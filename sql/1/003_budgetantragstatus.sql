CREATE OR REPLACE FUNCTION extension_budget_create_table () RETURNS TEXT AS $$
	CREATE TABLE extension.tbl_budget_antrag_status
	(
		budgetantrag_status_id integer NOT NULL,
		budgetantrag_id integer NOT NULL,
		budgetstatus_kurzbz varchar(32) NOT NULL,
		datum timestamp NOT NULL,
		uid varchar(32),
		oe_kurzbz varchar(32),
		insertamum timestamp DEFAULT now(),
		insertvon varchar(32)
	);
	COMMENT ON TABLE extension.tbl_budget_antrag_status IS 'Statuses of Budget Requests';

	ALTER TABLE extension.tbl_budget_antrag_status ADD CONSTRAINT pk_tbl_budget_antrag_status PRIMARY KEY (budgetantrag_status_id);

	CREATE SEQUENCE extension.tbl_budget_antrag_status_budgetantrag_status_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
	ALTER TABLE extension.tbl_budget_antrag_status ALTER COLUMN budgetantrag_status_id SET DEFAULT nextval('extension.tbl_budget_antrag_status_budgetantrag_status_id_seq');

	ALTER TABLE extension.tbl_budget_antrag_status ADD CONSTRAINT fk_budgetantrag_status_budgetstatus_kurzbz FOREIGN KEY (budgetstatus_kurzbz) REFERENCES extension.tbl_budget_status(budgetstatus_kurzbz) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budget_antrag_status ADD CONSTRAINT fk_budgetantrag_status_budgetantrag_id FOREIGN KEY (budgetantrag_id) REFERENCES extension.tbl_budget_antrag(budgetantrag_id) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budget_antrag_status ADD CONSTRAINT fk_budgetantrag_status_uid FOREIGN KEY (uid) REFERENCES public.tbl_benutzer(uid) ON UPDATE CASCADE ON DELETE RESTRICT;
	ALTER TABLE extension.tbl_budget_antrag_status ADD CONSTRAINT fk_budgetantrag_status_oe_kurzbz FOREIGN KEY (oe_kurzbz) REFERENCES public.tbl_organisationseinheit(oe_kurzbz) ON UPDATE CASCADE ON DELETE RESTRICT;

	GRANT SELECT, INSERT, UPDATE, DELETE ON extension.tbl_budget_antrag_status TO vilesci;
	GRANT SELECT, UPDATE ON extension.tbl_budget_antrag_status_budgetantrag_status_id_seq TO vilesci;
	SELECT 'Table added'::text;
 $$
LANGUAGE 'sql';

SELECT 
	CASE 
	WHEN (SELECT true::BOOLEAN FROM pg_catalog.pg_tables WHERE schemaname = 'extension' AND tablename = 'tbl_budget_antrag_status')
	THEN (SELECT 'success'::TEXT)
	ELSE (SELECT extension_budget_create_table())
END;

-- Drop function
DROP FUNCTION extension_budget_create_table();
