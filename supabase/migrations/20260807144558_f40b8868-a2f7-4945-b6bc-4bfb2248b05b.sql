-- Formação ativa do artista: usada como padrão em eventos, riders e documentos.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_active_formation_idx ON public.profiles (active_formation_id);