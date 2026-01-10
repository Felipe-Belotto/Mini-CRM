-- Create workspace_invites table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS workspace_invites_workspace_id_idx ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_invites_email_idx ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS workspace_invites_token_idx ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS workspace_invites_status_idx ON workspace_invites(status);
CREATE INDEX IF NOT EXISTS workspace_invites_workspace_email_status_idx ON workspace_invites(workspace_id, email, status);

-- Constraint to ensure no multiple pending invites for the same email in the same workspace
-- Using partial unique index instead of constraint to allow multiple accepted/expired invites
CREATE UNIQUE INDEX IF NOT EXISTS workspace_invites_unique_pending 
ON workspace_invites(workspace_id, email) 
WHERE status = 'pending';

-- Grant permissions
GRANT ALL ON public.workspace_invites TO authenticated, anon, service_role;

-- Function to mark expired invites automatically
CREATE OR REPLACE FUNCTION check_invite_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark expired invites when they are queried or when they expire
  UPDATE workspace_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
