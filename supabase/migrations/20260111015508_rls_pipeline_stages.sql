-- ============================================================================
-- RLS: PIPELINE STAGES (Feature Pipeline Config)
-- ============================================================================
-- Row Level Security para tabela de etapas do pipeline
-- ============================================================================

ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Membros do workspace podem ver as etapas do pipeline

CREATE POLICY "Members can view pipeline stages"
ON public.pipeline_stages
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all pipeline stages"
ON public.pipeline_stages
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Owner/admin pode criar novas etapas
-- Etapas de sistema são criadas via trigger (service_role)

CREATE POLICY "Admins can create pipeline stages"
ON public.pipeline_stages
FOR INSERT
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass (para trigger create_default_pipeline_stages)
CREATE POLICY "Service role can insert pipeline stages"
ON public.pipeline_stages
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Owner/admin pode atualizar etapas

CREATE POLICY "Admins can update pipeline stages"
ON public.pipeline_stages
FOR UPDATE
USING (public.is_workspace_admin_or_owner(workspace_id))
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can update pipeline stages"
ON public.pipeline_stages
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Owner/admin pode deletar etapas NÃO-SISTEMA (is_system = false)
-- Etapas de sistema não podem ser deletadas

CREATE POLICY "Admins can delete non-system pipeline stages"
ON public.pipeline_stages
FOR DELETE
USING (
  public.is_workspace_admin_or_owner(workspace_id)
  AND is_system = false
);

-- Service role bypass (para casos excepcionais)
CREATE POLICY "Service role can delete pipeline stages"
ON public.pipeline_stages
FOR DELETE
USING (auth.role() = 'service_role');
