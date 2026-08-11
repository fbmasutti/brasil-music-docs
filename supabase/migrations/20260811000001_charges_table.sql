-- Fase 4: tabela de cobranças PIX com histórico e ciclo de vida.
-- Status manual: PENDENTE → ENVIADA → PAGA | VENCIDA | CANCELADA.

CREATE TABLE public.charges (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL,
  event_id     UUID        REFERENCES public.events(id) ON DELETE SET NULL,
  client_id    UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  amount       NUMERIC(12,2),
  description  TEXT,
  due_date     DATE,
  status       TEXT        NOT NULL DEFAULT 'PENDENTE',
  pix_payload  TEXT,
  txid         TEXT,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own charges" ON public.charges
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.charges TO authenticated;
GRANT ALL ON public.charges TO service_role;

CREATE INDEX charges_user_idx  ON public.charges (user_id, created_at DESC);
CREATE INDEX charges_event_idx ON public.charges (event_id);

CREATE TRIGGER set_charges_updated_at
  BEFORE UPDATE ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
