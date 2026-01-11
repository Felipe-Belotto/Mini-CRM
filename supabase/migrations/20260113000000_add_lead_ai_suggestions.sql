-- ============================================================================
-- FEATURE: LEAD AI SUGGESTIONS
-- ============================================================================
-- Armazena mensagens geradas automaticamente por campanhas com etapa gatilho
-- ============================================================================

-- ============================================================================
-- TABELA: lead_ai_suggestions
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  suggestions JSONB NOT NULL, -- Array de AISuggestion
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  UNIQUE(lead_id, campaign_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lead_ai_suggestions_lead_id ON lead_ai_suggestions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_suggestions_workspace_id ON lead_ai_suggestions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_suggestions_campaign_id ON lead_ai_suggestions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_lead_ai_suggestions_generated_at ON lead_ai_suggestions(generated_at DESC);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.lead_ai_suggestions TO authenticated, anon, service_role;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE lead_ai_suggestions IS 'Mensagens geradas automaticamente por campanhas com etapa gatilho';
COMMENT ON COLUMN lead_ai_suggestions.suggestions IS 'Array JSON de sugestões de mensagens geradas pela IA';
COMMENT ON COLUMN lead_ai_suggestions.generated_at IS 'Data e hora em que as mensagens foram geradas automaticamente';
COMMENT ON COLUMN lead_ai_suggestions.viewed_at IS 'Data e hora em que o usuário visualizou as mensagens (NULL = não visualizado)';
