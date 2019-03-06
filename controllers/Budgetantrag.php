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
	const ACCEPTED = 'accepted';
	const VERWALTEN_PERMISSION = 'extension/budget_verwaltung';
	private $budgetstatus_permissions = array(
		self::NEWSTATUS => '',
		self::SENT => '',
		self::APPROVED => 'extension/budget_freigabe',
		self::REJECTED => 'extension/budget_freigabe',
		self::ACCEPTED => 'extension/budget_freigabe'
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
				'checkIfKostenstelleGenehmigbar' => 'extension/budget_verwaltung:r',
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
				'selectedkostenstelle' => $kostenstelle_id
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
			$json = success(false);
		}
		else
		{
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
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($json));
	}

	/**
	 * Checks if logged user has permission for Genehmigung of a Kostenstelle
	 */
	public function checkIfKostenstelleGenehmigbar()
	{
		$kostenstelle_id = $this->input->get('kostenstelle_id');
		
		$genehmigenperm = $this->permissionlib->isBerechtigt($this->budgetstatus_permissions[self::APPROVED], 'suid', null, $kostenstelle_id);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($genehmigenperm));
	}

	/**
	 * Gets all Kostenstellen for given Geschäftsjahr in JSON format
	 */
	public function getKostenstellen()
	{
		$geschaefsjahr = $this->input->get('geschaeftsjahr');

		$result = $this->BudgetkostenstelleModel->getKostenstellenForGeschaeftsjahrBerechtigt($geschaefsjahr);

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
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
		$result = null;

		if ($this->_checkBudgetverwaltenPermission($budgetantragid, 's'))
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
				'insertvon' => $this->uid
			);

			$result = $this->BudgetantragModel->addBudgetantrag($budgetantragData, $positionen);
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
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
		$result = null;

		if ($this->_checkBudgetverwaltenPermission($budgetantrag_id, 'suid'))
		{
			$result = $this->BudgetantragModel->deleteBudgetantrag($budgetantrag_id);
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
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
				$result = $this->BudgetantragstatusModel->getLastStatus($budgetantrag_id);

				$json = $result;
			}

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
	 * Checks if logged user has permission for Genehmigung of a Kostenstelle
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
	 * Modifies an array with a Budgetpositionen so it can be added or updated.
	 * @param $position
	 */
	private function _preparePositionArray(&$position)
	{
		$position['budgetposten'] = html_escape($position['budgetposten']);
		$position['konto_id'] = isset($position['konto_id']) && is_numeric($position['konto_id']) ? $position['konto_id'] : null;
		$position['projekt_id'] = isset($position['projekt_id']) && is_numeric($position['projekt_id'])? $position['projekt_id'] : null;
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
