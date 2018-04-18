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
		$this->dbTable = 'extension.tbl_budgetantrag_status';
		$this->pk = 'budgetantrag_status_id';
	}

	/**
	 * Gets last chronoligally last status for a Budgetantrag
	 * @param $budgetantrag_id
	 * @return mixed
	 */
	function getLastStatus($budgetantrag_id)
	{
		$query = 'SELECT *
					FROM extension.tbl_budgetantrag_status
					JOIN extension.tbl_budgetstatus USING (budgetstatus_kurzbz)
					WHERE budgetantrag_id = ?
					ORDER BY datum DESC
					LIMIT 1';

		return $this->execQuery($query, array($budgetantrag_id));
	}
}
