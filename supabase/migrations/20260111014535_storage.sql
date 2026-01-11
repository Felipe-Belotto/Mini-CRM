-- ============================================================================
-- STORAGE BUCKETS E POLICIES
-- ============================================================================
-- Configuração de buckets de armazenamento e políticas de acesso
-- Buckets: avatars (profiles), workspace-logos (workspaces), lead-avatars (leads)
-- ============================================================================

-- ============================================================================
-- BUCKET: avatars (Avatares de usuários)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Usuários podem fazer upload do próprio avatar
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuários podem atualizar o próprio avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuários podem deletar o próprio avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuários podem visualizar o próprio avatar
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Público pode visualizar avatares (bucket é público)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- ============================================================================
-- BUCKET: workspace-logos (Logos de workspaces)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-logos', 'workspace-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Usuários autenticados podem fazer upload de logos
-- Validação de ownership é feita na aplicação
DROP POLICY IF EXISTS "Authenticated can upload workspace logos" ON storage.objects;
CREATE POLICY "Authenticated can upload workspace logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workspace-logos');

-- Usuários autenticados podem atualizar logos
DROP POLICY IF EXISTS "Authenticated can update workspace logos" ON storage.objects;
CREATE POLICY "Authenticated can update workspace logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'workspace-logos');

-- Usuários autenticados podem deletar logos
DROP POLICY IF EXISTS "Authenticated can delete workspace logos" ON storage.objects;
CREATE POLICY "Authenticated can delete workspace logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'workspace-logos');

-- Público pode visualizar logos de workspaces
DROP POLICY IF EXISTS "Public can view workspace logos" ON storage.objects;
CREATE POLICY "Public can view workspace logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-logos');

-- ============================================================================
-- BUCKET: lead-avatars (Avatares de leads)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-avatars', 'lead-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Usuários autenticados com acesso ao workspace podem fazer upload
DROP POLICY IF EXISTS "Authenticated can upload lead avatars" ON storage.objects;
CREATE POLICY "Authenticated can upload lead avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lead-avatars');

-- Usuários autenticados podem atualizar avatares de leads
DROP POLICY IF EXISTS "Authenticated can update lead avatars" ON storage.objects;
CREATE POLICY "Authenticated can update lead avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lead-avatars');

-- Usuários autenticados podem deletar avatares de leads
DROP POLICY IF EXISTS "Authenticated can delete lead avatars" ON storage.objects;
CREATE POLICY "Authenticated can delete lead avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lead-avatars');

-- Público pode visualizar avatares de leads (para exibir nos cards)
DROP POLICY IF EXISTS "Public can view lead avatars" ON storage.objects;
CREATE POLICY "Public can view lead avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lead-avatars');

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento do Supabase Storage';
