-- ============================================================================
-- FIX: RLS pipeline_configs - Permitir Admin/Owner criar manualmente
-- ============================================================================
-- Adiciona política para permitir que admin/owner criem pipeline_configs
-- diretamente (sem depender apenas do trigger)
-- ============================================================================

-- Adicionar política para permitir Admin/Owner criar pipeline_configs
-- Isso é necessário quando o código tenta criar manualmente em updatePipelineConfigAction
CREATE POLICY "Admins can insert pipeline configs"
ON public.pipeline_configs
FOR INSERT
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- ============================================================================
-- COMENTÁRIO
-- ============================================================================

COMMENT ON POLICY "Admins can insert pipeline configs" ON public.pipeline_configs IS 
  'Permite que admin/owner criem pipeline_configs manualmente, além do trigger automático';
