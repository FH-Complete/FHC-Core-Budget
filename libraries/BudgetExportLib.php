<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Library that contains all the needed functionalities to operate with the Jobs Queue System
 */
class BudgetExportLib
{
	private $_ci; // CI instance

	/**
	 * Constructor
	 */
	public function __construct()
	{
		// Gets CI instance
		$this->_ci =& get_instance();

		// Loads all needed models
		$this->_ci->load->model('extensions/FHC-Core-Budget/Budgetantrag_model', 'BudgetanragModel');
	}

	//------------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * To get all the most recently added jobs using the given job type
	 */
	public function generateCSV()
	{
		$dbModel = new DB_Model();

		$csvResult = $dbModel->execReadOnlyQuery('
			
			SELECT
				tbl_sap_organisationsstruktur.oe_kurzbz_sap, kostenstelle_id,
			tbl_konto.konto_id, sum(betrag),
				tbl_kostenstelle.bezeichnung, tbl_budget_position.benoetigt_am
			FROM
				extension.tbl_budget_antrag
				JOIN extension.tbl_budget_position USING(budgetantrag_id)
				LEFT JOIN wawi.tbl_konto
			ON(tbl_budget_position.konto_id=tbl_konto.konto_id)
				LEFT JOIN wawi.tbl_kostenstelle USING(kostenstelle_id)
				LEFT JOIN sync.tbl_sap_organisationsstruktur
			ON(tbl_kostenstelle.oe_kurzbz=tbl_sap_organisationsstruktur.oe_kurzbz)
			WHERE
				geschaeftsjahr_kurzbz=\'GJ2020-2021\' 
				
				--AND tbl_konto.konto_id IN (31,104,111)
				
			GROUP BY tbl_sap_organisationsstruktur.oe_kurzbz_sap,
				kostenstelle_id, tbl_konto.konto_id,     tbl_kostenstelle.bezeichnung,
				tbl_budget_position.benoetigt_am
			ORDER BY kostenstelle_id, konto_id');

		// If error occurred while retrieving new users from database then return the error
		if (isError($csvResult)) return getError($csvResult);

		$rawDataArray = getData($csvResult);
		$hashArray = array();

		foreach($rawDataArray as $budgetRequest)
		{
			if($budgetRequest->benoetigt_am === NULL)
			{
				$budgetMonthsArray = $this->distributeBudgetRequestOverYearEqually($budgetRequest);
			}
			else
			{
				$budgetMonthsArray = $this->distributeBudgetRequestOverYearForRequiredDate($budgetRequest);
			}

			foreach($budgetMonthsArray as $bugetMonth)
			{
				$identifier = (string)"$bugetMonth->konto_id$bugetMonth->kostenstelle_id$bugetMonth->buchungsperiode";

				if(!array_key_exists($identifier, $hashArray))
					{
						$hashArray[$identifier]=array();
					}

				array_push($hashArray[$identifier],$bugetMonth);
			}
		}

		// sort the Hasharry so the Buchungsperiode are lined up in order for the export
		ksort($hashArray);

		$formattedDataArray = $this->mergeIdenticalPeriods($hashArray);

		$csvFile = $this->array2csv($formattedDataArray);

		return $csvFile;
	}

	//------------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Splits a Budget Request of a year into 12 month Periods and distributes requested sum equally.
	 *
	 * @return  array
	 */
	private function distributeBudgetRequestOverYearEqually($budgetRequest)
	{
		$monthlyBudgetRequestArray = array();
		$betrag_distributed_equally = money_format("%.2n", (int)$budgetRequest->sum / 12);

		for ($month = 1; $month <= 12; $month++)
		{
			$unternehmen = "100000";
			$konto_id = $budgetRequest->konto_id;
			$kostenstelle_id = $budgetRequest->oe_kurzbz_sap;
			$profit_center= "";
			$period = $this->getBuchungsperiodeForCorrespondingMonth($month);
			$geschaeftsjahr = "2020";

			$budgetForPeriod = $this->generateBudgetForPeriod($unternehmen, $konto_id, $kostenstelle_id, $profit_center,
													$period, $geschaeftsjahr, $betrag_distributed_equally);

			array_push($monthlyBudgetRequestArray, $budgetForPeriod);
		}

		return $monthlyBudgetRequestArray;
	}

	/**
	 * Splits a Budget Request of a year into 12 month Periods and puts the requested sum into the month in which it is
	 * required. The other 11 months have an amount of 0.
	 *
	 * @return  array
	 */
	private function distributeBudgetRequestOverYearForRequiredDate($budgetRequest)
	{
		$monthlyBudgetRequestArray = array();

		$benoetigt_am = strtotime($budgetRequest->benoetigt_am);
		$benoetigt_am_month = idate('m', $benoetigt_am);

		for ($month = 1; $month <= 12; $month++)
		{
			$unternehmen = "100000";
			$konto_id = $budgetRequest->konto_id;
			$kostenstelle_id = $budgetRequest->oe_kurzbz_sap;
			$profit_center= "";
			$period = $this->getBuchungsperiodeForCorrespondingMonth($month);
			$geschaeftsjahr = "2020";

			if($month===$benoetigt_am_month) $betrag = (float)$budgetRequest->sum;
			else $betrag = 0.0;

			$budgetForPeriod = $this->generateBudgetForPeriod($unternehmen, $konto_id, $kostenstelle_id, $profit_center,
				$period, $geschaeftsjahr, $betrag);

			array_push($monthlyBudgetRequestArray, $budgetForPeriod);
		}

		return $monthlyBudgetRequestArray;
	}

	/**
	 * Returns a budget Period Object.
	 *
	 * @param $unternehmen
	 * @param $konto_id
	 * @param $kostenstelle_id
	 * @param $profit_center
	 * @param $period
	 * @param $geschaeftsjahr
	 * @param $betrag
	 * 
	 * @return  stdClass
	 */
	private function generateBudgetForPeriod($unternehmen, $konto_id, $kostenstelle_id, $profit_center,
										  $period, $geschaeftsjahr, $betrag)
	{
		$budgetPeriod = new stdClass();
		$budgetPeriod->unternehmen = $unternehmen;
		$budgetPeriod->konto_id = $konto_id;
		$budgetPeriod->kostenstelle_id = $kostenstelle_id;
		$budgetPeriod->profit_center = $profit_center;
		$budgetPeriod->geschaeftsjahr = $geschaeftsjahr;
		$budgetPeriod->buchungsperiode = $period;
		$budgetPeriod->betrag = $betrag;

		return $budgetPeriod;
	}

	/** Merges all identical Budget Periods in 2 Dimensional Array  and returns a 1 Dimensional Array in which each
	 *  each entriy represents a Budget Period.
	 * 
	 * @param $hashArray
	 * 
	 * @return array
	 */
	private function mergeIdenticalPeriods($hashArray)
	{
		$formattedDataArray = array();

		foreach($hashArray as $identicalBudgetRequest)
		{
			if(sizeof($identicalBudgetRequest)>1)
			{
				$monthRow = new stdClass();
				$monthRow->unternehmen = "100000";
				$monthRow->konto_id = $identicalBudgetRequest[0]->konto_id;
				$monthRow->kostenstelle_id = $identicalBudgetRequest[0]->kostenstelle_id;
				$monthRow->profit_center = "";
				$monthRow->geschaeftsjahr = $identicalBudgetRequest[0]->geschaeftsjahr;
				$monthRow->buchungsperiode = $identicalBudgetRequest[0]->buchungsperiode;

				$betrag=0.0;

				foreach($identicalBudgetRequest as $request)
				{
					$requestBetrag = $request->betrag;
					$betrag = $betrag + $requestBetrag;
				}

				$monthRow->betrag = $betrag;

				array_push($formattedDataArray, $monthRow);
			}
			else
			{
				array_push($formattedDataArray, $identicalBudgetRequest[0]);
			}
		}

		return $formattedDataArray;
	}

	/** Returns the Buchungsperiode For the corresponding Month
	 *
	 * @param $month
	 * 
	 * @return int 
	 */
	private function getBuchungsperiodeForCorrespondingMonth($month)
	{
		$mapping = [
			1 => "005",
			2 => "006",
			3 => "007",
			4 => "008",
			5 => "009",
			6 => "010",
			7 => "011",
			8 => "012",
			9 => "001",
			10 => "002",
			11 => "003",
			12 => "004"
		];
		return $mapping[$month];
	}
	
	/** Returns the Geschäftsjahr for given Period and Akademic Year 
	 * 
	 * @param $period
	 * @param $requestedYear
	 * 
	 * @return int
	 */
	private function getGeschaeftsjahrForPeriod($period, $requestedYear)
	{
			if($period>4)
			{
				return $requestedYear+1;
			}
			else
			{
				return $requestedYear;
			}
	}

	/** Export the formatted array as a csv File
	 * @return csv
	 */
	function array2csv($array)
	{
		$header = array("Unternehmen", "Sachkonto", "Kostenstelle", "Profit-Center",
			"Geschaeftsjahr", "Buchungsperiode", "Betrag");
		$delimiter = ',';

		if (count($array) > 0) {
			header('Content-Type: application/csv; charset=utf-8');
			header('Content-Disposition: attachment; filename="budgetexport.csv",');
			ob_start();
			// prepare the file
			$fp = fopen('php://output', 'w');

			// Save header
			//$header = array_keys((array)$array[0]);
			fputcsv($fp, $header, $delimiter);

			// Save data
			foreach ($array as $element) {
				fputcsv($fp, (array)$element, $delimiter);
			}
			fclose($fp);
		}

		return $fp;
	}


}

