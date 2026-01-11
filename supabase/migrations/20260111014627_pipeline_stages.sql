-- ============================================================================
-- FEATURE: PIPELINE STAGES
-- ============================================================================
-- Etapas personalizáveis do pipeline de vendas por workspace
-- Permite que cada workspace configure suas próprias etapas
-- ============================================================================

-- ============================================================================
-- TABELA: pipeline_stages
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- identificador único: 'base', 'lead_mapeado', etc.
  color TEXT NOT NULL, -- classe CSS ou cor hex
  sort_order INTEGER NOT NULL,
  is_system BOOLEAN DEFAULT false, -- etapas padrão não podem ser deletadas
  is_hidden BOOLEAN DEFAULT false, -- permite ocultar etapas sem deletar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_workspace_id ON pipeline_stages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_sort_order ON pipeline_stages(workspace_id, sort_order);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.pipeline_stages TO authenticated, anon, service_role;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_pipeline_stages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pipeline_stages_updated_at ON pipeline_stages;
CREATE TRIGGER trigger_update_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_stages_updated_at();

-- ============================================================================
-- FUNÇÃO: Criar etapas padrão ao criar workspace
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pipeline_stages (workspace_id, name, slug, color, sort_order, is_system)
  VALUES
    (NEW.id, 'Base', 'base', 'kanban-base', 1, true),
    (NEW.id, 'Lead Mapeado', 'lead_mapeado', 'kanban-mapped', 2, true),
    (NEW.id, 'Tentando Contato', 'tentando_contato', 'kanban-contacting', 3, true),
    (NEW.id, 'Conexão Iniciada', 'conexao_iniciada', 'kanban-connection', 4, true),
    (NEW.id, 'Desqualificado', 'desqualificado', 'kanban-disqualified', 5, true),
    (NEW.id, 'Qualificado', 'qualificado', 'kanban-qualified', 6, true),
    (NEW.id, 'Reunião Agendada', 'reuniao_agendada', 'kanban-meeting', 7, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_pipeline_stages ON workspaces;
CREATE TRIGGER trigger_create_default_pipeline_stages
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION create_default_pipeline_stages();

-- ============================================================================
-- MIGRAÇÃO DE DADOS: Inserir etapas padrão para workspaces existentes
-- ============================================================================

INSERT INTO pipeline_stages (workspace_id, name, slug, color, sort_order, is_system)
SELECT 
  w.id,
  stage.name,
  stage.slug,
  stage.color,
  stage.sort_order,
  true
FROM workspaces w
CROSS JOIN (
  VALUES 
    ('Base', 'base', 'kanban-base', 1),
    ('Lead Mapeado', 'lead_mapeado', 'kanban-mapped', 2),
    ('Tentando Contato', 'tentando_contato', 'kanban-contacting', 3),
    ('Conexão Iniciada', 'conexao_iniciada', 'kanban-connection', 4),
    ('Desqualificado', 'desqualificado', 'kanban-disqualified', 5),
    ('Qualificado', 'qualificado', 'kanban-qualified', 6),
    ('Reunião Agendada', 'reuniao_agendada', 'kanban-meeting', 7)
) AS stage(name, slug, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_stages ps 
  WHERE ps.workspace_id = w.id AND ps.slug = stage.slug
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE pipeline_stages IS 'Etapas personalizáveis do pipeline por workspace';
COMMENT ON COLUMN pipeline_stages.slug IS 'Identificador único da etapa dentro do workspace';
COMMENT ON COLUMN pipeline_stages.color IS 'Classe CSS ou cor hex para exibição';
COMMENT ON COLUMN pipeline_stages.is_system IS 'Indica se é uma etapa padrão do sistema (não pode ser deletada)';
COMMENT ON COLUMN pipeline_stages.is_hidden IS 'Permite ocultar etapas sem deletá-las';
