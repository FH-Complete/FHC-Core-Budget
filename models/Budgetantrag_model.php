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
		$this->dbTable = 'extension.tbl_budgetantrag';
		$this->pk = 'budgetantrag_id';
	}

	/**
	 * Gets Budgetanträge for a Geschäftsjahr and a Kostenstelle together with their Budgetpositionen,
	 * each Budgetantrag has an array with Budgetpositionen
	 * @param $geschaeftsjahr
	 * @param $kostenstelle
	 * @return array
	 */
	public function getBudgetantraege($geschaeftsjahr, $kostenstelle)
	{
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->addOrder('extension.tbl_budgetantrag.budgetantrag_id');
		$budgetantraege = $this->loadWhere(array('geschaeftsjahr_kurzbz' => $geschaeftsjahr, 'kostenstelle_id' => $kostenstelle));

		if($budgetantraege->error)
			return error($budgetantraege->retval);

		$resultArr = array();

		foreach ($budgetantraege->retval as $antrag)
		{
			$this->addOrder('extension.tbl_budgetposition.budgetposition_id');
			$budgetpositionen = $this->BudgetpositionModel->loadWhere(array('budgetantrag_id' => $antrag->budgetantrag_id));

			if($budgetpositionen->error)
				return error($budgetpositionen->retval);
			
			$antrag->budgetpositionen = $budgetpositionen->retval;

			$resultArr[] = $antrag;
		}

		$budgetantraege->retval = $resultArr;
/*		$result = $this->loadTree('extension.tbl_budgetantrag', array('extension.tbl_budgetposition'),
			'extension.tbl_budgetantrag.geschaeftsjahr_kurzbz = '.$this->escape($geschaeftsjahr).' AND extension.tbl_budgetantrag.kostenstelle_id = '.$this->escape($kostenstelle)
		);*/

		return $budgetantraege;
	}

	/**
	 * Gets a Budgetantrag by a given id together with its Budgetpositionen
	 * @param $budgetantrag_id
	 * @return array
	 */
	public function getBudgetantrag($budgetantrag_id)
	{
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$budgetantrag = $this->load($budgetantrag_id);

		//$budgetantrag = $this->loadTree('extension.tbl_budgetantrag', array('extension.tbl_budgetposition'), 'extension.tbl_budgetantrag.budgetantrag_id = '.$budgetantrag_id);
		//, 'extension.tbl_budgetantrag.budgetantrag_id= '.$this->escape($budgetantrag_id)

		if ($budgetantrag->error)
			return error($budgetantrag->retval);

		$this->BudgetpositionModel->addOrder('extension.tbl_budgetposition.budgetposition_id');
		$budgetpositionen = $this->BudgetpositionModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));

		if ($budgetpositionen->error)
			return error($budgetpositionen->retval);

		$budgetantrag->retval[0]->budgetpositionen = $budgetpositionen->retval;

		return $budgetantrag;
	}

	/**
	 * Adds a new Budgetantrag with status "new", links it to given Budgetpositions
	 * @param $data
	 * @param $budgetPositionen
	 * @return array
	 */
	public function addBudgetantrag($data, $budgetPositionen)
	{
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');

		// Start DB transaction
		$this->db->trans_start(false);

		$result = $this->insert($data);
		$budgetantrag_id = $result->retval;

		if (isSuccess($result))
		{
			//add with budgetstatus new
			$this->BudgetantragstatusModel->insert(
				array(
					'budgetantrag_id' => $budgetantrag_id,
					'budgetstatus_kurzbz' => 'new',
					'datum' => date('Y-m-d H:i:s'),
					'uid' => $data['insertvon'],
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
					$position['betrag'] = $position['betrag'] === '' ? null : $position['betrag'];
					$position['projekt_id'] = empty($position['projekt_id']) ? null : $position['projekt_id'];
					$position['konto_id'] = empty($position['konto_id']) ? null : $position['konto_id'];
					$this->BudgetpositionModel->insert($position);
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
		$this->load->model('extensions/FHC-Core-Budget/budgetposition_model', 'BudgetpositionModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');

		$this->BudgetpositionModel->addSelect('budgetposition_id');
		$positionen = $this->BudgetpositionModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));
		if ($positionen->error)
			return error($positionen->retval);

		$this->BudgetantragstatusModel->addSelect('budgetantrag_status_id');
		$stati = $this->BudgetantragstatusModel->loadWhere(array('budgetantrag_id' => $budgetantrag_id));
		if ($stati->error)
			return error($stati->retval);

		// Start DB transaction
		$this->db->trans_start(false);

		foreach ($positionen->retval as $position)
		{
			$this->BudgetpositionModel->delete($position->budgetposition_id);
		}

		foreach ($stati->retval as $status)
		{
			$this->BudgetantragstatusModel->delete($status->budgetantrag_status_id);
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
