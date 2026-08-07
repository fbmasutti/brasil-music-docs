ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_email TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;