import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/Common/ProtectedRoute'
import VendraLayout from './components/Layout/VendraLayout'
import ParceiroLayout from './components/Layout/ParceiroLayout'
import DashboardVendraPage from './pages/vendra/DashboardVendraPage'
import EntradaDemandaPage from './pages/vendra/EntradaDemandaPage'
import DemandasPage from './pages/vendra/DemandasPage'
import RedeTecnicaPage from './pages/vendra/RedeTecnicaPage'
import RelatoriosPage from './pages/vendra/RelatoriosPage'
import BibliotecaPage from './pages/vendra/BibliotecaPage'
import DecisoesMVPPage from './pages/vendra/DecisoesMVPPage'
import ClientesPage from './pages/vendra/ClientesPage'
import PortalParceiroPage from './pages/vendra/PortalParceiroPage'
import LoginPage from './pages/parceiro/LoginPage'
import PropostasParceirosPage from './pages/parceiro/PropostasParceirosPage'
import MeusDadosPage from './pages/parceiro/MeusDadosPage'

export default function App() {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/vendra/dashboard" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route element={<VendraLayout />}>
          <Route path="/vendra/dashboard" element={<DashboardVendraPage />} />
          <Route path="/vendra/clientes" element={<ClientesPage />} />
          <Route path="/vendra/entrada-demanda" element={<EntradaDemandaPage />} />
          <Route path="/vendra/demandas" element={<DemandasPage />} />
          <Route path="/vendra/rede-tecnica" element={<RedeTecnicaPage />} />
          <Route path="/vendra/portal-parceiro" element={<PortalParceiroPage />} />
          <Route path="/vendra/relatorios" element={<RelatoriosPage />} />
          <Route path="/vendra/biblioteca" element={<BibliotecaPage />} />
          <Route path="/vendra/decisoes-mvp" element={<DecisoesMVPPage />} />
        </Route>

        <Route element={<ProtectedRoute><ParceiroLayout /></ProtectedRoute>}>
          <Route path="/parceiro/propostas" element={<PropostasParceirosPage />} />
          <Route path="/parceiro/meus-dados" element={<MeusDadosPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
