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
	}
}
