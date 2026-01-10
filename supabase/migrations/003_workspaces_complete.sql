-- Create workspaces table with name (not nome) and logo_url from the start
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
-- (ignora diferenças de maiúsculas/minúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_owner_id_name_unique_idx 
ON workspaces(owner_id, LOWER(name));

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Create pipeline_configs table
CREATE TABLE IF NOT EXISTS pipeline_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);
CREATE INDEX IF NOT EXISTS workspace_members_workspace_id_idx ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS pipeline_configs_workspace_id_idx ON pipeline_configs(workspace_id);

-- Grant permissions
GRANT ALL ON public.workspaces TO authenticated, anon, service_role;
GRANT ALL ON public.workspace_members TO authenticated, anon, service_role;
GRANT ALL ON public.pipeline_configs TO authenticated, anon, service_role;

-- Add foreign key constraint for current_workspace_id in profiles (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Remove existing constraint if any
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_current_workspace_id_fkey;
    -- Add foreign key constraint
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_current_workspace_id_fkey 
    FOREIGN KEY (current_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Triggers
-- Trigger to update updated_at on workspaces
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on pipeline_configs
DROP TRIGGER IF EXISTS update_pipeline_configs_updated_at ON pipeline_configs;
CREATE TRIGGER update_pipeline_configs_updated_at BEFORE UPDATE ON pipeline_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new workspace creation (add owner as member)
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add owner as member when workspace is created
DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace();

-- Function to create default pipeline config when workspace is created
CREATE OR REPLACE FUNCTION public.handle_new_workspace_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pipeline_configs (workspace_id, stages)
  VALUES (NEW.id, '[]'::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default pipeline config when workspace is created
DROP TRIGGER IF EXISTS on_workspace_created_pipeline ON workspaces;
CREATE TRIGGER on_workspace_created_pipeline
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace_pipeline();

-- Trigger to set current workspace when a new workspace is created (if function exists)
-- This function is defined in profiles migration, so we just create the trigger
DROP TRIGGER IF EXISTS on_workspace_created_set_current ON workspaces;
CREATE TRIGGER on_workspace_created_set_current
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_workspace_set_current();
