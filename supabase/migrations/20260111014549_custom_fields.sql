-- ============================================================================
-- FEATURE: CUSTOM FIELDS
-- ============================================================================
-- Campos personalizados configuráveis por workspace para leads
-- Permite que cada workspace defina seus próprios campos além dos padrão
-- ============================================================================

-- ============================================================================
-- TABELA: custom_fields
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'email', 'phone', 'select', 'textarea', 'date')),
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB, -- Opções para campos do tipo 'select'
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS custom_fields_workspace_id_idx ON custom_fields(workspace_id);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.custom_fields TO authenticated, anon, service_role;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_custom_fields_updated_at ON custom_fields;
CREATE TRIGGER update_custom_fields_updated_at 
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE custom_fields IS 'Campos personalizados configuráveis por workspace';
COMMENT ON COLUMN custom_fields.name IS 'Nome do campo personalizado';
COMMENT ON COLUMN custom_fields.type IS 'Tipo do campo: text, number, email, phone, select, textarea, date';
COMMENT ON COLUMN custom_fields.required IS 'Se o campo é obrigatório';
COMMENT ON COLUMN custom_fields.options IS 'Opções para campos do tipo select (JSON array)';
COMMENT ON COLUMN custom_fields."order" IS 'Ordem de exibição do campo';
