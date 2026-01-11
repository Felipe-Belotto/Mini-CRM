-- ============================================================================
-- RLS: CAMPAIGNS (Feature Campaigns)
-- ============================================================================
-- Row Level Security para tabela de campanhas
-- ============================================================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Membros do workspace podem ver as campanhas

CREATE POLICY "Members can view campaigns"
ON public.campaigns
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all campaigns"
ON public.campaigns
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Membros do workspace podem criar campanhas

CREATE POLICY "Members can create campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can insert campaigns"
ON public.campaigns
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Membros do workspace podem atualizar campanhas

CREATE POLICY "Members can update campaigns"
ON public.campaigns
FOR UPDATE
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can update campaigns"
ON public.campaigns
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Apenas owner/admin pode deletar campanhas

CREATE POLICY "Admins can delete campaigns"
ON public.campaigns
FOR DELETE
USING (public.is_workspace_admin_or_owner(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can delete campaigns"
ON public.campaigns
FOR DELETE
USING (auth.role() = 'service_role');
