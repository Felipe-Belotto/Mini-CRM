-- Create lead-avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-avatars', 'lead-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for lead-avatars bucket
-- Authenticated users with workspace access can upload lead avatars
DROP POLICY IF EXISTS "Authenticated can upload lead avatars" ON storage.objects;
CREATE POLICY "Authenticated can upload lead avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lead-avatars');

-- Authenticated users with workspace access can update lead avatars
DROP POLICY IF EXISTS "Authenticated can update lead avatars" ON storage.objects;
CREATE POLICY "Authenticated can update lead avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lead-avatars');

-- Authenticated users with workspace access can delete lead avatars
DROP POLICY IF EXISTS "Authenticated can delete lead avatars" ON storage.objects;
CREATE POLICY "Authenticated can delete lead avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lead-avatars');

-- Public can view lead avatars (para exibir nos cards)
DROP POLICY IF EXISTS "Public can view lead avatars" ON storage.objects;
CREATE POLICY "Public can view lead avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lead-avatars');
