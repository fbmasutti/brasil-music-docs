CREATE TABLE public.formation_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (formation_id, song_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formation_songs TO authenticated;
GRANT ALL ON public.formation_songs TO service_role;
ALTER TABLE public.formation_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own formation songs" ON public.formation_songs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX formation_songs_formation_idx ON public.formation_songs (formation_id, position);
CREATE INDEX formation_songs_song_idx ON public.formation_songs (song_id);