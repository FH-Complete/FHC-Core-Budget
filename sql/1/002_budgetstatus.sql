CREATE OR REPLACE FUNCTION extension.extension_budget_create_table () RETURNS TEXT AS $$
	CREATE TABLE extension.tbl_budget_status
	(
		budgetstatus_kurzbz varchar(32) NOT NULL,
		bezeichnung varchar(128)
	);
	COMMENT ON TABLE extension.tbl_budget_status IS 'Key Table of Budget Request Statuses';

	ALTER TABLE extension.tbl_budget_status ADD CONSTRAINT pk_tbl_budget_status PRIMARY KEY (budgetstatus_kurzbz);

	GRANT SELECT, INSERT, UPDATE, DELETE ON extension.tbl_budget_status TO vilesci;
	SELECT 'Table added'::text;
 $$
LANGUAGE 'sql';

SELECT
	CASE
	WHEN (SELECT true::BOOLEAN FROM pg_catalog.pg_tables WHERE schemaname = 'extension' AND tablename = 'tbl_budget_status')
	THEN (SELECT 'success'::TEXT)
	ELSE (SELECT extension.extension_budget_create_table())
END;

INSERT INTO extension.tbl_budget_status(budgetstatus_kurzbz, bezeichnung) SELECT 'new','Neu' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budget_status WHERE budgetstatus_kurzbz='new');
INSERT INTO extension.tbl_budget_status(budgetstatus_kurzbz, bezeichnung) SELECT 'sent','Abgeschickt' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budget_status WHERE budgetstatus_kurzbz='sent');
INSERT INTO extension.tbl_budget_status(budgetstatus_kurzbz, bezeichnung) SELECT 'approved','Freigegeben' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budget_status WHERE budgetstatus_kurzbz='approved');
INSERT INTO extension.tbl_budget_status(budgetstatus_kurzbz, bezeichnung) SELECT 'rejected','Abgelehnt' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budget_status WHERE budgetstatus_kurzbz='rejected');

-- Drop function
DROP FUNCTION extension.extension_budget_create_table();
