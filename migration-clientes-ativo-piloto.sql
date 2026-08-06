-- Filtra o dropdown de Cliente em Entrada de Demanda pros 3 clientes do
-- piloto atual, sem apagar os demais (Igreja Messiânica, Renner, Universal
-- seguem cadastrados, só não aparecem nesse formulário).
--
-- ativo_piloto é independente de status: um cliente pode estar "ativo"
-- (visível/operante no sistema como um todo) sem estar no piloto atual.
-- Pra incluir um novo cliente no piloto no futuro, basta:
--   UPDATE clientes SET ativo_piloto = true WHERE nome = '...';
-- sem precisar mexer em código nem redeployar o front-end.

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS ativo_piloto BOOLEAN NOT NULL DEFAULT false;

UPDATE clientes SET ativo_piloto = true
WHERE nome IN ('Cushman - Bradesco', 'Método - Localiza', 'Shopee');

-- Confirma resultado
SELECT nome, status, ativo_piloto FROM clientes ORDER BY nome;
