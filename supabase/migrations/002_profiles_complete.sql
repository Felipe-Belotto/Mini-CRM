-- Create profiles table with all fields from the start
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT, -- Keep for backwards compatibility if needed
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  on_completed BOOLEAN NOT NULL DEFAULT false,
  current_workspace_id UUID, -- Foreign key will be added in workspaces migration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_current_workspace_id_idx ON profiles(current_workspace_id);
CREATE INDEX IF NOT EXISTS profiles_on_completed_idx ON profiles(on_completed);

-- Grant permissions to authenticated, anon, and service_role
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
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

-- Trigger to create profile when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to set current workspace when a new workspace is created
CREATE OR REPLACE FUNCTION public.handle_new_workspace_set_current()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile of the owner to have this workspace as current
  -- Only if they don't have a current workspace set
  UPDATE public.profiles
  SET current_workspace_id = NEW.id
  WHERE id = NEW.owner_id
  AND current_workspace_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN profiles.first_name IS 'First name of the user';
COMMENT ON COLUMN profiles.last_name IS 'Last name of the user';
COMMENT ON COLUMN profiles.on_completed IS 'Indicates if the user completed the profile onboarding';
