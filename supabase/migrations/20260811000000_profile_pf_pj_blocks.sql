-- Fase 2: blocos PF e PJ simultâneos no perfil.
-- Mantém as colunas legadas para não quebrar código que ainda as lê, e
-- migra os dados existentes para o bloco correspondente ao entity_type.

ALTER TABLE public.profiles
  -- Bloco Pessoa Jurídica
  ADD COLUMN IF NOT EXISTS pj_razao_social    TEXT,
  ADD COLUMN IF NOT EXISTS pj_nome_fantasia   TEXT,
  ADD COLUMN IF NOT EXISTS pj_cnpj            TEXT,
  ADD COLUMN IF NOT EXISTS pj_inscricao_municipal TEXT,
  ADD COLUMN IF NOT EXISTS pj_inscricao_estadual  TEXT,
  ADD COLUMN IF NOT EXISTS pj_address         TEXT,
  ADD COLUMN IF NOT EXISTS pj_city            TEXT,
  ADD COLUMN IF NOT EXISTS pj_state           TEXT,
  ADD COLUMN IF NOT EXISTS pj_cep             TEXT,
  ADD COLUMN IF NOT EXISTS pj_email           TEXT,
  ADD COLUMN IF NOT EXISTS pj_phone           TEXT,
  -- Bloco Pessoa Física
  ADD COLUMN IF NOT EXISTS pf_full_name       TEXT,
  ADD COLUMN IF NOT EXISTS pf_cpf             TEXT,
  ADD COLUMN IF NOT EXISTS pf_rg              TEXT,
  ADD COLUMN IF NOT EXISTS pf_address         TEXT,
  ADD COLUMN IF NOT EXISTS pf_city            TEXT,
  ADD COLUMN IF NOT EXISTS pf_state           TEXT,
  ADD COLUMN IF NOT EXISTS pf_cep             TEXT,
  ADD COLUMN IF NOT EXISTS pf_email           TEXT,
  ADD COLUMN IF NOT EXISTS pf_phone           TEXT,
  -- Emissor padrão de contratos/recibos
  ADD COLUMN IF NOT EXISTS default_issuer     TEXT NOT NULL DEFAULT 'PF';

-- Migração de dados: quem tem entity_type PJ ou MEI vai para o bloco PJ;
-- quem tem PF (ou nulo) vai para o bloco PF.
UPDATE public.profiles
SET
  pj_razao_social  = CASE WHEN entity_type IN ('PJ', 'MEI') THEN legal_name  ELSE pj_razao_social END,
  pj_cnpj          = CASE WHEN entity_type IN ('PJ', 'MEI') THEN cpf_cnpj    ELSE pj_cnpj         END,
  pj_inscricao_municipal = CASE WHEN entity_type IN ('PJ', 'MEI') THEN inscricao_municipal ELSE pj_inscricao_municipal END,
  pj_inscricao_estadual  = CASE WHEN entity_type IN ('PJ', 'MEI') THEN inscricao_estadual  ELSE pj_inscricao_estadual  END,
  pj_address       = CASE WHEN entity_type IN ('PJ', 'MEI') THEN address     ELSE pj_address      END,
  pj_city          = CASE WHEN entity_type IN ('PJ', 'MEI') THEN city        ELSE pj_city         END,
  pj_state         = CASE WHEN entity_type IN ('PJ', 'MEI') THEN state       ELSE pj_state        END,
  pj_cep           = CASE WHEN entity_type IN ('PJ', 'MEI') THEN cep         ELSE pj_cep          END,
  pj_email         = CASE WHEN entity_type IN ('PJ', 'MEI') THEN email       ELSE pj_email        END,
  pj_phone         = CASE WHEN entity_type IN ('PJ', 'MEI') THEN phone       ELSE pj_phone        END,
  pf_full_name     = CASE WHEN entity_type = 'PF' THEN legal_name ELSE pf_full_name END,
  pf_cpf           = CASE WHEN entity_type = 'PF' THEN cpf_cnpj   ELSE pf_cpf       END,
  pf_address       = CASE WHEN entity_type = 'PF' THEN address    ELSE pf_address   END,
  pf_city          = CASE WHEN entity_type = 'PF' THEN city       ELSE pf_city      END,
  pf_state         = CASE WHEN entity_type = 'PF' THEN state      ELSE pf_state     END,
  pf_cep           = CASE WHEN entity_type = 'PF' THEN cep        ELSE pf_cep       END,
  pf_email         = CASE WHEN entity_type = 'PF' THEN email      ELSE pf_email     END,
  pf_phone         = CASE WHEN entity_type = 'PF' THEN phone      ELSE pf_phone     END,
  -- Emissor padrão: quem é PJ ou MEI emite pela PJ por padrão
  default_issuer   = CASE WHEN entity_type IN ('PJ', 'MEI') THEN 'PJ' ELSE 'PF' END;
