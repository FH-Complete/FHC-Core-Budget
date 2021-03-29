DO $$
BEGIN
        ALTER TABLE extension.tbl_budget_position ADD COLUMN erloese boolean DEFAULT FALSE;
        EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
        ALTER TABLE extension.tbl_budget_position ADD COLUMN investition boolean DEFAULT FALSE;
        EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
        ALTER TABLE extension.tbl_budget_position ADD COLUMN nutzungsdauer integer DEFAULT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON COLUMN extension.tbl_budget_position.erloese IS 'Revenues';
COMMENT ON COLUMN extension.tbl_budget_position.erloese IS 'Investments';
COMMENT ON COLUMN extension.tbl_budget_position.erloese IS 'Usage time';

