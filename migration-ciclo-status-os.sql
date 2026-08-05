-- Migração: itens 6 e 7 da rodada de alterações (2026-08-05)
--
-- Item 6: ciclo completo de status manual da OS —
--   Pendente -> Aceito -> Relatório Recebido -> Enviado ao Cliente -> Aceito pelo Cliente
-- Cada avanço de status grava um timestamp automático (sem UI extra), pra
-- permitir calcular tempo de ciclo por etapa no futuro.
--   - Pendente:            já coberto por data_criacao (existente)
--   - Aceito:               reaproveita data_aceita (coluna já existia no banco,
--                           criada fora dos scripts deste repo, mas nunca usada
--                           pelo front-end até agora)
--   - Relatório Recebido:  relatorio_recebido_em (nova)
--   - Enviado ao Cliente:  enviado_cliente_em (nova)
--   - Aceito pelo Cliente: aceito_cliente_em (nova)
--
-- Item 7: relatorio_url guarda o link do arquivo anexado pelo Bozza (upload
-- feito pelo front-end pro bucket de storage "relatorios-os" — ver nota no
-- final deste arquivo sobre criar o bucket manualmente).
--
-- IMPORTANTE sobre visualização (item 6): a OS que chega em "Aceito pelo
-- Cliente" NÃO é movida nem arquivada — ela continua na mesma tabela
-- ordens_servico pra sempre. A tela Demandas/OS separa "Ativas" de
-- "Concluídas" via filtro de query (status <> 'aceito_cliente' vs.
-- status = 'aceito_cliente'), implementado em DemandasPage.jsx.

-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Colunas novas
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS relatorio_recebido_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS enviado_cliente_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS aceito_cliente_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS relatorio_url TEXT;

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: Migra os status antigos pro novo ciclo ANTES de travar o CHECK
-- (rode isso só depois de já ter zerado as OS de teste com
-- cleanup-os-teste.sql — se ainda houver OS reais em status antigo,
-- confira o mapeamento abaixo antes de aplicar)
-- ═══════════════════════════════════════════════════════════════
UPDATE ordens_servico SET status = 'pendente' WHERE status IN ('nova', 'enviada');
UPDATE ordens_servico SET status = 'aceito' WHERE status IN ('aceita', 'em_andamento');
UPDATE ordens_servico SET status = 'aceito_cliente' WHERE status = 'concluida';
-- 'cancelada', 'em_revisao', 'atrasada' não têm equivalente direto no novo
-- ciclo de 5 estados. Se a query abaixo retornar alguma linha, decida
-- manualmente o mapeamento antes de aplicar o CHECK do PASSO 3.
SELECT id, numero_os, status FROM ordens_servico
WHERE status NOT IN ('pendente', 'aceito', 'relatorio_recebido', 'enviado_cliente', 'aceito_cliente');

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3: Trava o domínio de valores de status e ajusta o default
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_ordens_servico_status;
ALTER TABLE ordens_servico ADD CONSTRAINT chk_ordens_servico_status
  CHECK (status IN ('pendente', 'aceito', 'relatorio_recebido', 'enviado_cliente', 'aceito_cliente'));

ALTER TABLE ordens_servico ALTER COLUMN status SET DEFAULT 'pendente';

CREATE INDEX IF NOT EXISTS idx_ordens_servico_status_ciclo ON ordens_servico(status);

-- ═══════════════════════════════════════════════════════════════
-- PASSO 4: Confirmar resultado
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ordens_servico'
  AND column_name IN ('status', 'data_aceita', 'relatorio_recebido_em', 'enviado_cliente_em', 'aceito_cliente_em', 'relatorio_url');

-- ═══════════════════════════════════════════════════════════════
-- PASSO 5: Storage bucket do item 7 (anexo do relatório)
-- storage.objects tem RLS habilitado por padrão e SEM NENHUMA policy —
-- isso bloqueia até a anon key. A policy abaixo replica o mesmo nível de
-- exposição que o resto do app já tem hoje (RLS "allow all" nas tabelas
-- ordens_servico/propostas_os/parceiros/clientes). Aperte depois se quiser
-- trocar por bucket privado + signed URLs.
-- ═══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('relatorios-os', 'relatorios-os', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow all on relatorios-os bucket" ON storage.objects;
CREATE POLICY "Allow all on relatorios-os bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'relatorios-os') WITH CHECK (bucket_id = 'relatorios-os');
