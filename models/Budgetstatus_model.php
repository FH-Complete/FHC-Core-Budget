<?php

/**
 */
class Budgetstatus_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_budget_status';
		$this->pk = 'budgetstatus_kurzbz';
	}
}
