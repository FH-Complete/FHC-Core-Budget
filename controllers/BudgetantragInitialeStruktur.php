<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');


class BudgetantragInitialeStruktur extends CLI_Controller
{
	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();

		$this->load->library('extensions/FHC-Core-Budget/BudgetantragFunktionenLib');
	}

	//------------------------------------------------------------------------------------------------------------------
	// Public methods

	/** Create predefined initial budget structure for active Kostenstellen for a Geschäftsjahr.
	 * Can be executed for all Kostenstellen or only one specific Kostenstelle.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function createInitialeStruktur($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		$result = $this->budgetantragfunktionenlib->createInitialeStruktur($geschaeftsjahr_kurzbz, $kostenstelle_id);

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
