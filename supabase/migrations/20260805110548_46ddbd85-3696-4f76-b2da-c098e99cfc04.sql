
-- As policies de storage.objects já referenciavam estes buckets desde a
-- migration inicial, mas os buckets em si nunca foram criados por migration —
-- por isso todo upload do Brand Kit falhava com "Bucket not found".

-- artist-logos é PÚBLICO de propósito: as fotos e logos daqui são embutidas
-- nos cards de divulgação, que existem justamente para serem publicados.
-- getPublicUrl() só produz URL utilizável em bucket público.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artist-logos',
  'artist-logos',
  true,
  5242880, -- 5MB, mesmo limite validado no cliente (src/lib/storage.ts)
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Estes dois continuam PRIVADOS: generated-pdfs guarda contratos com CPF/CNPJ
-- e dados bancários, e clippings-media é material de portfólio do usuário.
-- O acesso continua sendo só via RLS por pasta do próprio usuário.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('clippings-media', 'clippings-media', false),
  ('generated-pdfs', 'generated-pdfs', false)
ON CONFLICT (id) DO NOTHING;
