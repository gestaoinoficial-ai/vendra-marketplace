-- Correção consolidada de ordens_servico (ver conversa completa).
-- Junta num script só o fix que ainda estava pendente (colunas
-- duplicadas + RLS de clientes) com as 4 colunas novas que o
-- formulário (EntradaDemandaPage.jsx) e o dispatchService.js já
-- esperam: criticidade, tipo_ocorrencia, grau, prognose.
--
-- Confirmado via REST/anon key antes de escrever isso:
--   - os_numero e numero_os coexistem hoje (duplicata ainda não removida)
--   - clientes ainda retorna [] pra anon key (RLS sem policy)
--   - as 4 colunas novas não existem ainda (42703 em todas)
--   - tabela ordens_servico está vazia (0 linhas) — seguro alterar

-- 1) Remove colunas duplicadas de ordens_servico
--    (os_numero duplica numero_os, cliente_nome duplica cliente_id,
--    endereco duplica endereco_completo, emergencial é redundante
--    porque prioridade já aceita o valor 'emergencial', created_at
--    duplica data_criacao, atualizado_em duplica updated_at)
ALTER TABLE ordens_servico
  DROP COLUMN IF EXISTS os_numero,
  DROP COLUMN IF EXISTS cliente_nome,
  DROP COLUMN IF EXISTS endereco,
  DROP COLUMN IF EXISTS emergencial,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS atualizado_em;

-- 2) Adiciona as 4 colunas novas do formulário
--    Nullable por enquanto (mesmo raciocínio das outras: a
--    obrigatoriedade já é garantida no frontend, e a tabela está
--    vazia então não há risco de quebrar nada de qualquer forma).
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS criticidade TEXT,
  ADD COLUMN IF NOT EXISTS tipo_ocorrencia TEXT,
  ADD COLUMN IF NOT EXISTS grau TEXT,
  ADD COLUMN IF NOT EXISTS prognose TEXT;

-- 3) Habilita leitura pública (anon) de clientes ativos
--    Sem isso, o SELECT retorna [] silenciosamente (mesmo padrão
--    já visto em parceiros antes do fix-rls-parceiros.sql).
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on clientes ativos" ON clientes;

CREATE POLICY "Allow public read on clientes ativos" ON clientes
  FOR SELECT
  USING (status = 'ativo');

-- 4) Confirma o resultado final das colunas de ordens_servico
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
ORDER BY ordinal_position;
