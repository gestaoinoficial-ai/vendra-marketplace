-- Item 8: zera as OS fictícias/de teste, mantendo o schema intacto.
-- NÃO roda automaticamente — confira as contagens do PASSO 1 antes de
-- descomentar e rodar o PASSO 2.
--
-- Contagem checada via REST/anon key em 2026-08-05:
--   ordens_servico: 4 linhas (todas cliente_id = Bradesco, status = 'enviada',
--                   todas de teste/demo do fluxo de dispatch)
--   propostas_os:  12 linhas (propostas geradas por essas 4 OS de teste)

-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Conferir quantos registros serão apagados
-- ═══════════════════════════════════════════════════════════════
SELECT COUNT(*) AS total_ordens_servico FROM ordens_servico;
SELECT COUNT(*) AS total_propostas_os FROM propostas_os;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: Apagar (descomente as duas linhas abaixo só depois de
-- confirmar o resultado do PASSO 1)
-- ═══════════════════════════════════════════════════════════════
-- DELETE FROM propostas_os;   -- FK ON DELETE CASCADE já apagaria isso junto
--                             -- ao deletar ordens_servico, mas deixamos explícito
-- DELETE FROM ordens_servico;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3: Confirmar que zerou
-- ═══════════════════════════════════════════════════════════════
-- SELECT COUNT(*) AS total_ordens_servico FROM ordens_servico;
-- SELECT COUNT(*) AS total_propostas_os FROM propostas_os;
