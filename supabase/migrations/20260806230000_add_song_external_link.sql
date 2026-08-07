-- Link externo (Spotify/YouTube/Deezer, colado à mão) por obra do repertório.
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS external_link TEXT DEFAULT '';
