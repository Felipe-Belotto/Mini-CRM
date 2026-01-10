-- Create custom_fields table with English field names from the start
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'email', 'phone', 'select', 'textarea', 'date')),
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS custom_fields_workspace_id_idx ON custom_fields(workspace_id);

-- Grant permissions
GRANT ALL ON public.custom_fields TO authenticated, anon, service_role;

-- Trigger to update updated_at on custom_fields
DROP TRIGGER IF EXISTS update_custom_fields_updated_at ON custom_fields;
CREATE TRIGGER update_custom_fields_updated_at BEFORE UPDATE ON custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
