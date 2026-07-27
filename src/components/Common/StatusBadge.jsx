const COLOR_CLASSES = {
  steel: 'bg-steel/20 text-slate',
  blue: 'bg-blue/15 text-blue',
  purple: 'bg-purple/15 text-purple',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
  amber: 'bg-amber/15 text-amber',
}

export default function StatusBadge({ statusKey, statusMap, fallbackLabel }) {
  const config = statusMap[statusKey]

  if (!config) {
    return <span className="badge bg-steel/20 text-slate">{fallbackLabel ?? statusKey ?? '—'}</span>
  }

  return (
    <span className={`badge ${COLOR_CLASSES[config.color] ?? COLOR_CLASSES.steel}`}>
      {config.icon ?? config.badge ?? ''} {config.label}
    </span>
  )
}
