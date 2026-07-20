-- Migração: Habilitar leitura pública (anon) na tabela parceiros
-- Sem uma policy de SELECT, RLS bloqueia silenciosamente (0 linhas, sem erro)
-- Data: 2026-07-20

ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on parceiros aprovados" ON parceiros;

CREATE POLICY "Allow public read on parceiros aprovados" ON parceiros
  FOR SELECT
  USING (status = 'aprovado');

-- Observação: escrita (INSERT/UPDATE/DELETE) continua restrita à service_role key,
-- usada pelo script de importação (import-engenheiros.js). O frontend (anon key)
-- só tem permissão de leitura em parceiros com status = 'aprovado'.
