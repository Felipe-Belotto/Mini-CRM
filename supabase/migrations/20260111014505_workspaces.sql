-- ============================================================================
-- FEATURE: WORKSPACES
-- ============================================================================
-- Gerenciamento de workspaces, membros, convites e configuração de pipeline
-- Inclui: workspaces, workspace_members, workspace_invites, pipeline_configs
-- ============================================================================

-- ============================================================================
-- TABELA: workspaces
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice único case-insensitive: um usuário não pode ter dois workspaces com o mesmo nome
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_owner_id_name_unique_idx 
ON workspaces(owner_id, LOWER(name));

CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);

-- ============================================================================
-- TABELA: workspace_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_id_idx ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON workspace_members(user_id);

-- ============================================================================
-- TABELA: workspace_invites
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS workspace_invites_workspace_id_idx ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invites_email_idx ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS workspace_invites_token_idx ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS workspace_invites_status_idx ON workspace_invites(status);
CREATE INDEX IF NOT EXISTS workspace_invites_workspace_email_status_idx ON workspace_invites(workspace_id, email, status);

-- Constraint para garantir apenas um convite pendente por email por workspace
CREATE UNIQUE INDEX IF NOT EXISTS workspace_invites_unique_pending 
ON workspace_invites(workspace_id, email) 
WHERE status = 'pending';

-- ============================================================================
-- TABELA: pipeline_configs
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipeline_configs_workspace_id_idx ON pipeline_configs(workspace_id);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.workspaces TO authenticated, anon, service_role;
GRANT ALL ON public.workspace_members TO authenticated, anon, service_role;
GRANT ALL ON public.workspace_invites TO authenticated, anon, service_role;
GRANT ALL ON public.pipeline_configs TO authenticated, anon, service_role;

-- ============================================================================
-- FOREIGN KEY: profiles.current_workspace_id -> workspaces.id
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_current_workspace_id_fkey;
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_current_workspace_id_fkey 
    FOREIGN KEY (current_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at em workspaces
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at 
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em pipeline_configs
DROP TRIGGER IF EXISTS update_pipeline_configs_updated_at ON pipeline_configs;
CREATE TRIGGER update_pipeline_configs_updated_at 
  BEFORE UPDATE ON pipeline_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÕES E TRIGGERS PARA CRIAÇÃO DE WORKSPACE
-- ============================================================================

-- Função para adicionar owner como membro automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();

-- Função para criar pipeline_config padrão
CREATE OR REPLACE FUNCTION public.handle_new_workspace_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pipeline_configs (workspace_id, stages)
  VALUES (NEW.id, '[]'::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_created_pipeline ON workspaces;
CREATE TRIGGER on_workspace_created_pipeline
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace_pipeline();

-- Trigger para definir current_workspace no profile do owner
DROP TRIGGER IF EXISTS on_workspace_created_set_current ON workspaces;
CREATE TRIGGER on_workspace_created_set_current
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace_set_current();

-- ============================================================================
-- FUNÇÃO PARA EXPIRAR CONVITES AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION check_invite_expiration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workspace_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE workspaces IS 'Workspaces do sistema - cada workspace isola dados de uma organização';
COMMENT ON TABLE workspace_members IS 'Membros de cada workspace com seus respectivos papéis';
COMMENT ON TABLE workspace_invites IS 'Convites pendentes para novos membros';
COMMENT ON TABLE pipeline_configs IS 'Configuração do pipeline de vendas por workspace';
COMMENT ON COLUMN workspace_members.role IS 'Papel do membro: owner, admin ou member';
COMMENT ON COLUMN workspace_invites.status IS 'Status do convite: pending, accepted, expired ou cancelled';
