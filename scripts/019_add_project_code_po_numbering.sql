-- ========================================
-- Migration 019: Project code for project-based PO numbering
-- PO numbers become PO-{project_code}-{counter}, e.g. PO-2-00001
-- ========================================

-- Add an editable per-project code used as the PO number prefix.
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_code INTEGER;

-- Backfill existing projects: default the code to the project's own id
-- (so "2nd project" -> code 2 -> PO-2-00001).
UPDATE projects
SET project_code = id
WHERE project_code IS NULL;

-- Each project must have a distinct code so PO ranges never overlap.
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_project_code
ON projects(project_code);

-- po_number is already UNIQUE NOT NULL (see 008_material_purchase_payment_tracking.sql),
-- which guarantees no two POs can share a number even under concurrent inserts.
