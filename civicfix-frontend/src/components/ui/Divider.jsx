export function Divider({ vertical = false, className = '' }) {
  return <span className={`cf-divider ${vertical ? 'is-vertical' : ''} ${className}`.trim()} aria-hidden="true" />
}
