export function IconButton({ label, children, variant = 'ghost', className = '', ...props }) {
  return (
    <button className={`cf-icon-button cf-icon-button-${variant} ${className}`.trim()} aria-label={label} type="button" {...props}>
      {children}
    </button>
  )
}
