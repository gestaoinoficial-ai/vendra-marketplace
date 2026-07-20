import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { getEngineerLocation, haversineDistance } from '../../services/geocodingService'

const MOCK_PROPOSALS = [
  {
    id: '1',
    os_id: 'OS-2042',
    status: 'enviada',
    cliente: 'Bradesco',
    endereco: 'Agência Campinas Centro',
    latitude: -22.9056,
    longitude: -47.0608,
    tipo_servico: 'Vistoria emergencial',
    descricao: 'Registrar infiltração no subsolo, fotografar com régua de escala e preencher o checklist fotográfico',
    prioridade: 'emergencial',
    valor_estimado: 2400,
    enviada_em: new Date().toISOString(),
    expira_em: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
  },
]

export default function PropostasParceirosPage() {
  const [engineerLocation, setEngineerLocation] = useState(null)
  const [gpsError, setGpsError] = useState('')
  const [tab, setTab] = useState('pendentes')
  const [proposals, setProposals] = useState(MOCK_PROPOSALS.map((p) => ({ ...p, distancia_km: null })))

  useEffect(() => {
    const requestGPS = async () => {
      try {
        const location = await getEngineerLocation()
        setEngineerLocation(location)
        setGpsError('')

        // Calculate distances for all proposals
        setProposals((prev) =>
          prev.map((p) => ({
            ...p,
            distancia_km: haversineDistance(
              { lat: location.lat, lng: location.lng },
              { lat: p.latitude, lng: p.longitude }
            ),
          }))
        )
      } catch (error) {
        setGpsError('Ative GPS para ver distância até demandas')
        console.log('GPS error:', error.message)
      }
    }

    requestGPS()
  }, [])

  const pendentes = proposals.filter((p) => p.status === 'enviada')
  const aceitas = proposals.filter((p) => p.status === 'aceita')
  const recusadas = proposals.filter((p) => p.status === 'recusada')

  return (
    <div className="space-y-4">
      <div className="card p-6 bg-navy text-white">
        <p className="text-lg">👋 Olá, Ricardo</p>
        <p className="text-sm text-steel">Você tem {pendentes.length} demanda{pendentes.length !== 1 ? 's' : ''} nova{pendentes.length !== 1 ? 's' : ''} aguardando seu aceite</p>
      </div>

      {gpsError && (
        <div className="card p-4 bg-amber/10 border border-amber/30 flex gap-3">
          <AlertCircle size={18} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber">{gpsError}</p>
        </div>
      )}

      <div>
        <div className="border-b border-steel/30 flex gap-4 mb-4">
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
            ❌ Recusadas ({recusadas.length})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tab === 'pendentes' &&
          (pendentes.length > 0 ? (
            pendentes.map((p) => (
              <div key={p.id} className="card p-5 border-l-4 border-danger">
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-rajdhani font-semibold text-navy">#{p.os_id} • {p.tipo_servico}</h3>
                    <span className="badge bg-danger/15 text-danger">EMERGENCIAL</span>
                  </div>
                  <p className="text-sm text-slate">
                    🏢 {p.cliente} • 📍 {p.endereco}
                  </p>
                </div>

                {p.distancia_km != null ? (
                  <p className="text-sm text-slate mb-3">📍 A {p.distancia_km.toFixed(1)} km de você</p>
                ) : (
                  <p className="text-sm text-slate mb-3">📍 Localização não disponível</p>
                )}

                <div className="bg-slate/10 p-3 rounded mb-4 text-sm">
                  <p className="font-medium text-navy mb-1">📋 Instruções:</p>
                  <p className="text-slate text-xs">{p.descricao}</p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-success text-white rounded-lg font-medium text-sm hover:brightness-95 transition">
                    ✓ Aceitar
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white border border-steel text-navy rounded-lg font-medium text-sm hover:bg-steel/10 transition">
                    ✗ Recusar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-6 text-center text-slate">Nenhuma proposta pendente</div>
          ))}

        {tab === 'aceitas' &&
          (aceitas.length > 0 ? (
            aceitas.map((p) => (
              <div key={p.id} className="card p-5 border-l-4 border-success">
                <h3 className="font-rajdhani font-semibold text-navy mb-2">#{p.os_id} • {p.tipo_servico}</h3>
                <p className="text-sm text-slate">🏢 {p.cliente}</p>
                <div className="mt-3 flex gap-2">
                  <button className="px-4 py-2 bg-white border border-steel text-navy rounded-lg font-medium text-sm">
                    📤 Upload Laudo
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-6 text-center text-slate">Nenhuma proposta aceita</div>
          ))}

        {tab === 'recusadas' &&
          (recusadas.length > 0 ? (
            recusadas.map((p) => (
              <div key={p.id} className="card p-5 border-l-4 border-steel">
                <h3 className="font-rajdhani font-semibold text-navy mb-2">#{p.os_id} • {p.tipo_servico}</h3>
                <p className="text-sm text-slate">🏢 {p.cliente}</p>
              </div>
            ))
          ) : (
            <div className="card p-6 text-center text-slate">Nenhuma proposta recusada</div>
          ))}
      </div>
    </div>
  )
}
