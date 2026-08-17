-- Fase A das ferramentas para professores: alunos, registro de aulas e
-- mensalidades recorrentes.
--
-- Duas recorrências diferentes, tratadas de formas diferentes de propósito:
--
--   Aula semanal -> REGRA. O horário fixo mora em students (weekday,
--     start_time, duration_min) e a agenda calcula as ocorrências na hora.
--     Só o desvio vira linha em lesson_records. Sem isso seriam ~48 linhas
--     por aluno por ano só para registrar que tudo correu como combinado.
--
--   Mensalidade -> REGISTRO. Cada uma precisa de status próprio (paga ou
--     não), então é materializada em charges, que já tem o ciclo de vida
--     PENDENTE -> ENVIADA -> PAGA | VENCIDA | CANCELADA.

-- ---------------------------------------------------------------- ALUNOS
CREATE TABLE IF NOT EXISTS public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  doc TEXT,
  email TEXT,
  phone TEXT,
  -- Responsável: aluno menor de idade é comum em aula de música, e quem
  -- assina o contrato e paga a mensalidade não é o aluno.
  guardian_name TEXT,
  guardian_phone TEXT,
  instrument TEXT,
  level TEXT,
  modality TEXT NOT NULL DEFAULT 'Presencial',
  -- O horário fixo. weekday segue o padrão de Date.getDay(): 0 = domingo.
  weekday SMALLINT,
  start_time TEXT,
  duration_min INTEGER NOT NULL DEFAULT 50,
  monthly_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_day SMALLINT NOT NULL DEFAULT 10,
  -- Aluno que tranca não pode sumir do histórico nem entrar na geração de
  -- mensalidade: só ATIVO gera cobrança.
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

-- ------------------------------------------------------- REGISTRO DE AULAS
-- Só o que desvia do combinado. Ausência de linha = aula prevista e normal.
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
-- Um registro por aluno por dia: marcar presença duas vezes não duplica.
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

-- ------------------------------------------------------------ MENSALIDADES
-- charges vira o lugar das mensalidades também, em vez de uma tabela nova:
-- ela já tem valor, vencimento, payload Pix e o ciclo de status.
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reference_month DATE;

-- O que torna "gerar mensalidades do mês" idempotente: clicar duas vezes
-- não cria cobrança repetida. Parcial porque cobrança de show não tem aluno.
CREATE UNIQUE INDEX IF NOT EXISTS charges_student_month_key
  ON public.charges (user_id, student_id, reference_month)
  WHERE student_id IS NOT NULL;

-- ------------------------------------------------------ PERFIL: ATIVIDADES
-- Decide a forma do app: quem só dá aula não vê rider, formação nem mala de
-- gig. Padrão 'shows' preserva o comportamento de quem já usa hoje.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activities TEXT[] NOT NULL DEFAULT ARRAY['shows'];
