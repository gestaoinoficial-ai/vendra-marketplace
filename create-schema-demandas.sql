-- Migração: Criar tabelas de demandas (ordens_servico e propostas_os)
-- Necessário para o dispatch real de OS aos parceiros
-- Data: 2026-07-20

-- Tabela de Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_numero TEXT UNIQUE NOT NULL,
  cliente_nome TEXT NOT NULL,
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'normal',
  emergencial BOOLEAN NOT NULL DEFAULT false,
  valor_estimado NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'enviada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Propostas de OS (uma por parceiro notificado)
CREATE TABLE IF NOT EXISTS propostas_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  parceiro_id UUID NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enviada',
  distancia_km NUMERIC(6, 2),
  enviada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  respondida_em TIMESTAMP WITH TIME ZONE,
  motivo_recusa TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_lat_lng ON ordens_servico(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_propostas_os_os_id ON propostas_os(os_id);
CREATE INDEX IF NOT EXISTS idx_propostas_os_parceiro_id ON propostas_os(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_propostas_os_status ON propostas_os(status);

-- Trigger de atualizado_em para ordens_servico
CREATE OR REPLACE FUNCTION update_ordens_servico_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ordens_servico_atualizado_em ON ordens_servico;

CREATE TRIGGER trigger_ordens_servico_atualizado_em
  BEFORE UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION update_ordens_servico_atualizado_em();

-- RLS: leitura/escrita pública via anon key (protótipo de demonstração)
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas_os ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on ordens_servico" ON ordens_servico;
CREATE POLICY "Allow all on ordens_servico" ON ordens_servico
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on propostas_os" ON propostas_os;
CREATE POLICY "Allow all on propostas_os" ON propostas_os
  FOR ALL USING (true) WITH CHECK (true);

-- Comentários descritivos
COMMENT ON TABLE ordens_servico IS 'Ordens de serviço criadas pelo painel Vendra';
COMMENT ON TABLE propostas_os IS 'Propostas de OS enviadas a cada parceiro dentro do raio de dispatch';
COMMENT ON COLUMN propostas_os.distancia_km IS 'Distância calculada via Haversine entre o parceiro e a OS';
COMMENT ON COLUMN propostas_os.expira_em IS 'Timestamp de expiração do timer de aceite (20 minutos após envio)';
