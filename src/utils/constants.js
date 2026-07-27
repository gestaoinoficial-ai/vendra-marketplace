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

export const OS_STATUS = {
  nova: { label: 'Nova', color: 'steel', icon: '⚪' },
  enviada: { label: 'Enviada', color: 'blue', icon: '🔵' },
  aceita: { label: 'Aceita', color: 'purple', icon: '🟣' },
  em_andamento: { label: 'Em andamento', color: 'success', icon: '🟢' },
  concluida: { label: 'Concluída', color: 'success', icon: '✅' },
  cancelada: { label: 'Cancelada', color: 'steel', icon: '⚫' },
  em_revisao: { label: 'Em revisão', color: 'amber', icon: '🟠' },
  atrasada: { label: 'Atrasada', color: 'danger', icon: '🔴' },
}

export const PROPOSTA_STATUS = {
  enviada: { label: 'Pendente', color: 'amber', badge: '📋' },
  aceita: { label: 'Aceita', color: 'success', badge: '✅' },
  recusada: { label: 'Recusada', color: 'steel', badge: '❌' },
  expirada: { label: 'Expirada', color: 'danger', badge: '⏰' },
}

export const PRIORIDADE_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'emergencial', label: 'Emergencial' },
]

export const TIPO_SERVICO_OPTIONS = [
  { value: 'vistoria', label: 'Vistoria' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'gerenciamento', label: 'Gerenciamento' },
  { value: 'orcamento', label: 'Orçamento' },
]

export const CRITICIDADE_OPTIONS = [
  { value: 'manutencao_emergencial', label: 'Manutenção Emergencial' },
  { value: 'manutencao_nao_emergencial', label: 'Manutenção Não-Emergencial' },
]

export const TIPO_OCORRENCIA_OPTIONS = [
  { value: 'vazamento_cronico', label: 'Vazamento Crônico' },
  { value: 'vandalismo', label: 'Vandalismo' },
  { value: 'incendio', label: 'Incêndio' },
  { value: 'curto_circuito', label: 'Curto Circuito' },
  { value: 'inundacao', label: 'Inundação' },
  { value: 'alagamento', label: 'Alagamento' },
  { value: 'operacao', label: 'Operação' },
  { value: 'acao_orgao_controlador', label: 'Ação de Órgão Controlador' },
  { value: 'outros', label: 'Outros' },
]

export const GRAU_OPTIONS = [
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Médio' },
  { value: 'baixo', label: 'Baixo' },
]

export const PROGNOSE_OPTIONS = [
  { value: 'falta_manutencao', label: 'Falta de Manutenção' },
  { value: 'desgaste_natural', label: 'Desgaste Natural' },
  { value: 'explosao', label: 'Explosão' },
  { value: 'vandalismo', label: 'Vandalismo' },
  { value: 'intemperies', label: 'Intempéries' },
  { value: 'incendio', label: 'Incêndio' },
  { value: 'outros', label: 'Outros' },
]

export const PROPOSAL_TIMEOUT_MINUTES = 20
export const DISPATCH_RADIUS_KM = 100
