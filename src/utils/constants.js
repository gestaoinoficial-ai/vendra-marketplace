export const COLORS = {
  navy: '#0E1528',
  gold: '#C9A84C',
  steel: '#C8CDD6',
  success: '#2E9E6B',
  danger: '#D64F2D',
  amber: '#D99A2B',
  blue: '#3B7DD8',
  purple: '#7B61C9',
  slate: '#7B8FA6',
  bg: '#F2F4F7',
}

// Ordem = ordem real do ciclo de vida da OS. Cada etapa (exceto "pendente",
// que já é coberta por data_criacao) tem uma coluna de timestamp própria,
// gravada automaticamente quando o operador avança o status manualmente.
export const OS_STATUS = {
  pendente: { label: 'Pendente', color: 'steel', icon: '⚪' },
  aceito: { label: 'Aceito', color: 'blue', icon: '🔵', timestampField: 'data_aceita' },
  relatorio_recebido: { label: 'Relatório Recebido', color: 'purple', icon: '🟣', timestampField: 'relatorio_recebido_em' },
  enviado_cliente: { label: 'Enviado ao Cliente', color: 'amber', icon: '🟠', timestampField: 'enviado_cliente_em' },
  aceito_cliente: { label: 'Aceito pelo Cliente', color: 'success', icon: '✅', timestampField: 'aceito_cliente_em' },
}

export const OS_STATUS_ORDER = Object.keys(OS_STATUS)

export const PROPOSTA_STATUS = {
  enviada: { label: 'Pendente', color: 'amber', badge: '📋' },
  aceita: { label: 'Aceita', color: 'success', badge: '✅' },
  recusada: { label: 'Recusada', color: 'steel', badge: '❌' },
  expirada: { label: 'Expirada', color: 'danger', badge: '⏰' },
}

export const TIPO_SERVICO_OPTIONS = [
  { value: 'vistoria', label: 'Vistoria' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'gerenciamento', label: 'Gerenciamento' },
  { value: 'orcamento', label: 'Orçamento' },
]

// Renomeado de "Criticidade" para "Prioridade" na UI. Mantém o nome da coluna
// no banco (criticidade) pra não exigir renomear coluna — só os valores mudaram.
export const CRITICIDADE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'emergencial', label: 'Emergencial' },
]

// Renomeado de "Tipo de Ocorrência" para "Escopo da Vistoria".
export const TIPO_OCORRENCIA_OPTIONS = [
  { value: 'eletrica_vandalismo', label: 'Elétrica / Vandalismo' },
  { value: 'civil_eletrica', label: 'Civil / Elétrica' },
  { value: 'civil_vandalismo', label: 'Civil / Vandalismo' },
  { value: 'eletrica_ar_condicionado', label: 'Elétrica / Ar Condicionado' },
  { value: 'civil_infiltracao', label: 'Civil / Infiltração' },
  { value: 'civil_telhado', label: 'Civil / Telhado' },
  { value: 'eletrica_manutencao', label: 'Elétrica / Manutenção' },
  { value: 'outros', label: 'Outros' },
]

export const PROPOSAL_TIMEOUT_MINUTES = 20
export const DISPATCH_RADIUS_KM = 100
