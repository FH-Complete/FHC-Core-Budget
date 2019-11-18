<?php

/**
 */
class Budgetposition_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_budget_position';
		$this->pk = 'budgetposition_id';

		$this->load->model('accounting/bestellung_model', 'BestellungModel');
	}

	/**
	 * Gets Bestellungen (bestell_nr) for a given Budgetposition
	 * @param $budgetposition_id
	 * @return mixed
	 */
	public function getDependentBestellungen($budgetposition_id)
	{
		$dependentBestellungen = array();

		$bestellungen = $this->BestellungModel->loadWhere(array('budgetposition_id' => $budgetposition_id));

		if (hasData($bestellungen))
		{
			foreach ($bestellungen->retval as $bestellung)
			{
				if (isset($bestellung->bestell_nr) && !isEmptyString($bestellung->bestell_nr))
					$dependentBestellungen[] = $bestellung->bestell_nr;
			}
		}

		return success($dependentBestellungen);
	}
}
