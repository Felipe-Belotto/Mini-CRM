-- ============================================================================
-- FIX: RLS workspace_invites
-- ============================================================================
-- Corrige policies que tentavam acessar auth.users diretamente
-- Usa auth.jwt() ->> 'email' para obter email do usuário autenticado
-- ============================================================================

-- Remover policies problemáticas
DROP POLICY IF EXISTS "Invited users can view their invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Invited users can accept invites" ON public.workspace_invites;

-- Recriar policies usando JWT para obter email
-- SELECT: Usuário convidado pode ver seu próprio convite (para aceitar)
CREATE POLICY "Invited users can view their invites"
ON public.workspace_invites
FOR SELECT
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
);

-- UPDATE: Convidado pode atualizar seu convite (aceitar/rejeitar)
CREATE POLICY "Invited users can accept invites"
ON public.workspace_invites
FOR UPDATE
USING (lower(email) = lower(auth.jwt() ->> 'email'))
WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));
