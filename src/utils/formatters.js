import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateString, pattern = 'dd/MM/yyyy HH:mm') {
  if (!dateString) return '—'
  return format(new Date(dateString), pattern, { locale: ptBR })
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—'
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR })
}

export function formatCountdown(totalSeconds) {
  const clamped = Math.max(0, totalSeconds)
  const minutes = Math.floor(clamped / 60)
  const seconds = Math.floor(clamped % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function whatsappLink(telefone, message) {
  if (!telefone) return null
  const digits = telefone.replace(/\D/g, '')
  if (!digits) return null
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  const base = `https://wa.me/${withCountryCode}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? value ?? '—'
}

export function buildDispatchMessage({
  parceiroNome,
  numeroOs,
  clienteNome,
  endereco,
  criticidade,
  criticidadeLabel,
  tipoOcorrenciaLabel,
  descricao,
}) {
  const lines = [
    `Olá ${parceiroNome}! Temos uma nova demanda para você:`,
    '',
    `📋 OS: ${numeroOs}`,
    `🏢 Cliente: ${clienteNome}`,
    `📍 Endereço: ${endereco}`,
    `⚠️ Criticidade: ${criticidadeLabel}`,
    `🔧 Ocorrência: ${tipoOcorrenciaLabel}`,
  ]

  if (descricao && descricao.trim()) {
    lines.push(`📝 Descrição: ${descricao.trim()}`)
  }

  lines.push('')
  lines.push(
    criticidade === 'manutencao_emergencial'
      ? 'Você tem 20 minutos para confirmar disponibilidade. Pode atender?'
      : 'Por favor, confirme sua disponibilidade assim que possível.'
  )

  return lines.join('\n')
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
