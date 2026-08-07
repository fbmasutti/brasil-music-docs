-- Permite registrar o pagamento a um parceiro da banda como despesa do
-- evento (categoria PARCEIRO), em vez de só copiar a chave Pix sem
-- registrar nada.
ALTER TABLE public.event_expenses
  ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
