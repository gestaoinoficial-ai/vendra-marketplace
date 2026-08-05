-- Item 1: Cushman/Método passam a aparecer no rótulo do cliente, já que são
-- as intermediárias que de fato acionam a Vendra (Cushman gerencia a demanda
-- do Bradesco, Método gerencia a demanda da Localiza). Shopee segue sem
-- intermediária confirmada.
--
-- Confirmado via REST/anon key em 2026-08-05: a linha "Cushman" solta
-- (id 58f4238c-7080-419e-b4b7-215bcc55bc5d, segmento "Facilities") não tem
-- nenhuma ordens_servico vinculada — seguro apagar.
--
-- Rode o PASSO 1 primeiro pra conferir os ids antes de aplicar.

-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Conferir estado atual
-- ═══════════════════════════════════════════════════════════════
SELECT id, nome, status FROM clientes ORDER BY nome;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: Aplicar
-- ═══════════════════════════════════════════════════════════════
UPDATE clientes SET nome = 'Cushman - Bradesco' WHERE id = 'ba6e566b-7085-4c36-8183-9f2b57bbed1a';
UPDATE clientes SET nome = 'Método - Localiza' WHERE id = '46606579-6feb-4868-921c-1f8e4e8b60c5';

-- Remove a linha "Cushman" solta (duplicava o nome sem vínculo com Bradesco)
DELETE FROM clientes WHERE id = '58f4238c-7080-419e-b4b7-215bcc55bc5d';

-- Shopee, Renner, Igreja Messiânica e Universal ficam como estão —
-- não foram mencionados no pedido de alteração.

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3: Confirmar resultado
-- ═══════════════════════════════════════════════════════════════
SELECT id, nome, status FROM clientes ORDER BY nome;
