-- ============================================================================
-- FIX: handle_new_user trigger - Remover trigger problemático
-- ============================================================================
-- O problema: O trigger handle_new_user está falhando devido a RLS,
-- causando erro 500 no signup mesmo com tratamento de exceção.
-- 
-- Solução: Remover o trigger e confiar no código da aplicação para
-- criar o perfil. A política "Users can create own profile" permite
-- que o usuário crie seu próprio perfil após o signup.
-- ============================================================================

-- Desabilitar o trigger que está causando erro 500
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Manter a função caso seja necessária no futuro, mas ela não será mais usada
-- A função pode ser removida em uma migration futura se não for mais necessária

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Função mantida para referência, mas o trigger foi desabilitado. O perfil é criado pelo código da aplicação após o signup usando a política "Users can create own profile".';
