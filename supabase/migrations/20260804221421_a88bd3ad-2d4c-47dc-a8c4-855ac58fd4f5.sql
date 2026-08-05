
-- FASE 0 — Fundação: Formações, Brand Kit, Financeiro/Fundo de Manutenção

-- BRAND KITS
CREATE TABLE public.brand_kits (
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
CREATE POLICY "own brand kits" ON public.brand_kits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER brand_kits_updated BEFORE UPDATE ON public.brand_kits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FORMATIONS
CREATE TABLE public.formations (
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
CREATE POLICY "own formations" ON public.formations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER formations_updated BEFORE UPDATE ON public.formations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FORMATION MEMBERS (roster padrão + rateio por formação)
CREATE TABLE public.formation_members (
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
CREATE POLICY "own formation members" ON public.formation_members FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GEAR CHECKLIST ITEMS (template de mala de gig por formação)
CREATE TABLE public.gear_checklist_items (
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
CREATE POLICY "own gear checklist items" ON public.gear_checklist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EVENT EXPENSES (custos operacionais por show, para o DRE rápido)
CREATE TABLE public.event_expenses (
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
CREATE POLICY "own event expenses" ON public.event_expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GEAR ASSETS (instrumentos/equipamentos cadastrados pelo usuário)
CREATE TABLE public.gear_assets (
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
CREATE POLICY "own gear assets" ON public.gear_assets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MAINTENANCE FUND ENTRIES (Fundo de Luthier: ledger de depósitos/usos)
CREATE TABLE public.maintenance_fund_entries (
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
CREATE POLICY "own maintenance fund entries" ON public.maintenance_fund_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EVENTS: vínculo com formação e endereço completo (deep-links de mapa)
ALTER TABLE public.events ADD COLUMN formation_id UUID REFERENCES public.formations(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN full_address TEXT DEFAULT '';

-- TECHNICAL RIDERS: rider pode pertencer a uma formação (além de/opcional a um evento)
ALTER TABLE public.technical_riders ADD COLUMN formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE;

CREATE INDEX ON public.formations (user_id);
CREATE INDEX ON public.formation_members (formation_id);
CREATE INDEX ON public.formation_members (team_member_id);
CREATE INDEX ON public.gear_checklist_items (formation_id, position);
CREATE INDEX ON public.event_expenses (event_id);
CREATE INDEX ON public.maintenance_fund_entries (user_id, created_at DESC);
CREATE INDEX ON public.events (formation_id);
CREATE INDEX ON public.technical_riders (formation_id);
