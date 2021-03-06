CREATE OR REPLACE VIEW extension.vw_budget_approved AS
SELECT
	tbl_budget_antrag.kostenstelle_id, tbl_budget_antrag.geschaeftsjahr_kurzbz, tbl_budget_antrag.bezeichnung,
	tbl_budget_position.budgetposition_id, tbl_budget_position.budgetposten, tbl_budget_position.konto_id,
	tbl_budget_position.betrag, tbl_budget_position.kommentar, tbl_budget_position.projekt_id
FROM
	extension.tbl_budget_antrag
	JOIN extension.tbl_budget_position USING(budgetantrag_id)
WHERE
	'approved'= (
		SELECT 
			budgetstatus_kurzbz
		FROM
			extension.tbl_budget_antrag_status
		WHERE
			budgetantrag_id=tbl_budget_antrag.budgetantrag_id
		ORDER BY datum desc LIMIT 1
	)
