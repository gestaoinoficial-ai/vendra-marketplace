export default function DashboardVendraPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-rajdhani text-3xl font-semibold text-navy mb-2">Dashboard Operacional</h1>
        <p className="text-slate">O que precisa da sua atenção agora</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: '⚙️', label: 'EM ANDAMENTO', value: 23, bg: '#FFF9E6' },
          { icon: '⚠️', label: 'ATRASADAS', value: 4, bg: '#FFE8E0' },
          { icon: '✋', label: 'AGUARDANDO ACEITE', value: 5, bg: '#E0F0FF' },
          { icon: '✓', label: 'CONCLUÍDAS', value: 7, bg: '#E0FFF0' },
          { icon: '🔗', label: 'PARCEIROS ATIVOS', value: 27, bg: '#F0E8FF' },
          { icon: '🏢', label: 'CLIENTES ATIVOS', value: 9, bg: '#FFF5E6' },
        ].map((card) => (
          <div key={card.label} className="card p-4" style={{ borderLeftColor: 'currentColor', borderLeft: '4px solid' }}>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{card.icon}</span>
              <div>
                <p className="text-xs uppercase font-semibold text-slate">{card.label}</p>
                <p className="font-rajdhani text-3xl font-bold text-navy mt-1">{card.value}</p>
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
