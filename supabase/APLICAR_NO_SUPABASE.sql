-- =====================================================================
-- StageKit — schema pendente (Fases 0 a 4)
--
-- COMO USAR: painel do Supabase > SQL Editor > New query > cole tudo
-- isto > Run. Pode rodar mais de uma vez sem problema (é idempotente).
--
-- Por que isto existe: as migrations em supabase/migrations/ foram
-- versionadas no git, mas nunca executadas no banco — o push sincroniza
-- o código, não o schema. Sem isto, salvar evento, criar formação e
-- subir foto do Brand Kit falham, porque as tabelas/colunas não existem.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- ---------------------------------------------------------------- BRAND KITS
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Meu Brand Kit',
  preset TEXT NOT NULL DEFAULT 'neon_night',
  palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_kits TO authenticated;
GRANT ALL ON public.brand_kits TO service_role;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own brand kits" ON public.brand_kits;
CREATE POLICY "own brand kits" ON public.brand_kits FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS brand_kits_updated ON public.brand_kits;
CREATE TRIGGER brand_kits_updated BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------- FORMATIONS
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  base_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formations TO authenticated;
GRANT ALL ON public.formations TO service_role;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own formations" ON public.formations;
CREATE POLICY "own formations" ON public.formations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS formations_updated ON public.formations;
CREATE TRIGGER formations_updated BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Roster padrão da formação, com o rateio de cada integrante.
CREATE TABLE IF NOT EXISTS public.formation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  split_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (formation_id, team_member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.formation_members TO authenticated;
GRANT ALL ON public.formation_members TO service_role;
ALTER TABLE public.formation_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own formation members" ON public.formation_members;
CREATE POLICY "own formation members" ON public.formation_members FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mala de gig padrão da formação.
CREATE TABLE IF NOT EXISTS public.gear_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_checklist_items TO authenticated;
GRANT ALL ON public.gear_checklist_items TO service_role;
ALTER TABLE public.gear_checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own gear checklist items" ON public.gear_checklist_items;
CREATE POLICY "own gear checklist items" ON public.gear_checklist_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------- FINANCEIRO
CREATE TABLE IF NOT EXISTS public.event_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'OUTRO',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_expenses TO authenticated;
GRANT ALL ON public.event_expenses TO service_role;
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own event expenses" ON public.event_expenses;
CREATE POLICY "own event expenses" ON public.event_expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.gear_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_assets TO authenticated;
GRANT ALL ON public.gear_assets TO service_role;
ALTER TABLE public.gear_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own gear assets" ON public.gear_assets;
CREATE POLICY "own gear assets" ON public.gear_assets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.maintenance_fund_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_fund_entries TO authenticated;
GRANT ALL ON public.maintenance_fund_entries TO service_role;
ALTER TABLE public.maintenance_fund_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own maintenance fund entries" ON public.maintenance_fund_entries;
CREATE POLICY "own maintenance fund entries" ON public.maintenance_fund_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------- COLUNAS NOVAS EM TABELAS ANTIGAS
-- Sem estas duas, salvar/editar qualquer evento falha.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS full_address TEXT DEFAULT '';

-- Rider pode pertencer a uma formação. SET NULL (e não CASCADE): apagar a
-- formação não deve destruir o rider, que é conteúdo próprio.
ALTER TABLE public.technical_riders ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------- ÍNDICES
CREATE INDEX IF NOT EXISTS formations_user_idx ON public.formations (user_id);
CREATE INDEX IF NOT EXISTS formation_members_formation_idx ON public.formation_members (formation_id);
CREATE INDEX IF NOT EXISTS formation_members_team_idx ON public.formation_members (team_member_id);
CREATE INDEX IF NOT EXISTS gear_checklist_formation_idx ON public.gear_checklist_items (formation_id, position);
CREATE INDEX IF NOT EXISTS event_expenses_event_idx ON public.event_expenses (event_id);
CREATE INDEX IF NOT EXISTS maintenance_fund_user_idx ON public.maintenance_fund_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_formation_idx ON public.events (formation_id);
CREATE INDEX IF NOT EXISTS technical_riders_formation_idx ON public.technical_riders (formation_id);

-- ------------------------------------------------------- STORAGE (Brand Kit)
-- As policies de storage.objects já existiam, mas os buckets nunca foram
-- criados — por isso todo upload de foto/logo falhava.
--
-- Isto vai dentro de um bloco com tratamento de exceção DE PROPÓSITO: em
-- alguns projetos o schema storage é restrito, e um erro aqui abortaria a
-- transação inteira, desfazendo todas as tabelas criadas acima. Se falhar,
-- o script segue e avisa — dá para criar os buckets pela UI (Storage > New
-- bucket), que é o que realmente importa: 'artist-logos' PÚBLICO.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('artist-logos', 'artist-logos', true, 5242880,
          ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
  ON CONFLICT (id) DO UPDATE
    SET public = true,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

  -- Estes seguem privados: guardam contratos com CPF/CNPJ e material do usuário.
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('clippings-media', 'clippings-media', false),
         ('generated-pdfs', 'generated-pdfs', false)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Buckets de storage criados/atualizados com sucesso.';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Buckets NAO criados (%). Crie manualmente em Storage > New bucket: artist-logos com Public marcado.', SQLERRM;
END $$;

-- Recarrega o cache de schema do PostgREST para as tabelas novas aparecerem
-- na API imediatamente, sem esperar o reload automático.
NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------- ALUNOS
-- Ferramentas para professores. Duas recorrências, tratadas de formas
-- diferentes de propósito: a aula semanal é REGRA (o horário fixo mora no
-- aluno e a agenda calcula as ocorrências; só o desvio vira linha em
-- lesson_records) e a mensalidade é REGISTRO (cada uma precisa de status
-- próprio, então é materializada em charges).
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  doc TEXT,
  email TEXT,
  phone TEXT,
  -- Aluno menor de idade é comum: quem assina e paga não é o aluno.
  guardian_name TEXT,
  guardian_phone TEXT,
  instrument TEXT,
  level TEXT,
  modality TEXT NOT NULL DEFAULT 'Presencial',
  -- weekday segue Date.getDay(): 0 = domingo.
  weekday SMALLINT,
  start_time TEXT,
  duration_min INTEGER NOT NULL DEFAULT 50,
  monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_day SMALLINT NOT NULL DEFAULT 10,
  -- Só ATIVO gera mensalidade; quem tranca não some do histórico.
  status TEXT NOT NULL DEFAULT 'ATIVO',
  started_at DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own students" ON public.students;
CREATE POLICY "own students" ON public.students FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Só o que desvia do combinado. Sem linha = aula prevista e normal.
CREATE TABLE IF NOT EXISTS public.lesson_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'REALIZADA',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_records_student_date_key
  ON public.lesson_records (student_id, lesson_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_records TO authenticated;
GRANT ALL ON public.lesson_records TO service_role;
ALTER TABLE public.lesson_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own lesson records" ON public.lesson_records;
CREATE POLICY "own lesson records" ON public.lesson_records FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS set_lesson_records_updated_at ON public.lesson_records;
CREATE TRIGGER set_lesson_records_updated_at BEFORE UPDATE ON public.lesson_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mensalidade reusa charges em vez de tabela nova: ela já tem valor,
-- vencimento, payload Pix e o ciclo PENDENTE/ENVIADA/PAGA/VENCIDA.
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reference_month DATE;

-- O que torna "gerar mensalidades do mês" idempotente: clicar duas vezes
-- não cria cobrança repetida. Parcial porque cobrança de show não tem aluno.
CREATE UNIQUE INDEX IF NOT EXISTS charges_student_month_key
  ON public.charges (user_id, student_id, reference_month)
  WHERE student_id IS NOT NULL;

-- Decide a forma do app: quem só dá aula não vê rider, formação nem mala
-- de gig. O padrão 'shows' preserva quem já usa o produto hoje.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activities TEXT[] NOT NULL DEFAULT ARRAY['shows'];

-- =====================================================================
-- VERIFICAÇÃO — o resultado desta consulta aparece na aba Results.
-- Todas as linhas devem mostrar "OK". Se alguma mostrar "FALTANDO",
-- me mande o print que eu diagnostico.
-- =====================================================================
SELECT 'tabela: ' || t AS item,
       CASE WHEN to_regclass('public.' || t) IS NOT NULL THEN 'OK' ELSE 'FALTANDO' END AS status
FROM unnest(ARRAY['formations','formation_members','brand_kits','gear_checklist_items',
                  'event_expenses','gear_assets','maintenance_fund_entries',
                  'students','lesson_records']) AS t
UNION ALL
SELECT 'coluna: events.' || c,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema='public' AND table_name='events' AND column_name=c)
            THEN 'OK' ELSE 'FALTANDO' END
FROM unnest(ARRAY['formation_id','full_address']) AS c
UNION ALL
SELECT 'coluna: charges.' || c,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema='public' AND table_name='charges' AND column_name=c)
            THEN 'OK' ELSE 'FALTANDO' END
FROM unnest(ARRAY['student_id','reference_month']) AS c
UNION ALL
SELECT 'coluna: profiles.activities',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema='public' AND table_name='profiles' AND column_name='activities')
            THEN 'OK' ELSE 'FALTANDO' END
UNION ALL
SELECT 'bucket: ' || b,
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id=b) THEN 'OK' ELSE 'FALTANDO' END
FROM unnest(ARRAY['artist-logos']) AS b
ORDER BY 1;
