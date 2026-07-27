-- ═══════════════════════════════════════════════════════════════
-- DIAGNÓSTICO COMPLETO — ordens_servico
-- Somente leitura. Rode as 4 queries e cole os resultados de volta.
-- ═══════════════════════════════════════════════════════════════

-- 1) TODAS as colunas, com tipo, nullability e default
SELECT
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
ORDER BY ordinal_position;

-- 2) TODAS as constraints (PK, UNIQUE, FK, CHECK) via pg_constraint
--    (mais confiável que information_schema pra isso)
SELECT
  conname AS constraint_name,
  contype AS constraint_type, -- p=primary key, u=unique, f=foreign key, c=check
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.ordens_servico'::regclass
ORDER BY contype;

-- 3) TODOS os índices na tabela
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'ordens_servico';

-- 4) Quantas linhas existem hoje, e quantas têm numero_os / os_numero
--    preenchidos (só roda sem erro se as colunas existirem — se der
--    erro "column does not exist" numa das duas, é sinal de que só
--    uma delas existe de fato)
SELECT COUNT(*) AS total_linhas FROM ordens_servico;
