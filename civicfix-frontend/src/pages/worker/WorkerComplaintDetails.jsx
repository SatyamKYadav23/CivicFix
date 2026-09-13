import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { complaintService } from '../../services/complaintService.js'
import { workerService } from '../../services/workerService.js'
import { ComplaintStatus, ComplaintPriority, LocationPickerMap, formatCoordinates } from '../../components/complaint/index.js'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ErrorState } from '../../components/ui/ErrorState.jsx'
import { formatDate, formatRelativeTime, getAssetUrl } from '../../utils/formatters.js'
import { COMPLAINT_STATUSES } from '../../utils/constants.js'

export function WorkerComplaintDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [complaint, setComplaint] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState('')

  // Completion form state
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [materialsUsed, setMaterialsUsed] = useState('')
  const [proofPhotos, setProofPhotos] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadComplaint = () => {
    setIsLoading(true)
    setError(null)
    complaintService
      .getComplaintById(id)
      .then((data) => {
        if (!data) throw new Error(`Task reference ${id} not found.`)
        setComplaint(data)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load task details.')
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadComplaint()
  }, [id])

  const handleAcceptTask = async () => {
    setActionError('')
    setIsSubmitting(true)
    try {
      const updated = await workerService.acceptTask(id, user || { name: 'Field Technician' })
      setComplaint(updated)
    } catch (err) {
      setActionError(err.message || 'Failed to accept task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartWork = async () => {
    setActionError('')
    setIsSubmitting(true)
    try {
      const updated = await workerService.startWork(
        id,
        user || { name: 'Field Technician' },
        'Technician has arrived at the incident site and commenced repair operations.'
      )
      setComplaint(updated)
    } catch (err) {
      setActionError(err.message || 'Failed to start work.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    files.forEach((file, i) => {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target.result
        setProofPhotos((prev) => [
          ...prev,
          {
            id: `proof-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: `${(file.size / 1024).toFixed(0)} KB`,
            previewUrl: base64Url,
            url: base64Url,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index) => {
    setProofPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCompleteTask = async (e) => {
    e.preventDefault()
    setActionError('')
    if (!resolutionNotes.trim()) {
      setActionError('Please provide a summary of the work performed before submitting.')
      return
    }
    setIsSubmitting(true)
    try {
      const updated = await workerService.completeTask(
        id,
        {
          notes: resolutionNotes.trim(),
          materialsUsed: materialsUsed.trim(),
          proofPhotos: proofPhotos.length > 0 ? proofPhotos : [],
        },
        user || { name: 'Field Technician' }
      )
      setComplaint(updated)
    } catch (err) {
      setActionError(err.message || 'Failed to submit completion report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <ErrorState
        title="Task Not Found"
        description={error}
        onRetry={loadComplaint}
      />
    )
  }

  if (isLoading || !complaint) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner />
      </div>
    )
  }

  // Derive current step from status + taskStatus
  const taskStatus = complaint.taskStatus || null
  const isAssigned = complaint.status === COMPLAINT_STATUSES.ASSIGNED && taskStatus !== 'ACCEPTED'
  const isAccepted = complaint.status === COMPLAINT_STATUSES.ASSIGNED && taskStatus === 'ACCEPTED'
  const isInProgress = complaint.status === COMPLAINT_STATUSES.IN_PROGRESS
  const isResolved =
    complaint.status === COMPLAINT_STATUSES.RESOLVED ||
    complaint.status === COMPLAINT_STATUSES.CLOSED

  const locationStr =
    typeof complaint.location === 'object'
      ? complaint.location.address || complaint.location.area
      : complaint.location

  return (
    <div className="cf-worker-details-page">
      {/* ── Page Header ── */}
      <div className="cf-page-header">
        <div>
          <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span className="cf-complaint-card-id">{complaint.id}</span>
            <Badge variant="primary">{complaint.category || 'General'}</Badge>
            <ComplaintPriority priority={complaint.priority} />
            <ComplaintStatus status={complaint.status} />
          </div>
          <h1 className="cf-page-title">{complaint.title}</h1>
          <p className="cf-page-subtitle">
            Assigned repair order &nbsp;•&nbsp; SLA Target: Resolution within 48 hours
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/worker/complaints')}>
          ← My Task Queue
        </Button>
      </div>

      {/* ── Progress Steps Indicator ── */}
      <div className="cf-worker-steps-bar">
        {[
          { label: 'Task Assigned', done: true },
          { label: 'Accept Task', done: !isAssigned },
          { label: 'Start Work', done: isInProgress || isResolved },
          { label: 'Submit Completion', done: isResolved },
          { label: 'Authority Review', done: complaint.status === COMPLAINT_STATUSES.CLOSED },
        ].map((step, i, arr) => (
          <div key={i} className={`cf-wsb-step ${step.done ? 'is-done' : i === arr.findIndex((s) => !s.done) ? 'is-active' : ''}`}>
            <div className="cf-wsb-dot">{step.done ? '✓' : i + 1}</div>
            <span className="cf-wsb-label">{step.label}</span>
            {i < arr.length - 1 && <div className="cf-wsb-line" />}
          </div>
        ))}
      </div>

      <div className="cf-admin-split-grid">
        {/* ── Left: Incident Details ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Location & Citizen Info */}
          <div className="cf-admin-panel-card">
            <h3 className="cf-apc-title">Incident Location & Citizen Information</h3>
            <div className="cf-amc-details-grid">
              <div className="cf-amc-detail-item">
                <span className="label">Physical Address</span>
                <span className="val">📍 {locationStr || 'Location on record'}</span>
              </div>
              <div className="cf-amc-detail-item">
                <span className="label">Landmark / Reference</span>
                <span className="val">
                  {typeof complaint.location === 'object' && complaint.location.landmark
                    ? complaint.location.landmark
                    : 'Refer to docket description'}
                </span>
              </div>
              <div className="cf-amc-detail-item">
                <span className="label">Reported By</span>
                <span className="val">👤 {complaint.citizenName || 'Registered Citizen'}</span>
              </div>
              <div className="cf-amc-detail-item">
                <span className="label">Date Reported</span>
                <span className="val">{formatDate(complaint.createdAt)}</span>
              </div>
            </div>

            {complaint.coordinates && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)' }}>
                    GPS: <strong>{formatCoordinates(complaint.coordinates.lat, complaint.coordinates.lng)}</strong>
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${complaint.coordinates.lat},${complaint.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cf-btn cf-btn-secondary cf-btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    🧭 Navigate in Google Maps ↗
                  </a>
                </div>
                <LocationPickerMap
                  value={complaint.coordinates}
                  readOnly={true}
                  height="200px"
                />
              </div>
            )}
          </div>

          {/* Issue Description & Evidence */}
          <div className="cf-admin-panel-card">
            <h3 className="cf-apc-title">Issue Description & Citizen Evidence</h3>
            <p style={{ color: 'var(--color-neutral-800)', lineHeight: 1.65, marginTop: 'var(--space-2)' }}>
              {complaint.description || 'No additional description provided by citizen.'}
            </p>
            {(() => {
              const photos = (Array.isArray(complaint.photos) && complaint.photos.length > 0)
                ? complaint.photos
                : (Array.isArray(complaint.evidence) && complaint.evidence.length > 0)
                ? complaint.evidence
                : (complaint.imageUrl ? [{ url: complaint.imageUrl, name: 'evidence.jpg' }] : [])

              if (photos.length === 0) return null

              return (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <span className="cf-rdc-label">Citizen's Photographic Evidence ({photos.length})</span>
                  <div className="cf-wizard-thumbs-grid" style={{ marginTop: 'var(--space-2)' }}>
                    {photos.map((p, i) => {
                      const rawSrc = typeof p === 'object' ? p.previewUrl || p.url || p.preview : p
                      const src = getAssetUrl(rawSrc)
                      const name = typeof p === 'object' ? p.name : `evidence_${i + 1}.jpg`
                      return (
                        <div key={i} className="cf-wizard-thumb-card" style={{ overflow: 'hidden' }}>
                          <a href={src} target="_blank" rel="noopener noreferrer" title="Click to view full image">
                            <img
                              src={src}
                              alt={`Complaint evidence ${i + 1}`}
                              className="cf-wtc-img"
                              style={{ display: 'block' }}
                            />
                          </a>
                          {name && (
                            <div style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-neutral-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Completed resolution record */}
          {isResolved && complaint.resolutionNotes && (
            <div className="cf-admin-panel-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 className="cf-apc-title" style={{ color: '#14532d' }}>
                Submitted Completion Record
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <div>
                  <span className="cf-rdc-label">Work Summary</span>
                  <p style={{ margin: '4px 0 0', color: '#166534', lineHeight: 1.6 }}>
                    {complaint.resolutionNotes}
                  </p>
                </div>
                {complaint.materialsUsed && (
                  <div>
                    <span className="cf-rdc-label">Materials Used</span>
                    <p style={{ margin: '2px 0 0', color: '#166534', fontWeight: 600, fontSize: '0.875rem' }}>
                      {complaint.materialsUsed}
                    </p>
                  </div>
                )}
                {complaint.feedback && (
                  <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>
                    <span className="cf-rdc-label">Citizen Satisfaction Rating</span>
                    <div style={{ fontSize: '1.1rem', marginTop: '2px' }}>
                      {'⭐'.repeat(complaint.feedback.rating || 5)}{' '}
                      <span style={{ fontSize: '0.875rem', color: '#166534' }}>
                        ({complaint.feedback.rating}/5)
                      </span>
                    </div>
                    {complaint.feedback.comment && (
                      <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: '0.875rem', color: '#166534' }}>
                        "{complaint.feedback.comment}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Action Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {actionError && (
            <div className="cf-modal-error-box">{actionError}</div>
          )}

          {/* STEP 1: Accept Task */}
          {isAssigned && (
            <div
              className="cf-admin-panel-card"
              style={{ border: '2px solid var(--color-primary-400)', background: '#eff6ff' }}
            >
              <span className="cf-mc-badge" style={{ color: 'var(--color-primary-700)' }}>
                Step 1 of 3
              </span>
              <h3 className="cf-apc-title" style={{ color: 'var(--color-primary-900)', marginTop: 'var(--space-1)' }}>
                Accept Assigned Task
              </h3>
              <p style={{ color: 'var(--color-primary-800)', fontSize: '0.875rem', margin: 'var(--space-2) 0 var(--space-4)', lineHeight: 1.5 }}>
                Review the complaint details and confirm that you accept this repair assignment. This will notify the Authority Officer that you are handling this case.
              </p>
              <Button
                onClick={handleAcceptTask}
                loading={isSubmitting}
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                ✓ Accept Task Assignment
              </Button>
            </div>
          )}

          {/* STEP 2: Start Work */}
          {isAccepted && (
            <div
              className="cf-admin-panel-card"
              style={{ border: '2px solid #f59e0b', background: '#fffbeb' }}
            >
              <span className="cf-mc-badge" style={{ color: '#92400e' }}>
                Step 2 of 3
              </span>
              <h3 className="cf-apc-title" style={{ color: '#78350f', marginTop: 'var(--space-1)' }}>
                Commence Field Work
              </h3>
              <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 'var(--space-2) 0 var(--space-4)', lineHeight: 1.5 }}>
                Click below once you have arrived at the incident location and are ready to begin the repair. This will update the complaint status to <strong>In Progress</strong>.
              </p>
              <Button
                onClick={handleStartWork}
                loading={isSubmitting}
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700, background: '#d97706' }}
              >
                ▶ Mark Arrived & Start Repair
              </Button>
            </div>
          )}

          {/* STEP 3: Complete Work */}
          {isInProgress && (
            <div
              className="cf-admin-panel-card"
              style={{ border: '2px solid #86efac', background: '#f0fdf4' }}
            >
              <span className="cf-mc-badge" style={{ color: '#166534' }}>
                Step 3 of 3
              </span>
              <h3 className="cf-apc-title" style={{ color: '#14532d', marginTop: 'var(--space-1)' }}>
                Submit Completion Report
              </h3>
              <p style={{ color: '#166534', fontSize: '0.875rem', margin: 'var(--space-2) 0 var(--space-3)', lineHeight: 1.5 }}>
                Document the completed repair with a written summary and photographic evidence. This will submit the docket for Authority review.
              </p>

              {actionError && (
                <div className="cf-modal-error-box" style={{ marginBottom: 'var(--space-3)' }}>
                  {actionError}
                </div>
              )}

              <form
                onSubmit={handleCompleteTask}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              >
                <div className="cf-form-group">
                  <label className="cf-form-label">Work Completion Summary *</label>
                  <textarea
                    rows={4}
                    className="cf-form-textarea"
                    placeholder="Describe the repair work performed — e.g. Replaced 3 blown LED modules, restored cable junction, and conducted live circuit test. Street light operational."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="cf-form-group">
                  <label className="cf-form-label">Parts & Materials Consumed</label>
                  <input
                    type="text"
                    className="cf-form-input"
                    placeholder="e.g. 1× 70W LED Driver, 15m Copper Cable, 2× Junction Clamps"
                    value={materialsUsed}
                    onChange={(e) => setMaterialsUsed(e.target.value)}
                  />
                </div>

                <div className="cf-form-group">
                  <label className="cf-form-label">After-Work Photographic Evidence</label>
                  <div className="cf-wizard-dropzone">
                    <input
                      type="file"
                      id="worker-proof-upload"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="cf-hidden-input"
                    />
                    <label htmlFor="worker-proof-upload" className="cf-wz-drop-label" style={{ padding: 'var(--space-4)' }}>
                      <span className="cf-wd-icon">📷</span>
                      <span className="cf-wd-main">
                        <strong>Upload after-repair photos</strong>
                      </span>
                      <span className="cf-wd-sub">JPEG, PNG — maximum 10MB per file</span>
                    </label>
                  </div>
                  {proofPhotos.length > 0 && (
                    <div className="cf-wizard-thumbs-grid" style={{ marginTop: 'var(--space-2)' }}>
                      {proofPhotos.map((photo, i) => (
                        <div key={i} className="cf-wizard-thumb-card">
                          <img src={photo.previewUrl} alt={photo.name} className="cf-wtc-img" />
                          <button
                            type="button"
                            className="cf-wtc-del"
                            onClick={() => handleRemovePhoto(i)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    fontWeight: 800,
                    background: '#16a34a',
                    fontSize: '0.9375rem',
                  }}
                >
                  ✓ Submit & Mark Task Completed
                </Button>
              </form>
            </div>
          )}

          {/* Resolved — awaiting authority approval */}
          {isResolved && (
            <div
              className="cf-admin-panel-card"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>✅</div>
              <h3 style={{ color: '#14532d', margin: '0 0 var(--space-1)' }}>
                Completion Report Submitted
              </h3>
              <p style={{ color: '#166534', fontSize: '0.875rem', margin: '0 0 var(--space-3)', lineHeight: 1.5 }}>
                Your completion report is under review by the Department Authority Officer. The complaint will be officially closed upon their approval.
              </p>
              {complaint.status === COMPLAINT_STATUSES.CLOSED && (
                <Badge variant="success" style={{ fontSize: '0.875rem' }}>
                  ✓ Approved & Docket Closed
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
