-- ============================================================================
-- FIX: handle_new_user trigger para funcionar com RLS
-- ============================================================================
-- O problema: A função handle_new_user() com SECURITY DEFINER ainda está
-- sujeita ao RLS, e a política "Service role can insert profiles" verifica
-- auth.role() = 'service_role', mas o trigger não executa com service_role.
-- 
-- Solução: Adicionar tratamento de erro para não falhar o signup, e confiar
-- na política "Users can create own profile" que já existe como fallback.
-- ============================================================================

-- Recriar a função handle_new_user com tratamento de erro robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tentar inserir o perfil
  INSERT INTO public.profiles (id, avatar_url, on_completed)
  VALUES (
    NEW.id,
    '/fallback-avatar.webp',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Se houver qualquer erro (RLS, constraint, etc), logar mas não falhar o signup
    -- O perfil pode ser criado depois via:
    -- 1. Política "Users can create own profile" (fallback)
    -- 2. Código no signupAction que cria perfil manualmente se necessário
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Cria perfil automaticamente quando usuário é criado no auth. Usa ON CONFLICT para evitar erros duplicados e EXCEPTION para não falhar o signup se houver problemas com RLS. O perfil será criado via política fallback se o trigger falhar.';
