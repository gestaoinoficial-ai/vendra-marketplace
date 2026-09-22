import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MapPin, RefreshCw, XCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useAuthStore } from '../../store/authStore'
import StatusBadge from '../../components/Common/StatusBadge'
import Button from '../../components/Common/Button'
import { CRITICIDADE_OPTIONS, PROPOSTA_STATUS, TIPO_OCORRENCIA_OPTIONS } from '../../utils/constants'
import { formatDate, optionLabel } from '../../utils/formatters'
import { getEngineerLocation, haversineDistance } from '../../services/geocodingService'

function proposalEffectiveStatus(proposta) {
  const isExpired = proposta.status === 'enviada' && proposta.expira_em && new Date(proposta.expira_em) < new Date()
  return isExpired ? 'expirada' : proposta.status
}

function tipoOcorrenciaLabel(os) {
  return os.tipo_ocorrencia === 'outros' && os.tipo_ocorrencia_outro
    ? os.tipo_ocorrencia_outro
    : optionLabel(TIPO_OCORRENCIA_OPTIONS, os.tipo_ocorrencia)
}

async function fetchPropostas(parceiroId) {
  const { data: propostas, error } = await supabase
    .from('propostas_os')
    .select('*')
    .eq('parceiro_id', parceiroId)
    .order('enviada_em', { ascending: false })
  if (error) throw error

  const osIds = [...new Set(propostas.map((p) => p.os_id))]
  const { data: ordens, error: ordensError } =
    osIds.length > 0 ? await supabase.from('ordens_servico').select('*').in('id', osIds) : { data: [], error: null }
  if (ordensError) throw ordensError
  const ordensMap = new Map(ordens.map((o) => [o.id, o]))

  const clienteIds = [...new Set(ordens.map((o) => o.cliente_id).filter(Boolean))]
  const { data: clientes, error: clientesError } =
    clienteIds.length > 0
      ? await supabase.from('clientes').select('id, nome').in('id', clienteIds)
      : { data: [], error: null }
  if (clientesError) throw clientesError
  const clientesMap = new Map(clientes.map((c) => [c.id, c.nome]))

  return propostas
    .map((p) => {
      const os = ordensMap.get(p.os_id)
      // RLS já restringe a leitura à própria OS/proposta; se a OS não
      // veio (ex.: linha removida), a proposta fica órfã e é descartada.
      return os ? { ...p, os: { ...os, clienteNome: clientesMap.get(os.cliente_id) ?? '—' } } : null
    })
    .filter(Boolean)
}

function ProposalCard({ proposta, engineerLocation, onAceitar, onRecusar }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const os = proposta.os
  const status = proposalEffectiveStatus(proposta)
  const podeResponder = status === 'enviada'

  const distanciaKm =
    engineerLocation && os.latitude != null && os.longitude != null
      ? haversineDistance(engineerLocation, { lat: os.latitude, lng: os.longitude })
      : null

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-rajdhani text-lg font-semibold text-navy">{os.numero_os}</h3>
          <p className="text-xs text-slate">{formatDate(os.data_criacao)}</p>
        </div>
        <StatusBadge statusKey={status} statusMap={PROPOSTA_STATUS} />
      </div>

      <p className="mb-1 text-sm text-slate">
        🏢 {os.clienteNome} · 📍 {os.endereco_completo || '—'}
      </p>
      {distanciaKm != null ? (
        <p className="mb-3 flex items-center gap-1 text-xs text-slate">
          <MapPin size={12} />A {distanciaKm.toFixed(1)} km de você
        </p>
      ) : (
        <p className="mb-3 text-xs text-slate">📍 Distância não disponível (ative o GPS)</p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-semibold uppercase text-slate">Prioridade</p>
          <p className="text-navy">{optionLabel(CRITICIDADE_OPTIONS, os.criticidade)}</p>
        </div>
        <div>
          <p className="font-semibold uppercase text-slate">Escopo</p>
          <p className="text-navy">{tipoOcorrenciaLabel(os)}</p>
        </div>
      </div>

      {os.descricao && (
        <div className="mb-4 rounded-lg bg-steel/10 p-3 text-sm">
          <p className="mb-1 font-medium text-navy">Descrição</p>
          <p className="text-xs text-slate">{os.descricao}</p>
        </div>
      )}

      {podeResponder && (
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => run(() => onAceitar(proposta))}
            disabled={busy}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Aceitar
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => run(() => onRecusar(proposta))}
            disabled={busy}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            Recusar
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}

export default function PropostasParceirosPage() {
  const parceiro = useAuthStore((state) => state.parceiro)
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pendentes')
  const [engineerLocation, setEngineerLocation] = useState(null)
  const [gpsError, setGpsError] = useState('')

  async function loadData() {
    if (!parceiro) return
    setLoading(true)
    setError('')
    try {
      setPropostas(await fetchPropostas(parceiro.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parceiro?.id])

  useEffect(() => {
    getEngineerLocation()
      .then(setEngineerLocation)
      .catch(() => setGpsError('Ative o GPS para ver a distância até as demandas'))
  }, [])

  async function handleAceitar(proposta) {
    // Mesma função de banco usada pelo aceite manual do admin (Demandas/OS) —
    // trava a OS/proposta e evita os dois lados aceitarem a mesma demanda.
    const { error: rpcError } = await supabase.rpc('aceitar_proposta', { p_proposta_id: proposta.id })
    if (rpcError) throw new Error(rpcError.message)
    await loadData()
  }

  async function handleRecusar(proposta) {
    const { error: updateError } = await supabase
      .from('propostas_os')
      .update({ status: 'recusada', respondida_em: new Date().toISOString(), motivo_recusa: 'Recusada pelo parceiro' })
      .eq('id', proposta.id)
    if (updateError) throw new Error(updateError.message)
    await loadData()
  }

  const pendentes = propostas.filter((p) => proposalEffectiveStatus(p) === 'enviada')
  const aceitas = propostas.filter((p) => p.status === 'aceita')
  const recusadas = propostas.filter((p) => proposalEffectiveStatus(p) !== 'enviada' && p.status !== 'aceita')
  const realizadas = aceitas.filter((p) => p.os.status === 'aceito_cliente').length

  const nome = parceiro?.nome_fantasia || parceiro?.nome_empresario || 'Parceiro'
  const listaAtual = tab === 'pendentes' ? pendentes : tab === 'aceitas' ? aceitas : recusadas

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 bg-navy p-6 text-white">
        <div>
          <p className="text-lg">👋 Olá, {nome}</p>
          <p className="text-sm text-steel">
            {pendentes.length} demanda{pendentes.length !== 1 ? 's' : ''} aguardando seu aceite ·{' '}
            {realizadas} demanda{realizadas !== 1 ? 's' : ''} realizada{realizadas !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {gpsError && (
        <div className="card flex gap-3 border border-amber/30 bg-amber/10 p-4">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-amber" />
          <p className="text-sm text-amber">{gpsError}</p>
        </div>
      )}

      {!loading && error && (
        <div className="card flex gap-3 border border-danger/30 bg-danger/10 p-4">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-danger" />
          <p className="text-sm text-danger">Erro ao carregar propostas: {error}</p>
        </div>
      )}

      <div className="border-b border-steel/30 flex gap-4">
        <button
          onClick={() => setTab('pendentes')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            tab === 'pendentes' ? 'border-b-2 border-gold text-gold' : 'text-slate hover:text-navy'
          }`}
        >
          📋 Pendentes ({pendentes.length})
        </button>
        <button
          onClick={() => setTab('aceitas')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            tab === 'aceitas' ? 'border-b-2 border-success text-success' : 'text-slate hover:text-navy'
          }`}
        >
          ✅ Aceitas ({aceitas.length})
        </button>
        <button
          onClick={() => setTab('recusadas')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            tab === 'recusadas' ? 'border-b-2 border-danger text-danger' : 'text-slate hover:text-navy'
          }`}
        >
          ❌ Recusadas/Expiradas ({recusadas.length})
        </button>
      </div>

      {loading && propostas.length === 0 ? (
        <div className="card flex items-center justify-center gap-2 p-12 text-slate">
          <Loader2 size={20} className="animate-spin" />
          Carregando propostas...
        </div>
      ) : listaAtual.length === 0 ? (
        <div className="card p-6 text-center text-slate">Nenhuma proposta nesta aba.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {listaAtual.map((proposta) => (
            <ProposalCard
              key={proposta.id}
              proposta={proposta}
              engineerLocation={engineerLocation}
              onAceitar={handleAceitar}
              onRecusar={handleRecusar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
