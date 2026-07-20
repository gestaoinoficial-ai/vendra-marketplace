import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, Phone, Mail, MapPin, Radius } from 'lucide-react'
import { supabase } from '../../services/supabase'

export default function RedeTecnicaPage() {
  const [parceiros, setParceiros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchParceiros() {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('parceiros')
        .select('*')
        .eq('status', 'aprovado')
        .order('nome_fantasia', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        setParceiros([])
      } else {
        setParceiros(data || [])
      }

      setLoading(false)
    }

    fetchParceiros()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-rajdhani text-3xl font-semibold text-navy">Rede Técnica</h1>
        <p className="text-slate">{parceiros.length} engenheiro{parceiros.length !== 1 ? 's' : ''} aprovado{parceiros.length !== 1 ? 's' : ''}</p>
      </div>

      {loading && (
        <div className="card p-12 flex items-center justify-center gap-2 text-slate">
          <Loader2 size={20} className="animate-spin" />
          Carregando engenheiros...
        </div>
      )}

      {!loading && error && (
        <div className="card p-4 bg-danger/10 border border-danger/30 flex gap-3">
          <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">Erro ao carregar parceiros: {error}</p>
        </div>
      )}

      {!loading && !error && parceiros.length === 0 && (
        <div className="card p-12 text-center text-slate">Nenhum engenheiro aprovado encontrado.</div>
      )}

      {!loading && !error && parceiros.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parceiros.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-rajdhani font-semibold text-lg text-navy">
                  {p.nome_fantasia || p.nome_empresario}
                </h3>
                <span className="badge bg-success/15 text-success whitespace-nowrap">Aprovado</span>
              </div>

              {p.especialidades && p.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.especialidades.map((esp, idx) => (
                    <span key={idx} className="badge bg-gold/15 text-navy text-[11px]">
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm text-slate">
                {p.regiao_atuacao && (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="flex-shrink-0" />
                    {p.regiao_atuacao}
                  </p>
                )}
                {p.raio_atuacao_km && (
                  <p className="flex items-center gap-2">
                    <Radius size={14} className="flex-shrink-0" />
                    Raio de atuação: {p.raio_atuacao_km} km
                  </p>
                )}
                {p.telefone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="flex-shrink-0" />
                    {p.telefone}
                  </p>
                )}
                {p.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail size={14} className="flex-shrink-0" />
                    {p.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
