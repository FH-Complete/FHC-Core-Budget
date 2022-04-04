<?php

/**
 */
class Budgetantrag_model extends DB_Model
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();
		$this->dbTable = 'extension.tbl_budget_antrag';
		$this->pk = 'budgetantrag_id';

		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');
	}

	/**
	 * Gets Budgetanträge for a Geschäftsjahr and a Kostenstelle together with their Budgetpositionen,
	 * each Budgetantrag has an array with Budgetpositionen
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return array
	 */
	public function getBudgetantraege($geschaeftsjahr_kurzbz, $kostenstelle_id)
	{
		$this->addSelect('budgetantrag_id');
		$this->addOrder('budgetantrag_id');
		$budgetantraege = $this->loadWhere(array('geschaeftsjahr_kurzbz' => $geschaeftsjahr_kurzbz, 'kostenstelle_id' => $kostenstelle_id));

		if ($budgetantraege->error)
			return $budgetantraege;

		$resultArr = array();

		foreach ($budgetantraege->retval as $antrag)
		{
			$budgetantrag = $this->getBudgetantrag($antrag->budgetantrag_id);

			if (isError($budgetantrag))
				return error($budgetantrag->retval);

			if (hasData($budgetantrag))
				$resultArr[] = $budgetantrag->retval[0];
		}

		$budgetantraege->retval = $resultArr;

		return $budgetantraege;
	}

	/**
	 * Gets a Budgetantrag by a given id together with its Budgetpositionen
	 * @param $budgetantrag_id
	 * @return array
	 */
	public function getBudgetantrag($budgetantrag_id)
	{
		$budgetantrag = $this->load($budgetantrag_id);

		if (isError($budgetantrag))
			return $budgetantrag;

		$this->BudgetpositionModel->addOrder('budgetposition_id');
		$budgetpositionen = $this->BudgetpositionModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));

		if (isError($budgetpositionen))
			return $budgetpositionen;

		$laststatus = $this->BudgetantragstatusModel->getLastStatus($budgetantrag_id);

		if (isError($laststatus))
			return $laststatus;

		if (hasData($budgetantrag))
		{
			$budgetantragData = getData($budgetantrag)[0];

			if (hasData($laststatus))
				$budgetantragData->budgetstatus = getData($laststatus)[0];

			$budgetantragData->budgetpositionen = array();

			if (hasData($budgetpositionen))
				$budgetantragData->budgetpositionen = getData($budgetpositionen);

			$budgetantrag = success(array($budgetantragData));
		}

		return $budgetantrag;
	}

	/**
	 * Adds a new Budgetantrag with status "new", links it to given Budgetpositionen
	 * @param $data
	 * @param $budgetPositionen
	 * @return array
	 */
	public function addBudgetantrag($data, $budgetPositionen)
	{
		// Start DB transaction
		$this->db->trans_start(false);

		$fieldsToInsert = array(
			'kostenstelle_id', 'geschaeftsjahr_kurzbz', 'bezeichnung', 'insertvon'
		);

		$dataToInsert = array();

		foreach ($fieldsToInsert as $field)
		{
			if (!isset($data[$field]))
				return error("$field missing");

			$dataToInsert[$field] = $data[$field];
		}

		$result = $this->insert($dataToInsert);

		if (isSuccess($result))
		{
			$budgetantrag_id = $result->retval;
			//add with budgetstatus new
			$result = $this->BudgetantragstatusModel->insert(
				array(
					'budgetantrag_id' => $budgetantrag_id,
					'budgetstatus_kurzbz' => 'new',
					'datum' => date('Y-m-d H:i:s'),
					'uid' => isset($data['uid']) ? $data['uid'] : null,
					'insertvon' => $data['insertvon']
				)
			);

			//add budgetpositions
			if (isset($budgetPositionen))
			{
				foreach ($budgetPositionen as $position)
				{
					$position['budgetantrag_id'] = $budgetantrag_id;
					$position['budgetposten'] = html_escape($position['budgetposten']);
					$position['betrag'] = !isset($position['betrag']) || $position['betrag'] === '' ? null : $position['betrag'];
					$position['projekt_id'] = isset($position['projekt_id']) && is_numeric($position['projekt_id']) ? $position['projekt_id'] : null;
					$position['konto_id'] = isset($position['konto_id']) && is_numeric($position['konto_id'])? $position['konto_id'] : null;
					$position['insertvon'] = $data['insertvon'];
					$result = $this->BudgetpositionModel->insert($position);
				}
			}
		}

		// Transaction complete!
		$this->db->trans_complete();

		// Check if everything went ok during the transaction
		if ($this->db->trans_status() === false || isError($result))
		{
			$this->db->trans_rollback();
			$result = error($result->msg, EXIT_ERROR);
		}
		else
		{
			$this->db->trans_commit();
			$result = success($budgetantrag_id);
		}

		return $result;
	}

	/**
	 * Deletes a Budgetantrag AND all linked Budgetpositionen and Budgetantragstatus, returns id of deleted Budgetantrag on success
	 * @param $budgetantrag_id
	 * @return mixed
	 */
	public function deleteBudgetantrag($budgetantrag_id)
	{
		$this->BudgetpositionModel->addSelect('budgetposition_id');
		$positionen = $this->BudgetpositionModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));
		if ($positionen->error)
			return $positionen;

		$this->BudgetantragstatusModel->addSelect('budgetantrag_status_id');
		$stati = $this->BudgetantragstatusModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));
		if ($stati->error)
			return $stati;

		// Start DB transaction
		$this->db->trans_start(false);

		foreach ($positionen->retval as $position)
		{
			$result = $this->BudgetpositionModel->delete($position->budgetposition_id);
		}

		foreach ($stati->retval as $status)
		{
			$result = $this->BudgetantragstatusModel->delete($status->budgetantrag_status_id);
		}

		$result = $this->BudgetantragModel->delete($budgetantrag_id);

		// Transaction complete!
		$this->db->trans_complete();

		// Check if everything went ok during the transaction
		if ($this->db->trans_status() === false || isError($result))
		{
			$this->db->trans_rollback();
			$result = error($result->msg, EXIT_ERROR);
		}
		else
		{
			$this->db->trans_commit();
			$result = success($budgetantrag_id);
		}

		return $result;
	}
}
