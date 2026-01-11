-- ============================================================================
-- RLS: LEADS (Feature Leads)
-- ============================================================================
-- Row Level Security para leads e lead_responsibles
-- Nota: lead_activities e lead_messages_sent já possuem RLS (migration 008_leads.sql)
-- ============================================================================

-- ############################################################################
-- TABELA: leads
-- ############################################################################

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Membros do workspace podem ver leads

CREATE POLICY "Members can view leads"
ON public.leads
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all leads"
ON public.leads
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Membros do workspace podem criar leads

CREATE POLICY "Members can create leads"
ON public.leads
FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Membros do workspace podem atualizar leads

CREATE POLICY "Members can update leads"
ON public.leads
FOR UPDATE
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can update leads"
ON public.leads
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Membros do workspace podem deletar leads

CREATE POLICY "Members can delete leads"
ON public.leads
FOR DELETE
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can delete leads"
ON public.leads
FOR DELETE
USING (auth.role() = 'service_role');

-- ############################################################################
-- TABELA: lead_responsibles
-- ############################################################################

ALTER TABLE public.lead_responsibles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Membros do workspace podem ver responsáveis (via lead)

CREATE POLICY "Members can view lead responsibles"
ON public.lead_responsibles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_responsibles.lead_id
    AND public.is_workspace_member(l.workspace_id)
  )
);

-- Service role bypass
CREATE POLICY "Service role can view all lead responsibles"
ON public.lead_responsibles
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Membros do workspace podem adicionar responsáveis

CREATE POLICY "Members can add lead responsibles"
ON public.lead_responsibles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_responsibles.lead_id
    AND public.is_workspace_member(l.workspace_id)
  )
);

-- Service role bypass
CREATE POLICY "Service role can insert lead responsibles"
ON public.lead_responsibles
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Normalmente não há UPDATE em lead_responsibles (apenas INSERT/DELETE)
-- Mas incluímos para completude

CREATE POLICY "Members can update lead responsibles"
ON public.lead_responsibles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_responsibles.lead_id
    AND public.is_workspace_member(l.workspace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_responsibles.lead_id
    AND public.is_workspace_member(l.workspace_id)
  )
);

-- Service role bypass
CREATE POLICY "Service role can update lead responsibles"
ON public.lead_responsibles
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Membros do workspace podem remover responsáveis

CREATE POLICY "Members can delete lead responsibles"
ON public.lead_responsibles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_responsibles.lead_id
    AND public.is_workspace_member(l.workspace_id)
  )
);

-- Service role bypass
CREATE POLICY "Service role can delete lead responsibles"
ON public.lead_responsibles
FOR DELETE
USING (auth.role() = 'service_role');
