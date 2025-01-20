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
	private $_default_buchungsperioden_betraege = [];

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

		// get Buchungsperioden, prefilled with default 0 values
		$default_buchungsperioden_betraege = array_fill_keys(array_values($this->_buchungsperioden), 0.0);
		ksort($default_buchungsperioden_betraege);
		$this->_default_buchungsperioden_betraege = $default_buchungsperioden_betraege;
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
				// everything in the month of request, or distribute over year equally
				if ($budgetRequest->benoetigt_am === null)
				{
					$budgetMonth = $this->distributeBudgetRequestOverYearEqually($budgetRequest);
				}
				else
				{
					$budgetMonth = $this->distributeBudgetRequestOverYearForRequiredDate($budgetRequest);
				}

				// identifier: one entry for each Konto and Kostenstelle combination, replace null values for better sorting
				$ktoIdentifier = isset($budgetMonth->konto_id) ? $budgetMonth->konto_id : "_";
				$identifier = (string)"$ktoIdentifier$budgetMonth->kostenstelle_id";

				if (!array_key_exists($identifier, $hashArray))
				{
					$hashArray["$identifier"] = array();
				}

				array_push($hashArray["$identifier"], $budgetMonth);
			}
		}

		// sort the Hasharry so the Buchungsperiode are lined up in order for the export
		ksort($hashArray, SORT_STRING);
		$formattedDataArray = $this->mergeIdenticalPeriods($hashArray);

		$csvFile = $this->array2csv($formattedDataArray);

		return $csvFile;
	}

	//------------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Splits a Budget Request of a year into 12 month Periods and distributes requested sum equally.
	 *
	 * @return  object
	 */
	private function distributeBudgetRequestOverYearEqually($budgetRequest)
	{
		$betrag_distributed_equally = (float)$budgetRequest->sum / numberOfElements($this->_buchungsperioden);

		$unternehmen = $budgetRequest->unternehmen;
		$konto_id = $budgetRequest->ext_id;
		$kostenstelle_id = $budgetRequest->oe_kurzbz_sap;
		$profit_center= "";
		$geschaeftsjahr = $budgetRequest->jahr;

		$budgetForPeriod = $this->generateBudget($unternehmen, $konto_id, $kostenstelle_id, $profit_center, $geschaeftsjahr);

		// set same betrag for each period
		foreach ($budgetForPeriod->buchungsperioden as $buchungsperiode => $betrag)
		{
			$budgetForPeriod->buchungsperioden[$buchungsperiode] = $betrag_distributed_equally;
		}

		return $budgetForPeriod;
	}

	/**
	 * Puts the requested budget sum into the month in which it is required. The other 11 months have an amount of 0.
	 *
	 * @return  object
	 */
	private function distributeBudgetRequestOverYearForRequiredDate($budgetRequest)
	{
		// get month from benoetigt_am date
		$benoetigt_am = strtotime($budgetRequest->benoetigt_am);
		$benoetigt_am_month = idate('m', $benoetigt_am);

		// extract properties
		$unternehmen = $budgetRequest->unternehmen;
		$konto_id = $budgetRequest->ext_id;
		$kostenstelle_id = $budgetRequest->oe_kurzbz_sap;
		$profit_center= "";
		$period = $this->_buchungsperioden[$benoetigt_am_month];
		$geschaeftsjahr = $budgetRequest->jahr;

		$budgetForPeriod = $this->generateBudget($unternehmen, $konto_id, $kostenstelle_id, $profit_center, $geschaeftsjahr);

		// set  budget amount for requested month
		$budgetForPeriod->buchungsperioden[$period] = (float)$budgetRequest->sum;

		return $budgetForPeriod;
	}

	/**
	 * Returns a budget Object.
	 *
	 * @param $unternehmen
	 * @param $konto_id
	 * @param $kostenstelle_id
	 * @param $profit_center
	 * @param $geschaeftsjahr
	 *
	 * @return  stdClass
	 */
	private function generateBudget($unternehmen, $konto_id, $kostenstelle_id, $profit_center, $geschaeftsjahr)
	{
		$budgetPeriod = new stdClass();
		$budgetPeriod->unternehmen = $unternehmen;
		$budgetPeriod->konto_id = $konto_id;
		$budgetPeriod->kostenstelle_id = $kostenstelle_id;
		$budgetPeriod->profit_center = $profit_center;
		$budgetPeriod->geschaeftsjahr = $geschaeftsjahr;
		$budgetPeriod->buchungsperioden = $this->_default_buchungsperioden_betraege;

		return $budgetPeriod;
	}

	/** Merges (sums up) all identical Budget entries and returns a 1 Dimensional Array
	 *
	 * @param $hashArray
	 *
	 * @return array
	 */
	private function mergeIdenticalPeriods($hashArray)
	{
		$formattedDataArray = array();

		foreach($hashArray as $identicalBudgetRequests)
		{
			// create object with first request
			$monthRow = new stdClass();
			$monthRow->unternehmen = $identicalBudgetRequests[0]->unternehmen;
			$monthRow->konto_id = $identicalBudgetRequests[0]->konto_id;
			$monthRow->kostenstelle_id = $identicalBudgetRequests[0]->kostenstelle_id;
			$monthRow->profit_center = "";
			$monthRow->geschaeftsjahr = $identicalBudgetRequests[0]->geschaeftsjahr;

			// sum up all identical requests
			$buchungsperioden = $this->_default_buchungsperioden_betraege;
			foreach($identicalBudgetRequests as $request)
			{
				foreach ($request->buchungsperioden as $buchungsperiode => $betrag)
				{
					$buchungsperioden[$buchungsperiode] += $betrag;
				}
			}

			// format all amounts
			foreach ($buchungsperioden as $buchungsperiode => $betrag)
			{
				$monthRow->{$buchungsperiode} = number_format(
					(float)$betrag,
					$decimals = 2,
					$dec_point = ".",
					$thousands_sep = ""
				);
			}
			// add row with amount sum
			array_push($formattedDataArray, $monthRow);
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
	public function array2csv($array)
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
