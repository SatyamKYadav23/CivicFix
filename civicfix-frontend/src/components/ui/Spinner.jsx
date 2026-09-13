export function Spinner({ size = 'md', label = 'Loading', className = '' }) {
  return (
    <span className={`cf-spinner cf-spinner-${size} ${className}`.trim()} role="status" aria-label={label}>
      <span className="cf-sr-only">{label}</span>
    </span>
  )
}
