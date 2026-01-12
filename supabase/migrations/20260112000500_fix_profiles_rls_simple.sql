-- ============================================================================
-- FIX: Simplificar RLS de profiles conforme documentação do Supabase
-- ============================================================================
-- Baseado na documentação oficial do Supabase:
-- https://supabase.com/docs/guides/database/postgres/row-level-security
-- 
-- Padrão recomendado:
-- - SELECT: Perfis públicos são visíveis para todos (ou apenas próprio perfil)
-- - INSERT: Usuários podem criar seu próprio perfil
-- - UPDATE: Usuários podem atualizar apenas seu próprio perfil
-- ============================================================================

-- Remover políticas antigas que não seguem o padrão
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of workspace members" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.profiles;

-- ============================================================================
-- POLICY: SELECT
-- ============================================================================
-- Perfis são públicos e visíveis para todos
-- (se preferir apenas próprio perfil, use: USING ((select auth.uid()) = id))
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- ============================================================================
-- POLICY: INSERT
-- ============================================================================
-- Usuários podem criar seu próprio perfil
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- POLICY: UPDATE
-- ============================================================================
-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- POLICY: DELETE
-- ============================================================================
-- DELETE é feito apenas via cascade do auth.users (não precisa de política)
-- Se necessário permitir delete, use:
-- CREATE POLICY "Users can delete their own profile"
-- ON public.profiles FOR DELETE
-- USING ((select auth.uid()) = id);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "Public profiles are viewable by everyone" ON public.profiles IS 
  'Perfis são públicos e visíveis para todos. Padrão recomendado pelo Supabase.';

COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 
  'Usuários autenticados podem criar seu próprio perfil. Padrão recomendado pelo Supabase.';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS 
  'Usuários autenticados podem atualizar apenas seu próprio perfil. Padrão recomendado pelo Supabase.';
