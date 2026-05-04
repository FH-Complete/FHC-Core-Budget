<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Library that contains all the needed functionalities to operate with the Jobs Queue System
 */
class BudgetantragFunktionenLib
{
	const INSERT_VON_USER = 'system';

	const NEWSTATUS = 'new';
	const SENT = 'sent';
	const APPROVED = 'approved';
	const REJECTED = 'rejected';

	private $_budgetstatus_permissions = array(
		self::NEWSTATUS => 'extension/budget_freigabe',
		self::SENT => '',
		self::APPROVED => 'extension/budget_freigabe',
		self::REJECTED => 'extension/budget_freigabe'
	);


	private $_ci; // CI instance

	/**
	 * Constructor
	 */
	public function __construct()
	{
		// Gets CI instance
		$this->_ci =& get_instance();

		// Loads all needed models
		$this->_ci->load->model('extensions/FHC-Core-Budget/Budgetantrag_model', 'BudgetantragModel');
		$this->_ci->load->model('extensions/FHC-Core-Budget/budgetantragstatus_model', 'BudgetantragstatusModel');

		$this->_ci->load->library('PermissionLib');
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
		return $this->_updateMultipleBudgetantragStatus($geschaeftsjahr_kurzbz, self::NEWSTATUS, self::SENT, $kostenstelle_id);
	}

	/** Sets Budgetanträge from status abgeschickt to freigegeben.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function setFreigegeben($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		return $this->_updateMultipleBudgetantragStatus($geschaeftsjahr_kurzbz, self::SENT, self::APPROVED, $kostenstelle_id);
	}

	/** Sets Budgetanträge from status freigegebben to new.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function setNeu($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		return $this->_updateMultipleBudgetantragStatus($geschaeftsjahr_kurzbz, self::APPROVED, self::NEWSTATUS, $kostenstelle_id);
	}

	/** Create predefined initial budget structure for active Kostenstellen for a Geschäftsjahr.
	 * Can be executed for all Kostenstellen or only one specific Kostenstelle.
	 * @param $geschaeftsjahr_kurzbz
	 * @param $kostenstelle_id
	 * @return void
	 */
	public function createInitialeStruktur($geschaeftsjahr_kurzbz, $kostenstelle_id = null)
	{
		$this->_ci->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');
		$this->_ci->load->model('accounting/konto_model', 'KontoModel');
		$this->_ci->load->model('accounting/kostenstelle_model', 'KostenstelleModel');

		// TODO transaction?
		$kostenstellenRes = $this->_ci->KostenstelleModel->getKostenstellenForGeschaeftsjahr($geschaeftsjahr_kurzbz);

		if (!hasData($kostenstellenRes))
		{
			return success(["Keine Kostenstellen gefunden"]);
		}

		$infos = [];
		$counter = 0;

		$kostenstellen = getData($kostenstellenRes);

		// Personalbudgetanträge: 'name of Budgetantrag' => 'konto_id'
		// in reverse order, because last inserted is shown first
		$personalBudgetantragWithMonths = array(
			'Personal Sonstiges - Honorare, Prüfungsgebühren' => array(
				'budgetposten' => 'Honorare, Prüfungsgebühren',
				'konto_id' => 143
			),
			'Personal Sonstiges - Studentische Hilfskräfte' => array(
				'budgetposten' => 'Studentische Hilfskräfte',
				'konto_id' => 145
			),
			'Personal Externe' => array(
				'konto_id' => 133
			),
			'Personal Angestellte' => array(
				'konto_id' => 132
			)
		);

		// other budgetantrag categories, note: order is important!
		$otherBudgetantraege = array(
			'Erlöse' => array(
				array(
					'budgetposten' => 'Erlöse Bund',
					'konto_id' => 134,
					'erloese' => true
				),
				array(
					'budgetposten' => 'Erlöse Studierende',
					'konto_id' => 135,
					'erloese' => true
				),
				array(
					'budgetposten' => 'Erlöse WV TW GmbH',
					'konto_id' => 137,
					'erloese' => true
				),
				array(
					'budgetposten' => 'Erlöse F&E, sonstige Projekte',
					'konto_id' => 136,
					'erloese' => true
				),
				array(
					'budgetposten' => 'Erträge sonstige',
					'konto_id' => 138,
					'erloese' => true
				)
			),
			'Investitionen' => array(
				array(
					'budgetposten' => 'Investitionen',
					'konto_id' => null,
					'investition' => true,
					'benoetigt_am' => date('Y-09-01')
				)
			),
			'Sachbudget' => array(
				array(
					'budgetposten' => 'Sachbudget',
					'konto_id' => null,
				)
			)
		);

		$months = $this->_getMonths($geschaeftsjahr_kurzbz);

		foreach ($kostenstellen as $kst)
		{
			// skip if no permissions
			if (!$this->checkBudgetantragstatusPermission($kst->kostenstelle_id, self::NEWSTATUS)) continue;

			// skip inactive Kostenstellen or filtered kostenstelle
			if ($kst->aktiv !== true || (isset($kostenstelle_id) && $kst->kostenstelle_id != $kostenstelle_id))
				continue;

			// check if Kostenstelle already has Budgetanträge
			$existingBudgetantraegeRes = $this->_ci->BudgetantragModel->getBudgetantraege($geschaeftsjahr_kurzbz, $kst->kostenstelle_id);

			if (isError($existingBudgetantraegeRes))
			{
				$infos[] = "Error when getting Budgetanträge: ".getError($existingBudgetantraegeRes);
				continue;
			}

			// Do not insert default structure if there are already Budgetanträge present
			if (hasData($existingBudgetantraegeRes))
				continue;

			$budgetantrag = array(
				'kostenstelle_id' => $kst->kostenstelle_id,
				'geschaeftsjahr_kurzbz' => $geschaeftsjahr_kurzbz,
				'insertvon' => self::INSERT_VON_USER
			);

			// Insert other budgetanträge first so they are shown last
			foreach ($otherBudgetantraege as $bezeichnung => $budetpositionen)
			{
				// insert budgetantrag and position
				$result = $this->_addBudgetantrag($bezeichnung, $budgetantrag, $budetpositionen);
				if (isError($result)) $infos[] = getError($result);
				if (hasData($result))
				{
					$infos = array_merge($infos, getData($result));
					$counter++;
				}
			}

			// Insert Personalbudget
			foreach ($personalBudgetantragWithMonths as $budgetantragBezeichnung => $budgetpostenInfo)
			{
				// create budgetpositionen for each month
				$positionen = array();

				// set Budgetposten name if explicitely given, otherwise Budgetposten name is name of Antrag
				$budgetposten_bezeichnung = isset($budgetpostenInfo['budgetposten']) ? $budgetpostenInfo['budgetposten'] : $budgetantragBezeichnung;

				$konto_id = $budgetpostenInfo['konto_id'];

				// add position for each month
				foreach ($months as $monthNumber => $monthArr)
				{
					$position = array();
					$position['budgetposten'] = $budgetposten_bezeichnung.'/'.$monthArr['bezeichnung'].' '.$monthArr['jahr'];
					$position['benoetigt_am'] = $monthArr['jahr'].'-'.$monthNumber.'-01';
					$position['konto_id'] = $konto_id;
					$positionen[] = $position;
				}

				// insert budgetantrag and position
				$this->_addBudgetantrag($budgetantragBezeichnung, $budgetantrag, $positionen);
				if (isError($result)) $infos[] = getError($result);
				if (hasData($result))
				{
					$infos = array_merge($infos, getData($result));
					$counter++;
				}
			}
		}

		$infos[] = "Anlage initialer Struktur abgeschlossen, $counter Anträge hinzugefügt";

		return success($infos);
	}

	/**
	 * Checks if logged user has permission for Freigabe of a Kostenstelle
	 * @param $kostenstelle_id
	 * @param $budgetstatus_kurzbz
	 * @return bool
	 */
	public function checkBudgetantragstatusPermission($kostenstelle_id, $budgetstatus_kurzbz)
	{
		// do not check permissions if called from command line
		if (is_cli()) return true;
		if ($this->_budgetstatus_permissions[$budgetstatus_kurzbz] === '')
			return true;

		return $this->_ci->permissionlib->isBerechtigt(
			$this->_budgetstatus_permissions[$budgetstatus_kurzbz], 'suid', null, $kostenstelle_id
		);
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
		$infos = [];

		$budgetantraegeRes = $this->_ci->BudgetantragModel->getBudgetantraegeByGeschaeftsjahrAndLastStatus(
			$geschaeftsjahr_kurzbz,
			$last_budgetstatus_kurzbz,
			$kostenstelle_id
		);

		if (isError($budgetantraegeRes)) return error("Fehler beim Holen der Budgetanträge: " . getError($budgetantraegeRes));

		$counter = 0;

		if (hasData($budgetantraegeRes))
		{
			$budgetantraege = getData($budgetantraegeRes);

			foreach ($budgetantraege as $budgetantrag)
			{
				// check kostenstelle permissions
				if (!$this->checkBudgetantragstatusPermission($budgetantrag->kostenstelle_id, $new_budgetstatus_kurzbz)) continue;

				$budgetantrag_id = $budgetantrag->budgetantrag_id;

				$result = $this->_ci->BudgetantragstatusModel->insert(
					array(
						'budgetantrag_id' => $budgetantrag_id,
						'budgetstatus_kurzbz' => $new_budgetstatus_kurzbz,
						'datum' => date('Y-m-d H:i:s')
					)
				);

				if (isError($result)) return error("Fehler beim Hinzufügen des Status mit Id $budgetantrag_id: ".getError($result));

				$counter++;
				$infos[] = "Status von Budgetantrag ".$budgetantrag->bezeichnung
					." mit Id $budgetantrag_id erfolgreich auf \"$new_budgetstatus_kurzbz\" geändert";
			}
		}

		$infos[] = "Statusänderungen abgeschlossen: $counter Änderungen";
		return success($infos);
	}

/**
	 * Add a Budgetantrag with Budgetpositionen.
	 * @param $bezeichnung
	 * @param $budgetantrag
	 * @param $positionen
	 * @return void
	 */
	private function _addBudgetantrag($bezeichnung, $budgetantrag, $positionen)
	{
		$infos = [];
		$budgetantrag['bezeichnung'] = $bezeichnung;

		// create budgetpositionen
		for ($i = 0; $i < count($positionen); $i++)
		{
			// check if konto id exists for the Kostenstelle
			if (isset($positionen[$i]['konto_id']))
			{
				$this->_ci->KontoModel->addJoin('wawi.tbl_konto_kostenstelle', 'konto_id');
				$kontoRes = $this->_ci->KontoModel->loadWhere(
					array(
						'konto_id' => $positionen[$i]['konto_id'],
						'kostenstelle_id' => $budgetantrag['kostenstelle_id']
					)
				);

				if (!hasData($kontoRes))
				{
					$infos[] = 'Konto Id '.$positionen[$i]['konto_id'].' für Kostenstelle '.$budgetantrag['kostenstelle_id'].' nicht gefunden';
					$positionen[$i]['konto_id'] = null;
				}
			}

			$positionen[$i]['insertvon'] = self::INSERT_VON_USER;
			$positionen[$i]['betrag'] = 0;
		}

		// insert budgetantrag and position
		$budgetantragAddRes = $this->_ci->BudgetantragModel->addBudgetantrag($budgetantrag, $positionen);

		if (isError($budgetantragAddRes))
		{
			return error("Fehler beim Hinzufügen des Budgetantrags: ".getError($budgetantragAddRes));
		}

		$infos[] = "Budgetantrag ".(hasData($budgetantragAddRes) ? getData($budgetantragAddRes) : '')
			." ".$budgetantrag["bezeichnung"]." erfolgreich hinzugefügt";

		return success($infos);
	}

	/**
	 * Gets Months and their number, german name and Geschäftsjahr.
	 * @param $geschaeftsjahr_kurzbz
	 * @return array
	 */
	private function _getMonths($geschaeftsjahr_kurzbz)
	{
		$geschaeftsjahrRes = $this->_ci->GeschaeftsjahrModel->load($geschaeftsjahr_kurzbz);

		if (!hasData($geschaeftsjahrRes))
		{
			//echo "No Geschäftsjahr found";
			return array();
		}

		$geschaeftsjahr = getData($geschaeftsjahrRes)[0];

		$geschaeftsjahr_start = substr($geschaeftsjahr->start, 0, 4);
		$geschaeftsjahr_ende = substr($geschaeftsjahr->ende, 0, 4);

		return array(
			'09' => array(
				'bezeichnung' => 'September',
				'jahr' => $geschaeftsjahr_start,
			),
			'10' => array(
				'bezeichnung' => 'Oktober',
				'jahr' => $geschaeftsjahr_start,
			),
			'11' => array(
				'bezeichnung' => 'November',
				'jahr' => $geschaeftsjahr_start,
			),
			'12' => array(
				'bezeichnung' => 'Dezember',
				'jahr' => $geschaeftsjahr_start,
			),
			'01' => array(
				'bezeichnung' => 'Januar',
				'jahr' => $geschaeftsjahr_ende,
			),
			'02' => array(
				'bezeichnung' => 'Februar',
				'jahr' => $geschaeftsjahr_ende,
			),
			'03' => array(
				'bezeichnung' => 'März',
				'jahr' => $geschaeftsjahr_ende,
			),
			'04' => array(
				'bezeichnung' => 'April',
				'jahr' => $geschaeftsjahr_ende,
			),
			'05' => array(
				'bezeichnung' => 'Mai',
				'jahr' => $geschaeftsjahr_ende,
			),
			'06' => array(
				'bezeichnung' => 'Juni',
				'jahr' => $geschaeftsjahr_ende,
			),
			'07' => array(
				'bezeichnung' => 'Juli',
				'jahr' => $geschaeftsjahr_ende,
			),
			'08' => array(
				'bezeichnung' => 'August',
				'jahr' => $geschaeftsjahr_ende,
			)
		);
	}
}
