-- Create leads table with English field names from the start
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  segment TEXT,
  revenue TEXT,
  linkedin TEXT,
  notes TEXT,
  stage TEXT NOT NULL DEFAULT 'base' CHECK (stage IN ('base', 'lead_mapeado', 'tentando_contato', 'conexao_iniciada', 'desqualificado', 'qualificado', 'reuniao_agendada')),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes with correct names
CREATE INDEX IF NOT EXISTS leads_workspace_id_idx ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);
CREATE INDEX IF NOT EXISTS leads_responsible_id_idx ON leads(responsible_id);
CREATE INDEX IF NOT EXISTS leads_campaign_id_idx ON leads(campaign_id);

-- Grant permissions
GRANT ALL ON public.leads TO authenticated, anon, service_role;

-- Trigger to update updated_at on leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
