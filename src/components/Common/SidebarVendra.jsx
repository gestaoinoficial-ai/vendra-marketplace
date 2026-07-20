import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3, Users, FileText, ClipboardList, Wrench, Eye, FileUp,
  BookOpen, CheckSquare, Settings, LogOut
} from 'lucide-react'

const MENU_ITEMS = [
  { section: 'OPERAÇÃO', items: [
    { to: '/vendra/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/vendra/clientes', label: 'Clientes', icon: Users },
    { to: '/vendra/entrada-demanda', label: 'Entrada de Demanda', icon: FileText },
    { to: '/vendra/demandas', label: 'Demandas / OS', icon: ClipboardList },
    { to: '/vendra/rede-tecnica', label: 'Rede Técnica', icon: Wrench },
    { to: '/vendra/portal-parceiro', label: 'Portal do Parceiro', icon: Eye },
    { to: '/vendra/relatorios', label: 'Relatórios', icon: FileUp },
  ]},
  { section: 'CO-CRIAÇÃO', items: [
    { to: '/vendra/decisoes-mvp', label: 'Decisões do MVP', icon: CheckSquare },
    { to: '/vendra/biblioteca', label: 'Biblioteca Vendra', icon: BookOpen },
  ]},
]

export default function SidebarVendra({ open, onClose }) {
  const location = useLocation()

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-navy text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
      open ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gold text-navy font-rajdhani font-bold flex items-center justify-center">V</div>
            <span className="font-rajdhani text-lg font-semibold">VENDRA</span>
          </div>
          <p className="text-xs text-steel">AMBIENTE INTERNO</p>
        </div>

        <nav className="flex-1 p-4 space-y-6">
          {MENU_ITEMS.map(({ section, items }) => (
            <div key={section}>
              <p className="text-xs uppercase font-rajdhani text-steel font-semibold mb-2">{section}</p>
              <div className="space-y-1">
                {items.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(to) ? 'bg-gold text-navy' : 'text-steel hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-steel hover:text-white hover:bg-white/5">
            <Settings size={18} />
            Configurações
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-steel hover:text-danger hover:bg-danger/10">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
