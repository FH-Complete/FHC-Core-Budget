<?php

/**
 * Manages Budgetanträge. Enables adding, updating and deleting Budgetanträge and their Budgetposten.
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
