ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL;
