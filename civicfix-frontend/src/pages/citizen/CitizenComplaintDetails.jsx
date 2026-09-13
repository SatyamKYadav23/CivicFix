import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { complaintService } from '../../services/complaintService.js'
import { feedbackService } from '../../services/feedbackService.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Textarea } from '../../components/ui/Textarea.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { ComplaintStatus, ComplaintPriority, ComplaintTimeline, LocationPickerMap, formatCoordinates } from '../../components/complaint/index.js'
import { formatDate, formatDateTime, getAssetUrl } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'

export function CitizenComplaintDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const [complaint, setComplaint] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Feedback form state
  const [rating, setRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  const loadComplaint = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await complaintService.getComplaintById(id)
      setComplaint(data)
    } catch (err) {
      setError(err.message || 'Unable to load complaint details.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    let isCurrent = true
    complaintService.getComplaintById(id).then(
      (data) => {
        if (isCurrent) {
          setComplaint(data)
          setIsLoading(false)
        }
      },
      (err) => {
        if (isCurrent) {
          setError(err.message || 'Unable to load complaint details.')
          setIsLoading(false)
        }
      }
    )
    return () => {
      isCurrent = false
    }
  }, [id])

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingFeedback(true)
    try {
      const updated = await feedbackService.submitFeedback(
        id,
        rating,
        feedbackComment,
        user?.name || 'Citizen'
      )
      setComplaint(updated)
      setFeedbackSuccess(true)
    } catch (err) {
      alert(err.message || 'Failed to submit feedback.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner />
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <ErrorState
        title="Complaint not found"
        description={error || `Could not find complaint reference: ${id}`}
        onRetry={loadComplaint}
      />
    )
  }

  const isResolved = complaint.status === COMPLAINT_STATUSES.RESOLVED
  const hasFeedback = Boolean(complaint.feedback)

  return (
    <div className="cf-complaint-details-page">
      {/* Header */}
      <div className="cf-page-header">
        <div>
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <Link
              to="/citizen/complaints"
              style={{ textDecoration: 'none', color: 'var(--color-primary-600)', fontWeight: 600 }}
            >
              ← Back to My Complaints
            </Link>
          </div>
          <h1 className="cf-page-title">{complaint.title}</h1>
          <p className="cf-page-subtitle">
            Docket ID: <strong>{complaint.id}</strong> • Reported on {formatDate(complaint.createdAt)}
          </p>
        </div>
        <div className="cf-inline-wrap">
          <ComplaintPriority priority={complaint.priority} />
          <ComplaintStatus status={complaint.status} />
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="cf-showcase-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {/* Main Description & Location */}
          <Card title="Complaint Overview">
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <strong>Description:</strong>
                <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-neutral-800)', lineHeight: 1.5 }}>
                  {complaint.description || 'No additional descriptive text provided.'}
                </p>
              </div>

              <div className="cf-inline-wrap" style={{ gap: 'var(--space-6)' }}>
                <div>
                  <strong>Category:</strong>
                  <p style={{ marginTop: 'var(--space-1)' }}>🏷️ {complaint.category}</p>
                </div>
                <div>
                  <strong>Location / Landmark:</strong>
                  <p style={{ marginTop: 'var(--space-1)' }}>📍 {complaint.location}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Geotagged Incident Map Card */}
          {complaint.coordinates && (
            <Card title="Geotagged Incident Location">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)' }}>
                    GPS: <strong>{formatCoordinates(complaint.coordinates.lat, complaint.coordinates.lng)}</strong>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${complaint.coordinates.lat},${complaint.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
                <LocationPickerMap
                  value={complaint.coordinates}
                  readOnly={true}
                  height="220px"
                />
              </div>
            </Card>
          )}

          {/* Photo Evidence */}
          <Card title="Photo Evidence">
            {(() => {
              const photos = (Array.isArray(complaint.photos) && complaint.photos.length > 0)
                ? complaint.photos
                : (Array.isArray(complaint.evidence) && complaint.evidence.length > 0)
                ? complaint.evidence
                : (complaint.imageUrl ? [{ url: complaint.imageUrl, name: 'evidence.jpg' }] : [])

              if (photos.length === 0) {
                return (
                  <p style={{ color: 'var(--color-neutral-500)', fontSize: '0.875rem', margin: 0 }}>
                    No photos attached to this complaint.
                  </p>
                )
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
                  {photos.map((photo, i) => {
                    const rawSrc = typeof photo === 'object' ? photo.previewUrl || photo.url || photo.preview : photo
                    const src = getAssetUrl(rawSrc)
                    const name = typeof photo === 'object' ? photo.name : `evidence_${i + 1}.jpg`
                    return (
                      <div
                        key={i}
                        style={{
                          border: '1px solid var(--color-neutral-200)',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--color-neutral-100)',
                        }}
                      >
                        <a href={src} target="_blank" rel="noopener noreferrer" title="Click to view full image">
                          <img
                            src={src}
                            alt={`Complaint Evidence ${i + 1}`}
                            style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                          />
                        </a>
                        <div style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-neutral-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name || `evidence_${i + 1}.jpg`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </Card>

          {/* Assigned Field Technician */}
          {complaint.assignedWorker && (
            <Card title="Assigned Field Technician">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ fontSize: '2.5rem' }}>👷</div>
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{complaint.assignedWorker.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-600)', marginTop: '2px' }}>
                    {complaint.assignedWorker.department || 'Municipal Field Operations'}
                    {complaint.assignedWorker.phone && ` • 📞 ${complaint.assignedWorker.phone}`}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Resolution Details */}
          {complaint.resolution && (
            <Card title="Resolution Notes" className="cf-complaint-card-high" style={{ borderColor: 'var(--color-success-600)' }}>
              <p style={{ color: 'var(--color-neutral-800)', lineHeight: 1.5 }}>{complaint.resolution.notes}</p>
              {complaint.resolution.resolvedAt && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)' }}>
                  Resolved on: {formatDateTime(complaint.resolution.resolvedAt)}
                </div>
              )}
              {Array.isArray(complaint.resolutionPhotos) && complaint.resolutionPhotos.length > 0 && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-600)', textTransform: 'uppercase', display: 'block', marginBottom: 'var(--space-2)' }}>
                    After-Work Proof Photos
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
                    {complaint.resolutionPhotos.map((photo, i) => {
                      const resSrc = getAssetUrl(typeof photo === 'object' ? photo.previewUrl || photo.url : photo)
                      return (
                        <div key={i} style={{ border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                          <a href={resSrc} target="_blank" rel="noopener noreferrer">
                            <img src={resSrc} alt={`Resolution evidence ${i + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Citizen Feedback Form (Unlocks upon RESOLVED) */}
          {isResolved && !hasFeedback && (
            <Card title="Provide Resolution Feedback">
              <p style={{ marginBottom: 'var(--space-3)', color: 'var(--color-neutral-700)', lineHeight: 1.4 }}>
                Your issue has been marked resolved by the field team. Please inspect the completed work and rate the resolution:
              </p>

              <form onSubmit={handleFeedbackSubmit}>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                    Satisfaction Rating
                  </label>
                  <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          fontSize: '1.6rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: rating >= star ? '#f59e0b' : '#d1d5db',
                          transition: 'color 100ms',
                          padding: 0,
                          lineHeight: 1,
                        }}
                        aria-label={`${star} star`}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-700)', marginLeft: 'var(--space-2)' }}>
                      {rating} out of 5 Stars
                    </span>
                  </div>
                </div>

                <Textarea
                  id="feedback-comment"
                  label="Comments & Citizen Feedback"
                  rows={3}
                  placeholder="Share details about the fix quality, response time, and technician conduct..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Button type="submit" loading={isSubmittingFeedback}>
                    Submit Rating & Close Complaint
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Display Submitted Feedback */}
          {hasFeedback && (
            <Card title="Your Submitted Feedback" style={{ background: 'var(--color-neutral-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>
                  {'★'.repeat(complaint.feedback.rating || 5)}
                  {'☆'.repeat(5 - (complaint.feedback.rating || 5))}
                </span>
                <strong>{complaint.feedback.rating} / 5 Stars</strong>
              </div>
              {complaint.feedback.comment && (
                <p style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{complaint.feedback.comment}"
                </p>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)' }}>
                Submitted by {complaint.feedback.citizenName || 'Citizen'} on {formatDate(complaint.feedback.createdAt)}
              </div>
            </Card>
          )}

          {feedbackSuccess && (
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
              ✓ Thank you! Your feedback has been recorded and the complaint is permanently closed.
            </div>
          )}
        </div>

        {/* Timeline Column */}
        <div>
          <Card title="Lifecycle & Resolution Timeline">
            <ComplaintTimeline
              events={complaint.timeline}
              currentStatus={complaint.status}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
