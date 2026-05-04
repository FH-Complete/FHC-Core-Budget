<?php

/**
 * 
 */
class BudgetantragMehrfachverwaltung extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/budget_freigabe:r',
				'changeBudget' => 'extension/budget_freigabe:rw'
			)
		);

		// Loads libraries
		$this->load->library('extensions/FHC-Core-Budget/BudgetantragFunktionenLib');
		$this->load->library('WidgetLib');

		// Loads models
		$this->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');
		$this->load->model('accounting/kostenstelle_model', 'KostenstelleModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetkostenstelle_model', 'BudgetkostenstelleModel');
	}

	/**
	 * Default
	 */
	public function index()
	{
		$this->_show();
	}

	/**
	 * Calls appropriate methods for changing budget.
	 */
	public function changeBudget()
	{
		$geschaeftsjahr_kurzbz = $this->input->post('geschaeftsjahr');
		$kostenstelle_id = $this->input->post('kostenstelle_id');
		$action = $this->input->post('action');
		if (!is_numeric($kostenstelle_id)) $kostenstelle_id = null;

		if ($this->input->post('abschicken'))
		{
			$result = $this->budgetantragfunktionenlib->setAbgeschickt($geschaeftsjahr_kurzbz, $kostenstelle_id);
		}
		elseif ($this->input->post('freigeben'))
		{
			$result = $this->budgetantragfunktionenlib->setFreigegeben($geschaeftsjahr_kurzbz, $kostenstelle_id);
		}
		elseif ($this->input->post('neu'))
		{
			$result = $this->budgetantragfunktionenlib->setNeu($geschaeftsjahr_kurzbz, $kostenstelle_id);
		}
		elseif ($this->input->post('struktur'))
		{
			$result = $this->budgetantragfunktionenlib->createInitialeStruktur($geschaeftsjahr_kurzbz, $kostenstelle_id);
		}
		else
		{
			$result = success("Nichts ausgewählt");
		}

		$output = '';
		if (isError($result)) $output = getError($result);
		if (hasData($result)) $output = getData($result);

		$this->_show($output, $kostenstelle_id);
	}

	/**
	 * Show interface for Budgetmanagement.
	 * @param $output output text to display
	 * @param $selectedkostenstelle id of selected Kostenstelle
	 * @return object success or error
	 */
	private function _show($output = '', $selectedkostenstelle = null)
	{
		$this->GeschaeftsjahrModel->addSelect('geschaeftsjahr_kurzbz');
		$this->GeschaeftsjahrModel->addOrder('start', 'DESC');

		// Bei der Eingabe werden nur die naechsten 3 Geschaeftsjahre in die Zukunft angezeigt.
		$geschaeftsjahre = $this->GeschaeftsjahrModel->loadWhere("start<=now()+'3 years'::interval");

		if (isError($geschaeftsjahre))
		{
			show_error(getData($geschaeftsjahre));
		}

		$geschaeftsjahr = $this->GeschaeftsjahrModel->getNextGeschaeftsjahr(120);

		if (hasData($geschaeftsjahr))
		{
			$geschaeftsjahr = getData($geschaeftsjahr)[0]->geschaeftsjahr_kurzbz;
		}
		else
		{
			if (hasData($geschaeftsjahre))
				$geschaeftsjahr = getData($geschaeftsjahre)[0]->geschaeftsjahr_kurzbz;
			else
				$geschaeftsjahr = null;
		}

		$kostenstellen = $this->BudgetkostenstelleModel->getKostenstellenForGeschaeftsjahrBerechtigt($geschaeftsjahr);

		if (isError($kostenstellen))
		{
			show_error(getError($kostenstellen));
		}

		$kostenstellen = hasData($kostenstellen) ? getData($kostenstellen) : [];

		foreach ($kostenstellen as $key => $kst)
		{
			// remove if no permission
			if (!$this->budgetantragfunktionenlib->checkBudgetantragstatusPermission($kst->kostenstelle_id, BudgetantragFunktionenLib::APPROVED))
			{
				unset($kostenstellen[$key]);
			}
			
		}
		

		$this->load->view('extensions/FHC-Core-Budget/budgetantraegemehrfachverwaltung.php',
			array(
				'geschaeftsjahre' => getData($geschaeftsjahre),
				'selectedgeschaeftsjahr' => $geschaeftsjahr,
				'kostenstellen' => $kostenstellen,
				'selectedkostenstelle' => $selectedkostenstelle,
				'output' => $output
			)
		);
	}
}
