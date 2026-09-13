import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { complaintService } from '../../services/complaintService.js'
import { Button } from '../../components/ui/Button.jsx'
import { CATEGORIES, COMPLAINT_PRIORITIES } from '../../utils/constants.js'
import { LocationPickerMap, formatCoordinates } from '../../components/complaint/index.js'

const WIZARD_STEPS = [
  { id: 1, name: 'Issue Type', icon: '1', desc: 'Category & Urgency' },
  { id: 2, name: 'Location', icon: '2', desc: 'Address & Landmark' },
  { id: 3, name: 'Photos', icon: '3', desc: 'Evidence Upload' },
  { id: 4, name: 'Review & Submit', icon: '4', desc: 'Confirm & Dispatch' },
]

const URGENCY_LEVELS = [
  {
    value: COMPLAINT_PRIORITIES.LOW,
    label: 'Low',
    tag: 'Low Priority',
    hint: 'Minor defect or routine maintenance',
    sla: '3 to 5 Days',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    value: COMPLAINT_PRIORITIES.MEDIUM,
    label: 'Medium',
    tag: 'Medium Priority',
    hint: 'Standard maintenance within target SLA',
    sla: '24 to 48 Hours',
    color: '#a16207',
    bg: '#fefce8',
    border: '#fef08a',
  },
  {
    value: COMPLAINT_PRIORITIES.HIGH,
    label: 'High',
    tag: 'High Priority',
    hint: 'Pedestrian safety risk or infrastructure blockage',
    sla: 'Within 24 Hours',
    color: '#c2410c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
  {
    value: COMPLAINT_PRIORITIES.CRITICAL,
    label: 'Critical',
    tag: 'Critical Priority',
    hint: 'Direct hazard to life or major municipal emergency',
    sla: 'Within 4 to 8 Hours',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca',
  },
]

export function CreateComplaint() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('roads')
  const [priority, setPriority] = useState(COMPLAINT_PRIORITIES.MEDIUM)
  const [location, setLocation] = useState(user?.address || '')
  const [landmark, setLandmark] = useState('')
  const [coordinates, setCoordinates] = useState({ lat: 28.6139, lng: 77.2090 })
  const [description, setDescription] = useState('')
  const [evidenceImages, setEvidenceImages] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submittedComplaint, setSubmittedComplaint] = useState(null)

  // Handlers for evidence upload
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    files.forEach((f, i) => {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target.result
        setEvidenceImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            name: f.name,
            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
            preview: base64Url,
            url: base64Url,
            previewUrl: base64Url,
            file: f,
            rawFile: f,
          },
        ])
      }
      reader.readAsDataURL(f)
    })
  }

  const handleRemoveImage = (imgId) => {
    setEvidenceImages((prev) => prev.filter((img) => img.id !== imgId))
  }

  const handleAddressResolved = ({ address, landmark: lm, coordinates: coords }) => {
    if (address) {
      setLocation(address)
    }
    if (lm && !landmark) {
      setLandmark(lm)
    }
    if (coords) {
      setCoordinates(coords)
    }
  }

  const handleAutoFillAddress = () => {
    if (user?.address) {
      setLocation(user.address)
    } else {
      setLocation('Sector 12, Block B, New Delhi')
    }
  }

  // Step navigation & validations
  const handleNext = () => {
    setErrorMessage('')

    if (currentStep === 1) {
      if (!title.trim()) {
        setErrorMessage('Please enter a brief complaint title before proceeding.')
        return
      }
      if (!category) {
        setErrorMessage('Please select a category for the issue.')
        return
      }
    }

    if (currentStep === 2) {
      if (!location.trim()) {
        setErrorMessage('Please enter the street address or location of the issue.')
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setErrorMessage('')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const selectedCat = CATEGORIES.find((c) => c.id === category)
      const categoryLabel = selectedCat ? selectedCat.label : category

      const fullLocation = landmark.trim()
        ? `${location.trim()} (Near ${landmark.trim()})`
        : location.trim()

      const formattedEvidence = evidenceImages.map((img) => ({
        name: img.name,
        url: img.url || img.preview,
        previewUrl: img.previewUrl || img.preview || img.url,
      }))

      const rawFile = evidenceImages.find((img) => img.rawFile || img.file)?.rawFile || null

      const newComplaint = await complaintService.createComplaint(
        {
          title: title.trim(),
          category: category,
          description: description.trim() || `${categoryLabel} reported at ${fullLocation}.`,
          location: fullLocation,
          coordinates,
          landmark: landmark.trim(),
          priority,
          evidence: formattedEvidence,
          photos: formattedEvidence,
          image: rawFile,
          file: rawFile,
        },
        user
      )

      setSubmittedComplaint(newComplaint)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit complaint. Please review your details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0]
  const selectedUrgencyObj = URGENCY_LEVELS.find((u) => u.value === priority) || URGENCY_LEVELS[1]

  // Success Confirmation Screen
  if (submittedComplaint) {
    return (
      <div className="cf-wizard-success-wrapper">
        <div className="cf-wsc-card">
          <h1 className="cf-page-title">Application Successfully Submitted</h1>
          <p className="cf-wsc-ref-text">
            Municipal Reference Docket ID:{' '}
            <strong className="cf-wsc-id-badge">{submittedComplaint.id}</strong>
          </p>
          <p className="cf-wsc-sub">
            Your grievance has been officially registered with the municipal command center and queued for nodal officer triage and technician dispatch.
          </p>

          <div className="cf-wsc-docket-summary">
            <div className="cf-wsc-docket-header">
              <span className="cf-wsc-dh-label">Registered Grievance</span>
              <span className="cf-wsc-dh-priority" style={{ color: selectedUrgencyObj.color, backgroundColor: selectedUrgencyObj.bg }}>
                {selectedUrgencyObj.tag}
              </span>
            </div>
            <h3 className="cf-wsc-docket-title">{submittedComplaint.title}</h3>
            <div className="cf-wsc-docket-grid">
              <div><strong>Location:</strong> {submittedComplaint.location}</div>
              <div><strong>Category:</strong> {submittedComplaint.category}</div>
              <div><strong>Resolution SLA:</strong> {selectedUrgencyObj.sla}</div>
              <div><strong>Evidence:</strong> {evidenceImages.length} Photo{evidenceImages.length === 1 ? '' : 's'}</div>
            </div>
          </div>

          <div className="cf-wsc-actions">
            <Button
              size="lg"
              onClick={() => navigate(`/citizen/complaints/${submittedComplaint.id}`)}
            >
              Track Live Milestone Progress →
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setSubmittedComplaint(null)
                setCurrentStep(1)
                setTitle('')
                setDescription('')
                setLandmark('')
                setLocation(user?.address || '')
                setCoordinates({ lat: 28.6139, lng: 77.2090 })
              }}
            >
              Report Another Issue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cf-wizard-page">
      {/* 1. Header */}
      <div className="cf-page-header">
        <div>
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <Link
              to="/citizen/complaints"
              style={{ textDecoration: 'none', color: 'var(--color-primary-600)', fontWeight: 600, fontSize: '0.875rem' }}
            >
              ← Back to My Complaints
            </Link>
          </div>
          <h1 className="cf-page-title">Report a Civic Complaint</h1>
          <p className="cf-page-subtitle">
            Follow the guided 4-step wizard to register your grievance with municipal authorities.
          </p>
        </div>
      </div>

      {/* 2. Modern Connected Timeline Stepper */}
      <div className="cf-stepper-bar">
        {WIZARD_STEPS.map((s, index) => {
          const isCompleted = currentStep > s.id
          const isActive = currentStep === s.id

          return (
            <div
              key={s.id}
              className={`cf-stepper-node ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
              onClick={() => {
                if (s.id < currentStep) setCurrentStep(s.id)
              }}
              role="button"
              tabIndex={0}
            >
              <div className="cf-sn-circle">
                {isCompleted ? '✓' : s.id}
              </div>
              <div className="cf-sn-info">
                <span className="cf-sn-name">{s.name}</span>
                <span className="cf-sn-desc">{s.desc}</span>
              </div>
              {index < WIZARD_STEPS.length - 1 && <div className="cf-sn-line" />}
            </div>
          )
        })}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="cf-wizard-error-banner">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Wizard Step Card Container */}
      <div className="cf-wizard-card">
        {/* STEP 1: Basic Info & Category */}
        {currentStep === 1 && (
          <div className="cf-wizard-step-body">
            <div className="cf-wsb-header">
              <span className="cf-wsb-badge">Step 1 of 4</span>
              <h2 className="cf-wsb-title">What is the civic issue?</h2>
              <p className="cf-wsb-subtitle">Provide a concise title, pick the municipal department, and assign urgency.</p>
            </div>

            {/* Title Field */}
            <div className="cf-wizard-field">
              <label htmlFor="complaint-title" className="cf-wizard-label">
                Complaint Title <span className="cf-req">*</span>
              </label>
              <input
                id="complaint-title"
                type="text"
                placeholder="e.g., Deep Pothole on Ring Road Junction, Water Leakage Outside Gate 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="cf-wizard-input"
                required
              />
              <span className="cf-wizard-help">Keep it short and descriptive for quick municipal triage.</span>
            </div>

            {/* Category Visual Grid */}
            <div className="cf-wizard-field">
              <label className="cf-wizard-label">
                Select Category <span className="cf-req">*</span>
              </label>
              <div className="cf-cat-picker-grid">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id
                  return (
                    <div
                      key={cat.id}
                      className={`cf-cat-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setCategory(cat.id)}
                      role="button"
                      tabIndex={0}
                    >
                      {cat.icon && <span className="cf-cc-icon">{cat.icon}</span>}
                      <div className="cf-cc-text">
                        <strong className="cf-cc-title">{cat.label}</strong>
                        {cat.description && <span className="cf-cc-desc">{cat.description}</span>}
                      </div>
                      {isSelected && <span className="cf-cc-check">✓</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Urgency Assessment */}
            <div className="cf-wizard-field">
              <label className="cf-wizard-label">
                Urgency Assessment <span className="cf-req">*</span>
              </label>
              <div className="cf-urgency-picker-grid">
                {URGENCY_LEVELS.map((u) => {
                  const isSelected = priority === u.value
                  return (
                    <div
                      key={u.value}
                      className={`cf-urgency-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setPriority(u.value)}
                      style={{
                        backgroundColor: isSelected ? u.bg : '#ffffff',
                        borderColor: isSelected ? u.color : 'var(--color-neutral-200)',
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="cf-uc-tag" style={{ color: u.color }}>
                        {u.tag}
                      </div>
                      <div className="cf-uc-hint">{u.hint}</div>
                      <div className="cf-uc-sla">SLA: {u.sla}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location & Notes */}
        {currentStep === 2 && (
          <div className="cf-wizard-step-body">
            <div className="cf-wsb-header">
              <span className="cf-wsb-badge">Step 2 of 4</span>
              <h2 className="cf-wsb-title">Where is the defect located?</h2>
              <p className="cf-wsb-subtitle">Pinpoint the location on the live interactive map or use automatic GPS detection.</p>
            </div>

            {/* Interactive Map & Auto GPS Field */}
            <div className="cf-wizard-field">
              <label className="cf-wizard-label">
                Interactive Grievance Map & Auto-Location <span className="cf-req">*</span>
              </label>
              <LocationPickerMap
                value={coordinates}
                onChange={(newCoords) => setCoordinates(newCoords)}
                onAddressResolved={handleAddressResolved}
                initialAddress={location}
                height="340px"
              />
            </div>

            <div className="cf-wizard-field">
              <div className="cf-wizard-label-row">
                <label htmlFor="complaint-location" className="cf-wizard-label">
                  Street Address / Sector / Area <span className="cf-req">*</span>
                </label>
                <button
                  type="button"
                  className="cf-wizard-link-btn"
                  onClick={handleAutoFillAddress}
                >
                  Use My Saved Profile Address
                </button>
              </div>
              <input
                id="complaint-location"
                type="text"
                placeholder="e.g. Sector 12, Block B, Main Market Road, New Delhi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="cf-wizard-input"
                required
              />
              <span className="cf-wizard-help">Auto-filled from map pin or GPS location. You can tweak or add specific details.</span>
            </div>

            <div className="cf-wizard-field">
              <label htmlFor="complaint-landmark" className="cf-wizard-label">
                Nearby Landmark <span className="cf-opt">(Optional)</span>
              </label>
              <input
                id="complaint-landmark"
                type="text"
                placeholder="e.g. Opposite Market Gate 3, near DAV Public School, Metro Pillar 42"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="cf-wizard-input"
              />
            </div>

            <div className="cf-wizard-field">
              <label htmlFor="complaint-description" className="cf-wizard-label">
                Detailed Description <span className="cf-opt">(Optional)</span>
              </label>
              <textarea
                id="complaint-description"
                rows={4}
                placeholder="Describe when the defect started, size/depth, hazards to residents, and any temporary markings..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="cf-wizard-textarea"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Photo Evidence */}
        {currentStep === 3 && (
          <div className="cf-wizard-step-body">
            <div className="cf-wsb-header">
              <span className="cf-wsb-badge">Step 3 of 4</span>
              <h2 className="cf-wsb-title">Attach Photo Evidence</h2>
              <p className="cf-wsb-subtitle">Upload clear photos of the civic defect. Photos accelerate triage and worker assignment.</p>
            </div>

            <div className="cf-wizard-field">
              <div className="cf-wizard-dropzone">
                <input
                  type="file"
                  id="wizard-file-upload"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="cf-hidden-input"
                />
                <label htmlFor="wizard-file-upload" className="cf-wz-drop-label">
                  <span className="cf-wd-main">
                    <strong>Click to upload photos</strong> or drag & drop files here
                  </span>
                  <span className="cf-wd-sub">Supports JPEG, PNG, WebP (Max 5MB each)</span>
                </label>
              </div>

              {/* Photo Thumbnails */}
              {evidenceImages.length > 0 ? (
                <div className="cf-wizard-thumbs-grid">
                  {evidenceImages.map((img) => (
                    <div key={img.id} className="cf-wizard-thumb-card">
                      <img src={img.preview} alt={img.name} className="cf-wtc-img" />
                      <div className="cf-wtc-meta">
                        <span className="cf-wtc-name">{img.name}</span>
                        <span className="cf-wtc-size">{img.size}</span>
                      </div>
                      <button
                        type="button"
                        className="cf-wtc-del"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cf-wizard-empty-hint">
                  No photos attached yet. You can still continue, but photos help the repair crew arrive with the right tools.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Final Submit */}
        {currentStep === 4 && (
          <div className="cf-wizard-step-body">
            <div className="cf-wsb-header">
              <span className="cf-wsb-badge">Step 4 of 4</span>
              <h2 className="cf-wsb-title">Review & Submit Application</h2>
              <p className="cf-wsb-subtitle">Please verify your complaint details before submitting to the municipal command registry.</p>
            </div>

            {/* Official Review Docket */}
            <div className="cf-review-docket-card">
              <div className="cf-rdc-header">
                <div>
                  <span className="cf-rdc-badge">Grievance Summary</span>
                  <h3 className="cf-rdc-title">{title}</h3>
                </div>
                <span className="cf-rdc-priority-tag" style={{ color: selectedUrgencyObj.color, backgroundColor: selectedUrgencyObj.bg }}>
                  {selectedUrgencyObj.tag}
                </span>
              </div>

              <div className="cf-rdc-grid">
                <div className="cf-rdc-item">
                  <span className="cf-rdc-label">Category</span>
                  <span className="cf-rdc-val">{selectedCategoryObj.label}</span>
                </div>

                <div className="cf-rdc-item">
                  <span className="cf-rdc-label">Target SLA Guarantee</span>
                  <span className="cf-rdc-val">{selectedUrgencyObj.sla}</span>
                </div>

                <div className="cf-rdc-item">
                  <span className="cf-rdc-label">Location Address</span>
                  <span className="cf-rdc-val">{location}</span>
                </div>

                {landmark && (
                  <div className="cf-rdc-item">
                    <span className="cf-rdc-label">Nearby Landmark</span>
                    <span className="cf-rdc-val">{landmark}</span>
                  </div>
                )}

                <div className="cf-rdc-item">
                  <span className="cf-rdc-label">GPS Coordinates</span>
                  <span className="cf-rdc-val" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {formatCoordinates(coordinates?.lat, coordinates?.lng)}
                  </span>
                </div>

                <div className="cf-rdc-item">
                  <span className="cf-rdc-label">Reporting Citizen</span>
                  <span className="cf-rdc-val">{user?.name || 'Citizen'} ({user?.email || 'citizen@civicfix.gov.in'})</span>
                </div>

                <div className="cf-rdc-item">
                  <span className="cf-rdc-label">Attached Photos</span>
                  <span className="cf-rdc-val">{evidenceImages.length} Photo{evidenceImages.length === 1 ? '' : 's'} attached</span>
                </div>
              </div>

              {/* Map Preview in Review */}
              <div style={{ marginTop: 'var(--space-4)' }}>
                <span className="cf-rdc-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                  Pinpointed Defect Site on Map:
                </span>
                <LocationPickerMap
                  value={coordinates}
                  readOnly={true}
                  height="190px"
                />
              </div>

              {description && (
                <div className="cf-rdc-desc-box" style={{ marginTop: 'var(--space-3)' }}>
                  <span className="cf-rdc-label">Detailed Notes:</span>
                  <p>{description}</p>
                </div>
              )}

              <div className="cf-rdc-sla-charter">
                <p>
                  <strong>Municipal Service Charter:</strong> Your grievance will be officially timestamped and assigned to the relevant zonal officer with automated SLA milestone tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Wizard Step Navigation Footer Buttons */}
        <div className="cf-wizard-footer">
          {currentStep > 1 ? (
            <Button type="button" variant="secondary" onClick={handleBack}>
              ← Back to Step {currentStep - 1}
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => navigate('/citizen/complaints')}>
              Cancel
            </Button>
          )}

          {currentStep < 4 ? (
            <Button type="button" onClick={handleNext}>
              Continue to Step {currentStep + 1} →
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              loading={isSubmitting}
              onClick={handleSubmit}
              className="cf-wizard-submit-btn"
            >
              ✓ Submit Application to Municipal Portal
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
