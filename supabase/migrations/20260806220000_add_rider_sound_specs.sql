-- Rider técnico: separa a sonorização em 3 campos (mesa/console, P.A.,
-- monitores) em vez de um único campo de texto genérico. sound_requirements
-- continua existindo para observações gerais.
ALTER TABLE public.technical_riders
  ADD COLUMN IF NOT EXISTS console_specs TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pa_specs TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS monitor_specs TEXT DEFAULT '';
