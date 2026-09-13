import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { complaintService } from '../../services/complaintService.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { ComplaintStatus, ComplaintPriority, ComplaintTimeline, AssignWorkerModal, LocationPickerMap, formatCoordinates } from '../../components/complaint/index.js'
import { formatDate, formatDateTime, getAssetUrl } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '../../utils/constants.js'

export function AuthorityComplaintDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const [complaint, setComplaint] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')

  // Inline note state for completion review
  const [rejectionNote, setRejectionNote] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

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
      (data) => { if (isCurrent) { setComplaint(data); setIsLoading(false) } },
      (err) => { if (isCurrent) { setError(err.message || 'Unable to load complaint.'); setIsLoading(false) } }
    )
    return () => { isCurrent = false }
  }, [id])

  const actor = { name: user?.name || 'Authority Officer', role: 'AUTHORITY' }

  const handlePriorityChange = async (newPriority) => {
    if (!complaint || complaint.priority === newPriority) return
    setIsUpdatingPriority(true)
    setActionSuccess('')
    setActionError('')
    try {
      const updated = await complaintService.updateStatus(
        id,
        complaint.status,
        `Priority escalated to ${newPriority} by ${actor.name}.`,
        actor
      )
      setComplaint({ ...updated, priority: newPriority })
      setActionSuccess(`Priority updated to ${newPriority}.`)
    } catch (err) {
      setActionError(err.message || 'Failed to update priority.')
    } finally {
      setIsUpdatingPriority(false)
    }
  }

  const handleUpdateStatus = async (targetStatus, note) => {
    setActionError('')
    try {
      const updated = await complaintService.updateStatus(id, targetStatus, note, actor)
      setComplaint(updated)
      setActionSuccess(`Status updated to ${targetStatus}.`)
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setActionError(err.message || 'Failed to update status.')
    }
  }

  /**
   * §27 — Authority reviews worker's completed task.
   * Approve: complaint becomes CLOSED.
   * Reject: complaint reverts to IN_PROGRESS for rework.
   */
  const handleApproveCompletion = async () => {
    setIsReviewing(true)
    setActionError('')
    try {
      const updated = await complaintService.updateStatus(
        id,
        COMPLAINT_STATUSES.CLOSED,
        `Completion approved by ${actor.name}. Docket closed.`,
        actor
      )
      setComplaint(updated)
      setActionSuccess('Repair verified. Docket officially closed.')
    } catch (err) {
      setActionError(err.message || 'Failed to approve completion.')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleRejectCompletion = async () => {
    if (!rejectionNote.trim()) {
      setActionError('Please provide a reason for rejection before submitting.')
      return
    }
    setIsReviewing(true)
    setActionError('')
    try {
      const updated = await complaintService.updateStatus(
        id,
        COMPLAINT_STATUSES.IN_PROGRESS,
        `Completion rejected by ${actor.name}. Reason: ${rejectionNote.trim()}. Task returned for rework.`,
        actor
      )
      setComplaint(updated)
      setShowRejectionForm(false)
      setRejectionNote('')
      setActionSuccess('Completion rejected. Task has been returned to the technician for rework.')
    } catch (err) {
      setActionError(err.message || 'Failed to reject completion.')
    } finally {
      setIsReviewing(false)
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
        title="Complaint Not Found"
        description={error || `Could not locate grievance reference: ${id}`}
        onRetry={loadComplaint}
      />
    )
  }

  const isClosedOrRejected =
    complaint.status === COMPLAINT_STATUSES.CLOSED ||
    complaint.status === COMPLAINT_STATUSES.REJECTED ||
    complaint.status === COMPLAINT_STATUSES.DUPLICATE

  const hasPendingCompletionReview = complaint.status === COMPLAINT_STATUSES.RESOLVED

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="cf-page-header">
        <div>
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <Link
              to="/authority/complaints"
              style={{ textDecoration: 'none', color: 'var(--color-primary-600)', fontWeight: 600 }}
            >
              ← Back to Complaint Queue
            </Link>
          </div>
          <h1 className="cf-page-title">{complaint.title}</h1>
          <p className="cf-page-subtitle">
            Docket Reference: <strong>{complaint.id}</strong> &nbsp;•&nbsp; Logged on{' '}
            {formatDate(complaint.createdAt)}
          </p>
        </div>
        <div className="cf-inline-wrap">
          <ComplaintPriority priority={complaint.priority} />
          <ComplaintStatus status={complaint.status} />
          {!isClosedOrRejected && (
            <Button onClick={() => setShowAssignModal(true)}>
              {complaint.assignedWorker ? '👷 Reassign Technician' : '👷 Assign Technician'}
            </Button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
          }}
        >
          ✓ {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="cf-modal-error-box" style={{ marginBottom: 'var(--space-4)' }}>
          {actionError}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="cf-showcase-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        {/* Left Column */}
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {/* Grievance Information */}
          <Card title="Grievance Details">
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <strong>Reported By:</strong>
                <p style={{ marginTop: '2px', color: 'var(--color-neutral-800)' }}>
                  👤 {complaint.citizenName || 'Registered Citizen'}
                </p>
              </div>
              <div>
                <strong>Issue Description:</strong>
                <p style={{ marginTop: '2px', color: 'var(--color-neutral-800)', lineHeight: 1.6 }}>
                  {complaint.description || 'No supplementary details were provided by the citizen.'}
                </p>
              </div>
              <div className="cf-inline-wrap" style={{ gap: 'var(--space-6)' }}>
                <div>
                  <strong>Category:</strong>
                  <p style={{ marginTop: '2px' }}>🏷️ {complaint.category}</p>
                </div>
                <div>
                  <strong>Location:</strong>
                  <p style={{ marginTop: '2px' }}>📍 {
                    typeof complaint.location === 'object'
                      ? complaint.location.address || complaint.location.area
                      : complaint.location
                  }</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Geotagged Incident Location Map */}
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
          <Card title="Citizen's Photographic Evidence">
            {(() => {
              const photos = (Array.isArray(complaint.photos) && complaint.photos.length > 0)
                ? complaint.photos
                : (Array.isArray(complaint.evidence) && complaint.evidence.length > 0)
                ? complaint.evidence
                : (complaint.imageUrl ? [{ url: complaint.imageUrl, name: 'evidence.jpg' }] : [])

              if (photos.length === 0) {
                return (
                  <p style={{ color: 'var(--color-neutral-500)', fontSize: '0.875rem', margin: 0 }}>
                    No photographic evidence attached by the citizen.
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
                            alt={`Complaint evidence ${i + 1}`}
                            style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                          />
                        </a>
                        <div
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            color: 'var(--color-neutral-600)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {name || `evidence_${i + 1}.jpg`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </Card>

          {/* Assigned Technician */}
          {complaint.assignedWorker ? (
            <Card title="Assigned Field Technician">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '2.2rem' }}>👷</div>
                  <div>
                    <strong style={{ fontSize: '1.05rem' }}>{complaint.assignedWorker.name}</strong>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)' }}>
                      {complaint.assignedWorker.department || 'Field Division'}&nbsp;•&nbsp;
                      📞 {complaint.assignedWorker.phone || 'On record'}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(true)}>
                  Reassign
                </Button>
              </div>
            </Card>
          ) : (
            <Card title="Field Technician Assignment">
              <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-3)' }}>
                No technician has been dispatched for this complaint. Assign an available field worker to proceed.
              </p>
              <Button onClick={() => setShowAssignModal(true)}>
                Assign Field Technician
              </Button>
            </Card>
          )}

          {/* ── §27: Completion Review Panel ── */}
          {hasPendingCompletionReview && (
            <Card
              title="Technician Completion Review"
              style={{ border: '2px solid #86efac', background: '#f0fdf4' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    background: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3)',
                    fontSize: '0.875rem',
                    color: '#15803d',
                    fontWeight: 600,
                  }}
                >
                  ⏳ Pending your review — the assigned technician has submitted a completion report. Please verify the evidence below and either approve or return for rework.
                </div>

                {complaint.resolutionNotes && (
                  <div>
                    <span className="cf-rdc-label">Technician's Work Summary</span>
                    <p style={{ margin: '4px 0 0', color: '#166534', lineHeight: 1.6, fontWeight: 600 }}>
                      {complaint.resolutionNotes}
                    </p>
                  </div>
                )}

                {complaint.materialsUsed && (
                  <div>
                    <span className="cf-rdc-label">Parts & Materials Used</span>
                    <p style={{ margin: '2px 0 0', color: '#166534', fontSize: '0.875rem', fontWeight: 600 }}>
                      {complaint.materialsUsed}
                    </p>
                  </div>
                )}

                {Array.isArray(complaint.resolutionPhotos) && complaint.resolutionPhotos.length > 0 && (
                  <div>
                    <span className="cf-rdc-label">After-Work Photographic Evidence</span>
                    <div className="cf-wizard-thumbs-grid" style={{ marginTop: 'var(--space-2)' }}>
                      {complaint.resolutionPhotos.map((photo, i) => {
                        const rSrc = getAssetUrl(typeof photo === 'object' ? photo.previewUrl || photo.url : photo)
                        return (
                          <div key={i} className="cf-wizard-thumb-card" style={{ overflow: 'hidden' }}>
                            <a href={rSrc} target="_blank" rel="noopener noreferrer" title="Click to view full image">
                              <img
                                src={rSrc}
                                alt="Completion evidence"
                                className="cf-wtc-img"
                              />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Review Actions */}
                {!showRejectionForm ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      paddingTop: 'var(--space-3)',
                      borderTop: '1px solid #bbf7d0',
                    }}
                  >
                    <Button
                      onClick={handleApproveCompletion}
                      loading={isReviewing}
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      ✓ Approve & Close Docket
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowRejectionForm(true)}
                      style={{ flex: 1 }}
                    >
                      Reject — Return for Rework
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid #bbf7d0' }}>
                    <div className="cf-form-group">
                      <label className="cf-form-label">Reason for Rejection *</label>
                      <textarea
                        rows={3}
                        className="cf-form-textarea"
                        placeholder="Specify what is missing or incorrect — e.g. Repair is incomplete. The junction box was not sealed and the light still flickers."
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="secondary"
                        onClick={() => { setShowRejectionForm(false); setRejectionNote('') }}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRejectCompletion}
                        loading={isReviewing}
                        style={{ flex: 1, background: '#dc2626' }}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Closed docket confirmation */}
          {complaint.status === COMPLAINT_STATUSES.CLOSED && (
            <Card title="Docket Status — Closed" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <p style={{ color: '#166534', fontWeight: 600, margin: 0 }}>
                ✓ This grievance has been resolved, verified, and officially closed. All repair records have been archived.
              </p>
            </Card>
          )}

          {/* Citizen Feedback */}
          {complaint.feedback && (
            <Card title="Citizen Satisfaction Review">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: '1.25rem' }}>{'⭐'.repeat(complaint.feedback.rating || 5)}</span>
                <strong>{complaint.feedback.rating} / 5 Stars</strong>
              </div>
              {complaint.feedback.comment && (
                <p style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic' }}>
                  "{complaint.feedback.comment}"
                </p>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', marginTop: 'var(--space-2)' }}>
                Submitted by {complaint.feedback.citizenName || 'Citizen'} on{' '}
                {formatDate(complaint.feedback.createdAt)}
              </div>
            </Card>
          )}

          {/* Officer Triage Panel */}
          {!isClosedOrRejected && !hasPendingCompletionReview && (
            <Card title="Officer Triage Controls">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>
                    Priority Level:
                  </label>
                  <Select
                    id="triage-priority"
                    value={complaint.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    disabled={isUpdatingPriority}
                    options={[
                      { value: COMPLAINT_PRIORITIES.LOW, label: 'Low — Standard SLA (48h)' },
                      { value: COMPLAINT_PRIORITIES.MEDIUM, label: 'Medium — Elevated SLA (24h)' },
                      { value: COMPLAINT_PRIORITIES.HIGH, label: 'High — Urgent SLA (12h)' },
                      { value: COMPLAINT_PRIORITIES.CRITICAL, label: 'Critical — Emergency SLA (6h)' },
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                    Triage Actions:
                  </label>
                  <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)' }}>
                    {complaint.status === COMPLAINT_STATUSES.REPORTED && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(
                            COMPLAINT_STATUSES.UNDER_REVIEW,
                            'Report verified and classified under departmental jurisdiction.'
                          )
                        }
                      >
                        Mark Under Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleUpdateStatus(
                          COMPLAINT_STATUSES.DUPLICATE,
                          'Identified as duplicate of an existing active complaint.'
                        )
                      }
                    >
                      Mark as Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleUpdateStatus(
                          COMPLAINT_STATUSES.REJECTED,
                          'Report falls outside municipal service jurisdiction.'
                        )
                      }
                    >
                      Reject Complaint
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Timeline */}
        <div>
          <Card title="Complaint Lifecycle Timeline">
            <ComplaintTimeline events={complaint.timeline} currentStatus={complaint.status} />
          </Card>
        </div>
      </div>

      {/* Assign Worker Modal */}
      <AssignWorkerModal
        isOpen={showAssignModal}
        complaint={complaint}
        onClose={() => setShowAssignModal(false)}
        onAssigned={(complaintId, worker) => {
          loadComplaint()
          setActionSuccess(`Technician ${worker?.name || ''} has been dispatched to docket ${complaintId}.`)
        }}
      />
    </div>
  )
}
