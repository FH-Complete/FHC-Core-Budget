<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');

require_once('Budgetantrag.php');

class BudgetantragStatusUpdate extends CLI_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();

		// load models
		$this->load->model('extensions/FHC-Core-Budget/budgetantrag_model', 'BudgetantragModel');
		$this->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');
	}

	//------------------------------------------------------------------------------------------------------------------
	// Public methods

	/** Sets Budgetanträge from status new to sent.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function setAbgeschickt($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		$this->_updateMultipleBudgetantragStatus($geschaeftsjahr_kurzbz, Budgetantrag::NEWSTATUS, Budgetantrag::SENT, $kostenstelle_id);
	}

	//------------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Sets all Budgetantraege from a status to another.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $last_budgetstatus_kurzbz
	 * @param $new_budgetstatus_kurzbz
	 * @param $kostenstelle_id optionally limit by Kostenstelle
	 * @return void
	 */
	private function _updateMultipleBudgetantragStatus($geschaeftsjahr_kurzbz, $last_budgetstatus_kurzbz, $new_budgetstatus_kurzbz, $kostenstelle_id)
	{
		$budgetantraegeRes = $this->BudgetantragModel->getBudgetantraegeByGeschaeftsjahrAndLastStatus(
			$geschaeftsjahr_kurzbz,
			$last_budgetstatus_kurzbz,
			$kostenstelle_id
		);

		if (isError($budgetantraegeRes)) echo "Error when getting Budgetantraege";

		if (hasData($budgetantraegeRes))
		{
			$budgetantraege = getData($budgetantraegeRes);

			foreach ($budgetantraege as $budgetantrag)
			{
				$budgetantrag_id = $budgetantrag->budgetantrag_id;

				$result = $this->BudgetantragstatusModel->insert(
					array(
						'budgetantrag_id' => $budgetantrag_id,
						'budgetstatus_kurzbz' => $new_budgetstatus_kurzbz,
						'datum' => date('Y-m-d H:i:s')
					)
				);

				if (isError($result)) echo "Error when inserting status for Antrag with id $budgetantrag_id";
			}
		}
	}
}
