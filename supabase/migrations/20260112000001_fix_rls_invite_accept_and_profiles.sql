-- ============================================================================
-- FIX: RLS para aceite de convites e criação de perfil
-- ============================================================================
-- 1. Permite que usuários adicionem a si mesmos como membros quando têm
--    um convite pendente válido para seu email
-- 2. Permite que usuários criem seu próprio perfil (fallback do trigger)
-- ============================================================================

-- ############################################################################
-- FIX 1: workspace_members - Permitir auto-inserção via convite
-- ############################################################################

-- Política para permitir que um usuário se adicione como membro
-- quando existe um convite pendente para seu email
CREATE POLICY "Users can accept invites and join workspace"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  -- O usuário está inserindo a si mesmo
  user_id = auth.uid()
  AND
  -- Existe um convite pendente para o email deste usuário neste workspace
  EXISTS (
    SELECT 1 FROM public.workspace_invites wi
    WHERE wi.workspace_id = workspace_members.workspace_id
    AND wi.status = 'pending'
    AND lower(wi.email) = lower(auth.jwt() ->> 'email')
  )
);

COMMENT ON POLICY "Users can accept invites and join workspace" ON public.workspace_members IS 
  'Permite que usuário se adicione como membro quando tem convite pendente válido';

-- ############################################################################
-- FIX 2: profiles - Permitir que usuário crie próprio perfil
-- ############################################################################

-- Política para permitir que um usuário crie seu próprio perfil
-- Isso é um fallback caso o trigger handle_new_user falhe
CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  -- O usuário está criando seu próprio perfil
  id = auth.uid()
);

COMMENT ON POLICY "Users can create own profile" ON public.profiles IS 
  'Permite que usuário crie seu próprio perfil (fallback do trigger)';

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON EXTENSION pgcrypto IS 'Extensão pgcrypto para geração de UUIDs';
