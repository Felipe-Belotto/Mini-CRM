-- ============================================================================
-- RLS: COLOR PALETTES
-- ============================================================================
-- Row Level Security para tabela de paletas de cores
-- ============================================================================

ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Todos podem ver cores padrão (is_default = true)
-- Membros do workspace podem ver cores customizadas do seu workspace

CREATE POLICY "Anyone can view default color palettes"
ON public.color_palettes
FOR SELECT
USING (is_default = true AND workspace_id IS NULL);

CREATE POLICY "Members can view workspace color palettes"
ON public.color_palettes
FOR SELECT
USING (
  workspace_id IS NOT NULL 
  AND public.is_workspace_member(workspace_id)
);

-- Service role bypass
CREATE POLICY "Service role can view all color palettes"
ON public.color_palettes
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Apenas service_role pode criar cores padrão
-- Owner/admin pode criar cores customizadas para seu workspace

CREATE POLICY "Admins can create workspace color palettes"
ON public.color_palettes
FOR INSERT
WITH CHECK (
  workspace_id IS NOT NULL
  AND public.is_workspace_admin_or_owner(workspace_id)
);

-- Service role bypass (para cores padrão e triggers)
CREATE POLICY "Service role can insert color palettes"
ON public.color_palettes
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Apenas service_role pode atualizar cores padrão
-- Owner/admin pode atualizar cores customizadas do seu workspace

CREATE POLICY "Admins can update workspace color palettes"
ON public.color_palettes
FOR UPDATE
USING (
  workspace_id IS NOT NULL
  AND public.is_workspace_admin_or_owner(workspace_id)
)
WITH CHECK (
  workspace_id IS NOT NULL
  AND public.is_workspace_admin_or_owner(workspace_id)
);

-- Service role bypass
CREATE POLICY "Service role can update color palettes"
ON public.color_palettes
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Cores padrão não podem ser deletadas
-- Owner/admin pode deletar cores customizadas do seu workspace

CREATE POLICY "Admins can delete workspace color palettes"
ON public.color_palettes
FOR DELETE
USING (
  workspace_id IS NOT NULL
  AND is_default = false
  AND public.is_workspace_admin_or_owner(workspace_id)
);

-- Service role bypass (para casos excepcionais)
CREATE POLICY "Service role can delete color palettes"
ON public.color_palettes
FOR DELETE
USING (auth.role() = 'service_role');
