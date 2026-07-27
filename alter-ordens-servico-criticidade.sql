-- Adiciona os 4 campos de classificação da OS emergencial
-- Nullable de propósito (mesma lógica do alter-ordens-servico.sql):
-- não dá pra forçar NOT NULL numa tabela que já tem linhas sem valor
-- default. Obrigatoriedade fica a cargo do formulário.

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS criticidade TEXT,
  ADD COLUMN IF NOT EXISTS tipo_ocorrencia TEXT,
  ADD COLUMN IF NOT EXISTS grau TEXT,
  ADD COLUMN IF NOT EXISTS prognose TEXT;

ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_criticidade;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_criticidade
  CHECK (criticidade IS NULL OR criticidade IN ('manutencao_emergencial', 'manutencao_nao_emergencial'));

ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_tipo_ocorrencia;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_tipo_ocorrencia
  CHECK (tipo_ocorrencia IS NULL OR tipo_ocorrencia IN (
    'vazamento_cronico', 'vandalismo', 'incendio', 'curto_circuito',
    'inundacao', 'alagamento', 'operacao', 'acao_orgao_controlador', 'outros'
  ));

ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_grau;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_grau
  CHECK (grau IS NULL OR grau IN ('alto', 'medio', 'baixo'));

ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_prognose;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_prognose
  CHECK (prognose IS NULL OR prognose IN (
    'falta_manutencao', 'desgaste_natural', 'explosao', 'vandalismo',
    'intemperies', 'incendio', 'outros'
  ));
