import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, MessageCircle, Paperclip, RefreshCw } from 'lucide-react'
import { supabase } from '../../services/supabase'
import StatusBadge from '../../components/Common/StatusBadge'
import Button from '../../components/Common/Button'
import { CRITICIDADE_OPTIONS, OS_STATUS, OS_STATUS_ORDER, PROPOSTA_STATUS, TIPO_OCORRENCIA_OPTIONS } from '../../utils/constants'
import { buildDispatchMessage, formatDate, optionLabel, whatsappLink } from '../../utils/formatters'

const RELATORIO_BUCKET = 'relatorios-os'

async function fetchDemandas(tab) {
  let ordensQuery = supabase
    .from('ordens_servico')
    .select('*')
    .order('data_criacao', { ascending: false })

  ordensQuery =
    tab === 'concluidas' ? ordensQuery.eq('status', 'aceito_cliente') : ordensQuery.neq('status', 'aceito_cliente')

  const { data: ordens, error: ordensError } = await ordensQuery
  if (ordensError) throw ordensError

  const clienteIds = [...new Set(ordens.map((o) => o.cliente_id).filter(Boolean))]
  const { data: clientes, error: clientesError } =
    clienteIds.length > 0
      ? await supabase.from('clientes').select('id, nome').in('id', clienteIds)
      : { data: [], error: null }
  if (clientesError) throw clientesError
  const clientesMap = new Map(clientes.map((c) => [c.id, c.nome]))

  const osIds = ordens.map((o) => o.id)
  const { data: propostas, error: propostasError } =
    osIds.length > 0 ? await supabase.from('propostas_os').select('*').in('os_id', osIds) : { data: [], error: null }
  if (propostasError) throw propostasError

  const parceiroIds = [...new Set(propostas.map((p) => p.parceiro_id).filter(Boolean))]
  const { data: parceiros, error: parceirosError } =
    parceiroIds.length > 0
      ? await supabase.from('parceiros').select('id, nome_fantasia, nome_empresario, telefone').in('id', parceiroIds)
      : { data: [], error: null }
  if (parceirosError) throw parceirosError
  const parceirosMap = new Map(parceiros.map((p) => [p.id, p]))

  const propostasByOs = new Map()
  for (const proposta of propostas) {
    const list = propostasByOs.get(proposta.os_id) ?? []
    list.push({ ...proposta, parceiro: parceirosMap.get(proposta.parceiro_id) ?? null })
    propostasByOs.set(proposta.os_id, list)
  }
  for (const list of propostasByOs.values()) {
    list.sort((a, b) => (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity))
  }

  return ordens.map((os) => ({
    ...os,
    clienteNome: clientesMap.get(os.cliente_id) ?? '—',
    propostas: propostasByOs.get(os.id) ?? [],
  }))
}

function proposalEffectiveStatus(proposta) {
  const isExpired = proposta.status === 'enviada' && proposta.expira_em && new Date(proposta.expira_em) < new Date()
  return isExpired ? 'expirada' : proposta.status
}

function tipoOcorrenciaLabel(os) {
  return os.tipo_ocorrencia === 'outros' && os.tipo_ocorrencia_outro
    ? os.tipo_ocorrencia_outro
    : optionLabel(TIPO_OCORRENCIA_OPTIONS, os.tipo_ocorrencia)
}

function ParceiroRow({ proposta, os }) {
  const parceiro = proposta.parceiro
  const nome = parceiro?.nome_fantasia || parceiro?.nome_empresario || 'Parceiro removido'

  const message = buildDispatchMessage({
    parceiroNome: nome,
    numeroOs: os.numero_os,
    clienteNome: os.clienteNome,
    endereco: os.endereco_completo || '—',
    criticidade: os.criticidade,
    criticidadeLabel: optionLabel(CRITICIDADE_OPTIONS, os.criticidade),
    tipoOcorrenciaLabel: tipoOcorrenciaLabel(os),
    descricao: os.descricao,
  })
  const link = whatsappLink(parceiro?.telefone, message)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-steel/10 px-3 py-2 text-sm">
      <div className="min-w-[160px] flex-1">
        <p className="font-medium text-navy">{nome}</p>
        <p className="text-xs text-slate">
          {proposta.distancia_km != null ? `${proposta.distancia_km.toFixed(1)} km` : 'Distância não disponível'}
        </p>
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-success hover:underline"
        >
          <MessageCircle size={13} />
          {parceiro.telefone}
        </a>
      ) : (
        <span className="text-xs text-slate">Sem telefone</span>
      )}

      <StatusBadge statusKey={proposalEffectiveStatus(proposta)} statusMap={PROPOSTA_STATUS} />
    </div>
  )
}

function OSCard({ os, onAdvance, onAttachRelatorio }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const currentIndex = OS_STATUS_ORDER.indexOf(os.status)
  const nextStatus =
    currentIndex >= 0 && currentIndex < OS_STATUS_ORDER.length - 1 ? OS_STATUS_ORDER[currentIndex + 1] : null

  const handleAdvanceClick = async () => {
    if (!nextStatus) return
    setActionError('')

    if (nextStatus === 'relatorio_recebido') {
      if (!file) {
        setActionError('Selecione o arquivo do relatório antes de avançar.')
        return
      }
      setBusy(true)
      try {
        await onAttachRelatorio(os, file)
      } catch (err) {
        setActionError(err.message)
      } finally {
        setBusy(false)
      }
      return
    }

    setBusy(true)
    try {
      await onAdvance(os, nextStatus)
    } catch (err) {
      setActionError(err.message)
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
        <StatusBadge statusKey={os.status} statusMap={OS_STATUS} />
      </div>

      <p className="mb-1 text-sm text-slate">
        🏢 {os.clienteNome} · 📍 {os.endereco_completo || '—'}
      </p>
      <p className="mb-4 text-xs text-slate">🔧 {tipoOcorrenciaLabel(os)}</p>

      {os.relatorio_url && (
        <a
          href={os.relatorio_url}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex items-center gap-1 text-xs text-blue hover:underline"
        >
          <Paperclip size={13} />
          Ver relatório anexado
        </a>
      )}

      <div className="border-t border-steel/30 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase text-slate">
          Parceiros notificados ({os.propostas.length})
        </p>

        {os.propostas.length === 0 ? (
          <p className="text-sm text-slate">Nenhum parceiro foi notificado para essa OS.</p>
        ) : (
          <div className="space-y-2">
            {os.propostas.map((proposta) => (
              <ParceiroRow key={proposta.id} proposta={proposta} os={os} />
            ))}
          </div>
        )}
      </div>

      {nextStatus && (
        <div className="mt-3 border-t border-steel/30 pt-3 flex flex-wrap items-center gap-2">
          {nextStatus === 'relatorio_recebido' && (
            <input
              type="file"
              className="max-w-[220px] text-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          )}
          <Button variant="secondary" onClick={handleAdvanceClick} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Avançar para: {OS_STATUS[nextStatus].label}
          </Button>
          {actionError && <p className="w-full text-xs text-danger">{actionError}</p>}
        </div>
      )}
    </div>
  )
}

export default function DemandasPage() {
  const [tab, setTab] = useState('ativas')
  const [ordens, setOrdens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchDemandas(tab)
      setOrdens(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tab])

  async function advanceStatus(os, nextStatus) {
    const patch = { status: nextStatus }
    const timestampField = OS_STATUS[nextStatus]?.timestampField
    if (timestampField) patch[timestampField] = new Date().toISOString()

    const { error: updateError } = await supabase.from('ordens_servico').update(patch).eq('id', os.id)
    if (updateError) throw new Error(updateError.message)
    await loadData()
  }

  async function attachRelatorio(os, file) {
    const path = `${os.numero_os}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from(RELATORIO_BUCKET).upload(path, file)
    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage.from(RELATORIO_BUCKET).getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('ordens_servico')
      .update({
        status: 'relatorio_recebido',
        relatorio_recebido_em: new Date().toISOString(),
        relatorio_url: urlData.publicUrl,
      })
      .eq('id', os.id)
    if (updateError) throw new Error(updateError.message)
    await loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-rajdhani text-3xl font-semibold text-navy">Demandas / OS</h1>
          <p className="text-slate">
            {ordens.length} {ordens.length === 1 ? 'ordem' : 'ordens'} de serviço
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      <div className="flex gap-4 border-b border-steel/30">
        <button
          onClick={() => setTab('ativas')}
          className={`px-2 pb-2 text-sm font-medium transition-colors ${
            tab === 'ativas' ? 'border-b-2 border-gold text-gold' : 'text-slate hover:text-navy'
          }`}
        >
          Ativas
        </button>
        <button
          onClick={() => setTab('concluidas')}
          className={`px-2 pb-2 text-sm font-medium transition-colors ${
            tab === 'concluidas' ? 'border-b-2 border-success text-success' : 'text-slate hover:text-navy'
          }`}
        >
          Concluídas
        </button>
      </div>

      {loading && ordens.length === 0 && (
        <div className="card flex items-center justify-center gap-2 p-12 text-slate">
          <Loader2 size={20} className="animate-spin" />
          Carregando demandas...
        </div>
      )}

      {!loading && error && (
        <div className="card flex gap-3 border border-danger/30 bg-danger/10 p-4">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-danger" />
          <p className="text-sm text-danger">Erro ao carregar demandas: {error}</p>
        </div>
      )}

      {!loading && !error && ordens.length === 0 && (
        <div className="card p-12 text-center text-slate">
          {tab === 'concluidas' ? 'Nenhuma OS concluída.' : 'Nenhuma OS ativa encontrada.'}
        </div>
      )}

      <div className="space-y-4">
        {ordens.map((os) => (
          <OSCard key={os.id} os={os} onAdvance={advanceStatus} onAttachRelatorio={attachRelatorio} />
        ))}
      </div>
    </div>
  )
}
