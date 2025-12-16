-- ========================================
-- Account Head Hierarchy Migration
-- Created: December 16, 2025
-- Purpose: Add parent-child relationship to income_expense_heads for account groups/sub-categories
-- Example: Construction Material (Group) -> Steel, Sand, Silicon Sand, Bricks (Sub-categories)
-- ========================================

-- Add parent_id column to create hierarchical structure
ALTER TABLE income_expense_heads 
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES income_expense_heads(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_path TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_income_expense_heads_parent_id ON income_expense_heads(parent_id);
CREATE INDEX IF NOT EXISTS idx_income_expense_heads_is_group ON income_expense_heads(is_group);
CREATE INDEX IF NOT EXISTS idx_income_expense_heads_level ON income_expense_heads(level);

-- Add comments
COMMENT ON COLUMN income_expense_heads.parent_id IS 'Reference to parent account head for hierarchical grouping (NULL for top-level groups)';
COMMENT ON COLUMN income_expense_heads.is_group IS 'TRUE if this is a group/category that contains sub-accounts, FALSE if it is a ledger account';
COMMENT ON COLUMN income_expense_heads.level IS 'Hierarchy level: 0 for top-level groups, 1 for sub-groups, 2 for ledger accounts, etc.';
COMMENT ON COLUMN income_expense_heads.full_path IS 'Full hierarchical path (e.g., "Construction Material > Steel")';

-- Create a function to update full_path automatically
CREATE OR REPLACE FUNCTION update_expense_head_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.full_path := NEW.head_name;
        NEW.level := 0;
    ELSE
        SELECT full_path, level INTO parent_path, NEW.level
        FROM income_expense_heads
        WHERE id = NEW.parent_id;
        
        NEW.full_path := parent_path || ' > ' || NEW.head_name;
        NEW.level := NEW.level + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update path
DROP TRIGGER IF EXISTS trigger_update_expense_head_path ON income_expense_heads;
CREATE TRIGGER trigger_update_expense_head_path
    BEFORE INSERT OR UPDATE OF head_name, parent_id
    ON income_expense_heads
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_head_path();

-- ========================================
-- Insert Sample Hierarchical Account Heads
-- ========================================

-- Construction Material Group (Parent)
INSERT INTO income_expense_heads (head_name, is_group, type, inc_exp_type_id, is_active)
VALUES ('Construction Material', true, 'Dr', 1, true)
ON CONFLICT DO NOTHING;

-- Get the Construction Material group ID
DO $$
DECLARE
    construction_material_id INTEGER;
BEGIN
    SELECT id INTO construction_material_id 
    FROM income_expense_heads 
    WHERE head_name = 'Construction Material' AND is_group = true
    LIMIT 1;

    -- Add sub-categories under Construction Material
    IF construction_material_id IS NOT NULL THEN
        INSERT INTO income_expense_heads (head_name, parent_id, is_group, type, unit, inc_exp_type_id, is_active)
        VALUES 
            ('Steel', construction_material_id, false, 'Dr', 'TON', 1, true),
            ('Sand', construction_material_id, false, 'Dr', 'CFT', 1, true),
            ('Silicon Sand', construction_material_id, false, 'Dr', 'CFT', 1, true),
            ('Bricks', construction_material_id, false, 'Dr', 'PIECE', 1, true),
            ('Cement', construction_material_id, false, 'Dr', 'BAG', 1, true),
            ('Rod', construction_material_id, false, 'Dr', 'TON', 1, true),
            ('Stone Chips', construction_material_id, false, 'Dr', 'CFT', 1, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Labor Cost Group (Parent)
INSERT INTO income_expense_heads (head_name, is_group, type, inc_exp_type_id, is_active)
VALUES ('Labor Cost', true, 'Dr', 1, true)
ON CONFLICT DO NOTHING;

-- Add sub-categories under Labor Cost
DO $$
DECLARE
    labor_cost_id INTEGER;
BEGIN
    SELECT id INTO labor_cost_id 
    FROM income_expense_heads 
    WHERE head_name = 'Labor Cost' AND is_group = true
    LIMIT 1;

    IF labor_cost_id IS NOT NULL THEN
        INSERT INTO income_expense_heads (head_name, parent_id, is_group, type, inc_exp_type_id, is_active)
        VALUES 
            ('Mason Labor', labor_cost_id, false, 'Dr', NULL, 1, true),
            ('Helper Labor', labor_cost_id, false, 'Dr', NULL, 1, true),
            ('Skilled Labor', labor_cost_id, false, 'Dr', NULL, 1, true),
            ('Unskilled Labor', labor_cost_id, false, 'Dr', NULL, 1, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Equipment & Machinery Group (Parent)
INSERT INTO income_expense_heads (head_name, is_group, type, inc_exp_type_id, is_active)
VALUES ('Equipment & Machinery', true, 'Dr', 1, true)
ON CONFLICT DO NOTHING;

-- Add sub-categories under Equipment & Machinery
DO $$
DECLARE
    equipment_id INTEGER;
BEGIN
    SELECT id INTO equipment_id 
    FROM income_expense_heads 
    WHERE head_name = 'Equipment & Machinery' AND is_group = true
    LIMIT 1;

    IF equipment_id IS NOT NULL THEN
        INSERT INTO income_expense_heads (head_name, parent_id, is_group, type, inc_exp_type_id, is_active)
        VALUES 
            ('Excavator Rent', equipment_id, false, 'Dr', 'HOUR', 1, true),
            ('Concrete Mixer', equipment_id, false, 'Dr', 'HOUR', 1, true),
            ('Crane Rent', equipment_id, false, 'Dr', 'HOUR', 1, true),
            ('Generator', equipment_id, false, 'Dr', 'HOUR', 1, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Create a view for hierarchical display
CREATE OR REPLACE VIEW v_expense_heads_hierarchy AS
WITH RECURSIVE expense_tree AS (
    -- Root level (groups with no parent)
    SELECT 
        id,
        head_name,
        parent_id,
        is_group,
        level,
        full_path,
        type,
        unit,
        inc_exp_type_id,
        is_active,
        ARRAY[id] as path_ids,
        head_name::TEXT as sort_path
    FROM income_expense_heads
    WHERE parent_id IS NULL AND is_active = true
    
    UNION ALL
    
    -- Child levels
    SELECT 
        child.id,
        child.head_name,
        child.parent_id,
        child.is_group,
        child.level,
        child.full_path,
        child.type,
        child.unit,
        child.inc_exp_type_id,
        child.is_active,
        parent.path_ids || child.id,
        parent.sort_path || ' > ' || child.head_name
    FROM income_expense_heads child
    INNER JOIN expense_tree parent ON child.parent_id = parent.id
    WHERE child.is_active = true
)
SELECT 
    et.*,
    iet.name as type_name,
    REPEAT('  ', et.level) || et.head_name as indented_name
FROM expense_tree et
LEFT JOIN income_expense_types iet ON et.inc_exp_type_id = iet.id
ORDER BY et.sort_path;

-- Add helpful comment
COMMENT ON VIEW v_expense_heads_hierarchy IS 'Hierarchical view of expense heads showing parent-child relationships with indentation';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Account head hierarchy migration completed successfully!';
    RAISE NOTICE 'Sample groups created: Construction Material, Labor Cost, Equipment & Machinery';
    RAISE NOTICE 'Use is_group=true for groups, is_group=false for ledger accounts';
END $$;
