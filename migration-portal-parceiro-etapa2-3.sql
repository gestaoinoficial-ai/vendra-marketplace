-- ═══════════════════════════════════════════════════════════════════════
-- Portal do Parceiro — Etapa 2 (conta de teste) + Etapa 3 (aceite atômico)
--
-- PRÉ-REQUISITO OBRIGATÓRIO antes de rodar este script:
--   No painel do Supabase → Authentication → Users → Add user, crie
--   o usuário abaixo com "Auto Confirm User" marcado (senha à sua escolha).
--   Eu não vejo nem defino essa senha.
--
--     email: parceiro.teste@vendra.app
--
-- Troque o e-mail nas duas ocorrências abaixo se preferir outro.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- PASSO 1: Confirma que o usuário de teste já existe (falha alto e claro
-- se não existir, em vez de gravar user_id = NULL silenciosamente)
-- ───────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'parceiro.teste@vendra.app';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário parceiro.teste@vendra.app não encontrado em auth.users. Crie-o em Authentication > Users (Auto Confirm User) e rode este script de novo.';
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────
-- PASSO 2: Amplia leitura pública (anon) pra incluir linhas de teste
--
-- As policies de "aprovado"/"ativo" continuam intactas — isso só ADICIONA
-- visibilidade pra status = 'teste'. Parceiros e clientes reais não mudam
-- de comportamento em nenhuma tela: RedeTecnicaPage, dispatchService e
-- EntradaDemandaPage filtram explicitamente por 'aprovado'/'ativo' no
-- código, não só na RLS — então a linha de teste continua invisível nos
-- dropdowns, no dispatch automático e nos contadores do dashboard. Só
-- fica visível onde a tela busca por ID (ex.: nome do parceiro/cliente
-- numa proposta já existente em Demandas/OS).
-- ───────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public read on parceiros aprovados" ON parceiros;
CREATE POLICY "Allow public read on parceiros aprovados" ON parceiros
  FOR SELECT
  USING (status IN ('aprovado', 'teste'));

DROP POLICY IF EXISTS "Allow public read on clientes ativos" ON clientes;
CREATE POLICY "Allow public read on clientes ativos" ON clientes
  FOR SELECT
  USING (status IN ('ativo', 'teste'));

-- ───────────────────────────────────────────────────────────────────────
-- PASSO 3: RLS do Portal do Parceiro (Etapa 1, arquivo já existente
-- migration-rls-portal-parceiro.sql, incorporado aqui pra rodar tudo de
-- uma vez só). Idempotente — seguro rodar de novo mesmo se já aplicado.
-- ───────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all on ordens_servico" ON ordens_servico;
CREATE POLICY "Allow all on ordens_servico (anon)"
  ON ordens_servico FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on ordens_servico (anon)" ON ordens_servico;
CREATE POLICY "Allow all on ordens_servico (anon)"
  ON ordens_servico FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on propostas_os" ON propostas_os;
DROP POLICY IF EXISTS "Allow all on propostas_os (anon)" ON propostas_os;
CREATE POLICY "Allow all on propostas_os (anon)"
  ON propostas_os FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Parceiro le propostas proprias" ON propostas_os;
CREATE POLICY "Parceiro le propostas proprias"
  ON propostas_os FOR SELECT TO authenticated
  USING (parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parceiro responde propostas proprias" ON propostas_os;
CREATE POLICY "Parceiro responde propostas proprias"
  ON propostas_os FOR UPDATE TO authenticated
  USING (parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid()))
  WITH CHECK (parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parceiro le OS das propostas proprias" ON ordens_servico;
CREATE POLICY "Parceiro le OS das propostas proprias"
  ON ordens_servico FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT os_id FROM propostas_os
      WHERE parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parceiro aceita OS das propostas proprias" ON ordens_servico;
CREATE POLICY "Parceiro aceita OS das propostas proprias"
  ON ordens_servico FOR UPDATE TO authenticated
  USING (
    status = 'pendente'
    AND id IN (
      SELECT os_id FROM propostas_os
      WHERE parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    status = 'aceito'
    AND id IN (
      SELECT os_id FROM propostas_os
      WHERE parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
    )
  );

-- Parceiro autenticado só lê o próprio cliente ligado às próprias OS
-- (necessário pro portal mostrar o nome do cliente na proposta)
DROP POLICY IF EXISTS "Parceiro le clientes das proprias OS" ON clientes;
CREATE POLICY "Parceiro le clientes das proprias OS" ON clientes
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT cliente_id FROM ordens_servico
      WHERE id IN (
        SELECT os_id FROM propostas_os
        WHERE parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
      )
    )
  );

-- Parceiro autenticado lê o próprio cadastro em parceiros
DROP POLICY IF EXISTS "Parceiro le proprio cadastro" ON parceiros;
CREATE POLICY "Parceiro le proprio cadastro" ON parceiros
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────────────
-- PASSO 4: Etapa 3 — função atômica de aceite
--
-- Usada tanto pelo aceite manual do admin (DemandasPage, role anon) quanto
-- pelo aceite dentro do Portal do Parceiro (role authenticated). Trava as
-- linhas com FOR UPDATE antes de checar o status: se os dois lados
-- tentarem aceitar quase ao mesmo tempo, o segundo a chegar vê a OS já
-- não-pendente (ou a proposta já respondida) DEPOIS de esperar a trava
-- liberar, e recebe um erro claro em vez de sobrescrever o resultado do
-- primeiro.
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION aceitar_proposta(p_proposta_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id UUID;
  v_parceiro_id UUID;
  v_proposta_status TEXT;
  v_os_status TEXT;
  v_parceiro_nome TEXT;
  v_authorized BOOLEAN;
BEGIN
  SELECT os_id, parceiro_id, status
    INTO v_os_id, v_parceiro_id, v_proposta_status
    FROM propostas_os
    WHERE id = p_proposta_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposta não encontrada';
  END IF;

  -- auth.uid() IS NULL => chamada feita com a anon key (admin, sem login).
  -- Caso contrário, só o parceiro dono da proposta pode aceitar a própria.
  v_authorized := (auth.uid() IS NULL) OR EXISTS (
    SELECT 1 FROM parceiros WHERE id = v_parceiro_id AND user_id = auth.uid()
  );
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Não autorizado a responder esta proposta';
  END IF;

  IF v_proposta_status <> 'enviada' THEN
    RAISE EXCEPTION 'Esta proposta já foi respondida';
  END IF;

  SELECT status INTO v_os_status FROM ordens_servico WHERE id = v_os_id FOR UPDATE;
  IF v_os_status <> 'pendente' THEN
    RAISE EXCEPTION 'Esta demanda já foi atribuída a outro parceiro';
  END IF;

  SELECT COALESCE(NULLIF(nome_fantasia, ''), nome_empresario)
    INTO v_parceiro_nome
    FROM parceiros WHERE id = v_parceiro_id;

  UPDATE propostas_os
    SET status = 'aceita', respondida_em = NOW()
    WHERE id = p_proposta_id;

  UPDATE propostas_os
    SET status = 'recusada', respondida_em = NOW(),
        motivo_recusa = 'Outro parceiro foi selecionado para a OS'
    WHERE os_id = v_os_id AND id <> p_proposta_id AND status = 'enviada';

  UPDATE ordens_servico
    SET status = 'aceito',
        data_aceita = NOW(),
        responsavel_parceiro_id = v_parceiro_id,
        responsavel_nome = v_parceiro_nome,
        responsavel_observacao = NULL
    WHERE id = v_os_id;
END;
$$;

GRANT EXECUTE ON FUNCTION aceitar_proposta(UUID) TO anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────
-- PASSO 5: Seed da conta de teste — idempotente (WHERE NOT EXISTS /
-- ON CONFLICT), seguro rodar de novo
-- ───────────────────────────────────────────────────────────────────────
INSERT INTO clientes (nome, status, ativo_piloto)
SELECT '[TESTE] Cliente Demonstração', 'teste', false
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome = '[TESTE] Cliente Demonstração');

INSERT INTO parceiros (
  nome_fantasia, nome_empresario, cpf_cnpj, email, telefone,
  especialidades, regiao_atuacao, raio_atuacao_km,
  latitude, longitude, status, disponivel, user_id
)
SELECT
  '[TESTE] Parceiro Demonstração', '[TESTE] Parceiro Demonstração',
  '000.000.000-00', 'parceiro.teste@vendra.app', '(00) 00000-0000',
  ARRAY['Teste'], 'Ambiente de Teste', 100,
  -22.3145, -49.0608, 'teste', true,
  (SELECT id FROM auth.users WHERE email = 'parceiro.teste@vendra.app')
WHERE NOT EXISTS (SELECT 1 FROM parceiros WHERE nome_fantasia = '[TESTE] Parceiro Demonstração');

-- Garante o vínculo mesmo se a linha já existia sem user_id preenchido
UPDATE parceiros
  SET user_id = (SELECT id FROM auth.users WHERE email = 'parceiro.teste@vendra.app')
  WHERE nome_fantasia = '[TESTE] Parceiro Demonstração' AND user_id IS NULL;

INSERT INTO ordens_servico (
  numero_os, cliente_id, tipo_servico, descricao, endereco_completo,
  latitude, longitude, prioridade, criticidade, tipo_ocorrencia,
  status, valor_estimado
)
SELECT
  'OS-TESTE-0001',
  (SELECT id FROM clientes WHERE nome = '[TESTE] Cliente Demonstração'),
  'vistoria',
  'OS de demonstração para testar o Portal do Parceiro — não é uma demanda real.',
  'Rua Batista de Carvalho, 1231, Centro, Bauru - SP',
  -22.3145, -49.0608, 'normal', 'normal', 'outros',
  'pendente', 500
ON CONFLICT (numero_os) DO NOTHING;

INSERT INTO propostas_os (os_id, parceiro_id, status, distancia_km, expira_em)
SELECT
  (SELECT id FROM ordens_servico WHERE numero_os = 'OS-TESTE-0001'),
  (SELECT id FROM parceiros WHERE nome_fantasia = '[TESTE] Parceiro Demonstração'),
  'enviada', 0.1,
  NOW() + INTERVAL '7 days'  -- prazo bem maior que os 20min reais, só pra não expirar durante a demo
WHERE NOT EXISTS (
  SELECT 1 FROM propostas_os
  WHERE os_id = (SELECT id FROM ordens_servico WHERE numero_os = 'OS-TESTE-0001')
    AND parceiro_id = (SELECT id FROM parceiros WHERE nome_fantasia = '[TESTE] Parceiro Demonstração')
);

-- ───────────────────────────────────────────────────────────────────────
-- PASSO 6: Confirma o resultado
-- ───────────────────────────────────────────────────────────────────────
SELECT
  p.id AS parceiro_id, p.nome_fantasia, p.user_id, p.status AS parceiro_status,
  po.id AS proposta_id, po.status AS proposta_status, po.expira_em,
  os.numero_os, os.status AS os_status, c.nome AS cliente_nome
FROM parceiros p
JOIN propostas_os po ON po.parceiro_id = p.id
JOIN ordens_servico os ON os.id = po.os_id
JOIN clientes c ON c.id = os.cliente_id
WHERE p.nome_fantasia = '[TESTE] Parceiro Demonstração';
