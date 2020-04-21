CREATE OR REPLACE FUNCTION extension.extension_budget_update () RETURNS TEXT AS $$
    ALTER TABLE extension.tbl_budget_position ADD COLUMN IF NOT EXISTS benoetigt_am date;
    SELECT 'Table tbl_budget_position updated'::text;
$$
LANGUAGE 'sql';

SELECT extension.extension_budget_update();

-- Drop function
DROP FUNCTION extension.extension_budget_update();
