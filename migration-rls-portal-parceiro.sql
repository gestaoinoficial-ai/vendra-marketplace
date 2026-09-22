-- Migração: RLS para o Portal do Parceiro (Etapa 1)
--
-- Contexto: até aqui, "Allow all on ordens_servico" e "Allow all on
-- propostas_os" valiam pra QUALQUER conexão (role default = public, que
-- cobre tanto anon quanto authenticated). O admin nunca loga (usa só a
-- anon key, role = anon) — isso não muda nesse MVP. O parceiro, a partir
-- de agora, loga via Supabase Auth (Etapa 1), e suas requisições passam a
-- carregar um JWT próprio, virando role = authenticated.
--
-- Estratégia: restringir as policies "Allow all" pra valerem só pra role
-- anon (admin continua 100% como está, zero mudança de comportamento) e
-- criar policies novas, escopadas por parceiro, só pra role authenticated.
-- Como policies permissivas se combinam por OR, isso isola de verdade o
-- parceiro logado sem tocar no fluxo do admin.

-- ═══════════════════════════════════════════════════════════════
-- PASSO 1: Restringe as policies existentes pra role anon (admin)
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Allow all on ordens_servico" ON ordens_servico;
CREATE POLICY "Allow all on ordens_servico (anon)"
  ON ordens_servico
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on propostas_os" ON propostas_os;
CREATE POLICY "Allow all on propostas_os (anon)"
  ON propostas_os
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- PASSO 2: propostas_os — parceiro logado só vê/responde as próprias
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Parceiro le propostas proprias"
  ON propostas_os
  FOR SELECT
  TO authenticated
  USING (
    parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
  );

CREATE POLICY "Parceiro responde propostas proprias"
  ON propostas_os
  FOR UPDATE
  TO authenticated
  USING (
    parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
  )
  WITH CHECK (
    parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- PASSO 3: ordens_servico — parceiro logado só vê OS ligada a uma
-- proposta própria, e só pode fazer a transição pendente -> aceito
-- (aceite dentro do portal). Concluir/cancelar/demais campos
-- continuam exclusivos do admin (role anon).
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Parceiro le OS das propostas proprias"
  ON ordens_servico
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT os_id FROM propostas_os
      WHERE parceiro_id IN (SELECT id FROM parceiros WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Parceiro aceita OS das propostas proprias"
  ON ordens_servico
  FOR UPDATE
  TO authenticated
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

-- ═══════════════════════════════════════════════════════════════
-- PASSO 4: Confirmar resultado
-- ═══════════════════════════════════════════════════════════════
SELECT pol.polname, pol.polrelid::regclass AS tabela, pol.polcmd,
       ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(pol.polroles)) AS roles
FROM pg_policy pol
WHERE pol.polrelid IN ('ordens_servico'::regclass, 'propostas_os'::regclass)
ORDER BY tabela, pol.polname;
