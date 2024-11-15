<?php

/**
 */
class BudgetantragUebersicht extends Auth_Controller
{
	const VERWALTENPERMISSION = 'extension/budget_verwaltung';

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => self::VERWALTENPERMISSION.':r',
				'oeUebersicht' => self::VERWALTENPERMISSION.':r',
				'getKostenstellenTree' => self::VERWALTENPERMISSION.':r'
			)
		);

		// Loads models
		$this->load->model('organisation/organisationseinheit_model', 'OrganisationseinheitModel');
		$this->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');
		$this->load->model('accounting/kostenstelle_model', 'Kostenstelle_model');
		$this->load->model('extensions/FHC-Core-Budget/budgetkostenstelle_model', 'BudgetkostenstelleModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantrag_model', 'BudgetantragModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->load->model('accounting/konto_model', 'KontoModel');
		$this->load->model('project/projekt_model', 'ProjektModel');

		$this->loadPhrases(
			array(
				'filter',
				'global',
				'ui'
			)
		);

		// Loads libraries
		$this->load->library('WidgetLib');

		$this->setControllerId(); // sets the controller id

		$this->_setAuthUID(); // sets property uid
	}

	/**
	 * Loads initial view with Budgetantragsstatusübersicht
	 */
	public function index()
	{
		$kostenstellen = $this->Kostenstelle_model->getKostenstellenBerechtigt(self::VERWALTENPERMISSION, 's');
		$kostenstellenids = array();

		if (hasData($kostenstellen))
		{
			//take only ids
			foreach ($kostenstellen->retval as $kostenstelle)
			{
				$kostenstellenids[] = $kostenstelle->kostenstelle_id;
			}
		}

		$kostenstellenidsstring = implode(",", $kostenstellenids);

		$this->load->view(
			'extensions/FHC-Core-Budget/budgetantraegestatusuebersicht.php',
			array(
				'kostenstellenberechtigt' => $kostenstellenidsstring
			)
		);
	}

	/**
	 * Loads Budgetantragsübersicht inf form of OE-tree
	 */
	public function oeUebersicht()
	{
		$this->GeschaeftsjahrModel->addSelect('geschaeftsjahr_kurzbz');
		$this->GeschaeftsjahrModel->addOrder('start', 'DESC');
		$geschaeftsjahre = $this->GeschaeftsjahrModel->load();

		if (isError($geschaeftsjahre))
		{
			show_error($geschaeftsjahre->retval);
		}

		$geschaeftsjahr = $this->GeschaeftsjahrModel->getNextGeschaeftsjahr(120);

		if (hasData($geschaeftsjahr))
		{
			$geschaeftsjahr = $geschaeftsjahr->retval[0]->geschaeftsjahr_kurzbz;
		}
		else
		{
			if (hasData($geschaeftsjahre))
				$geschaeftsjahr = $geschaeftsjahre->retval[0]->geschaeftsjahr_kurzbz;
			else
				$geschaeftsjahr = null;
		}

		$this->load->view(
			'extensions/FHC-Core-Budget/budgetantraegeuebersicht.php',
			array(
				'geschaeftsjahre' => $geschaeftsjahre->retval,
				'selectedgeschaeftsjahr' => $geschaeftsjahr
			)
		);
	}

	/**
	 * Initialises building of Oe-kostenstellen-tree
	 * @param $geschaeftsjahr
	 */
	public function getKostenstellenTree($geschaeftsjahr)
	{
		$result = $this->BudgetkostenstelleModel->getKostenstellenForGeschaeftsjahrWithOeBerechtigt($geschaeftsjahr);

		if (isSuccess($result))
			$this->outputJsonSuccess($this->buildKostenstellenTree($result->retval));
		else
			$this->outputJsonError('error when building Kostenstellen Tree');
	}

	/**
	 * Builds Oe-kostenstellen-tree by iterating over parents of each Kostenstelle
	 * and calling method for appending the kostenstelle to right parent
	 * @param $kostenstellen
	 * @return array
	 */
	private function buildKostenstellenTree($kostenstellen)
	{
		$oetree = array();

		foreach ($kostenstellen as $kostenstelle)
		{
			$kostenstelleoe = $kostenstelle;
			$kostenstelle = new stdClass();
			$kostenstelle->kostenstelle_id = $kostenstelleoe->kostenstelle_id;
			$kostenstelle->kostenstelle_kurzbz = $kostenstelleoe->kostenstelle_kurzbz;
			$kostenstelle->bezeichnung = $kostenstelleoe->kostenstelle_bezeichnung;
			$kostenstelle->aktiv = $kostenstelleoe->kostenstelle_aktiv;
			$kostenstelle->budgetsumme = $kostenstelleoe->kostenstelle_budgetsumme;
			$kostenstelle->erloesesumme = $kostenstelleoe->kostenstelle_erloesesumme;
			$kostenstelle->freigegebensumme = $kostenstelleoe->kostenstelle_freigegebensumme;
			$kostenstelle->oe_kurzbz = $kostenstelleoe->oe_kurzbz;
			$kostenstelle->oe_bezeichnung = $kostenstelleoe->oe_bezeichnung;
			$kostenstelle->level = $kostenstelleoe->level;

			// ignore if kostenstelle is inaktiv and no Budget
			if ($kostenstelle->kostenstelle_id !== null && !$kostenstelle->aktiv && !isset($kostenstelle->budgetsumme))
				continue;

			//true gets also inactive parents
			$result = $this->OrganisationseinheitModel->getParents($kostenstelle->oe_kurzbz, true);

			if (isError($result))
				return error($result);

			$appended = false;
			$parents = $result->retval;

			//first parent is always child itself
			$firstel = reset($parents);

			foreach ($parents as $parent)
			{
				$firstparent = $firstel === $parent;

				//does a parent already exist in oetree? - if it exists, kst (and possibly the oe of the kst) is appended to parent
				if ($this->appendKstToTree($oetree, $parent->oe_kurzbz, $kostenstelle, $firstparent, $appended))
				{
					$appended = true;
				}
			}

			$kostenstellen = array();

			if ($kostenstelle->kostenstelle_id !== null)
				$kostenstellen[] = $kostenstelle;

			//otherwise add as new root node
			if ($appended === false)
				$oetree[] = array(
					'oe_kurzbz' => $kostenstelle->oe_kurzbz,
					'bezeichnung' => $kostenstelle->oe_bezeichnung,
					'budgetsumme' => $kostenstelle->budgetsumme,
					'freigegebensumme' => $kostenstelle->freigegebensumme,
					'kostenstellen' => $kostenstellen,
					'level' => $kostenstelle->level,
					'children' => array()
				);
		}

		return $oetree;
	}

	/**
	 * Appends a Kostenstelle to the Oe-kostenstellen tree, recursively checks for appropriate parent.
	 * If parent oe is found, Kostenstelle (and Oe if not already there) is appended  to this first occurence
	 * @param $oetree the tree with Oe and Kostenstellen
	 * @param $parentoe_kurzbz name of oe parent searched in tree
	 * @param $kostenstelle Kostenstelle to append
	 * @param $firstparent wether the searched parent is the first one in the parentlist for the Kostenstelle
	 * @param $appended wether the Kostenstelle was already appended to the tree -
	 * if appended, still iterating for calculating the sums but not appending the Kostenstelle!
	 * @return bool true the Kostenstelle was successfully appended, false otherwise
	 */
	private function appendKstToTree(&$oetree, $parentoe_kurzbz, $kostenstelle, $firstparent, $appended)
	{
		$treesize = count($oetree);

		for ($i = 0; $i < $treesize; $i++)
		{
			$item = &$oetree[$i];

			if ($item['oe_kurzbz'] === $parentoe_kurzbz)
			{
				// increase budgetsumme of the parent
				$item['budgetsumme'] += $kostenstelle->budgetsumme;
				$item['freigegebensumme'] += $kostenstelle->freigegebensumme;

				// first parent is oe of kostenstelle - append only kostenstelle to existing oe
				if ($firstparent)
				{
					$item['kostenstellen'][] = $kostenstelle;
				}
				else
				{
					// append oe and kostenstelle if not already appended
					if ($appended === false)
					{
						$kostenstellen = array();
						if ($kostenstelle->kostenstelle_id !== null)
							$kostenstellen[] = $kostenstelle;

						$item['children'][] =
							array(
								'oe_kurzbz' => $kostenstelle->oe_kurzbz,
								'bezeichnung' => $kostenstelle->oe_bezeichnung,
								'budgetsumme' => $kostenstelle->budgetsumme,
								'freigegebensumme' => $kostenstelle->freigegebensumme,
								'kostenstellen' => $kostenstellen,
								'level' => $kostenstelle->level,
								'children' => array()
							);
					}
				}
				return true;
			}
			if ($this->appendKstToTree($item['children'], $parentoe_kurzbz, $kostenstelle, $firstparent, $appended) === true)
				return true;
		}
		return false;
	}

	/**
	 * Retrieve the UID of the logged user and checks if it is valid
	 */
	private function _setAuthUID()
	{
		$this->uid = getAuthUID();

		if (!$this->uid) show_error('User authentification failed');
	}
}
