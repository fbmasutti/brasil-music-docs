-- Fase 6: adiciona categoria aos itens da mala de gig.
-- Categorias sugeridas: Instrumentos, Cabos e energia, Som e PA,
--   Iluminação, Camarim, Transporte, Geral.

ALTER TABLE public.gear_checklist_items
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Geral';
