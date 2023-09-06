<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Library that contains all the needed functionalities to operate with the Jobs Queue System
 */
class BudgetExportLib
{
	const GMBH_OE_KURZBZ = 'gmbh';
	const GMBH_UNTERNEHMENSTYP_NAME = 'gmbh';
	const FH_UNTERNEHMEN_CODE = '100000';
	const GMBH_UNTERNEHMEN_CODE = '200000';

	private $_ci; // CI instance
	private $_buchungsperioden = [
		1 => "5",
		2 => "6",
		3 => "7",
		4 => "8",
		5 => "9",
		6 => "10",
		7 => "11",
		8 => "12",
		9 => "1",
		10 => "2",
		11 => "3",
		12 => "4"
	];

	/**
	 * Constructor
	 */
	public function __construct()
	{
		// Gets CI instance
		$this->_ci =& get_instance();

		// Loads all needed models
		$this->_ci->load->model('extensions/FHC-Core-Budget/Budgetantrag_model', 'BudgetanragModel');
		$this->_ci->load->model('organisation/organisationseinheit_model', 'OrganisationseinheitModel');
	}

	//------------------------------------------------------------------------------------------------------------------
	// Public methods

	/**
	 * Generates a csv file for Budget year
	 * @return csv
	 */
	public function generateCSV($geschaeftsjahr, $unternehmenstyp)
	{
		$gmbhOes = array();

		// Get all oes under gmbh for check unternehmen of Kostenstelle
		$gmbhOesRes = $this->_ci->OrganisationseinheitModel->getChilds(self::GMBH_OE_KURZBZ, true);

		if (isError($gmbhOesRes)) return getError($gmbhOesRes);

		if (hasData($gmbhOesRes))
		{
			$gmbhOesData = getData($gmbhOesRes);

			foreach ($gmbhOesData as $gmbhOe)
			{
				$gmbhOes[] = $gmbhOe->oe_kurzbz;
			}
		}

		$dbModel = new DB_Model();

		$params = array($geschaeftsjahr);

		// Erloese werden mit negativen Beträgen exportiert
		// Investitionen werden nur fuer ein Jahr exportiert (Betrag/Nutzungsdauer)
		// Investitionen weren immer auf Konto 704000 Abschreibungen Sachanlagen gebucht
		$query = '
			SELECT * FROM (
				SELECT
				CASE WHEN tbl_budget_position.investition=true
					THEN 704000
					ELSE wawi.tbl_konto.ext_id
				END as ext_id,
				tbl_sap_organisationsstruktur.oe_kurzbz_sap, kostenstelle_id,
				tbl_konto.konto_id,
				sum(
					CASE WHEN tbl_budget_position.investition=true
					THEN
						betrag/nutzungsdauer
					ELSE
						CASE WHEN tbl_budget_position.erloese=true
						THEN
							(betrag * (-1))
						ELSE
							betrag
						END
					END
				),
				tbl_kostenstelle.bezeichnung, tbl_budget_position.benoetigt_am,
				date_part(\'year\', tbl_geschaeftsjahr.ende) as jahr,';

			if ($unternehmenstyp === self::GMBH_UNTERNEHMENSTYP_NAME)
			{
				$query .= self::GMBH_UNTERNEHMEN_CODE;
			}
			else
			{
				$query .= self::FH_UNTERNEHMEN_CODE;
			}

		$query .= ' AS unternehmen
			FROM
				extension.tbl_budget_antrag
				JOIN extension.tbl_budget_position USING(budgetantrag_id)
				LEFT JOIN wawi.tbl_konto ON(tbl_budget_position.konto_id=tbl_konto.konto_id)
				LEFT JOIN wawi.tbl_kostenstelle USING(kostenstelle_id)
				LEFT JOIN sync.tbl_sap_organisationsstruktur ON(tbl_kostenstelle.oe_kurzbz=tbl_sap_organisationsstruktur.oe_kurzbz)
				JOIN public.tbl_geschaeftsjahr USING(geschaeftsjahr_kurzbz)
			WHERE
				--tbl_budget_position.erloese=false AND
				geschaeftsjahr_kurzbz=?';

			// filter budget depending on unternehmenstyp (gmbh, fh)
			if (!isEmptyArray($gmbhOes))
			{
				if ($unternehmenstyp === self::GMBH_UNTERNEHMENSTYP_NAME)
				{
					$query .= ' AND tbl_kostenstelle.oe_kurzbz IN ?';
				}
				else
				{
					$query .= ' AND tbl_kostenstelle.oe_kurzbz NOT IN ?';
				}
				$params[] = $gmbhOes;
			}

			$query .= ' GROUP BY 1, tbl_sap_organisationsstruktur.oe_kurzbz_sap,
				kostenstelle_id, tbl_kostenstelle.oe_kurzbz, tbl_konto.konto_id, tbl_kostenstelle.bezeichnung,
				tbl_budget_position.benoetigt_am, tbl_geschaeftsjahr.ende
			) budget
			-- exclude Kostenstellen with no sap oe and no konto id
			WHERE NOT (oe_kurzbz_sap IS NULL AND ext_id IS NULL)
			ORDER BY kostenstelle_id, konto_id';

		$csvResult = $dbModel->execReadOnlyQuery($query, $params);

		// If error occurred while retrieving new users from database then return the error
		if (isError($csvResult)) return getError($csvResult);

		$hashArray = array();

		if (hasData($csvResult))
		{
			$rawDataArray = getData($csvResult);

			foreach ($rawDataArray as $budgetRequest)
			{
				if ($budgetRequest->benoetigt_am === NULL)
				{
					$budgetMonthsArray = $this->distributeBudgetRequestOverYearEqually($budgetRequest);
				}
				else
				{
					$budgetMonthsArray = $this->distributeBudgetRequestOverYearForRequiredDate($budgetRequest);
				}

				foreach ($budgetMonthsArray as $budgetMonth)
				{
					$identifier = (string)"$budgetMonth->konto_id$budgetMonth->kostenstelle_id";

					if (!array_key_exists($identifier, $hashArray))
					{
						$hashArray[$identifier] = array();
					}

					array_push($hashArray[$identifier], $budgetMonth);
				}
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
		$betrag_distributed_equally = (float) $budgetRequest->sum / 12;

		for ($month = 1; $month <= 12; $month++)
		{
			$unternehmen = $budgetRequest->unternehmen;
			$konto_id = $budgetRequest->ext_id;
			$kostenstelle_id = $budgetRequest->oe_kurzbz_sap;
			$profit_center= "";
			$period = $this->_buchungsperioden[$month];
			$geschaeftsjahr = $budgetRequest->jahr;

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
			$unternehmen = $budgetRequest->unternehmen;;
			$konto_id = $budgetRequest->ext_id;
			$kostenstelle_id = $budgetRequest->oe_kurzbz_sap;
			$profit_center= "";
			$period = $this->_buchungsperioden[$month];
			$geschaeftsjahr = $budgetRequest->jahr;

			if ($month===$benoetigt_am_month)
				$betrag = (float) $budgetRequest->sum;
			else
				$betrag = 0.0;

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
		$buchungsperioden = array_fill_keys(array_values($this->_buchungsperioden), 0.0);
		$buchungsperioden[$period] = (float) $betrag;
		$budgetPeriod->buchungsperioden = $buchungsperioden;

		return $budgetPeriod;
	}

	/** Merges all identical Budget Periods in 2 Dimensional Array  and returns a 1 Dimensional Array in which each
	 *  each entry represents a Budget Period.
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
				$monthRow->unternehmen = $identicalBudgetRequest[0]->unternehmen;;
				$monthRow->konto_id = $identicalBudgetRequest[0]->konto_id;
				$monthRow->kostenstelle_id = $identicalBudgetRequest[0]->kostenstelle_id;
				$monthRow->profit_center = "";
				$monthRow->geschaeftsjahr = $identicalBudgetRequest[0]->geschaeftsjahr;
				$buchungsperioden = array_fill_keys(array_values($this->_buchungsperioden), 0.0);
				ksort($buchungsperioden);

				foreach($identicalBudgetRequest as $request)
				{
					foreach ($request->buchungsperioden as $buchungsperiode => $betrag)
					{
						$buchungsperioden[$buchungsperiode] += $betrag;
					}
				}

				foreach ($buchungsperioden as $buchungsperiode => $betrag)
				{
					$monthRow->{$buchungsperiode} = number_format(
						(float)$betrag,  $decimals = 2 , $dec_point = ".", $thousands_sep = ""
					);
				}

				array_push($formattedDataArray, $monthRow);
			}
			else
			{
				array_push($formattedDataArray, $identicalBudgetRequest[0]);
			}
		}

		return $formattedDataArray;
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
		$header = array("Unternehmen", "Sachkonto", "Kostenstelle", "Profit-Center", "Geschaeftsjahr");

		$buchungsperioden = array_values($this->_buchungsperioden);
		sort($buchungsperioden);

		$header = array_merge($header, $buchungsperioden);

		$delimiter = ',';

		header('Content-Type: application/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename="budgetexport.csv"');
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

		return $fp;
	}
}
