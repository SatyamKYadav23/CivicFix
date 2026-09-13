import { getStatusLabel } from '../../utils/complaintHelpers.js'

/**
 * ComplaintStatus Component
 * Displays a clean text-based color-coded status badge.
 */
export function ComplaintStatus({ status, className = '' }) {
  const label = getStatusLabel(status)
  const normalized = (status || 'reported').toLowerCase().replace(/\s+/g, '_')
  const statusClass = `cf-status-pill cf-status-pill-${normalized} ${className}`.trim()

  return (
    <span
      className={statusClass}
      role="status"
      aria-label={`Complaint Status: ${label}`}
    >
      {label}
    </span>
  )
}
