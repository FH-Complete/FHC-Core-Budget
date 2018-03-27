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
}
