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

export function whatsappLink(telefone) {
  if (!telefone) return null
  const digits = telefone.replace(/\D/g, '')
  if (!digits) return null
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountryCode}`
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
