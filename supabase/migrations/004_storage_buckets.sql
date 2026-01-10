-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for avatars bucket
-- Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own avatar
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public can view avatars
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create workspace-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-logos', 'workspace-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for workspace logos
-- Políticas simplificadas: qualquer usuário autenticado pode gerenciar logos
-- (a validação de ownership é feita no código da aplicação)
DROP POLICY IF EXISTS "Authenticated can upload workspace logos" ON storage.objects;
CREATE POLICY "Authenticated can upload workspace logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-logos');

DROP POLICY IF EXISTS "Authenticated can update workspace logos" ON storage.objects;
CREATE POLICY "Authenticated can update workspace logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'workspace-logos');

DROP POLICY IF EXISTS "Authenticated can delete workspace logos" ON storage.objects;
CREATE POLICY "Authenticated can delete workspace logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-logos');

DROP POLICY IF EXISTS "Public can view workspace logos" ON storage.objects;
CREATE POLICY "Public can view workspace logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-logos');
