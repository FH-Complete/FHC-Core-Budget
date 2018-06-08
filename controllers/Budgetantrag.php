<?php

/**
 * Manages Budgetanträge. Enables adding, updating and deleting Budgetanträge and their Budgetposten.
 */
class Budgetantrag extends VileSci_Controller
{
	private $uid;

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();

		// Loads models
		$this->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');
		$this->load->model('accounting/kostenstelle_model');
		$this->load->model('extensions/FHC-Core-Budget/budgetkostenstelle_model', 'BudgetkostenstelleModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantrag_model', 'BudgetantragModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->load->model('accounting/konto_model', 'KontoModel');
		$this->load->model('project/projekt_model', 'ProjektModel');

		// Loads libraries
		$this->load->library('WidgetLib');

		$this->_setAuthUID(); // sets property uid
	}

	/**
	 * Default
	 */
	public function index()
	{
		$this->showVerwalten();
	}

	/**
	 * Loads initial view with Geschäftsjahr and Kostenstellendropdown
	 * @param null $geschaeftsjahr
	 * @param null $kostenstelle_id
	 */
	public function showVerwalten($geschaeftsjahr = null, $kostenstelle_id = null)
	{
		$this->GeschaeftsjahrModel->addSelect('geschaeftsjahr_kurzbz');
		$this->GeschaeftsjahrModel->addOrder('start', 'DESC');
		$geschaeftsjahre = $this->GeschaeftsjahrModel->load();

		if (isError($geschaeftsjahre))
		{
			show_error($geschaeftsjahre->retval);
		}

		if (!isset($geschaeftsjahr))
		{
			$geschaeftsjahr = $this->GeschaeftsjahrModel->getNextGeschaeftsjahr();

			if (hasData($geschaeftsjahr))
			{
				$geschaeftsjahr = $geschaeftsjahr->retval[0]->geschaeftsjahr_kurzbz;
			}
			else
			{
				if (count($geschaeftsjahre->retval) > 0)
					$geschaeftsjahr = $geschaeftsjahre->retval[0]->geschaeftsjahr_kurzbz;
				else
					$geschaeftsjahr = null;
			}
		}
		$kostenstellen = $this->BudgetkostenstelleModel->getActiveKostenstellenForGeschaeftsjahrBerechtigt($geschaeftsjahr);

		if (isError($kostenstellen))
		{
			show_error($kostenstellen->retval);
		}

		$this->load->view(
			'extensions/FHC-Core-Budget/budgetantraegeverwalten.php',
			array(
				'geschaeftsjahre' => $geschaeftsjahre->retval,
				'kostenstellen' => $kostenstellen->retval,
				'selectedgeschaeftsjahr' => $geschaeftsjahr,
				'selectedkostenstelle' => $kostenstelle_id
			)
		);
	}

	/**
	 * Checks if given Geschäftsjahr is current, i.e. is either the currently running Gj or a Gj in the future
	 * returns Geschäftsjahr in JSON if current, false otherwise
	 * @param $geschaeftsjahr
	 */
	public function checkIfCurrentGeschaeftsjahr($geschaeftsjahr)
	{
		$json = null;

		$currgj = $this->GeschaeftsjahrModel->getCurrGeschaeftsjahr();

		if (isError($currgj))
			$json = json_encode($currgj);
		elseif (count($currgj->retval) < 1)
			$json = success(false);
		else
		{
			$gj = $this->GeschaeftsjahrModel->load($geschaeftsjahr);

			if (isError($gj))
				$json = json_encode($gj);
			elseif (count($gj->retval) < 1)
				$json = success(false);
			else
			{
				$currgjstart = $currgj->retval[0]->start;
				$gjstart = $gj->retval[0]->start;

				$json = success($gjstart >= $currgjstart);
			}
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($json));
	}

	/**
	 * Checks if logged used has permission for Genehmigung of a Kostenstelle
	 * @param $kostenstelle_id
	 */
	public function checkIfKostenstelleGenehmigbar($kostenstelle_id)
	{
		$this->load->library('PermissionLib');

		$genehmigenperm = $this->permissionlib->isBerechtigt('extension/budget_genehmigung', 'suid', null, $kostenstelle_id) === true;

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($genehmigenperm));
	}

	/**
	 * Gets all Kostenstellen for given Geschäftsjahr in JSON format
	 * @param $geschaefsjahr
	 */
	public function getKostenstellen($geschaefsjahr)
	{
		$result = $this->BudgetkostenstelleModel->getActiveKostenstellenForGeschaeftsjahrBerechtigt($geschaefsjahr);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Gets all Budgetanträge for given Geschäftsjahr and Kostenstelle in JSON format
	 * @param $geschaefsjahr
	 * @param $kostenstelle
	 */
	public function getBudgetantraege($geschaefsjahr, $kostenstelle)
	{
		$result = $this->BudgetantragModel->getBudgetantraege($geschaefsjahr, $kostenstelle);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Gets a Budgetantrag for a given id in JSON format
	 * @param $budgetantragid
	 */
	public function getBudgetantrag($budgetantragid)
	{
		$result = $this->BudgetantragModel->getBudgetantrag($budgetantragid);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Adds a new budgetantrag, including its positions
	 */
	public function newBudgetantrag()
	{
		$kostenstelle_id = $this->input->post('kostenstelle_id');
		$geschaeftsjahr_kurzbz = $this->input->post('geschaeftsjahr_kurzbz');
		$bezeichnung = $this->input->post('bezeichnung');
		$positionen = $this->input->post('positionen');

		$budgetantragData = array(
			'kostenstelle_id' => $kostenstelle_id,
			'geschaeftsjahr_kurzbz' => $geschaeftsjahr_kurzbz,
			'bezeichnung' => html_escape($bezeichnung),
			'insertvon' => $this->uid
		);

		$result = $this->BudgetantragModel->addBudgetantrag($budgetantragData, $positionen);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 *
	 */
	public function updateBudgetantragBezeichnung($budgetantrag_id)
	{
		$bezeichnung = $this->input->post('budgetbezeichnung');

		$result = $this->BudgetantragModel->update($budgetantrag_id, array('bezeichnung' => $bezeichnung));

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Updates positions of a Budgetantrag. This includes adding, updating and deleting positions!!
	 * Expects as post params one array each for adding, updating and deleting.
	 * Outputs ids of added, updated and deleted positions in JSON format if successful.
	 * @param $budgetantrag_id
	 */
	public function updateBudgetantragPositionen($budgetantrag_id)
	{
		$positionen_toadd = $this->input->post('positionentoadd');
		$positionen_toupdate = $this->input->post('positionentoupdate');
		$positionen_todelete = $this->input->post('positionentodelete');

		$inserted = $updated = $deleted = array();
		$errors = 0;

		if (is_array($positionen_toadd))
		{
			foreach ($positionen_toadd as $position)
			{
				$this->_preparePositionArray($position);

				//add corresponding budgetantrag id so it can be added to specific Budgetantrag
				$position['budgetantrag_id'] = $budgetantrag_id;

				$result = $this->BudgetpositionModel->insert($position);

				if (isSuccess($result))
					$inserted[] = $result->retval;
				else
					$errors++;
			}
		}

		if (is_array($positionen_toupdate))
		{
			foreach ($positionen_toupdate as $position)
			{
				$this->_preparePositionArray($position['position']);

				$result = $this->BudgetpositionModel->update($position['budgetposition_id'], $position['position']);

				if (isSuccess($result))
					$updated[] = $result->retval;
				else
					$errors++;
			}
		}

		if (is_array($positionen_todelete))
		{
			foreach ($positionen_todelete as $position)
			{
				$result = $this->BudgetpositionModel->delete($position['budgetposition_id']);

				if (isSuccess($result))
					$deleted[] = $result->retval;
				else
					$errors++;
			}
		}

		$result = array('errors' => $errors, 'inserted' => $inserted, 'updated' => $updated, 'deleted' => $deleted);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Deletes a Budgetantrag with a given id, returns deleted id in JSON format
	 * @param $budgetantrag_id
	 */
	public function deleteBudgetantrag($budgetantrag_id)
	{
		$result = $this->BudgetantragModel->deleteBudgetantrag($budgetantrag_id);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Update Budgetantrag status, returns new status if successfully updated, null otherwise
	 * @param $budgetantrag_id
	 * @param $budgetstatus_kurzbz
	 */
	public function updateBudgetantragStatus($budgetantrag_id, $budgetstatus_kurzbz)
	{
		$this->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');

		$json = null;

		$result = $this->BudgetantragstatusModel->insert(
			array(
				'budgetantrag_id' => $budgetantrag_id,
				'budgetstatus_kurzbz' => $budgetstatus_kurzbz,
				'datum' => date('Y-m-d H:i:s'),
				'uid' => $this->uid,
				'insertvon' => $this->uid
			)
		);

		if (isSuccess($result))
		{
			//get Budgetstatus data for updating html view
			$result = $this->BudgetantragstatusModel->getLastStatus($budgetantrag_id);

			$json = $result;
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($json));
	}

	/**
	 * Gets projekt id, kurzbz and titel for all projects in JSON format
	 */
	public function getProjekte()
	{
		$this->ProjektModel->addSelect('projekt_id, projekt_kurzbz, titel');
		$this->ProjektModel->addOrder('titel');
		$result = $this->ProjektModel->load();

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Gets konto_id, kontonr and kurzbz for all Konten for a Kostenstelle in JSON format
	 * @param $kostenstelle_id
	 */
	public function getKonten($kostenstelle_id)
	{
		$this->KontoModel->addSelect('konto_id, kontonr, kurzbz, aktiv');
		$this->KontoModel->addOrder('kurzbz');
		$result = $this->KontoModel->getKontenForKostenstelle($kostenstelle_id);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Modifies an array with a Budgetpositionen so it can be added or updated.
	 * This includes sanitizing html input and change empty strings to null
	 * @param $position
	 */
	private function _preparePositionArray(&$position)
	{
		$position['budgetposten'] = html_escape($position['budgetposten']);
		$position['konto_id'] = empty($position['konto_id']) ? null : $position['konto_id'];
		$position['projekt_id'] = empty($position['projekt_id']) ? null : $position['projekt_id'];
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
