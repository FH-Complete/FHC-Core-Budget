CREATE OR REPLACE FUNCTION extension.extension_budget_create_table () RETURNS TEXT AS $$
	CREATE TABLE extension.tbl_budget_antrag
	(
		budgetantrag_id integer NOT NULL,
		kostenstelle_id integer NOT NULL,
		geschaeftsjahr_kurzbz varchar(32) NOT NULL,
		bezeichnung	varchar(256),
		insertamum timestamp DEFAULT now(),
		insertvon varchar(32),
		updateamum timestamp,
		updatevon varchar(32)
	);
	COMMENT ON TABLE extension.tbl_budget_antrag IS 'Budget Requests';

	ALTER TABLE extension.tbl_budget_antrag ADD CONSTRAINT pk_tbl_budget_antrag PRIMARY KEY (budgetantrag_id);

	CREATE SEQUENCE extension.tbl_budget_antrag_budgetantrag_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
	ALTER TABLE extension.tbl_budget_antrag ALTER COLUMN budgetantrag_id SET DEFAULT nextval('extension.tbl_budget_antrag_budgetantrag_id_seq');

	GRANT SELECT, INSERT, UPDATE, DELETE ON extension.tbl_budget_antrag TO vilesci;
	GRANT SELECT, UPDATE ON extension.tbl_budget_antrag_budgetantrag_id_seq TO vilesci;

	ALTER TABLE extension.tbl_budget_antrag ADD CONSTRAINT fk_budgetantrag_kostenstelle_id FOREIGN KEY (kostenstelle_id) REFERENCES wawi.tbl_kostenstelle(kostenstelle_id) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budget_antrag ADD CONSTRAINT fk_budgetantrag_geschaeftsjahr_kurzbz FOREIGN KEY (geschaeftsjahr_kurzbz) REFERENCES public.tbl_geschaeftsjahr(geschaeftsjahr_kurzbz) ON UPDATE CASCADE ON DELETE RESTRICT;
	SELECT 'Table added'::text;
 $$
LANGUAGE 'sql';

SELECT
	CASE
	WHEN (SELECT true::BOOLEAN FROM pg_catalog.pg_tables WHERE schemaname = 'extension' AND tablename  = 'tbl_budget_antrag')
	THEN (SELECT 'success'::TEXT)
	ELSE (SELECT extension.extension_budget_create_table())
END;

-- Drop function
DROP FUNCTION extension.extension_budget_create_table();
