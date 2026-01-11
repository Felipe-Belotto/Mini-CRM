-- ============================================================================
-- RLS: CUSTOM FIELDS (Feature Custom Fields)
-- ============================================================================
-- Row Level Security para tabela de campos personalizados
-- ============================================================================

ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Membros do workspace podem ver os campos personalizados

CREATE POLICY "Members can view custom fields"
ON public.custom_fields
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all custom fields"
ON public.custom_fields
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Apenas owner/admin pode criar campos personalizados

CREATE POLICY "Admins can create custom fields"
ON public.custom_fields
FOR INSERT
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can insert custom fields"
ON public.custom_fields
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Apenas owner/admin pode atualizar campos personalizados

CREATE POLICY "Admins can update custom fields"
ON public.custom_fields
FOR UPDATE
USING (public.is_workspace_admin_or_owner(workspace_id))
WITH CHECK (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can update custom fields"
ON public.custom_fields
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Apenas owner/admin pode deletar campos personalizados

CREATE POLICY "Admins can delete custom fields"
ON public.custom_fields
FOR DELETE
USING (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can delete custom fields"
ON public.custom_fields
FOR DELETE
USING (auth.role() = 'service_role');
