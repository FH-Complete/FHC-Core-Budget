<?php

/**
 * Budgetkostenstellemodel
 */

class Budgetkostenstelle_model extends Kostenstelle_model
{
	const VERWALTEN_BERECHTIUNG = 'extension/budget_verwaltung';

	public function __construct()
	{
		parent::__construct();
		$this->load->model('extensions/FHC-Core-Budget/Budgetantrag_model', 'BudgetantragModel');
	}

	/**
	 * Gets all Kostenstellen which are active for a geschaeftsjahr, as determined by the geschaeftsjahr von and bis fields, together with their oe,
	 * hierarchally sorted, gets Kostenstellen of current Geschaeftsjahr if Geschaeftsjahr not specified
	 * Also gets sum of budget for each Kostenstelle
	 * @param $geschaeftsjahr
	 * @param $alloes if false, only oes which have Kostenstellen or have children with Kostenstellen are retrieved
	 * @return array|null
	 */
	public function getKostenstellenForGeschaeftsjahrWithOe($geschaeftsjahr = null, $alloes = false)
	{
		$gj = $this->_getGeschaeftsjahr($geschaeftsjahr);

		if (hasData($gj))
		{
			$gjkurzbz = $gj->retval[0]->geschaeftsjahr_kurzbz;
			$gjstart = $gj->retval[0]->start;

			$query = "WITH RECURSIVE tree (oe_kurzbz, bezeichnung, path, level, organisationseinheittyp_kurzbz) AS (
					SELECT oe_kurzbz,
							bezeichnung || ' (' || organisationseinheittyp_kurzbz || ')' AS bezeichnung,
							oe_kurzbz || '|' AS path, 0 AS level,
							organisationseinheittyp_kurzbz
					  FROM tbl_organisationseinheit
					 WHERE oe_parent_kurzbz IS NULL
				 UNION ALL
					SELECT oe.oe_kurzbz,
							oe.bezeichnung || ' (' || oe.organisationseinheittyp_kurzbz || ')' AS bezeichnung,
							tree.path || oe.oe_kurzbz || '|' AS path, tree.level + 1 AS level,
							oe.organisationseinheittyp_kurzbz
					  FROM tree JOIN tbl_organisationseinheit oe ON (tree.oe_kurzbz = oe.oe_parent_kurzbz)
			)
			SELECT oe_kurzbz,
					rec.bezeichnung as oe_bezeichnung,
					rec.organisationseinheittyp_kurzbz AS typ,
					SUBSTRING(REGEXP_REPLACE(path, '[A-z]+\|', '-', 'g') || rec.bezeichnung, 2) AS oe_description, 
					level,
					kst.kostenstelle_id as kostenstelle_id,
					kst.kurzbz as kostenstelle_kurzbz,
					kst.bezeichnung as kostenstelle_bezeichnung,
					kst.aktiv as kostenstelle_aktiv,
					kst.budgetsumme as kostenstelle_budgetsumme,
					kst.erloesesumme as kostenstelle_erloesesumme,
					kst.freigegebensumme as kostenstelle_freigegebensumme
			  FROM tree rec
				LEFT JOIN (
						SELECT kostenstelle_id, kurzbz, ksttable.bezeichnung, ksttable.aktiv, ksttable.oe_kurzbz as kstoe, 
						(
							SELECT sum(betrag) AS budgetsumme
							FROM wawi.tbl_kostenstelle
							JOIN extension.tbl_budget_antrag USING (kostenstelle_id)
							JOIN extension.tbl_budget_position USING (budgetantrag_id)
							WHERE extension.tbl_budget_antrag.geschaeftsjahr_kurzbz = ?
							AND wawi.tbl_kostenstelle.kostenstelle_id = ksttable.kostenstelle_id
							AND extension.tbl_budget_position.erloese = false
							GROUP BY wawi.tbl_kostenstelle.kostenstelle_id
						),
						(
							SELECT sum(betrag) AS erloesesumme
							FROM wawi.tbl_kostenstelle
							JOIN extension.tbl_budget_antrag USING (kostenstelle_id)
							JOIN extension.tbl_budget_position USING (budgetantrag_id)
							WHERE extension.tbl_budget_antrag.geschaeftsjahr_kurzbz = ?
							AND wawi.tbl_kostenstelle.kostenstelle_id = ksttable.kostenstelle_id
							AND extension.tbl_budget_position.erloese = true
							GROUP BY wawi.tbl_kostenstelle.kostenstelle_id
						),
						(
							SELECT sum(betrag) AS freigegebensumme
							FROM wawi.tbl_kostenstelle
							JOIN extension.tbl_budget_antrag USING (kostenstelle_id)
							JOIN (
									SELECT budgetantrag_id, max(datum) 
									FROM extension.tbl_budget_antrag_status
									WHERE budgetstatus_kurzbz = 'approved'
									GROUP BY budgetantrag_id
							) Appr USING (budgetantrag_id)
							JOIN extension.tbl_budget_position USING (budgetantrag_id)
							WHERE extension.tbl_budget_antrag.geschaeftsjahr_kurzbz = ?
							AND wawi.tbl_kostenstelle.kostenstelle_id = ksttable.kostenstelle_id
							GROUP BY wawi.tbl_kostenstelle.kostenstelle_id
						)
						FROM wawi.tbl_kostenstelle AS ksttable
						LEFT JOIN public.tbl_geschaeftsjahr kgjvon ON ksttable.geschaeftsjahrvon = kgjvon.geschaeftsjahr_kurzbz
						LEFT JOIN public.tbl_geschaeftsjahr kgjbis ON ksttable.geschaeftsjahrbis = kgjbis.geschaeftsjahr_kurzbz 
						WHERE
						(DATE ? >= kgjvon.start OR ksttable.geschaeftsjahrvon IS NULL)
						AND
						(DATE ? < kgjbis.ende OR ksttable.geschaeftsjahrbis IS NULL)
						ORDER BY ksttable.bezeichnung DESC
					) 
				kst on kst.kstoe = rec.oe_kurzbz";

			if ($alloes != true)
			{
				$query .= " WHERE EXISTS
                        (
                          WITH RECURSIVE oes(oe_kurzbz, oe_parent_kurzbz) as
                          (
                            SELECT oe_kurzbz, oe_parent_kurzbz FROM public.tbl_organisationseinheit
                            WHERE oe_kurzbz=rec.oe_kurzbz
                            UNION ALL
                            SELECT o.oe_kurzbz, o.oe_parent_kurzbz FROM public.tbl_organisationseinheit o, oes
                            WHERE o.oe_parent_kurzbz=oes.oe_kurzbz
                          )
                          SELECT oe_kurzbz
                          FROM oes
                          WHERE EXISTS(SELECT DISTINCT oe_kurzbz FROM wawi.tbl_kostenstelle WHERE oe_kurzbz = oes.oe_kurzbz)
                        )";
			}

			$query .= " ORDER BY level, typ, oe_bezeichnung, kostenstelle_bezeichnung;";

			return $this->execQuery($query, array($gjkurzbz, $gjkurzbz, $gjkurzbz, $gjstart, $gjstart));
		}
		else
		{
			return success(array());
		}
	}

	/**
	 * Wrapper for get Kostenstellen function, checks permissions for the retrieved Kostenstellen.
	 * Only retrieves Kostenstelle which are active or have Budget planned.
	 * @param $geschaeftsjahr
	 * @return mixed Kostenstellen for which user is berechtigt
	 */
	public function getKostenstellenForGeschaeftsjahrBerechtigt($geschaeftsjahr)
	{
		$kostenstellen = $this->getKostenstellenForGeschaeftsjahr($geschaeftsjahr);

		if (hasData($kostenstellen))
		{
			$this->BudgetantragModel->addSelect('kostenstelle_id');
			$allBudgetantraegeRes = $this->BudgetantragModel->loadWhere(array('geschaeftsjahr_kurzbz' => $geschaeftsjahr));

			if (isError($allBudgetantraegeRes))
				return $allBudgetantraegeRes;

			$filteredKostenstellen = $this->filterKostenstellenByBerechtigung($kostenstellen->retval);

			$filterRes = $this->filterKostenstellenByAktiv($filteredKostenstellen, $geschaeftsjahr);

			if (isError($filterRes))
				return $filterRes;

			if (hasData($filterRes))
				$filteredKostenstellen = getData($filterRes);

			$kostenstellen = success($filteredKostenstellen);
		}

		return $kostenstellen;
	}

	/**
	 * Wrapper for get Kostenstellen with oe function, checks permissions for the retrieved Kostenstellen
	 * @param null $geschaeftsjahr
	 * @return mixed Kostenstellen for which user is berechtigt
	 */
	public function getKostenstellenForGeschaeftsjahrWithOeBerechtigt($geschaeftsjahr = null)
	{
		$kostenstellen = $this->getKostenstellenForGeschaeftsjahrWithOe($geschaeftsjahr);

		if (hasData($kostenstellen))
		{
			$kostenstellenresult = $this->filterOeKostenstellen($kostenstellen->retval);

			$kostenstellen = success($kostenstellenresult);
		}

		return $kostenstellen;
	}

	/**
	 * Filters Kostenstelle by using isBerechtigt function, returns only kostenstelle for which user is berechtigt.
	 * @param $kostenstellen
	 * @return array
	 */
	private function filterKostenstellenByBerechtigung($kostenstellen)
	{
		$this->load->library('PermissionLib');

		$kostenstellenresult = array();

		foreach ($kostenstellen as $index => $kostenstelle)
		{
			if (isset($kostenstelle->kostenstelle_id) && isset($kostenstelle->oe_kurzbz))
			{
				if ($this->permissionlib->isBerechtigt(self::VERWALTEN_BERECHTIUNG, 's', null, $kostenstelle->kostenstelle_id) === true)
				{
					$kostenstellenresult[] = $kostenstelle;
				}
			}
		}

		return $kostenstellenresult;
	}

	/**
	 * Filters Kostenstellen by removing inactive Kostenstellen.
	 * Kostenstellen for which Budget is planned are considered active in the year.
	 * @param $kostenstellen
	 * @param $geschaeftsjahr
	 * @return mixed filtered Kostenstellen
	 */
	private function filterKostenstellenByAktiv($kostenstellen, $geschaeftsjahr)
	{
		$kostenstellenresult = array();

		$this->BudgetantragModel->addSelect('kostenstelle_id');
		$allBudgetantraegeRes = $this->BudgetantragModel->loadWhere(array('geschaeftsjahr_kurzbz' => $geschaeftsjahr));

		if (isError($allBudgetantraegeRes))
			return $allBudgetantraegeRes;

		if (hasData($allBudgetantraegeRes))
		{
			$allKostenstellenWithBudget = array();
			$allBudgetantraege = getData($allBudgetantraegeRes);
			foreach ($allBudgetantraege as $budgetantrag)
			{
				if (!in_array($budgetantrag->kostenstelle_id, $allKostenstellenWithBudget))
					$allKostenstellenWithBudget[] = $budgetantrag->kostenstelle_id;
			}

			foreach ($kostenstellen as $kostenstelle)
			{
				if ($kostenstelle->aktiv === true || in_array($kostenstelle->kostenstelle_id, $allKostenstellenWithBudget))
					$kostenstellenresult[] = $kostenstelle;
			}
		}

		return success($kostenstellenresult);
	}

	/**
	 * Filters Kostenstellen and Oes.
	 * Checks permissions, removes inactive Kostenstellen with no Budgetanträge.
	 * @param $kostenstellen
	 * @return array
	 */
	private function filterOeKostenstellen($kostenstellen)
	{
		$this->load->model('organisation/organisationseinheit_model', 'OrganisationseinheitModel');
		$this->load->library('PermissionLib');

		$kostenstellenresult = array();

		foreach ($kostenstellen as $index => $kostenstelle)
		{
			if (isset($kostenstelle->kostenstelle_id) && isset($kostenstelle->oe_kurzbz))
			{
				// pass only if berechtigt for Kostenstelle, also Kostenstelle is aktiv or has as Budgetsumme
				if ($this->permissionlib->isBerechtigt(self::VERWALTEN_BERECHTIUNG, 's', null, $kostenstelle->kostenstelle_id) === true
					&& ($kostenstelle->kostenstelle_aktiv || isset($kostenstelle->kostenstelle_budgetsumme))
				)
				{
					// add parents as "oe only", fill up oes up to root
					$parents = $this->OrganisationseinheitModel->getParents($kostenstelle->oe_kurzbz);

					$kostenstellenabove = array_slice($kostenstellen, 0, $index);

					foreach ($kostenstellenabove as $kstabove)
					{
						foreach ($parents->retval as $parent)
						{
							if ($kstabove->oe_kurzbz === $parent->oe_kurzbz)
							{
								$found = false;

								foreach ($kostenstellenresult as $kstres)
								{
									if ($kstres->oe_kurzbz === $kstabove->oe_kurzbz)
									{
										$found = true;
										break;
									}
								}
								if (!$found)
								{
									$oenokst = $kstabove;
									$oenokst->kostenstelle_id = null;
									$oenokst->kostenstelle_kurzbz = null;
									$oenokst->kostenstelle_bezeichnung = null;
									$oenokst->kostenstelle_aktiv = null;
									$kostenstellenresult[] = $oenokst;
								}
								break;
							}
						}
					}
					$kostenstellenresult[] = $kostenstelle;
				}
			}
		}

		// sorting Kostenstellen, sql order could have been mixed up after fill up with oes
		usort($kostenstellenresult, array($this, 'cmpOeKostenstellen'));

		return $kostenstellenresult;
	}

	/**
	 * Sorts Array with Kostenstellen and OEs.
	 * Order: level, typ, oe bezeichnung, kst bezeichnung.
	 * @param $ksta
	 * @param $kstb
	 * @return int
	 */
	private function cmpOeKostenstellen($ksta, $kstb)
	{
		if ($ksta->level - $kstb->level !== 0)
			return $ksta->level - $kstb->level;

		if ($ksta->typ !== $kstb->typ)
		{
			$typprio = array('Erhalter', 'Fakultaet', 'Department', 'Abteilung', 'Institut', 'Studiengang');

			foreach ($typprio as $prio)
			{
				if ($ksta->typ === $prio)
					return -1;

				if ($kstb->typ === $prio)
					return 1;
			}

			return strcmp($ksta->typ, $kstb->typ);
		}

		$oebezdiff = strcmp($ksta->oe_bezeichnung, $kstb->oe_bezeichnung);
		if ($oebezdiff !== 0)
			return $oebezdiff;

		$kstbezdiff = strcmp($ksta->kostenstelle_bezeichnung, $kstb->kostenstelle_bezeichnung);
		if ($kstbezdiff !== 0)
			return $kstbezdiff;

		return -1;
	}
}
