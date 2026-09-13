import { getAssetUrl } from '../../utils/formatters.js'

function initialsFromName(name) {
  if (!name) {
    return 'CF'
  }

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'CF'
}

export function Avatar({ src, alt, name, size = 'md', className = '' }) {
  const classes = `cf-avatar cf-avatar-${size} ${className}`.trim()
  if (src) {
    return <img className={classes} src={getAssetUrl(src)} alt={alt || name || 'User avatar'} />
  }

  return (
    <span className={classes} role="img" aria-label={alt || name || 'User avatar'}>
      {initialsFromName(name)}
    </span>
  )
}
