<?php

/**
 */
class BudgetantragUebersicht extends VileSci_Controller
{

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

		// Loads libraries
		$this->load->library('WidgetLib');

		$this->_setAuthUID(); // sets property uid

		/*		$this->_setNavigationMenuArray(); // sets property navigationMenuArray

				$this->navigationHeaderArray = array(
					'headertext' => 'Infocenter',
					'headertextlink' => base_url('index.ci.php/system/infocenter/InfoCenter')
				);*/
	}

	/**
	 * Loads initial view
	 */
	public function index()
	{
		$this->load->view(
			'extensions/FHC-Core-Budget/budgetantraegeuebersicht.php'
		);
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