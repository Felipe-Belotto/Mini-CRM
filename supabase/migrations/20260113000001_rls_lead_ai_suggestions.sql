-- ============================================================================
-- RLS: LEAD AI SUGGESTIONS
-- ============================================================================
-- Row Level Security para lead_ai_suggestions
-- ============================================================================

ALTER TABLE public.lead_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Membros do workspace podem visualizar sugestões

CREATE POLICY "Members can view lead AI suggestions"
ON public.lead_ai_suggestions
FOR SELECT
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can view all lead AI suggestions"
ON public.lead_ai_suggestions
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Membros do workspace podem criar sugestões (geração automática)

CREATE POLICY "Members can create lead AI suggestions"
ON public.lead_ai_suggestions
FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can insert lead AI suggestions"
ON public.lead_ai_suggestions
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Membros do workspace podem atualizar sugestões (marcar como visualizado)

CREATE POLICY "Members can update lead AI suggestions"
ON public.lead_ai_suggestions
FOR UPDATE
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can update all lead AI suggestions"
ON public.lead_ai_suggestions
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- Membros do workspace podem deletar sugestões

CREATE POLICY "Members can delete lead AI suggestions"
ON public.lead_ai_suggestions
FOR DELETE
USING (public.is_workspace_member(workspace_id));

-- Service role bypass
CREATE POLICY "Service role can delete all lead AI suggestions"
ON public.lead_ai_suggestions
FOR DELETE
USING (auth.role() = 'service_role');
