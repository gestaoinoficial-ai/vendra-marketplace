/**
 * ⚠️ VERSÃO DE DEMONSTRAÇÃO — NÃO É A TELA DE PRODUÇÃO ⚠️
 *
 * Criada só para a apresentação visual ao Anderson (peça de demonstração da
 * visão de produto). NÃO confundir com PropostasParceirosPage.jsx, que é a
 * tela real usada pelos parceiros de verdade.
 *
 * O que é REAL aqui (conectado ao Supabase):
 *   - A demanda pendente exibida no card 1 (busca a proposta real do
 *     parceiro de teste logado, igual à tela de produção)
 *   - Os botões Aceitar/Recusar desse card 1 chamam as mesmas funções reais
 *     usadas em produção (aceitar_proposta via RPC, update de propostas_os)
 *
 * O que é FICTÍCIO/HARDCODED aqui (sem lógica de negócio, sem Supabase):
 *   - O timer de contagem regressiva (visual apenas — não lê nem escreve
 *     expira_em no banco, é só um contador local que reinicia sozinho)
 *   - O card "Em Execução" inteiro (dados de uma OS fictícia, campo de
 *     prazo e área de upload são só visuais — não fazem upload de nada)
 *   - A seção "Biblioteca" (itens fixos, sem links funcionais)
 *   - A seção "Seu Painel" (números fixos, não calculados de dado real)
 *
 * Este arquivo foi feito pra ser fácil de apagar depois da apresentação
 * sem afetar nada em produção: não é importado por nenhuma outra página
 * real, e a rota /parceiro/demo não aparece em nenhum menu.
 */
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  Star,
  Timer,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/Common/Button'
import { formatDate } from '../../utils/formatters'

// ─── Dados 100% fictícios — não vêm do banco ──────────────────────────────

const BIBLIOTECA_DEMO = [
  { titulo: 'Padrão de Vistoria', descricao: 'Guia oficial de execução', icon: ClipboardList },
  { titulo: 'Checklist Fotográfico', descricao: 'O que fotografar em cada etapa', icon: FileText },
  { titulo: 'Modelo de Relatório', descricao: 'Template padrão para envio', icon: BookOpen },
  { titulo: 'Treinamento Inicial', descricao: 'Vídeo de onboarding', icon: GraduationCap },
]

const PAINEL_DEMO = {
  osConcluidas: 34,
  valorAcumulado: 'R$ 81,6k',
  avaliacao: '5,0',
}

const EM_EXECUCAO_DEMO = {
  numero_os: 'OS-2041',
  cliente: 'Bradesco',
  endereco: 'Agência Campinas Norte',
  prazo: 'Hoje, até 18h',
}

// ─── Timer visual fake (não lê/escreve expira_em real) ────────────────────

function useFakeCountdown(startMinutes = 20) {
  const [secondsLeft, setSecondsLeft] = useState(startMinutes * 60)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 0 ? startMinutes * 60 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [startMinutes])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// ─── Card 1: demanda pendente (dado real + timer/textos de demo) ──────────

async function fetchPendenteReal(parceiroId) {
  const { data: propostas, error } = await supabase
    .from('propostas_os')
    .select('*')
    .eq('parceiro_id', parceiroId)
    .eq('status', 'enviada')
    .order('enviada_em', { ascending: false })
    .limit(1)
  if (error) throw error
  if (!propostas || propostas.length === 0) return null

  const proposta = propostas[0]
  const { data: os, error: osError } = await supabase
    .from('ordens_servico')
    .select('*')
    .eq('id', proposta.os_id)
    .single()
  if (osError) throw osError

  let clienteNome = '—'
  if (os.cliente_id) {
    const { data: cliente } = await supabase.from('clientes').select('nome').eq('id', os.cliente_id).maybeSingle()
    clienteNome = cliente?.nome ?? '—'
  }

  return { ...proposta, os: { ...os, clienteNome } }
}

function CardPendente({ parceiroId, onReload }) {
  const [proposta, setProposta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const countdown = useFakeCountdown(20)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchPendenteReal(parceiroId)
        if (!cancelled) setProposta(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [parceiroId])

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action()
      onReload?.()
      setProposta(await fetchPendenteReal(parceiroId))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAceitar() {
    // Função real de produção — não é fake.
    const { error: rpcError } = await supabase.rpc('aceitar_proposta', { p_proposta_id: proposta.id })
    if (rpcError) throw new Error(rpcError.message)
  }

  async function handleRecusar() {
    const { error: updateError } = await supabase
      .from('propostas_os')
      .update({ status: 'recusada', respondida_em: new Date().toISOString(), motivo_recusa: 'Recusada pelo parceiro' })
      .eq('id', proposta.id)
    if (updateError) throw new Error(updateError.message)
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center gap-2 p-12 text-slate">
        <Loader2 size={20} className="animate-spin" />
        Carregando demanda...
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="card p-6 text-center text-slate">
        Nenhuma demanda pendente no momento para o parceiro de teste.
        <br />
        <span className="text-xs">
          (peça pra resetar a proposta de teste no banco antes da apresentação, se quiser mostrar este card)
        </span>
      </div>
    )
  }

  const os = proposta.os

  return (
    <div className="card overflow-hidden border-2 border-danger">
      <div className="flex items-center justify-between bg-danger/10 px-5 py-3">
        <p className="text-sm font-semibold text-danger">🔴 Demanda emergencial</p>
        <div className="flex items-center gap-1.5 text-danger">
          <Timer size={16} />
          <span className="font-rajdhani text-xl font-bold tabular-nums">{countdown}</span>
          <span className="text-xs">min. para aceitar</span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-rajdhani text-lg font-semibold text-navy">
          {os.numero_os} · {os.tipo_servico === 'vistoria' ? 'Vistoria emergencial' : os.tipo_servico}
        </h3>
        <p className="mb-1 text-sm text-slate">
          🏢 {os.clienteNome} · 📍 {os.endereco_completo || '—'}
        </p>
        <p className="mb-3 text-xs text-slate">{formatDate(os.data_criacao)}</p>

        {os.descricao && (
          <div className="mb-4 rounded-lg bg-steel/10 p-3 text-sm">
            <p className="mb-1 font-medium text-navy">📋 Instruções</p>
            <p className="text-xs text-slate">{os.descricao}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={() => run(handleAceitar)} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Aceitar (inicia o prazo)
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => run(handleRecusar)} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            Recusar
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
    </div>
  )
}

// ─── Card 2: "Em Execução" — 100% fictício, sem Supabase ──────────────────

function CardEmExecucao() {
  const d = EM_EXECUCAO_DEMO
  return (
    <div className="card overflow-hidden border-2 border-success">
      <div className="bg-success/10 px-5 py-3">
        <p className="text-sm font-semibold text-success">✅ Em execução</p>
      </div>

      <div className="p-5">
        <h3 className="font-rajdhani text-lg font-semibold text-navy">{d.numero_os} · Vistoria emergencial</h3>
        <p className="mb-3 text-sm text-slate">
          🏢 {d.cliente} · 📍 {d.endereco}
        </p>

        <div className="mb-4 rounded-lg bg-steel/10 p-3 text-sm">
          <p className="text-xs font-semibold uppercase text-slate">Prazo</p>
          <p className="text-navy">{d.prazo}</p>
        </div>

        {/* Área de upload — puramente visual, não envia nada de verdade.
            O upload real já existe no admin (Demandas/OS); não duplicado aqui. */}
        <button
          type="button"
          disabled
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-steel/60 p-6 text-slate opacity-80"
        >
          <UploadCloud size={28} />
          <span className="text-sm font-medium">Enviar fotos, laudo e relatório</span>
          <span className="text-xs">(ilustrativo — envio real acontece pelo admin nesta versão)</span>
        </button>
      </div>
    </div>
  )
}

// ─── Seção "Biblioteca" — 100% fictícia ────────────────────────────────────

function SecaoBiblioteca() {
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-rajdhani text-lg font-semibold text-navy">📚 Biblioteca</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BIBLIOTECA_DEMO.map(({ titulo, descricao, icon: Icon }) => (
          <div key={titulo} className="rounded-lg border border-steel/40 p-4 text-center opacity-90">
            <Icon size={22} className="mx-auto mb-2 text-gold" />
            <p className="text-sm font-medium text-navy">{titulo}</p>
            <p className="text-xs text-slate">{descricao}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Seção "Seu Painel" — 100% fictícia ────────────────────────────────────

function SecaoPainel() {
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-rajdhani text-lg font-semibold text-navy">📊 Seu Painel</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-steel/10 p-4 text-center">
          <p className="font-rajdhani text-3xl font-bold text-navy">{PAINEL_DEMO.osConcluidas}</p>
          <p className="text-xs uppercase text-slate">OS concluídas</p>
        </div>
        <div className="rounded-lg bg-steel/10 p-4 text-center">
          <p className="font-rajdhani text-3xl font-bold text-navy">{PAINEL_DEMO.valorAcumulado}</p>
          <p className="text-xs uppercase text-slate">Valor acumulado</p>
        </div>
        <div className="rounded-lg bg-steel/10 p-4 text-center">
          <p className="flex items-center justify-center gap-1 font-rajdhani text-3xl font-bold text-navy">
            <Star size={22} className="fill-gold text-gold" />
            {PAINEL_DEMO.avaliacao}
          </p>
          <p className="text-xs uppercase text-slate">Avaliação</p>
        </div>
      </div>
    </div>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────

export default function PropostasParceirosDemoPage() {
  const parceiro = useAuthStore((state) => state.parceiro)
  const [reloadKey, setReloadKey] = useState(0)
  const nome = parceiro?.nome_fantasia || parceiro?.nome_empresario || 'Parceiro'

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-2 border border-amber/40 bg-amber/10 p-3 text-sm text-amber">
        <AlertCircle size={16} className="flex-shrink-0" />
        Versão de demonstração — dados do painel/biblioteca/execução são fictícios, só o card de demanda pendente
        acima é real.
      </div>

      <div className="card bg-navy p-6 text-white">
        <p className="text-lg">👋 Olá, {nome}</p>
        <p className="text-sm text-steel">Visão do produto — Portal do Parceiro</p>
      </div>

      <CardPendente parceiroId={parceiro?.id} onReload={() => setReloadKey((k) => k + 1)} key={reloadKey} />

      <CardEmExecucao />

      <SecaoPainel />

      <SecaoBiblioteca />
    </div>
  )
}
