CREATE OR REPLACE FUNCTION extension_budget_create_table () RETURNS TEXT AS $$
	CREATE TABLE extension.tbl_budgetposition
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

	COMMENT ON TABLE extension.tbl_budgetposition IS 'Budget position';

	ALTER TABLE extension.tbl_budgetposition ADD CONSTRAINT pk_tbl_budgetposition PRIMARY KEY (budgetposition_id);

	CREATE SEQUENCE extension.tbl_budgetposition_budgetposition_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
	ALTER TABLE extension.tbl_budgetposition ALTER COLUMN budgetposition_id SET DEFAULT nextval('extension.tbl_budgetposition_budgetposition_id_seq');

	ALTER TABLE extension.tbl_budgetposition ADD CONSTRAINT fk_tbl_budgetposition_budgetantrag_id FOREIGN KEY (budgetantrag_id) REFERENCES extension.tbl_budgetantrag(budgetantrag_id) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budgetposition ADD CONSTRAINT fk_tbl_budgetposition_konto_id FOREIGN KEY (konto_id) REFERENCES wawi.tbl_konto(konto_id) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budgetposition ADD CONSTRAINT fk_tbl_budgetposition_projekt_id FOREIGN KEY (projekt_id) REFERENCES fue.tbl_projekt(projekt_id) ON UPDATE CASCADE ON DELETE RESTRICT;

	GRANT SELECT, INSERT, UPDATE, DELETE ON extension.tbl_budgetposition TO vilesci;
	GRANT SELECT, UPDATE ON extension.tbl_budgetposition_budgetposition_id_seq TO vilesci;
	SELECT 'Table added'::text;
 $$
LANGUAGE 'sql';

SELECT 
	CASE 
	WHEN (SELECT true::BOOLEAN FROM pg_catalog.pg_tables WHERE schemaname = 'extension' AND tablename = 'tbl_budgetposition') 
	THEN (SELECT 'success'::TEXT)
	ELSE (SELECT extension_budget_create_table())
END;

-- Drop function
DROP FUNCTION extension_budget_create_table();
