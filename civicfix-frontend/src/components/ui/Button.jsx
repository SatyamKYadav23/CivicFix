export function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  className = '',
  ...props
}) {
  const classes = [
    'cf-button',
    `cf-button-${variant}`,
    `cf-button-${size}`,
    fullWidth ? 'cf-button-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading ? <span className="cf-button-spinner" aria-hidden="true" /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  )
}
