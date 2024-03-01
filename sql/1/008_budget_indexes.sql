DO $$
BEGIN
	CREATE INDEX idx_budget_antrag_kostenstelle_id ON extension.tbl_budget_antrag USING btree (kostenstelle_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	CREATE INDEX idx_budget_position_budgetantrag_id ON extension.tbl_budget_position USING btree (budgetantrag_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	CREATE INDEX idx_budget_antrag_status_budgetantrag_id ON extension.tbl_budget_antrag_status USING btree (budgetantrag_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
