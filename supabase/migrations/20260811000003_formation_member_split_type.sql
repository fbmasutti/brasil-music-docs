ALTER TABLE public.formation_members
  ADD COLUMN IF NOT EXISTS split_type TEXT NOT NULL DEFAULT 'percent';
