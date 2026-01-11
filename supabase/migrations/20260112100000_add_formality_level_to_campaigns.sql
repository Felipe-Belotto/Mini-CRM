-- ============================================================================
-- MIGRATION: Add formality_level to campaigns
-- ============================================================================
-- Adiciona campo opcional para nível de formalidade em campanhas
-- 1 = muito informal, 5 = muito formal, NULL = usar padrão por canal
-- ============================================================================

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS formality_level INTEGER 
CHECK (formality_level IS NULL OR (formality_level >= 1 AND formality_level <= 5));

COMMENT ON COLUMN campaigns.formality_level IS 'Nível de formalidade da campanha (1-5). NULL usa padrão automático por canal.';
