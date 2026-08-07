ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'cover' CHECK (origin IN ('cover', 'autoral')),
  ADD COLUMN IF NOT EXISTS original_authors TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS external_link TEXT DEFAULT '';

ALTER TABLE public.technical_riders
  ADD COLUMN IF NOT EXISTS console_specs TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pa_specs TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS monitor_specs TEXT DEFAULT '';

ALTER TABLE public.event_expenses
  ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;