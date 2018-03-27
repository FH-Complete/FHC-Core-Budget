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
		$this->load->model('accounting/kostenstelle_model', 'KostenstelleModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantrag_model', 'BudgetantragModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->load->model('accounting/konto_model', 'KontoModel');
		$this->load->model('project/projekt_model', 'ProjektModel');
		//$this->load->model('accounting/budgetstatus_model', 'BudgetstatusModel');

		// Loads libraries
		$this->load->library('WidgetLib');

		$this->_setAuthUID(); // sets property uid

/*		$this->load->library('PermissionLib');
		if(!$this->permissionlib->isBerechtigt('basis/person'))
			show_error('You have no Permission! You need Infocenter Role');*/

/*		$this->_setNavigationMenuArray(); // sets property navigationMenuArray

		$this->navigationHeaderArray = array(
			'headertext' => 'Infocenter',
			'headertextlink' => base_url('index.ci.php/system/infocenter/InfoCenter')
		);*/
	}

	/**
	 * Loads initial view with Geschäftsjahr and Kostenstellendropdown
	 */
	public function index()
	{
		$this->GeschaeftsjahrModel->addSelect('geschaeftsjahr_kurzbz');
		$this->GeschaeftsjahrModel->addOrder('geschaeftsjahr_kurzbz', 'DESC');
		$geschaeftsjahre = $this->GeschaeftsjahrModel->load();

		if (isError($geschaeftsjahre))
		{
			show_error($geschaeftsjahre->retval);
		}

		$this->KostenstelleModel->addSelect('kostenstelle_id, kostenstelle_nr, kurzbz, bezeichnung');
		$this->KostenstelleModel->addOrder('kostenstelle_id');
		$kostenstellen = $this->KostenstelleModel->loadWhere(array('aktiv' => true));

		if (isError($kostenstellen))
		{
			show_error($kostenstellen->retval);
		}

		$this->load->view(
			'extensions/FHC-Core-Budget/budgetantraege.php',
			array(
			'geschaeftsjahre' => $geschaeftsjahre->retval,
			'kostenstellen' => $kostenstellen->retval
			)
		);
	}

	/**
	 * Gets all Budgetanträge for given Geschäftsjahr and Kostenstelle in JSON format
	 * @param $geschaefsjahr
	 * @param $kostenstelle
	 */
	public function getBudgetantraege($geschaefsjahr, $kostenstelle)
	{
		$result = $this->BudgetantragModel->getBudgetantraege($geschaefsjahr, $kostenstelle);

		if (isError($result))
		{
			$result = 'Error: '.$result->retval;
		}
		else
		{
			$result = $result->retval;
		}

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

		if (isError($result))
		{
			$result = 'Error: '.$result->retval;
		}
		else
		{
			$result = $result->retval;
		}

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

		if (isError($result))
		{
			$result = 'Error: '.$result->retval;
		}
		else
		{
			$result = $result->retval;
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

/*		var_dump($positionen_toadd);
		var_dump($positionen_toupdate);
		var_dump($positionen_todelete);

		die();*/
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
			}
		}

		if (is_array($positionen_toupdate))
		{
			foreach ($positionen_toupdate as $position)
			{
				$this->_preparePositionArray($position['position']/*, $budgetantrag_id*/);

				$result = $this->BudgetpositionModel->update($position['budgetposition_id'], $position['position']);

				if (isSuccess($result))
					$updated[] = $result->retval;
			}
		}

		if (is_array($positionen_todelete))
		{
			foreach ($positionen_todelete as $position)
			{
				//$this->_preparePositionArray($position['position'], $budgetantrag_id);

				$result = $this->BudgetpositionModel->delete($position['budgetposition_id']);

				if (isSuccess($result))
					$deleted[] = $result->retval;
			}
		}
		$result = array('inserted' => $inserted, 'updated' => $updated, 'deleted' => $deleted);

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

		if (isError($result))
		{
			$result = 'Error: '.$result->retval;
		}
		else
		{
			$result = $result->retval;
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Gets projekt id, kurzbz and titel for all projects in JSON format
	 */
	public function getProjekte()
	{
		$this->ProjektModel->addSelect('projekt_id, projekt_kurzbz, titel');
		$result = $this->ProjektModel->load();

		if (isError($result))
		{
			$result = 'Error: '.$result->retval;
		}
		else
		{
			$result = $result->retval;
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	/**
	 * Gets konto_id, kontonr and kurzbz for all konten in JSON format
	 */
	public function getKonten()
	{
		$this->KontoModel->addSelect('konto_id, kontonr, kurzbz');
		$result = $this->KontoModel->load();

		if (isError($result))
		{
			$result = 'Error: '.$result->retval;
		}
		else
		{
			$result = $result->retval;
		}

		$this->output
			->set_content_type('application/json')
			->set_output(json_encode($result));
	}

	// -----------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Modifies an array with Budgetpositionen so it can be added or updated.
	 * This includes sanitizing html input and change empty strings to null
	 * @param $position
	 */
	private function _preparePositionArray(&$position)
	{
		/*if (isset($budgetantrag_id))
			$position['budgetantrag_id'] = $budgetantrag_id;*/
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