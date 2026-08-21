-- Percentual do cachê que o artista separa para manutenção de instrumentos.
-- Antes vivia só em useState no Financeiro, com padrão 5%: voltava ao 5 a cada
-- visita à tela, então quem usava outro percentual redigitava toda vez.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS maintenance_reserve_percent NUMERIC NOT NULL DEFAULT 5;
