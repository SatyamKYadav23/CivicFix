/**
 * StatCard Component
 * Displays a single key operational metric or statistic block.
 */
export function StatCard({
  label,
  value,
  subtitle,
  icon,
  iconVariant = 'primary',
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  onClick,
  className = '',
}) {
  const isClickable = Boolean(onClick)
  const iconClass = `cf-stat-card-icon-wrap cf-stat-icon-${iconVariant}`
  const trendClass = `cf-stat-trend cf-stat-trend-${trendDirection}`

  return (
    <div
      className={`cf-stat-card ${isClickable ? 'is-clickable' : ''} ${className}`.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className="cf-stat-card-top">
        <span className="cf-stat-card-label">{label}</span>
        {icon && <div className={iconClass} aria-hidden="true">{icon}</div>}
      </div>

      <div className="cf-stat-card-value">{value}</div>

      <div className="cf-stat-card-bottom">
        {subtitle && <span>{subtitle}</span>}
        {trend && (
          <span className={trendClass}>
            {trendDirection === 'up' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '2px' }}><polyline points="18 15 12 9 6 15"/></svg>
            )}
            {trendDirection === 'down' && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '2px' }}><polyline points="6 9 12 15 18 9"/></svg>
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

