<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');


class BudgetantragInitialeStruktur extends CLI_Controller
{
	CONST INSERT_VON_USER = 'system';

	/**
	 * Constructor
	 */
	public function __construct()
	{
		parent::__construct();

		// load models
		$this->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');
		$this->load->model('accounting/konto_model', 'KontoModel');
		$this->load->model('accounting/kostenstelle_model', 'KostenstelleModel');
		$this->load->model('extensions/FHC-Core-Budget/Budgetantrag_model', 'BudgetantragModel');
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
		// TODO transaction?
		$kostenstellenRes = $this->KostenstelleModel->getKostenstellenForGeschaeftsjahr($geschaeftsjahr_kurzbz);

		if (!hasData($kostenstellenRes))
		{
			echo "No Kostenstellen found";
			return;
		}

		$kostenstellen = getData($kostenstellenRes);

		// Personalbudgetanträge: 'name of Budgetantrag' => 'konto_id'
		// in reverse order, because last inserted in shown first
		$personalBudgetantragWithMonths = array(
			'Personal Externe' => 133,
			'Personal Angestellte' => 132
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
			),
			'Personal Sonstiges' => array(
				array(
					'budgetposten' => 'Studentische Hilfskräfte',
					'konto_id' => 145
				),
				array(
					'budgetposten' => 'Honorare, Prüfungsgebühren',
					'konto_id' => 143
				),
				array(
					'budgetposten' => 'Werkverträge',
					'konto_id' => 142
				)
			)
		);

		$months = $this->_getMonths($geschaeftsjahr_kurzbz);

		foreach ($kostenstellen as $kst)
		{
			// skip inactive Kostenstellen or filtered kostenstelle
			if ($kst->aktiv !== true || (isset($kostenstelle_id) && $kst->kostenstelle_id !== $kostenstelle_id))
				continue;

			// check if Kostenstelle already has Budgetanträge
			$existingBudgetantraegeRes = $this->BudgetantragModel->getBudgetantraege($geschaeftsjahr_kurzbz, $kst->kostenstelle_id);

			if (isError($existingBudgetantraegeRes))
			{
				echo "Error when getting Budgetanträge: ".getError($existingBudgetantraegeRes);
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
				$this->_addBudgetantrag($bezeichnung, $budgetantrag, $budetpositionen);
			}

			// Insert Personalbudget
			foreach ($personalBudgetantragWithMonths as $bezeichnung => $konto_id)
			{
				// create budgetpositionen for each month
				$positionen = array();
				foreach ($months as $monthNumber => $monthArr)
				{
					$position = array();
					$position['budgetposten'] = $bezeichnung.'/'.$monthArr['bezeichnung'].' '.$monthArr['jahr'];
					$position['benoetigt_am'] = $monthArr['jahr'].'-'.$monthNumber.'-01';
					$position['konto_id'] = $konto_id;
					$positionen[] = $position;
				}

				// insert budgetantrag and position
				$this->_addBudgetantrag($bezeichnung, $budgetantrag, $positionen);
			}
		}
	}

	//------------------------------------------------------------------------------------------------------------------
	// Private methods

	/**
	 * Add a Budgetantrag with Budgetpositionen.
	 * @param $bezeichnung
	 * @param $budgetantrag
	 * @param $positionen
	 * @return void
	 */
	private function _addBudgetantrag($bezeichnung, $budgetantrag, $positionen)
	{
		$budgetantrag['bezeichnung'] = $bezeichnung;

		// create budgetpositionen
		for ($i = 0; $i < count($positionen); $i++)
		{
			// check if konto id exists for the Kostenstelle
			if (isset($positionen[$i]['konto_id']))
			{
				$this->KontoModel->addJoin('wawi.tbl_konto_kostenstelle', 'konto_id');;
				$kontoRes = $this->KontoModel->loadWhere(
					array(
						'konto_id' => $positionen[$i]['konto_id'],
						'kostenstelle_id' => $budgetantrag['kostenstelle_id']
					)
				);

				if (!hasData($kontoRes))
				{
					echo 'Konto Id '.$positionen[$i]['konto_id'].' not found for Kostenstelle '.$budgetantrag['kostenstelle_id'].' ';
					$positionen[$i]['konto_id'] = null;
				}
			}

			$positionen[$i]['insertvon'] = self::INSERT_VON_USER;
			$positionen[$i]['betrag'] = 0;
		}

		//var_dump($positionen);

		// insert budgetantrag and position
		$budgetantragAddRes = $this->BudgetantragModel->addBudgetantrag($budgetantrag, $positionen);

		if (isError($budgetantragAddRes))
		{
			echo "Error when adding budgetantrag: ".getError($budgetantragAddRes);
		}
	}

	/**
	 * Gets Months and their number, german name and Geschäftsjahr..
	 * @param $geschaeftsjahr_kurzbz
	 * @return array
	 */
	private function _getMonths($geschaeftsjahr_kurzbz)
	{
		$geschaeftsjahrRes = $this->GeschaeftsjahrModel->load($geschaeftsjahr_kurzbz);

		if (!hasData($geschaeftsjahrRes))
		{
			echo "No Geschäftsjahr found";
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
