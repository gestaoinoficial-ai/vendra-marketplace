import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase'

const OS_EM_ANDAMENTO_STATUSES = ['aceito', 'relatorio_recebido', 'enviado_cliente']

async function countRows(query, label) {
  const { count, error } = await query
  if (error) throw new Error(`Erro ao carregar ${label}: ${error.message}`)
  return count ?? 0
}

async function fetchDashboardCounts() {
  const [emAndamento, aguardandoAceite, concluidas, parceirosAtivos, clientesAtivos] = await Promise.all([
    countRows(
      supabase
        .from('ordens_servico')
        .select('id', { count: 'exact', head: true })
        .in('status', OS_EM_ANDAMENTO_STATUSES),
      'OS em andamento'
    ),
    countRows(
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
      'OS aguardando aceite'
    ),
    countRows(
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }).eq('status', 'aceito_cliente'),
      'OS concluídas'
    ),
    countRows(
      supabase.from('parceiros').select('id', { count: 'exact', head: true }).eq('status', 'aprovado'),
      'parceiros ativos'
    ),
    countRows(
      supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('ativo_piloto', true),
      'clientes ativos'
    ),
  ])

  return { emAndamento, aguardandoAceite, concluidas, parceirosAtivos, clientesAtivos }
}

export default function DashboardVendraPage() {
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCounts() {
      setLoading(true)
      setError('')
      try {
        setCounts(await fetchDashboardCounts())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCounts()
  }, [])

  const cards = [
    { icon: '⚙️', label: 'EM ANDAMENTO', value: counts?.emAndamento, bg: '#FFF9E6' },
    { icon: '⚠️', label: 'ATRASADAS', pending: true, bg: '#FFE8E0' },
    { icon: '✋', label: 'AGUARDANDO ACEITE', value: counts?.aguardandoAceite, bg: '#E0F0FF' },
    { icon: '✓', label: 'CONCLUÍDAS', value: counts?.concluidas, bg: '#E0FFF0' },
    { icon: '🔗', label: 'PARCEIROS ATIVOS', value: counts?.parceirosAtivos, bg: '#F0E8FF' },
    { icon: '🏢', label: 'CLIENTES ATIVOS', value: counts?.clientesAtivos, bg: '#FFF5E6' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rajdhani text-3xl font-semibold text-navy mb-2">Dashboard Operacional</h1>
        <p className="text-slate">O que precisa da sua atenção agora</p>
      </div>

      {error && (
        <div className="card flex gap-3 border border-danger/30 bg-danger/10 p-4">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-danger" />
          <p className="text-sm text-danger">Erro ao carregar indicadores: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4" style={{ borderLeftColor: 'currentColor', borderLeft: '4px solid' }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{card.icon}</span>
              <div>
                <p className="text-xs uppercase font-semibold text-slate">{card.label}</p>
                {card.pending ? (
                  <p className="text-sm text-slate mt-1" title="SLA de atraso ainda não definido">
                    SLA a definir
                  </p>
                ) : loading ? (
                  <Loader2 size={20} className="animate-spin text-slate mt-1" />
                ) : (
                  <p className="font-rajdhani text-3xl font-bold text-navy mt-1">{card.value ?? 0}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-rajdhani text-xl font-semibold text-navy mb-4">Em Andamento e Atrasadas</h2>
        <div className="text-center py-8 text-slate">Carregando dados...</div>
      </div>
    </div>
  )
}
