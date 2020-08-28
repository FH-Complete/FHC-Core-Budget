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
				
				AND tbl_konto.konto_id IN (31,104,111)
				
			GROUP BY tbl_sap_organisationsstruktur.oe_kurzbz_sap,
				kostenstelle_id, tbl_konto.konto_id,     tbl_kostenstelle.bezeichnung,
				tbl_budget_position.benoetigt_am
			ORDER BY kostenstelle_id, konto_id');

		// If error occurred while retrieving new users from database then return the error
		if (isError($csvResult)) return getError($csvResult);

		$csvArray = getData($csvResult);
		$hashArray = array();
		$finalArray = array();

		foreach($csvArray as $csvRow)
		{
			if($csvRow->benoetigt_am === NULL)
			{

				$sum_distibuted_equally = money_format("%.2n", (int)$csvRow->sum / 12);

				for ($i = 1; $i <= 12; $i++)
				{
					$monthRow = new stdClass();
					$monthRow->unternehmen = "100000";
					$monthRow->konto_id = $csvRow->konto_id;
					$monthRow->kostenstelle_id = $csvRow->kostenstelle_id;
					$monthRow->profit_center = "";
					$monthRow->geschaeftsjahr = "2020";
					$monthRow->buchungsperiode = $i;
					$monthRow->betrag = (float)$sum_distibuted_equally;

					$key = "$monthRow->konto_id$monthRow->kostenstelle_id$monthRow->buchungsperiode";

					if(!array_key_exists($key, $hashArray))
					{
						$hashArray[$key]=array();
					}

					array_push($hashArray[$key],$monthRow);

				}
			}
			else
			{
				$benoetigt_am = strtotime($csvRow->benoetigt_am);
				$month = idate('m', $benoetigt_am);
				$geschaeftsjahr = date('Y', $benoetigt_am);

				for ($i = 1; $i <= 12; $i++)
				{
					$monthRow = new stdClass();
					$monthRow->unternehmen = "100000";
					$monthRow->konto_id = $csvRow->konto_id;
					$monthRow->kostenstelle_id = $csvRow->kostenstelle_id;
					$monthRow->profit_center = "";
					$monthRow->geschaeftsjahr = $geschaeftsjahr;
					$monthRow->buchungsperiode = $i;

					if($i===$this->getBuchungsperiodeForMonth($month)) $monthRow->betrag = (float)$csvRow->sum;
					else $monthRow->betrag=0.0;

					$key = "$monthRow->konto_id$monthRow->kostenstelle_id$monthRow->buchungsperiode";

					if(!array_key_exists($key, $hashArray))
					{
						$hashArray[$key]=array();
					}

					array_push($hashArray[$key],$monthRow);

				}


			}
		}

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

				array_push($finalArray, $monthRow);
			}
			else
			{
				array_push($finalArray, $identicalBudgetRequest[0]);
			}
		}

		return $finalArray;
	}

	private function getBuchungsperiodeForMonth($monthNumber)
	{
		$mapping = [
			1 => 9,
			2 => 10,
			3 => 11,
			4 => 12,
			5 => 1,
			6 => 2,
			7 => 3,
			8 => 4,
			9 => 5,
			10 => 6,
			11 => 7,
			12 => 8
		];
		return $mapping[$monthNumber];
	}


}

