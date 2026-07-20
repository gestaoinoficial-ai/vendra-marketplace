import { Link, useLocation } from 'react-router-dom'
import { ClipboardList, User, BarChart3, MessageCircle, LogOut } from 'lucide-react'

const MENU_ITEMS = [
  { to: '/parceiro/propostas', label: 'Propostas', icon: ClipboardList },
  { to: '/parceiro/meus-dados', label: 'Meus Dados', icon: User },
  { to: '#', label: 'Relatórios Pessoais', icon: BarChart3 },
  { to: '#', label: 'Suporte', icon: MessageCircle },
]

export default function SidebarParceiro({ open, onClose }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-navy text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
      open ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gold text-navy font-rajdhani font-bold flex items-center justify-center">V</div>
            <span className="font-rajdhani text-lg font-semibold">VENDRA</span>
          </div>
          <p className="text-xs text-steel">AMBIENTE DO PARCEIRO</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {MENU_ITEMS.map(({ to, label, icon: Icon }) => (
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
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-steel hover:text-danger hover:bg-danger/10">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
