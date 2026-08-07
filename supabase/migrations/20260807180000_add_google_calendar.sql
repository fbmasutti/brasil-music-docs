-- Conexão do artista com o Google Calendar (push unidirecional StageKit -> Google).
-- O refresh_token nunca é exposto ao cliente: só a Edge Function (service role) o lê.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_email TEXT;

-- Guarda o id do evento no Google para permitir atualizar em vez de duplicar
-- quando o show é editado depois de já ter sido enviado.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
