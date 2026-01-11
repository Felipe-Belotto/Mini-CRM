-- ============================================================================
-- RLS: PROFILES (Feature Auth)
-- ============================================================================
-- Row Level Security para tabela de perfis de usuários
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Usuário pode ver:
-- 1. Próprio perfil
-- 2. Perfis de membros dos mesmos workspaces (para ver equipe)

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view profiles of workspace members"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT wm.user_id 
    FROM public.workspace_members wm
    WHERE wm.workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- INSERT é feito apenas via trigger handle_new_user (service_role)
-- Usuários não podem criar perfis diretamente

CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Usuário pode atualizar apenas o próprio perfil

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Service role pode atualizar qualquer perfil (para triggers e admin)
CREATE POLICY "Service role can update any profile"
ON public.profiles
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- DELETE é feito apenas via cascade do auth.users (service_role)
-- Usuários não podem deletar perfis diretamente

CREATE POLICY "Service role can delete profiles"
ON public.profiles
FOR DELETE
USING (auth.role() = 'service_role');
