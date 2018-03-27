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
		$this->dbTable = 'extension.tbl_budgetposition';
		$this->pk = 'budgetposition_id';
	}
}
