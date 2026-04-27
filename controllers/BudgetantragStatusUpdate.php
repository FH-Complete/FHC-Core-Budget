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

		// load libraries
		$this->load->library('extensions/FHC-Core-Budget/BudgetantragFunktionenLib');
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
		$result = $this->budgetantragfunktionenlib->setAbgeschickt($geschaeftsjahr_kurzbz, $kostenstelle_id);
		$this->_outputResult($result);
	}

	/** Sets Budgetanträge from status abgeschickt to freigegeben.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function setFreigegeben($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		$result = $this->budgetantragfunktionenlib->setFreigegeben($geschaeftsjahr_kurzbz, $kostenstelle_id);
		$this->_outputResult($result);
	}

	/** Sets Budgetanträge from status freigegebben to new.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function setNeu($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		$result = $this->budgetantragfunktionenlib->setNeu($geschaeftsjahr_kurzbz, $kostenstelle_id);
		$this->_outputResult($result);
	}

	/**
	 *  Write result on cli.
	 * @param string|array $result
	 */
	private function _outputResult($result)
	{
		if (isError($result)) echo getError($result);

		if (hasData($result))
		{
			$result = getData($result);
			if (is_string($result)) echo $result."\n";

			if (is_array($result))
			{
				foreach ($result as $txt)
				{
					echo $txt."\n";
				}
			}
		}
	}
}
