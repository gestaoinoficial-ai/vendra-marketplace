-- Migração: tipos de serviço configuráveis + vínculo com clientes
-- Data: 2026-07-27

-- 1) Tabela de tipos de serviço
CREATE TABLE IF NOT EXISTS tipos_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false
);

-- 2) Relação M:N entre clientes e tipos de serviço
CREATE TABLE IF NOT EXISTS clientes_tipos_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_servico_id UUID NOT NULL REFERENCES tipos_servico(id) ON DELETE CASCADE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cliente_id, tipo_servico_id)
);

-- 3) Campos obrigatórios por combinação tipo_servico + cliente
CREATE TABLE IF NOT EXISTS template_campos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_servico_id UUID NOT NULL REFERENCES tipos_servico(id) ON DELETE CASCADE,
  campos_obrigatorios JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (cliente_id, tipo_servico_id)
);

-- Índices de apoio
CREATE INDEX IF NOT EXISTS idx_clientes_tipos_servico_cliente ON clientes_tipos_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tipos_servico_tipo ON clientes_tipos_servico(tipo_servico_id);
CREATE INDEX IF NOT EXISTS idx_template_campos_cliente_tipo ON template_campos(cliente_id, tipo_servico_id);

-- RLS: leitura pública, escrita só via SQL editor/service role por enquanto
ALTER TABLE tipos_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on tipos_servico" ON tipos_servico;
CREATE POLICY "Allow public read on tipos_servico" ON tipos_servico
  FOR SELECT USING (true);

ALTER TABLE clientes_tipos_servico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on clientes_tipos_servico" ON clientes_tipos_servico;
CREATE POLICY "Allow public read on clientes_tipos_servico" ON clientes_tipos_servico
  FOR SELECT USING (true);

ALTER TABLE template_campos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on template_campos" ON template_campos;
CREATE POLICY "Allow public read on template_campos" ON template_campos
  FOR SELECT USING (true);

-- Seed: tipos de serviço (só vistoria_emergencial ativo)
INSERT INTO tipos_servico (nome, ativo) VALUES
  ('vistoria_emergencial', true),
  ('analise_orcamento', false),
  ('gerenciamento_obra', false)
ON CONFLICT (nome) DO NOTHING;

-- Seed: clientes (Bradesco, Localiza, Shopee)
INSERT INTO clientes (nome, status)
SELECT v.nome, 'ativo'
FROM (VALUES ('Bradesco'), ('Localiza'), ('Shopee')) AS v(nome)
WHERE NOT EXISTS (SELECT 1 FROM clientes c WHERE c.nome = v.nome);

-- Seed: vincula APENAS Bradesco a vistoria_emergencial
INSERT INTO clientes_tipos_servico (cliente_id, tipo_servico_id)
SELECT c.id, t.id
FROM clientes c, tipos_servico t
WHERE c.nome = 'Bradesco' AND t.nome = 'vistoria_emergencial'
ON CONFLICT (cliente_id, tipo_servico_id) DO NOTHING;
