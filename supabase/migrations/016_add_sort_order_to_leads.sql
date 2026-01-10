-- Add sort_order column to leads table for Kanban reordering within columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Initialize sort_order based on created_at order (per workspace and stage)
-- Leads created earlier get lower sort_order values
WITH ranked_leads AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY workspace_id, stage 
      ORDER BY created_at ASC
    ) as new_order
  FROM leads
)
UPDATE leads
SET sort_order = ranked_leads.new_order
FROM ranked_leads
WHERE leads.id = ranked_leads.id;

-- Set default value for new leads
ALTER TABLE leads ALTER COLUMN sort_order SET DEFAULT 0;

-- Make sort_order NOT NULL after populating existing data
ALTER TABLE leads ALTER COLUMN sort_order SET NOT NULL;

-- Create composite index for efficient querying of leads by stage with order
CREATE INDEX IF NOT EXISTS leads_workspace_stage_sort_order_idx 
  ON leads(workspace_id, stage, sort_order);
