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

		$this->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');

	}

	/**
	 * Default
	 */
	public function index()
	{
		$this->GeschaeftsjahrModel->addSelect('geschaeftsjahr_kurzbz');
		$this->GeschaeftsjahrModel->addOrder('start', 'DESC');
		$geschaeftsjahre = $this->GeschaeftsjahrModel->load();

		if (isError($geschaeftsjahre))
		{
			show_error($geschaeftsjahre->retval);
		}

		$geschaeftsjahr = $this->GeschaeftsjahrModel->getNextGeschaeftsjahr(60);

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

		$this->load->view('extensions/FHC-Core-Budget/budgetexport.php',
			array(
				'geschaeftsjahre' => $geschaeftsjahre->retval,
				'selectedgeschaeftsjahr' => $geschaeftsjahr
			)
		);
	}

	/**
	 * Loads initial view with Geschäftsjahr and Kostenstellendropdown
	 * @param null $geschaeftsjahr
	 * @param null $kostenstelle_id
	 */
	public function generateCSV()
	{
		$geschaeftsjahr = $this->input->post('geschaeftsjahr');
		$unternehmenstyp = $this->input->post('unternehmenstyp');

		if (isEmptyString($geschaeftsjahr))
			show_error("Geschäftsjahr fehlt");

		if (isEmptyString($unternehmenstyp))
			show_error("Unternehmenstyp fehlt");

		$csv = $this->budgetexportlib->generateCSV($geschaeftsjahr, $unternehmenstyp);
		return $csv;
	}

}
