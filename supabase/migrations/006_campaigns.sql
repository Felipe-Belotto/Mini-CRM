-- Create campaigns table with English field names and status values from the start
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  context TEXT NOT NULL,
  voice_tone TEXT NOT NULL CHECK (voice_tone IN ('formal', 'informal', 'neutro')),
  ai_instructions TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
  trigger_stage TEXT CHECK (trigger_stage IN ('base', 'lead_mapeado', 'tentando_contato', 'conexao_iniciada', 'desqualificado', 'qualificado', 'reuniao_agendada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS campaigns_workspace_id_idx ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);

-- Grant permissions
GRANT ALL ON public.campaigns TO authenticated, anon, service_role;

-- Trigger to update updated_at on campaigns
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
