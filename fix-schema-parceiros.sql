-- Migração: Adicionar colunas faltantes na tabela parceiros
-- Gerado para import-engenheiros.js
-- Data: 2026-07-20

ALTER TABLE parceiros
  -- Informações profissionais
  ADD COLUMN IF NOT EXISTS crea_cau TEXT,

  -- Localização
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),

  -- Status e disponibilidade
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT true,

  -- Campos de suporte (se ainda não existem)
  ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS raio_atuacao_km INTEGER,

  -- Timestamp para auditoria
  ADD COLUMN IF NOT EXISTS importado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_parceiros_status ON parceiros(status);
CREATE INDEX IF NOT EXISTS idx_parceiros_disponivel ON parceiros(disponivel);
CREATE INDEX IF NOT EXISTS idx_parceiros_lat_lng ON parceiros(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parceiros_especialidades ON parceiros USING GIN(especialidades);

-- Criar trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_parceiros_atualizado_em ON parceiros;

CREATE TRIGGER trigger_parceiros_atualizado_em
  BEFORE UPDATE ON parceiros
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- Comentários descritivos
COMMENT ON COLUMN parceiros.crea_cau IS 'Número de registro profissional (CREA ou CAU)';
COMMENT ON COLUMN parceiros.endereco IS 'Endereço completo do parceiro';
COMMENT ON COLUMN parceiros.latitude IS 'Latitude da localização (geocodificado)';
COMMENT ON COLUMN parceiros.longitude IS 'Longitude da localização (geocodificado)';
COMMENT ON COLUMN parceiros.disponivel IS 'Indica se o parceiro está disponível para receber demandas';
COMMENT ON COLUMN parceiros.especialidades IS 'Array de especialidades de atuação';
COMMENT ON COLUMN parceiros.raio_atuacao_km IS 'Raio máximo de atuação em quilômetros';
COMMENT ON COLUMN parceiros.importado_em IS 'Data e hora da importação original';
COMMENT ON COLUMN parceiros.atualizado_em IS 'Data e hora da última atualização';
