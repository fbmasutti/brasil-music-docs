
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  entity_type TEXT NOT NULL DEFAULT 'SOLO',
  stage_name TEXT NOT NULL DEFAULT '',
  legal_name TEXT DEFAULT '',
  doc_type TEXT DEFAULT 'CPF',
  cpf_cnpj TEXT DEFAULT '',
  cnae TEXT DEFAULT '',
  inscricao_municipal TEXT DEFAULT '',
  inscricao_estadual TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  cep TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_agency TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  pix_key TEXT DEFAULT '',
  ecad_association TEXT DEFAULT '',
  cae_ipi TEXT DEFAULT '',
  ecad_client_number TEXT DEFAULT '',
  cnd_expires_at DATE,
  logo_url TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  instrument TEXT DEFAULT '',
  cpf TEXT DEFAULT '',
  rg TEXT DEFAULT '',
  pis_pasep TEXT DEFAULT '',
  pix_key TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  food_restrictions TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own team" ON public.team_members FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CLIENTS
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT DEFAULT '',
  doc TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SONGS
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  isrc TEXT DEFAULT '',
  iswc TEXT DEFAULT '',
  genre TEXT DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  publisher TEXT DEFAULT '',
  performers TEXT DEFAULT '',
  producer TEXT DEFAULT '',
  studio TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own songs" ON public.songs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SONG WRITERS
CREATE TABLE public.song_writers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Compositor',
  share_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  cae_ipi TEXT DEFAULT '',
  association TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.song_writers TO authenticated;
GRANT ALL ON public.song_writers TO service_role;
ALTER TABLE public.song_writers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own writers" ON public.song_writers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EVENTS
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'SHOW',
  status TEXT NOT NULL DEFAULT 'RASCUNHO',
  event_date DATE,
  start_time TEXT DEFAULT '',
  soundcheck_time TEXT DEFAULT '',
  venue TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  fee_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fee_deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit_due_date DATE,
  balance_due_date DATE,
  ecad_sent BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SETLISTS
CREATE TABLE public.setlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Setlist',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setlists TO authenticated;
GRANT ALL ON public.setlists TO service_role;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own setlists" ON public.setlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.setlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setlist_songs TO authenticated;
GRANT ALL ON public.setlist_songs TO service_role;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own setlist songs" ON public.setlist_songs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TECHNICAL RIDERS
CREATE TABLE public.technical_riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Rider Técnico',
  channel_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  stage_plot JSONB NOT NULL DEFAULT '[]'::jsonb,
  backline TEXT DEFAULT '',
  sound_requirements TEXT DEFAULT '',
  lighting_requirements TEXT DEFAULT '',
  hospitality TEXT DEFAULT '',
  rooming_list TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_riders TO authenticated;
GRANT ALL ON public.technical_riders TO service_role;
ALTER TABLE public.technical_riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own riders" ON public.technical_riders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER riders_updated BEFORE UPDATE ON public.technical_riders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GENERATED DOCUMENTS
CREATE TABLE public.generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RASCUNHO',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_documents TO authenticated;
GRANT ALL ON public.generated_documents TO service_role;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.generated_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER docs_updated BEFORE UPDATE ON public.generated_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PORTFOLIO CLIPPINGS
CREATE TABLE public.portfolio_clippings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'CLIPPING',
  event_name TEXT DEFAULT '',
  year INTEGER,
  happened_at DATE,
  description TEXT DEFAULT '',
  media_url TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_clippings TO authenticated;
GRANT ALL ON public.portfolio_clippings TO service_role;
ALTER TABLE public.portfolio_clippings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clippings" ON public.portfolio_clippings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EVENT CHECKLISTS
CREATE TABLE public.event_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'PRE',
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_checklists TO authenticated;
GRANT ALL ON public.event_checklists TO service_role;
ALTER TABLE public.event_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checklists" ON public.event_checklists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ON public.events (user_id, event_date);
CREATE INDEX ON public.event_checklists (user_id, event_id);
CREATE INDEX ON public.setlist_songs (setlist_id, position);
CREATE INDEX ON public.song_writers (song_id);
CREATE INDEX ON public.generated_documents (user_id, created_at DESC);
CREATE INDEX ON public.portfolio_clippings (user_id, year);
