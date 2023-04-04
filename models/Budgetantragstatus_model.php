<?php

/**
 */
class Budgetantragstatus_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_budget_antrag_status';
		$this->pk = 'budgetantrag_status_id';
	}

	/**
	 * Gets last chronoligally last status for a Budgetantrag
	 * @param $budgetantrag_id
	 * @return mixed
	 */
	public function getLastStatus($budgetantrag_id)
	{
		$query = 'SELECT *
					FROM extension.tbl_budget_antrag_status
					JOIN extension.tbl_budget_status USING (budgetstatus_kurzbz)
					WHERE budgetantrag_id = ?
					ORDER BY datum DESC
					LIMIT 1';

		return $this->execQuery($query, array($budgetantrag_id));
	}
}
