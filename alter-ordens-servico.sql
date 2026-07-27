-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Inspecionar colunas atuais de ordens_servico
-- Rode isso primeiro e confira o resultado antes de seguir.
-- ═══════════════════════════════════════════════════════════════

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: Adicionar colunas que faltam (idempotente, não apaga dados)
--
-- ADD COLUMN IF NOT EXISTS só cria a coluna se ela ainda não existir —
-- rodar de novo não faz nada nas colunas já presentes.
--
-- Propositalmente SEM "NOT NULL" e SEM "UNIQUE" nas colunas que a
-- tabela nova pede como obrigatórias (os_numero, cliente_nome,
-- tipo_servico, endereco, latitude, longitude): se já existem linhas
-- na tabela, adicionar uma coluna NOT NULL sem valor padrão quebra
-- o ALTER TABLE (ou deixaria linhas antigas com violação). Ficam
-- nullable por segurança — a validação de obrigatoriedade continua
-- sendo feita pelo formulário no frontend, e dá pra apertar essas
-- constraints depois de confirmar/backfillar os dados antigos.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS os_numero TEXT,
  ADD COLUMN IF NOT EXISTS cliente_nome TEXT,
  ADD COLUMN IF NOT EXISTS tipo_servico TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS emergencial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'enviada',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3 (opcional, rode só depois de checar que não há linhas com
-- os_numero repetido ou nulo): garante unicidade de os_numero para
-- novas OS. Pule este passo se o SELECT abaixo retornar alguma linha.
-- ═══════════════════════════════════════════════════════════════

-- Verifica se há valores nulos ou duplicados em os_numero antes de
-- tentar criar o índice único:
SELECT os_numero, COUNT(*)
FROM ordens_servico
WHERE os_numero IS NOT NULL
GROUP BY os_numero
HAVING COUNT(*) > 1;

-- Se a query acima não retornou nada, é seguro rodar:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_ordens_servico_os_numero_unique
--   ON ordens_servico(os_numero) WHERE os_numero IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 4: Confirma o resultado final
-- ═══════════════════════════════════════════════════════════════

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
ORDER BY ordinal_position;
