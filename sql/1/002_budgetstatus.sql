CREATE OR REPLACE FUNCTION extension_budget_create_table () RETURNS TEXT AS $$
	CREATE TABLE extension.tbl_budgetstatus
	(
		budgetstatus_kurzbz varchar(32) NOT NULL,
		bezeichnung varchar(128)
	);
	COMMENT ON TABLE extension.tbl_budgetstatus IS 'Key Table of Budget Request Statuses';

	ALTER TABLE extension.tbl_budgetstatus ADD CONSTRAINT pk_tbl_budgetstatus PRIMARY KEY (budgetstatus_kurzbz);

	GRANT SELECT, INSERT, UPDATE, DELETE ON extension.tbl_budgetstatus TO vilesci;
	SELECT 'Table added'::text;
 $$
LANGUAGE 'sql';

SELECT 
	CASE 
	WHEN (SELECT true::BOOLEAN FROM pg_catalog.pg_tables WHERE schemaname = 'extension' AND tablename = 'tbl_budgetstatus') 
	THEN (SELECT 'success'::TEXT)
	ELSE (SELECT extension_budget_create_table())
END;

INSERT INTO extension.tbl_budgetstatus(budgetstatus_kurzbz, bezeichnung) SELECT 'new','Neu' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budgetstatus WHERE budgetstatus_kurzbz='new');
INSERT INTO extension.tbl_budgetstatus(budgetstatus_kurzbz, bezeichnung) SELECT 'sent','Abgeschickt' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budgetstatus WHERE budgetstatus_kurzbz='sent');
INSERT INTO extension.tbl_budgetstatus(budgetstatus_kurzbz, bezeichnung) SELECT 'approved','Genehmigt' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budgetstatus WHERE budgetstatus_kurzbz='approved');
INSERT INTO extension.tbl_budgetstatus(budgetstatus_kurzbz, bezeichnung) SELECT 'accepted','Freigegeben' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budgetstatus WHERE budgetstatus_kurzbz='accepted');
INSERT INTO extension.tbl_budgetstatus(budgetstatus_kurzbz, bezeichnung) SELECT 'rejected','Abgelehnt' WHERE NOT EXISTS(SELECT 1 FROM extension.tbl_budgetstatus WHERE budgetstatus_kurzbz='rejected');

-- Drop function
DROP FUNCTION extension_budget_create_table();
