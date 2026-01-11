-- ============================================================================
-- FEATURE: CAMPAIGNS
-- ============================================================================
-- Campanhas de marketing e outreach por workspace
-- Gerencia configurações de IA, tom de voz e gatilhos de automação
-- ============================================================================

-- ============================================================================
-- TABELA: campaigns
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  context TEXT NOT NULL,
  voice_tone TEXT NOT NULL CHECK (voice_tone IN ('formal', 'informal', 'neutro')),
  ai_instructions TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
  trigger_stage TEXT CHECK (trigger_stage IN (
    'base', 
    'lead_mapeado', 
    'tentando_contato', 
    'conexao_iniciada', 
    'desqualificado', 
    'qualificado', 
    'reuniao_agendada'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS campaigns_workspace_id_idx ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.campaigns TO authenticated, anon, service_role;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE campaigns IS 'Campanhas de marketing e outreach por workspace';
COMMENT ON COLUMN campaigns.name IS 'Nome da campanha';
COMMENT ON COLUMN campaigns.context IS 'Contexto da campanha para a IA';
COMMENT ON COLUMN campaigns.voice_tone IS 'Tom de voz: formal, informal ou neutro';
COMMENT ON COLUMN campaigns.ai_instructions IS 'Instruções específicas para a IA';
COMMENT ON COLUMN campaigns.status IS 'Status da campanha: active, paused ou finished';
COMMENT ON COLUMN campaigns.trigger_stage IS 'Etapa do pipeline que dispara a campanha';
