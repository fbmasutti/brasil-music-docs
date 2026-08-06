-- Repertório: distingue cover (maioria dos casos) de obra autoral.
-- Cover não tem ISRC/ISWC/editora/produtor/estúdio próprios e não usa split
-- de autoria (song_writers) — só precisa do nome do(s) autor(es) original(is)
-- para o relatório de execução pública do ECAD.
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'cover' CHECK (origin IN ('cover', 'autoral')),
  ADD COLUMN IF NOT EXISTS original_authors TEXT DEFAULT '';
