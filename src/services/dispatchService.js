import { supabase } from './supabase'
import { haversineDistance } from './geocodingService'
import { DISPATCH_RADIUS_KM, PROPOSAL_TIMEOUT_MINUTES } from '../utils/constants'

function generateOsNumero() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `OS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

async function createOrdemServico(form, clienteNome) {
  const os_numero = generateOsNumero()

  const { data, error } = await supabase
    .from('ordens_servico')
    .insert({
      os_numero,
      cliente_nome: clienteNome,
      tipo_servico: form.tipo_servico,
      descricao: form.descricao || null,
      endereco: form.endereco,
      latitude: form.lat,
      longitude: form.lng,
      prioridade: form.emergencial ? 'emergencial' : form.prioridade,
      emergencial: form.emergencial,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      status: 'enviada',
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar OS: ${error.message}`)
  return data
}

async function findParceirosProximos(lat, lng, raioKm = DISPATCH_RADIUS_KM) {
  const { data: parceiros, error } = await supabase
    .from('parceiros')
    .select('id, nome_fantasia, nome_empresario, latitude, longitude')
    .eq('status', 'aprovado')
    .eq('disponivel', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (error) throw new Error(`Erro ao buscar parceiros: ${error.message}`)

  return (parceiros || [])
    .map((parceiro) => ({
      ...parceiro,
      distancia_km: haversineDistance({ lat, lng }, { lat: parceiro.latitude, lng: parceiro.longitude }),
    }))
    .filter((parceiro) => parceiro.distancia_km <= raioKm)
    .sort((a, b) => a.distancia_km - b.distancia_km)
}

async function criarPropostas(osId, parceirosProximos) {
  if (parceirosProximos.length === 0) return []

  const expiraEm = new Date(Date.now() + PROPOSAL_TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const propostas = parceirosProximos.map((parceiro) => ({
    os_id: osId,
    parceiro_id: parceiro.id,
    status: 'enviada',
    distancia_km: Number(parceiro.distancia_km.toFixed(2)),
    expira_em: expiraEm,
  }))

  const { data, error } = await supabase.from('propostas_os').insert(propostas).select()

  if (error) throw new Error(`Erro ao criar propostas: ${error.message}`)
  return data
}

/**
 * Orquestra o dispatch completo de uma OS:
 * 1. Cria a ordem_servico
 * 2. Busca parceiros dentro do raio (Haversine)
 * 3. Cria uma proposta_os para cada parceiro encontrado
 */
export async function dispatchOrdemServico(form, clienteNome) {
  const ordem = await createOrdemServico(form, clienteNome)
  const parceirosProximos = await findParceirosProximos(form.lat, form.lng)
  const propostas = await criarPropostas(ordem.id, parceirosProximos)

  return {
    ordem,
    parceirosNotificados: parceirosProximos.length,
    parceiros: parceirosProximos,
    propostas,
  }
}
