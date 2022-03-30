<?php

/**
 * Shows overview of Budgetanträge, with possible excel export
 */
class BudgetantragUebersichtExcel extends Auth_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct(
			array(
				'index' => 'extension/budget_freigabe:r'
			)
		);

		// Loads libraries
		$this->load->library('WidgetLib');
	}

	/**
	 * Default
	 */
	public function index()
	{
		$this->load->view('extensions/FHC-Core-Budget/budgetantraegeuebersichtexcel.php');
	}
}
