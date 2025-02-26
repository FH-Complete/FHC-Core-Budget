<?php

/**
 * Manages Budgetanträge. Enables adding, updating and deleting Budgetanträge and their Budgetposten.
 */
class Budgetantrag extends Auth_Controller
{
	private $uid;
	const NEWSTATUS = 'new';
	const SENT = 'sent';
	const APPROVED = 'approved';
	const REJECTED = 'rejected';
	const VERWALTEN_PERMISSION = 'extension/budget_verwaltung';
	private $budgetstatus_permissions = array(
		self::NEWSTATUS => 'extension/budget_freigabe',
		self::SENT => '',
		self::APPROVED => 'extension/budget_freigabe',
		self::REJECTED => 'extension/budget_freigabe'
	);

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/budget_verwaltung:r',
				'showVerwalten' => 'extension/budget_verwaltung:r',
				'checkIfVerwaltbar' => 'extension/budget_verwaltung:r',
				'checkIfKostenstelleFreigebbar' => 'extension/budget_verwaltung:r',
				'checkBudgetpositionDependencies' => 'extension/budget_verwaltung:r',
				'getKostenstellen' => 'extension/budget_verwaltung:r',
				'getBudgetantraege' => 'extension/budget_verwaltung:r',
				'getBudgetantrag' => 'extension/budget_verwaltung:r',
				'newBudgetantrag' => 'extension/budget_verwaltung:rw',
				'updateBudgetantragBezeichnung' => 'extension/budget_verwaltung:rw',
				'updateBudgetantragPositionen' => 'extension/budget_verwaltung:rw',
				'deleteBudgetantrag' => 'extension/budget_verwaltung:rw',
				'updateBudgetantragStatus' => 'extension/budget_verwaltung:rw',
				'getProjekte' => 'extension/budget_verwaltung:r',
				'getKonten' => 'extension/budget_verwaltung:r'
			)
		);

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
		$this->load->library('PermissionLib');

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
	public function showVerwalten()
	{
		$geschaeftsjahr = $this->input->get('geschaeftsjahr');
		$kostenstelle_id = $this->input->get('kostenstelle_id');
		$budgetantrag_id = $this->input->get('budgetantrag_id');

		$this->GeschaeftsjahrModel->addSelect('geschaeftsjahr_kurzbz');
		$this->GeschaeftsjahrModel->addOrder('start', 'DESC');

		// Bei der Eingabe werden nur die naechsten 3 Geschaeftsjahre in die Zukunft angezeigt.
		$geschaeftsjahre = $this->GeschaeftsjahrModel->loadWhere("start<=now()+'3 years'::interval");

		if (isError($geschaeftsjahre))
		{
			show_error($geschaeftsjahre->retval);
		}

		if (!isset($geschaeftsjahr))
		{
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
		}
		$kostenstellen = $this->BudgetkostenstelleModel->getKostenstellenForGeschaeftsjahrBerechtigt($geschaeftsjahr);

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
				'selectedkostenstelle' => $kostenstelle_id,
				'budgetantrag_id' => $budgetantrag_id
			)
		);
	}

	/**
	 * Checks if given Geschäftsjahr is current, i.e. is either the currently running Gj or a Gj in the future
	 * and budget_verwaltung permission
	 */
	public function checkIfVerwaltbar()
	{
		$geschaeftsjahr = $this->input->get('geschaeftsjahr');
		$kostenstelle_id = $this->input->get('kostenstelle');

		$json = null;

		if (!$this->permissionlib->isBerechtigt(self::VERWALTEN_PERMISSION, 'suid', null, $kostenstelle_id))
		{
			$json = false;
		}
		else
		{
			$currgj = $this->GeschaeftsjahrModel->getCurrGeschaeftsjahr();

			if (isError($currgj))
				$json = json_encode($currgj);
			elseif (count($currgj->retval) < 1)
				$json = false;
			else
			{
				$gj = $this->GeschaeftsjahrModel->load($geschaeftsjahr);

				if (isError($gj))
					$json = json_encode($gj);
				elseif (count($gj->retval) < 1)
					$json = false;
				else
				{
					$currgjstart = $currgj->retval[0]->start;
					$gjstart = $gj->retval[0]->start;

					$json = ($gjstart >= $currgjstart);
				}
			}
		}

		if (is_bool($json))
			$this->outputJsonSuccess(array($json));
		else
			$this->outputJsonError('Error when checking verwaltbar');
	}

	/**
	 * Checks if logged user has permission for Freigabe of a Kostenstelle
	 */
	public function checkIfKostenstelleFreigebbar()
	{
		$kostenstelle_id = $this->input->get('kostenstelle_id');

		$freigebenperm = $this->permissionlib->isBerechtigt($this->budgetstatus_permissions[self::APPROVED], 'suid', null, $kostenstelle_id);

		if (is_bool($freigebenperm))
			$this->outputJsonSuccess(array($freigebenperm));
		else
			$this->outputJsonError('error when checking Freigabepermission');
	}

	/**
	 * Finds objects dependent on a budgetposition (e.g. Bestellungen)
	 */
	public function checkBudgetpositionDependencies()
	{
		$budgetposition_id = $this->input->get('budgetposition_id');
		$dependencies = array();

		$dependentBestellungen = $this->BudgetpositionModel->getDependentBestellungen($budgetposition_id);

		if (hasData($dependentBestellungen))
		{
			$dependencies['Bestellungen'] = $dependentBestellungen->retval;
		}

		$this->outputJsonSuccess($dependencies);
	}

	/**
	 * Gets all Kostenstellen for given Geschäftsjahr in JSON format
	 */
	public function getKostenstellen()
	{
		$geschaefsjahr = $this->input->get('geschaeftsjahr');

		$result = $this->BudgetkostenstelleModel->getKostenstellenForGeschaeftsjahrBerechtigt($geschaefsjahr);

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('error when getting Kostenstellen');
	}

	/**
	 * Gets all Budgetanträge for given Geschäftsjahr and Kostenstelle in JSON format
	 */
	public function getBudgetantraege()
	{
		$geschaefsjahr = $this->input->get('geschaeftsjahr');
		$kostenstelle_id = $this->input->get('kostenstelle_id');

		$result = null;

		if ($this->permissionlib->isBerechtigt(self::VERWALTEN_PERMISSION, 's', null, $kostenstelle_id))
			$result = $this->BudgetantragModel->getBudgetantraege($geschaefsjahr, $kostenstelle_id);

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when getting Budgetanträge');
	}

	/**
	 * Gets a Budgetantrag for a given id in JSON format
	 * @param $budgetantrag_id
	 */
	public function getBudgetantrag($budgetantrag_id)
	{
		$result = null;

		if ($this->_checkBudgetverwaltenPermission($budgetantrag_id, 's'))
			$result = $this->BudgetantragModel->getBudgetantrag($budgetantrag_id);

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when getting Budgetantrag');
	}

	/**
	 * Adds a new budgetantrag, including its positions
	 */
	public function newBudgetantrag()
	{
		$result = null;

		$kostenstelle_id = $this->input->post('kostenstelle_id');
		$geschaeftsjahr_kurzbz = $this->input->post('geschaeftsjahr_kurzbz');
		$bezeichnung = $this->input->post('bezeichnung');
		$positionen = $this->input->post('positionen');

		if ($this->permissionlib->isBerechtigt(self::VERWALTEN_PERMISSION, 'suid', null, $kostenstelle_id))
		{
			$budgetantragData = array(
				'kostenstelle_id' => $kostenstelle_id,
				'geschaeftsjahr_kurzbz' => $geschaeftsjahr_kurzbz,
				'bezeichnung' => html_escape($bezeichnung),
				'uid' => $this->uid,
				'insertvon' => $this->uid
			);

			foreach ($positionen as $positionkey => $position)
			{
				$this->_preparePositionArray($position);
				$positionen[$positionkey] = $position;
			}

			$result = $this->BudgetantragModel->addBudgetantrag($budgetantragData, $positionen);
		}

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when adding new Budgetantrag');
	}

	/**
	 * Updates Bezeichnung of a Budgetantrag
	 * @param $budgetantrag_id
	 */
	public function updateBudgetantragBezeichnung($budgetantrag_id)
	{
		$result = null;

		if ($this->_checkBudgetverwaltenPermission($budgetantrag_id, 'suid'))
		{
			$bezeichnung = $this->input->post('budgetbezeichnung');
			$result = $this->BudgetantragModel->update($budgetantrag_id, array('bezeichnung' => $bezeichnung));
		}

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when updating Budgetantrag Bezeichnung');
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
		$errors = array();

		if ($this->_checkBudgetverwaltenPermission($budgetantrag_id, 'suid'))
		{
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
						$errors[] = $position['budgetposten'];
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
						$errors[] = $position['budgetposition_id'];
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
						$errors[] = $position['budgetposition_id'];
				}
			}
		}

		$result = array('errors' => $errors, 'inserted' => $inserted, 'updated' => $updated, 'deleted' => $deleted);

		$this->outputJsonSuccess($result);
	}

	/**
	 * Deletes a Budgetantrag with a given id, returns deleted id in JSON format
	 * @param $budgetantrag_id
	 */
	public function deleteBudgetantrag($budgetantrag_id)
	{
		$result = null;

		if ($this->_checkBudgetverwaltenPermission($budgetantrag_id, 'suid'))
		{
			$bestellungen = $this->_getDependentBestellungen($budgetantrag_id);
			if (count($bestellungen) <= 0)
			{
				$result = $this->BudgetantragModel->deleteBudgetantrag($budgetantrag_id);
			}
			else
			{
				$bestellungenstr = implode(", ", $bestellungen);
				$this->outputJsonError('Budgetantrag kann nicht gelöscht werden, da es abhängige Bestellungen gibt. (' . $bestellungenstr . ')');
				return;
			}
		}

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when deleting Budgetantrag');
	}

	/**
	 * Update Budgetantrag status, returns new status if successfully updated, null otherwise
	 * @param $budgetantrag_id
	 */
	public function updateBudgetantragStatus($budgetantrag_id)
	{
		$json = null;
		$budgetstatus_kurzbz = $this->input->post('budgetstatus_kurzbz');

		if (is_numeric($budgetantrag_id)
			&& isset($budgetstatus_kurzbz)
			&& $this->_checkBudgetantragstatusPermission($budgetantrag_id, $budgetstatus_kurzbz))
		{
			$this->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');

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
				$json = $this->BudgetantragstatusModel->getLastStatus($budgetantrag_id);
			}
		}

		if (isSuccess($json))
			$this->outputJsonSuccess($json->retval);
		else
			$this->outputJsonError('Error when updating Budgetantrag Status');
	}

	/**
	 * Gets projekt id, kurzbz and titel for all projects in JSON format
	 */
	public function getProjekte()
	{
		$this->ProjektModel->addSelect('projekt_id, projekt_kurzbz, titel');
		$this->ProjektModel->addOrder('titel');
		$result = $this->ProjektModel->load();

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when getting Projekte');
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

		if (isSuccess($result))
			$this->outputJsonSuccess($result->retval);
		else
			$this->outputJsonError('Error when getting Konten');
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Checks if logged user has permission for Verwalten of a Budgetantrag (i.e. for its Kostenstelle)
	 * @param $budgetantrag_id
	 * @param $accesstype read/write access (suid)
	 * @return bool
	 */
	private function _checkBudgetverwaltenPermission($budgetantrag_id, $accesstype)
	{
		$this->BudgetantragModel->addSelect('kostenstelle_id');
		$result = $this->BudgetantragModel->load($budgetantrag_id);

		if (!hasData($result))
			return false;

		return $this->permissionlib->isBerechtigt(self::VERWALTEN_PERMISSION, $accesstype, null, $result->retval[0]->kostenstelle_id);
	}

	/**
	 * Checks if logged user has permission for Freigabe of a Kostenstelle
	 * @param $kostenstelle_id
	 * @return bool
	 */
	private function _checkBudgetantragstatusPermission($budgetantrag_id, $budgetstatus_kurzbz)
	{
		$this->BudgetantragModel->addSelect('kostenstelle_id');
		$result = $this->BudgetantragModel->load($budgetantrag_id);

		if (!hasData($result))
			return false;

		if ($this->budgetstatus_permissions[$budgetstatus_kurzbz] === '')
			return true;

		return $this->permissionlib->isBerechtigt($this->budgetstatus_permissions[$budgetstatus_kurzbz], 'suid', null, $result->retval[0]->kostenstelle_id);
	}

	/**
	 * Gets Bestellungen for a Budgetposition of a given Budgetantrag
	 * @param $budgetantrag_id
	 * @return array
	 */
	private function _getDependentBestellungen($budgetantrag_id)
	{
		$dependentBestellungen = array();
		$budgetpositionen = $this->BudgetpositionModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));

		foreach ($budgetpositionen->retval as $budgetposition)
		{
			$bestellungen = $this->BudgetpositionModel->getDependentBestellungen($budgetposition->budgetposition_id);
			if (hasData($bestellungen))
				$dependentBestellungen = array_merge($dependentBestellungen, $bestellungen->retval);
		}

		return $dependentBestellungen;
	}

	/**
	 * Modifies an array with a Budgetpositionen so it can be added or updated.
	 * @param $position
	 */
	private function _preparePositionArray(&$position)
	{
		$position['budgetposten'] = html_escape($position['budgetposten']);
		$position['konto_id'] = isset($position['konto_id']) && is_numeric($position['konto_id']) ? $position['konto_id'] : null;
		$position['projekt_id'] = isset($position['projekt_id']) && is_numeric($position['projekt_id'])? $position['projekt_id'] : null;
		$position['benoetigt_am'] = isset($position['benoetigt_am']) && !isEmptyString($position['benoetigt_am'])? $position['benoetigt_am'] : null;
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
