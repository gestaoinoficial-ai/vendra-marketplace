-- Migração: fluxo simplificado de status manual da OS (2 ações no total)
-- Substitui o ciclo anterior de avanços manuais um a um por:
--   1) Aceite (de um parceiro notificado específico, ou indicação de
--      terceiro fora da Rede Técnica)
--   2) Concluído (pula direto pra 'aceito_cliente')
-- mais um botão de Excluir OS (cancelamento com motivo, sem deletar linha).
--
-- Novo mapeamento de abas em Demandas/OS:
--   Em Aberto  -> status = 'pendente'
--   Ativas     -> status = 'aceito'
--   Concluídas -> status = 'aceito_cliente' (somente leitura, sem ações)
--
-- 'relatorio_recebido' e 'enviado_cliente' continuam válidos no CHECK
-- (não removidos — baixo risco, e relatorio_recebido_em segue sendo
-- gravado ao anexar laudo) mas deixam de ser atingidos por clique manual;
-- o status pula direto de 'aceito' pra 'aceito_cliente'.

-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Colunas novas
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS responsavel_parceiro_id UUID REFERENCES parceiros(id),
  ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_observacao TEXT,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_ordens_servico_responsavel_parceiro_id ON ordens_servico(responsavel_parceiro_id);

COMMENT ON COLUMN ordens_servico.responsavel_parceiro_id IS 'Parceiro cadastrado que efetivamente aceitou a OS (aceite manual do operador dentro de Em Aberto)';
COMMENT ON COLUMN ordens_servico.responsavel_nome IS 'Nome do responsável pela execução — preenchido para indicação/terceiro não cadastrado, ou espelha o nome do parceiro cadastrado';
COMMENT ON COLUMN ordens_servico.responsavel_observacao IS 'Observação livre sobre o responsável (usado principalmente no caso de indicação/terceiro)';
COMMENT ON COLUMN ordens_servico.motivo_cancelamento IS 'Motivo em texto livre do cancelamento da OS (ex: Cushman declinou, sem retorno)';
COMMENT ON COLUMN ordens_servico.cancelado_em IS 'Timestamp de quando a OS foi cancelada';

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: Adiciona 'cancelada' ao domínio de status
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_status;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_status
  CHECK (status IN ('pendente', 'aceito', 'relatorio_recebido', 'enviado_cliente', 'aceito_cliente', 'cancelada'));

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3: Confirmar resultado
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
  AND column_name IN (
    'responsavel_parceiro_id', 'responsavel_nome', 'responsavel_observacao',
    'motivo_cancelamento', 'cancelado_em'
  );
