-- Remove tudo que foi criado por migration-portal-parceiro-etapa2-3.sql.
-- Não toca em nenhum parceiro/cliente/OS real — filtra só pelas marcas
-- de teste (nome_fantasia / nome). Rode depois da demonstração.
--
-- O usuário do Auth (parceiro.teste@vendra.app) precisa ser removido à
-- parte, em Authentication > Users no painel do Supabase.

DELETE FROM propostas_os
WHERE parceiro_id IN (SELECT id FROM parceiros WHERE nome_fantasia = '[TESTE] Parceiro Demonstração');

DELETE FROM ordens_servico WHERE numero_os = 'OS-TESTE-0001';

DELETE FROM parceiros WHERE nome_fantasia = '[TESTE] Parceiro Demonstração';

DELETE FROM clientes WHERE nome = '[TESTE] Cliente Demonstração';

-- Confirma que não sobrou nada
SELECT
  (SELECT COUNT(*) FROM parceiros WHERE nome_fantasia = '[TESTE] Parceiro Demonstração') AS parceiros_teste,
  (SELECT COUNT(*) FROM clientes WHERE nome = '[TESTE] Cliente Demonstração') AS clientes_teste,
  (SELECT COUNT(*) FROM ordens_servico WHERE numero_os = 'OS-TESTE-0001') AS os_teste;
