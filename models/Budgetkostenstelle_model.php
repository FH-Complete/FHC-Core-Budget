<?php

/**
 * Budgetkostenstellemodel
 */

class Budgetkostenstelle_model extends Kostenstelle_model
{

	public function __construct()
	{
		parent::__construct();
	}

	/**
	 * Gets all active Kostenstellen for a geschaeftsjahr, as determined by the geschaeftsjahrvon and bis fields, together with their oe,
	 * hierarchally sorted, gets Kostenstellen of current Geschaeftsjahr if Geschaeftsjahr not specified
	 * Also gets sum of budget for each Kostenstelle
	 * @param null $geschaeftsjahr
	 * @return array|null
	 */
	public function getActiveKostenstellenForGeschaeftsjahrWithOe($geschaeftsjahr = null)
	{
		$this->load->model('organisation/geschaeftsjahr_model', 'GeschaeftsjahrModel');

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
					   AND aktiv = true
				 UNION ALL
					SELECT oe.oe_kurzbz,
							oe.bezeichnung || ' (' || oe.organisationseinheittyp_kurzbz || ')' AS bezeichnung,
							tree.path || oe.oe_kurzbz || '|' AS path, tree.level + 1 AS level,
							oe.organisationseinheittyp_kurzbz
					  FROM tree JOIN tbl_organisationseinheit oe ON (tree.oe_kurzbz = oe.oe_parent_kurzbz)
			)
			SELECT oe_kurzbz,
					rec.bezeichnung as oe_bezeichnung,
					SUBSTRING(REGEXP_REPLACE(path, '[A-z]+\|', '-', 'g') || rec.bezeichnung, 2) AS oe_description, 
					level,
					kst.kostenstelle_id as kostenstelle_id,
					kst.kurzbz as kostenstelle_kurzbz,
					kst.bezeichnung as kostenstelle_bezeichnung,
					kst.aktiv as kostenstelle_aktiv,
					kst.budgetsumme as kostenstelle_budgetsumme,
					kst.genehmigtsumme as kostenstelle_genehmigtsumme
			  FROM tree rec
				JOIN (
						SELECT kostenstelle_id, kurzbz, ksttable.bezeichnung, ksttable.aktiv, ksttable.oe_kurzbz as kstoe, 
						(
							SELECT sum(betrag) AS budgetsumme
							FROM wawi.tbl_kostenstelle
							JOIN extension.tbl_budget_antrag USING (kostenstelle_id)
							JOIN extension.tbl_budget_position USING (budgetantrag_id)
							WHERE extension.tbl_budget_antrag.geschaeftsjahr_kurzbz = ?
							AND wawi.tbl_kostenstelle.kostenstelle_id = ksttable.kostenstelle_id
							GROUP BY wawi.tbl_kostenstelle.kostenstelle_id
						),
						(
							SELECT sum(betrag) AS genehmigtsumme
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
				kst on kst.kstoe =  rec.oe_kurzbz
				ORDER BY level";

			return $this->execQuery($query, array($gjkurzbz, $gjkurzbz, $gjstart, $gjstart));
		}
		else
		{
			return success(array());
		}
	}

	/**
	 * Wrapper for get Kostenstellen function, checks permissions for the retrieved Kostenstellen
	 * @param null $geschaeftsjahr
	 * @return mixed Kostenstellen for which user is berechtigt
	 */
	public function getActiveKostenstellenForGeschaeftsjahrBerechtigt($geschaeftsjahr = null)
	{
		$kostenstellen = $this->getActiveKostenstellenForGeschaeftsjahr($geschaeftsjahr);

		if (hasData($kostenstellen))
		{
			$kostenstellenresult = $this->filterKostenstellenByBerechtigung($kostenstellen->retval);

			$kostenstellen = success($kostenstellenresult);
		}

		return $kostenstellen;
	}

	/**
	 * Wrapper for get Kostenstellen with oe function, checks permissions for the retrieved Kostenstellen
	 * @param null $geschaeftsjahr
	 * @return mixed Kostenstellen for which user is berechtigt
	 */
	public function getActiveKostenstellenForGeschaeftsjahrWithOeBerechtigt($geschaeftsjahr = null)
	{
		$kostenstellen = $this->getActiveKostenstellenForGeschaeftsjahrWithOe($geschaeftsjahr);

		if (hasData($kostenstellen))
		{
			$kostenstellenresult = $this->filterKostenstellenByBerechtigung($kostenstellen->retval);

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

		foreach ($kostenstellen as $kostenstelle)
		{
			if ($this->permissionlib->isBerechtigt('extension/budget_verwaltung', 'suid', null, $kostenstelle->kostenstelle_id) === true)
			{
				$kostenstellenresult[] = $kostenstelle;
			}
		}

		return $kostenstellenresult;
	}

}
