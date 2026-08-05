-- Migração: itens 2 e 3 da rodada de alterações (2026-08-05)
--
-- Item 2: campo "Criticidade" renomeado para "Prioridade" na UI, consolidando
-- os 3 campos de severidade que existiam no form (Prioridade radio, checkbox
-- "emergencial" e Criticidade dropdown) em um só. Mantém o NOME da coluna no
-- banco (criticidade) — só os valores aceitos mudam, de
-- manutencao_emergencial/manutencao_nao_emergencial para emergencial/normal.
-- A coluna antiga "prioridade" (radio) fica órfã no banco (front-end parou de
-- escrever nela) — não foi dropada, segue o mesmo raciocínio de não apagar
-- dado que não foi pedido para apagar.
--
-- Item 3: campo "Tipo de Ocorrência" renomeado para "Escopo da Vistoria",
-- vira dropdown fixo com 7 opções + Outros (texto livre).

-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Migra valores existentes ANTES de travar o novo CHECK
-- (senão o ALTER TABLE falha se houver linha com valor fora do novo domínio)
-- ═══════════════════════════════════════════════════════════════
UPDATE ordens_servico SET criticidade = 'emergencial' WHERE criticidade = 'manutencao_emergencial';
UPDATE ordens_servico SET criticidade = 'normal' WHERE criticidade = 'manutencao_nao_emergencial';

UPDATE ordens_servico SET tipo_ocorrencia = 'outros'
WHERE tipo_ocorrencia IS NOT NULL
  AND tipo_ocorrencia NOT IN (
    'eletrica_vandalismo', 'civil_eletrica', 'civil_vandalismo', 'eletrica_ar_condicionado',
    'civil_infiltracao', 'civil_telhado', 'eletrica_manutencao', 'outros'
  );

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: Coluna nova pro texto livre de "Outros" (item 3)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS tipo_ocorrencia_outro TEXT;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3: Atualiza os CHECK constraints pro novo domínio de valores
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_criticidade;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_criticidade
  CHECK (criticidade IS NULL OR criticidade IN ('normal', 'emergencial'));

ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_tipo_ocorrencia;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_tipo_ocorrencia
  CHECK (tipo_ocorrencia IS NULL OR tipo_ocorrencia IN (
    'eletrica_vandalismo', 'civil_eletrica', 'civil_vandalismo', 'eletrica_ar_condicionado',
    'civil_infiltracao', 'civil_telhado', 'eletrica_manutencao', 'outros'
  ));

-- ═══════════════════════════════════════════════════════════════
-- PASSO 4: Confirmar resultado
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
  AND column_name IN ('criticidade', 'tipo_ocorrencia', 'tipo_ocorrencia_outro');
