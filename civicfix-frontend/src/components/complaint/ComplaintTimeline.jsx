import { formatDateTime, getAssetUrl } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'

const STANDARD_STEPS = [
  { status: COMPLAINT_STATUSES.REPORTED, title: 'Complaint Reported' },
  { status: COMPLAINT_STATUSES.UNDER_REVIEW, title: 'Under Review' },
  { status: COMPLAINT_STATUSES.ASSIGNED, title: 'Worker Assigned' },
  { status: COMPLAINT_STATUSES.IN_PROGRESS, title: 'Work In Progress' },
  { status: COMPLAINT_STATUSES.RESOLVED, title: 'Resolved' },
  { status: COMPLAINT_STATUSES.CLOSED, title: 'Closed' },
]

/**
 * ComplaintTimeline Component
 * Displays the complete lifecycle and history of actions performed on a complaint.
 */
export function ComplaintTimeline({
  events = [],
  currentStatus = COMPLAINT_STATUSES.REPORTED,
  className = '',
}) {
  // If custom events list is provided, render custom event stream
  const isCustomEventList = events && events.length > 0

  // Calculate status progression index
  const statusOrder = [
    COMPLAINT_STATUSES.REPORTED,
    COMPLAINT_STATUSES.UNDER_REVIEW,
    COMPLAINT_STATUSES.ASSIGNED,
    COMPLAINT_STATUSES.IN_PROGRESS,
    COMPLAINT_STATUSES.RESOLVED,
    COMPLAINT_STATUSES.CLOSED,
  ]

  const isTerminalSpecial =
    currentStatus === COMPLAINT_STATUSES.REJECTED || currentStatus === COMPLAINT_STATUSES.DUPLICATE

  const currentIndex = statusOrder.indexOf(currentStatus)

  // Build steps array
  const stepsToRender = isCustomEventList
    ? events
    : STANDARD_STEPS.map((step, index) => {
        let state = 'pending'
        if (isTerminalSpecial) {
          state = index === 0 ? 'completed' : 'pending'
        } else if (index < currentIndex) {
          state = 'completed'
        } else if (index === currentIndex) {
          state = 'active'
        }

        return {
          id: step.status,
          title: step.title,
          state,
          timestamp: null,
          actor: null,
          notes: null,
        }
      })

  return (
    <div className={`cf-timeline ${className}`.trim()} role="list" aria-label="Complaint progress history">
      {stepsToRender.map((step, index) => {
        const isLast = index === stepsToRender.length - 1
        const itemState = step.state || 'pending'
        const isCompleted = itemState === 'completed'
        const isActive = itemState === 'active'
        const isDanger = itemState === 'danger' || step.status === COMPLAINT_STATUSES.REJECTED

        let itemModifier = 'cf-timeline-item-pending'
        if (isDanger) itemModifier = 'cf-timeline-item-danger'
        else if (isCompleted) itemModifier = 'cf-timeline-item-completed'
        else if (isActive) itemModifier = 'cf-timeline-item-active'

        return (
          <div key={step.id || step.status || index} className={`cf-timeline-item ${itemModifier}`} role="listitem">
            <div className="cf-timeline-axis">
              <div className="cf-timeline-dot" aria-hidden="true">
                {isCompleted ? '✓' : isDanger ? '✕' : index + 1}
              </div>
              {!isLast && <div className="cf-timeline-connector" />}
            </div>

            <div className="cf-timeline-body">
              <div className="cf-timeline-header">
                <div className="cf-timeline-title">
                  {step.title}
                  {isActive && <span className="cf-sr-only"> (Current Step)</span>}
                </div>
                {step.timestamp && (
                  <time className="cf-timeline-timestamp" dateTime={new Date(step.timestamp).toISOString()}>
                    {formatDateTime(step.timestamp)}
                  </time>
                )}
              </div>

              {step.actor && <div className="cf-timeline-actor">By: {step.actor}</div>}

              {step.notes && <div className="cf-timeline-notes">{step.notes}</div>}

              {step.evidence && step.evidence.length > 0 && (
                <div className="cf-timeline-evidence-grid">
                  {step.evidence.map((imgUrl, i) => {
                    const rawSrc = typeof imgUrl === 'object' ? imgUrl.previewUrl || imgUrl.url || imgUrl.preview : imgUrl
                    const src = getAssetUrl(rawSrc)
                    return (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" title="Click to view full image">
                        <img
                          src={src}
                          alt={`Evidence ${i + 1}`}
                          className="cf-timeline-evidence-thumb"
                        />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

