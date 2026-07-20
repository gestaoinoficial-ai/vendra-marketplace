import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../../components/Common/Button'
import { CLIENTES, TIPO_SERVICO_OPTIONS, PRIORIDADE_OPTIONS } from '../../utils/constants'
import { geocodeAddress } from '../../services/geocodingService'
import { dispatchOrdemServico } from '../../services/dispatchService'

export default function EntradaDemandaPage() {
  const [form, setForm] = useState({
    cliente_id: '',
    tipo_servico: '',
    descricao: '',
    endereco: '',
    lat: null,
    lng: null,
    prioridade: 'normal',
    emergencial: false,
    valor_estimado: '',
  })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  const handleAddressBlur = async () => {
    if (!form.endereco.trim()) {
      setGeocodeError('')
      return
    }

    setGeocoding(true)
    setGeocodeError('')

    const result = await geocodeAddress(form.endereco)

    if (result.success) {
      setForm((prev) => ({
        ...prev,
        lat: result.latitude,
        lng: result.longitude,
      }))
      setGeocodeError('')
    } else {
      setGeocodeError('⚠️ Endereço não encontrado. Verifique e tente novamente.')
      setForm((prev) => ({
        ...prev,
        lat: null,
        lng: null,
      }))
    }

    setGeocoding(false)
  }

  const handleSubmit = async () => {
    // Validate form
    if (!form.cliente_id || !form.tipo_servico || !form.endereco || !form.lat || !form.lng) {
      setSubmitResult({
        success: false,
        message: 'Por favor, preencha todos os campos obrigatórios',
      })
      return
    }

    setSubmitting(true)
    setSubmitResult(null)

    try {
      const clienteName = CLIENTES.find((c) => c.id === form.cliente_id)?.nome || ''

      const { ordem, parceirosNotificados } = await dispatchOrdemServico(form, clienteName)

      setSubmitResult({
        success: true,
        osId: ordem.os_numero,
        message:
          parceirosNotificados > 0
            ? `✅ OS ${ordem.os_numero} criada e enviada para ${parceirosNotificados} engenheiro${parceirosNotificados === 1 ? '' : 's'} próximo${parceirosNotificados === 1 ? '' : 's'}!`
            : `⚠️ OS ${ordem.os_numero} criada, mas nenhum engenheiro foi encontrado num raio de 100km.`,
        details: {
          cliente: clienteName,
          endereco: form.endereco,
          engenheirosNotificados: parceirosNotificados,
          timerExpiracao: '20 minutos',
        },
      })

      // Reset form after success
      setTimeout(() => {
        setForm({
          cliente_id: '',
          tipo_servico: '',
          descricao: '',
          endereco: '',
          lat: null,
          lng: null,
          prioridade: 'normal',
          emergencial: false,
          valor_estimado: '',
        })
        setSubmitResult(null)
      }, 3000)
    } catch (error) {
      setSubmitResult({
        success: false,
        message: `❌ Erro ao criar OS: ${error.message}`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="font-rajdhani text-3xl font-semibold text-navy">Criar OS Emergencial</h1>
        <p className="text-slate">Cria a ordem de serviço e despacha para engenheiros num raio de 100km.</p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente</label>
            <select className="input" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Selecione um cliente</option>
              {CLIENTES.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Serviço</label>
            <select className="input" value={form.tipo_servico} onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })}>
              <option value="">Selecione</option>
              {TIPO_SERVICO_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Descrição</label>
          <textarea className="input min-h-32" placeholder="Descreva a situação..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>

        <div>
          <label className="label">Endereço</label>
          <div className="relative">
            <input
              type="text"
              className={`input pr-10 ${geocodeError ? 'border-danger' : ''}`}
              placeholder="Rua, número, bairro, cidade"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              onBlur={handleAddressBlur}
              disabled={geocoding}
            />
            {geocoding && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate" />}
          </div>
          {geocodeError && <p className="mt-1 text-sm text-danger">{geocodeError}</p>}
          {form.lat && form.lng && !geocodeError && <p className="mt-1 text-xs text-success">✓ Localização geocodificada</p>}
        </div>

        <div>
          <label className="label">Prioridade</label>
          <div className="flex gap-4">
            {PRIORIDADE_OPTIONS.map((p) => (
              <label key={p.value} className="flex items-center gap-2 text-sm">
                <input type="radio" name="prioridade" value={p.value} checked={form.prioridade === p.value} onChange={(e) => setForm({ ...form, prioridade: e.target.value })} />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.emergencial} onChange={(e) => setForm({ ...form, emergencial: e.target.checked })} />
          Marcar como emergencial
        </label>

        <div>
          <label className="label">Valor Estimado (R$)</label>
          <input type="number" min="0" step="0.01" className="input" placeholder="0,00" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} />
        </div>

        {submitResult && (
          <div
            className={`rounded-lg border p-4 flex gap-3 ${
              submitResult.success
                ? 'bg-success/10 border-success/30'
                : 'bg-danger/10 border-danger/30'
            }`}
          >
            {submitResult.success ? (
              <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${submitResult.success ? 'text-success' : 'text-danger'}`}>
                {submitResult.message}
              </p>
              {submitResult.details && (
                <div className="mt-2 text-xs text-slate space-y-1">
                  <p>📋 Cliente: {submitResult.details.cliente}</p>
                  <p>📍 Endereço: {submitResult.details.endereco}</p>
                  <p>🔔 Engenheiros notificados: {submitResult.details.engenheirosNotificados}</p>
                  <p>⏱️ Timer de expiração: {submitResult.details.timerExpiracao}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!form.cliente_id || !form.tipo_servico || !form.endereco || !form.lat || !form.lng || geocoding || geocodeError !== '' || submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Criando OS...
            </>
          ) : (
            'Enviar para Engenheiros Próximos'
          )}
        </Button>
      </div>
    </div>
  )
}
