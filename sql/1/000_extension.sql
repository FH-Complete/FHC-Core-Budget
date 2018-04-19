CREATE SCHEMA IF NOT EXISTS extension;

-- permissions
INSERT INTO system.tbl_berechtigung (berechtigung_kurzbz, beschreibung) SELECT 'extension/budget_verwaltung','Verwaltung von Budgetanträgen' WHERE NOT EXISTS(SELECT 1 FROM system.tbl_berechtigung WHERE berechtigung_kurzbz='extension/budget_verwaltung');
INSERT INTO system.tbl_berechtigung (berechtigung_kurzbz, beschreibung) SELECT 'extension/budget_freigabe','Freigeben von Budgetanträgen' WHERE NOT EXISTS(SELECT 1 FROM system.tbl_berechtigung WHERE berechtigung_kurzbz='extension/budget_freigabe');
INSERT INTO system.tbl_berechtigung (berechtigung_kurzbz, beschreibung) SELECT 'extension/budget_genehmigung','Genehmigen und Ablehnen von Budgetanträgen' WHERE NOT EXISTS(SELECT 1 FROM system.tbl_berechtigung WHERE berechtigung_kurzbz='extension/budget_genehmigung');