CREATE OR REPLACE FUNCTION extension_budget_create_table () RETURNS TEXT AS $$
	CREATE TABLE extension.tbl_budget_position
	(
		budgetposition_id integer NOT NULL,
		budgetantrag_id integer NOT NULL,
		budgetposten varchar(512),
		konto_id integer,
		betrag numeric(12,4),
		kommentar text,
		projekt_id integer,
		insertamum timestamp DEFAULT now(),
		insertvon varchar(32),
		updateamum timestamp,
		updatevon varchar(32)
	);

	COMMENT ON TABLE extension.tbl_budget_position IS 'Budget position';

	ALTER TABLE extension.tbl_budget_position ADD CONSTRAINT pk_tbl_budget_position PRIMARY KEY (budgetposition_id);

	CREATE SEQUENCE extension.tbl_budget_position_budgetposition_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
	ALTER TABLE extension.tbl_budget_position ALTER COLUMN budgetposition_id SET DEFAULT nextval('extension.tbl_budget_position_budgetposition_id_seq');

	ALTER TABLE extension.tbl_budget_position ADD CONSTRAINT fk_tbl_budget_position_budgetantrag_id FOREIGN KEY (budgetantrag_id) REFERENCES extension.tbl_budget_antrag(budgetantrag_id) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budget_position ADD CONSTRAINT fk_tbl_budget_position_konto_id FOREIGN KEY (konto_id) REFERENCES wawi.tbl_konto(konto_id) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budget_position ADD CONSTRAINT fk_tbl_budget_position_projekt_id FOREIGN KEY (projekt_id) REFERENCES fue.tbl_projekt(projekt_id) ON UPDATE CASCADE ON DELETE RESTRICT;

	GRANT SELECT, INSERT, UPDATE, DELETE ON extension.tbl_budget_position TO vilesci;
	GRANT SELECT, UPDATE ON extension.tbl_budget_position_budgetposition_id_seq TO vilesci;
	SELECT 'Table added'::text;
 $$
LANGUAGE 'sql';

SELECT 
	CASE 
	WHEN (SELECT true::BOOLEAN FROM pg_catalog.pg_tables WHERE schemaname = 'extension' AND tablename = 'tbl_budget_position')
	THEN (SELECT 'success'::TEXT)
	ELSE (SELECT extension_budget_create_table())
END;

-- Drop function
DROP FUNCTION extension_budget_create_table();
