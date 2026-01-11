-- ============================================================================
-- FEATURE: COLOR PALETTES
-- ============================================================================
-- Sistema de paletas de cores para personalização de etapas do pipeline
-- Permite cores padrão do sistema e cores customizadas por workspace
-- ============================================================================

-- ============================================================================
-- TABELA: color_palettes
-- ============================================================================

CREATE TABLE IF NOT EXISTS color_palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nome da cor (ex: "Cinza", "Azul", "Rosa Personalizada")
  key TEXT NOT NULL, -- Chave única (ex: "kanban-base", "custom-pink")
  border_class TEXT NOT NULL, -- Classe CSS para borda (ex: "border-t-slate-400")
  bg_class TEXT NOT NULL, -- Classe CSS para fundo (ex: "bg-slate-400")
  preview_class TEXT NOT NULL, -- Classe CSS para preview (ex: "bg-gray-500")
  is_default BOOLEAN DEFAULT false, -- Indica se é cor padrão do sistema
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL para cores padrão, UUID para customizadas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, key) -- Garante que não há duplicatas de key por workspace
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_color_palettes_workspace_id ON color_palettes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_color_palettes_is_default ON color_palettes(is_default);
CREATE INDEX IF NOT EXISTS idx_color_palettes_key ON color_palettes(key);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_color_palettes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_color_palettes_updated_at ON color_palettes;
CREATE TRIGGER trigger_update_color_palettes_updated_at
  BEFORE UPDATE ON color_palettes
  FOR EACH ROW
  EXECUTE FUNCTION update_color_palettes_updated_at();

-- ============================================================================
-- INSERIR CORES PADRÃO DO SISTEMA
-- ============================================================================

INSERT INTO color_palettes (name, key, border_class, bg_class, preview_class, is_default, workspace_id)
VALUES
  ('Cinza', 'kanban-base', 'border-t-slate-400', 'bg-slate-400', 'bg-gray-500', true, NULL),
  ('Azul', 'kanban-mapped', 'border-t-cyan-500', 'bg-cyan-500', 'bg-blue-500', true, NULL),
  ('Amarelo', 'kanban-contacting', 'border-t-amber-500', 'bg-amber-500', 'bg-yellow-500', true, NULL),
  ('Roxo', 'kanban-connection', 'border-t-violet-500', 'bg-violet-500', 'bg-purple-500', true, NULL),
  ('Vermelho', 'kanban-disqualified', 'border-t-red-500', 'bg-red-500', 'bg-red-500', true, NULL),
  ('Verde', 'kanban-qualified', 'border-t-emerald-500', 'bg-emerald-500', 'bg-green-500', true, NULL),
  ('Laranja', 'kanban-meeting', 'border-t-blue-500', 'bg-blue-500', 'bg-orange-500', true, NULL),
  ('Rosa', 'custom-pink', 'border-t-pink-500', 'bg-pink-500', 'bg-pink-500', true, NULL),
  ('Índigo', 'custom-indigo', 'border-t-indigo-500', 'bg-indigo-500', 'bg-indigo-500', true, NULL),
  ('Teal', 'custom-teal', 'border-t-teal-500', 'bg-teal-500', 'bg-teal-500', true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ADICIONAR COLUNA color_palette_id EM pipeline_stages (OPCIONAL)
-- Mantém compatibilidade com campo color existente
-- ============================================================================

ALTER TABLE pipeline_stages 
ADD COLUMN IF NOT EXISTS color_palette_id UUID REFERENCES color_palettes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_color_palette_id ON pipeline_stages(color_palette_id);

-- ============================================================================
-- MIGRAÇÃO: Atualizar pipeline_stages existentes para usar color_palettes
-- ============================================================================

-- Atualizar etapas existentes para referenciar as paletas padrão baseado no campo color
UPDATE pipeline_stages ps
SET color_palette_id = cp.id
FROM color_palettes cp
WHERE ps.color = cp.key
  AND cp.is_default = true
  AND cp.workspace_id IS NULL
  AND ps.color_palette_id IS NULL;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.color_palettes TO authenticated, anon, service_role;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE color_palettes IS 'Paleta de cores para personalização de etapas do pipeline';
COMMENT ON COLUMN color_palettes.key IS 'Chave única da cor (ex: kanban-base, custom-pink)';
COMMENT ON COLUMN color_palettes.border_class IS 'Classe CSS Tailwind para borda superior (ex: border-t-slate-400)';
COMMENT ON COLUMN color_palettes.bg_class IS 'Classe CSS Tailwind para fundo (ex: bg-slate-400)';
COMMENT ON COLUMN color_palettes.preview_class IS 'Classe CSS Tailwind para preview em seletores (ex: bg-gray-500)';
COMMENT ON COLUMN color_palettes.is_default IS 'Indica se é uma cor padrão do sistema';
COMMENT ON COLUMN color_palettes.workspace_id IS 'NULL para cores padrão globais, UUID para cores customizadas por workspace';
