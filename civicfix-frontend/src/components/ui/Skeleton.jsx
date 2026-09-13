export function Skeleton({ width = '100%', height = '1rem', circle = false, className = '' }) {
  return (
    <span
      className={`cf-skeleton ${circle ? 'is-circle' : ''} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
