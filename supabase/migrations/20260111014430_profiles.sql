-- ============================================================================
-- FEATURE: PROFILES (Auth)
-- ============================================================================
-- Tabela de perfis de usuários, vinculada ao auth.users do Supabase
-- Gerencia dados do usuário como nome, avatar, telefone e onboarding
-- ============================================================================

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT, -- Mantido para compatibilidade
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  on_completed BOOLEAN NOT NULL DEFAULT false,
  current_workspace_id UUID, -- Foreign key será adicionada após criar workspaces
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_current_workspace_id_idx ON profiles(current_workspace_id);
CREATE INDEX IF NOT EXISTS profiles_on_completed_idx ON profiles(on_completed);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÕES
-- ============================================================================

-- Função para criar profile automaticamente quando um usuário é criado no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_url, on_completed)
  VALUES (
    NEW.id,
    '/fallback-avatar.webp',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para definir current_workspace quando um novo workspace é criado
-- Esta função é chamada por trigger em workspaces
CREATE OR REPLACE FUNCTION public.handle_new_workspace_set_current()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o profile do owner para ter este workspace como current
  -- Apenas se não tiver um current workspace definido
  UPDATE public.profiles
  SET current_workspace_id = NEW.id
  WHERE id = NEW.owner_id
  AND current_workspace_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema';
COMMENT ON COLUMN profiles.first_name IS 'Primeiro nome do usuário';
COMMENT ON COLUMN profiles.last_name IS 'Sobrenome do usuário';
COMMENT ON COLUMN profiles.on_completed IS 'Indica se o usuário completou o onboarding';
COMMENT ON COLUMN profiles.current_workspace_id IS 'Workspace atual selecionado pelo usuário';
