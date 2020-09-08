<?php

/**
 * Manages Budgetanträge. Enables adding, updating and deleting Budgetanträge and their Budgetposten.
 */
class Budgetexport extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/budget_freigabe:r',
				'generateCSV' => 'extension/budget_freigabe:r'
			)
		);

		// Loads libraries
		$this->load->library('extensions/FHC-Core-Budget/BudgetExportLib');
		$this->load->library('WidgetLib');


	}

	/**
	 * Default
	 */
	public function index()
	{
		$this->load->view('extensions/FHC-Core-Budget/budgetexport.php');
	}

	/**
	 * Loads initial view with Geschäftsjahr and Kostenstellendropdown
	 * @param null $geschaeftsjahr
	 * @param null $kostenstelle_id
	 */
	public function generateCSV()
	{
		$csv = $this->budgetexportlib->generateCSV();
		return $csv;
	}

}
