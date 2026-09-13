import civicFixLogo from '../../assets/image.png'

export function CivicFixLogo({ className = 'cf-brand-img', title = 'CivicFix', alt = 'CivicFix', ...props }) {
  return (
    <img
      src={civicFixLogo}
      alt={alt || title}
      className={className}
      {...props}
    />
  )
}

