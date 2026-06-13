-- Bucket público para logos e fotos de itens do cardápio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'zapcomanda',
  'zapcomanda',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (cardápio digital acessa as imagens sem autenticação)
CREATE POLICY "zapcomanda_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'zapcomanda');

-- Usuários autenticados podem fazer upload
CREATE POLICY "zapcomanda_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'zapcomanda');

-- Usuários autenticados podem atualizar arquivos
CREATE POLICY "zapcomanda_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'zapcomanda');

-- Usuários autenticados podem deletar arquivos
CREATE POLICY "zapcomanda_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'zapcomanda');
