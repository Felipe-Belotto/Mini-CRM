-- Add avatar_url column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar_url TEXT;
