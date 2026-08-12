import { Menu, Search, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Header({ onMenuClick }) {
  const { role, switchRole } = useAuthStore()

  return (
    <header className="border-b border-steel/20 bg-white px-6 py-4 flex items-center justify-between h-16">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 hover:bg-steel/10 rounded-lg lg:hidden">
          <Menu size={20} />
        </button>
        <h2 className="font-rajdhani text-xl font-semibold text-navy">Dashboard</h2>
      </div>

      <div className="flex-1 max-w-xs mx-8 hidden sm:flex">
        <div className="w-full relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input type="text" placeholder="Buscar OS, cliente, parceiro..." className="input w-full pl-9" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => switchRole(role === 'admin' ? 'partner' : 'admin')} className="p-2 hover:bg-steel/10 rounded-lg">
          <User size={20} />
        </button>
      </div>
    </header>
  )
}
