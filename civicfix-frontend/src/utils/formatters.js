/**
 * Formats an ISO date or timestamp into a readable date string (e.g. "Aug 24, 2026")
 */
export function formatDate(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return String(dateInput)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats a date with time (e.g. "Aug 24, 2026, 10:30 AM")
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return String(dateInput)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Returns humanized relative time (e.g. "2 hours ago", "Just now", "Yesterday")
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return String(dateInput)

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) {
    return 'Yesterday'
  }
  if (diffInDays < 30) {
    return `${diffInDays}d ago`
  }
  return formatDate(date)
}

/**
 * Truncates text cleanly with an ellipsis
 */
export function truncateText(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text || ''
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Capitalizes the first letter of each word
 */
export function capitalizeWords(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Resolves static or uploaded asset URLs with backend server origin
 */
export function getAssetUrl(url) {
  if (!url) return ''
  if (typeof url !== 'string') {
    url = url.previewUrl || url.url || url.preview || ''
  }
  if (!url || typeof url !== 'string') return ''
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url
  }
  const apiBase =
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    'http://localhost:5000/api'
  const backendHost = apiBase.replace(/\/api\/?$/, '')
  return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`
}



