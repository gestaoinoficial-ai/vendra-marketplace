import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-slate">
        <Loader2 size={20} className="animate-spin" />
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
