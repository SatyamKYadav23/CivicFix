export function Badge({ variant = 'neutral', children, className = '' }) {
  return <span className={`cf-badge cf-badge-${variant} ${className}`.trim()}>{children}</span>
}
