import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MessageCircle, Paperclip, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import { supabase } from '../../services/supabase'
import StatusBadge from '../../components/Common/StatusBadge'
import Button from '../../components/Common/Button'
import { CRITICIDADE_OPTIONS, OS_STATUS, PROPOSTA_STATUS, TIPO_OCORRENCIA_OPTIONS } from '../../utils/constants'
import { buildDispatchMessage, formatDate, optionLabel, whatsappLink } from '../../utils/formatters'

const RELATORIO_BUCKET = 'relatorios-os'

// Em Aberto -> aceite (parceiro ou indicação de terceiro) -> Ativas -> Concluído -> Concluídas
const TAB_STATUS = { aberto: 'pendente', ativas: 'aceito', concluidas: 'aceito_cliente' }

async function fetchDemandas(tab) {
  const { data: ordens, error: ordensError } = await supabase
    .from('ordens_servico')
    .select('*')
    .eq('status', TAB_STATUS[tab])
    .order('data_criacao', { ascending: false })
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

function ParceiroRow({ proposta, os, onAceitar }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
    portalUrl: `${window.location.origin}/login`,
  })
  const link = whatsappLink(parceiro?.telefone, message)

  // Confirmação real acontece por fora (WhatsApp/Cushman) — permite aceitar
  // mesmo com o timer de 20min já vencido, ele é só referência visual.
  const podeAceitar = proposta.status === 'enviada'

  const handleAceitar = async () => {
    setBusy(true)
    setError('')
    try {
      await onAceitar(os, proposta)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg bg-steel/10 px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
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

        {podeAceitar && (
          <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={handleAceitar} disabled={busy}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Aceite
          </Button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function IndicacaoTerceiro({ os, onAceitar }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [observacao, setObservacao] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-slate hover:text-navy"
      >
        <UserPlus size={13} />
        Responsável não é da Rede Técnica (indicação/terceiro)
      </button>
    )
  }

  const handleSubmit = async () => {
    if (!nome.trim()) {
      setError('Informe o nome do responsável.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onAceitar(os, nome.trim(), observacao.trim())
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-steel/30 p-3">
      <input
        type="text"
        className="input text-sm"
        placeholder="Nome do responsável"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        disabled={busy}
      />
      <input
        type="text"
        className="input text-sm"
        placeholder="Observação (opcional)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        disabled={busy}
      />
      <div className="flex gap-2">
        <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={handleSubmit} disabled={busy}>
          {busy && <Loader2 size={13} className="animate-spin" />}
          Registrar e aceitar
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function ExcluirOs({ os, onCancelar }) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-danger hover:underline">
        <Trash2 size={13} />
        Excluir OS
      </button>
    )
  }

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      setError('Informe o motivo da exclusão.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onCancelar(os, motivo.trim())
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-danger/30 bg-danger/5 p-3">
      <textarea
        className="input min-h-16 text-sm"
        placeholder="Motivo da exclusão (ex: Cushman declinou, sem retorno)"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        disabled={busy}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="border-danger px-3 py-1.5 text-xs text-danger"
          onClick={handleConfirm}
          disabled={busy}
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          Confirmar exclusão
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setOpen(false)} disabled={busy}>
          Voltar
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

function OSCard({ os, onAceitarParceiro, onAceitarTerceiro, onConcluir, onCancelar, onAttachRelatorio }) {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const responsavelLabel = os.responsavel_nome
    ? os.responsavel_parceiro_id
      ? os.responsavel_nome
      : `${os.responsavel_nome} (indicação/terceiro)`
    : null

  const handleAttach = async () => {
    if (!file) {
      setActionError('Selecione o arquivo do relatório.')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      await onAttachRelatorio(os, file)
      setFile(null)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleConcluir = async () => {
    setBusy(true)
    setActionError('')
    try {
      await onConcluir(os)
    } catch (err) {
      setActionError(err.message)
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

      {responsavelLabel && (
        <p className="mb-4 text-sm text-navy">
          👷 Responsável: <span className="font-medium">{responsavelLabel}</span>
          {os.responsavel_observacao && <span className="text-xs text-slate"> — {os.responsavel_observacao}</span>}
        </p>
      )}

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

      {os.status === 'pendente' && (
        <div className="space-y-3 border-t border-steel/30 pt-3">
          <p className="text-xs font-semibold uppercase text-slate">
            Parceiros notificados ({os.propostas.length})
          </p>

          {os.propostas.length === 0 ? (
            <p className="text-sm text-slate">Nenhum parceiro foi notificado para essa OS.</p>
          ) : (
            <div className="space-y-2">
              {os.propostas.map((proposta) => (
                <ParceiroRow key={proposta.id} proposta={proposta} os={os} onAceitar={onAceitarParceiro} />
              ))}
            </div>
          )}

          <IndicacaoTerceiro os={os} onAceitar={onAceitarTerceiro} />
        </div>
      )}

      {os.status === 'aceito' && (
        <div className="flex flex-wrap items-center gap-2 border-t border-steel/30 pt-3">
          <input
            type="file"
            className="max-w-[220px] text-xs"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button variant="secondary" onClick={handleAttach} disabled={busy || !file}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Anexar relatório
          </Button>
          <Button variant="primary" onClick={handleConcluir} disabled={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            Concluído
          </Button>
        </div>
      )}

      {actionError && <p className="mt-2 text-xs text-danger">{actionError}</p>}

      {(os.status === 'pendente' || os.status === 'aceito') && (
        <div className="mt-3 border-t border-steel/30 pt-3">
          <ExcluirOs os={os} onCancelar={onCancelar} />
        </div>
      )}
    </div>
  )
}

export default function DemandasPage() {
  const [tab, setTab] = useState('aberto')
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

  // Aceite unificado: mesma função de banco (aceitar_proposta) usada aqui
  // (admin, role anon) e no Portal do Parceiro (role authenticated). Trava
  // a proposta e a OS com FOR UPDATE dentro da função, então se os dois
  // lados tentarem aceitar quase ao mesmo tempo, o segundo recebe um erro
  // claro ("já foi atribuída a outro parceiro") em vez de sobrescrever o
  // resultado do primeiro.
  async function aceitarParceiro(os, proposta) {
    const { error } = await supabase.rpc('aceitar_proposta', { p_proposta_id: proposta.id })
    if (error) throw new Error(error.message)
    await loadData()
  }

  async function aceitarTerceiro(os, nome, observacao) {
    const pendentes = os.propostas.filter((p) => p.status === 'enviada').map((p) => p.id)
    if (pendentes.length > 0) {
      const { error: recusaError } = await supabase
        .from('propostas_os')
        .update({
          status: 'recusada',
          respondida_em: new Date().toISOString(),
          motivo_recusa: 'OS atribuída a indicação/terceiro fora da Rede Técnica',
        })
        .in('id', pendentes)
      if (recusaError) throw new Error(recusaError.message)
    }

    const { error: osError } = await supabase
      .from('ordens_servico')
      .update({
        status: 'aceito',
        data_aceita: new Date().toISOString(),
        responsavel_parceiro_id: null,
        responsavel_nome: nome,
        responsavel_observacao: observacao || null,
      })
      .eq('id', os.id)
    if (osError) throw new Error(osError.message)

    await loadData()
  }

  async function concluirOs(os) {
    const { error: updateError } = await supabase
      .from('ordens_servico')
      .update({ status: 'aceito_cliente', aceito_cliente_em: new Date().toISOString() })
      .eq('id', os.id)
    if (updateError) throw new Error(updateError.message)
    await loadData()
  }

  async function cancelarOs(os, motivo) {
    const { error: updateError } = await supabase
      .from('ordens_servico')
      .update({ status: 'cancelada', motivo_cancelamento: motivo, cancelado_em: new Date().toISOString() })
      .eq('id', os.id)
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
      .update({ relatorio_recebido_em: new Date().toISOString(), relatorio_url: urlData.publicUrl })
      .eq('id', os.id)
    if (updateError) throw new Error(updateError.message)
    await loadData()
  }

  const TABS = [
    { key: 'aberto', label: 'Em Aberto', activeClass: 'border-gold text-gold' },
    { key: 'ativas', label: 'Ativas', activeClass: 'border-blue text-blue' },
    { key: 'concluidas', label: 'Concluídas', activeClass: 'border-success text-success' },
  ]

  const emptyLabel =
    tab === 'aberto' ? 'Nenhuma OS em aberto.' : tab === 'ativas' ? 'Nenhuma OS ativa no momento.' : 'Nenhuma OS concluída.'

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
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2 pb-2 text-sm font-medium transition-colors ${
              tab === t.key ? `border-b-2 ${t.activeClass}` : 'text-slate hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
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
        <div className="card p-12 text-center text-slate">{emptyLabel}</div>
      )}

      <div className="space-y-4">
        {ordens.map((os) => (
          <OSCard
            key={os.id}
            os={os}
            onAceitarParceiro={aceitarParceiro}
            onAceitarTerceiro={aceitarTerceiro}
            onConcluir={concluirOs}
            onCancelar={cancelarOs}
            onAttachRelatorio={attachRelatorio}
          />
        ))}
      </div>
    </div>
  )
}
