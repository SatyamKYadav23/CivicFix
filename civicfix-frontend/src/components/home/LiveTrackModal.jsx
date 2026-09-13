import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { complaintService } from '../../services/complaintService.js'
import { ComplaintStatus } from '../complaint/ComplaintStatus.jsx'
import { ComplaintPriority } from '../complaint/ComplaintPriority.jsx'

const SAMPLE_IDS = ['CF-1001', 'CF-1002', 'CF-1003', 'CF-1004']

export function LiveTrackModal({ isOpen, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery || 'CF-1001')
  const [complaint, setComplaint] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const target = (initialQuery || 'CF-1001').trim()
    setQuery(target)

    let isMounted = true
    setLoading(true)
    setNotFound(false)

    complaintService.getComplaintById(target.toUpperCase())
      .then((found) => {
        if (!isMounted) return
        if (found) {
          setComplaint(found)
          setNotFound(false)
        } else {
          return complaintService.getAllComplaints().then((all) => {
            if (!isMounted) return
            const match = all.find(
              (c) =>
                c.id.toLowerCase() === target.toLowerCase() ||
                c.title.toLowerCase().includes(target.toLowerCase()) ||
                c.location.toLowerCase().includes(target.toLowerCase())
            )
            if (match) {
              setComplaint(match)
              setNotFound(false)
            } else {
              setComplaint(null)
              setNotFound(true)
            }
          })
        }
      })
      .catch(() => {
        if (isMounted) {
          setComplaint(null)
          setNotFound(true)
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [initialQuery, isOpen])

  async function handleLookup(idToSearch) {
    const cleanId = (idToSearch || query).trim()
    if (!cleanId) return

    setLoading(true)
    setNotFound(false)

    try {
      const found = await complaintService.getComplaintById(cleanId.toUpperCase())
      if (found) {
        setComplaint(found)
        setNotFound(false)
      } else {
        const all = await complaintService.getAllComplaints()
        const match = all.find(
          (c) =>
            c.id.toLowerCase() === cleanId.toLowerCase() ||
            c.title.toLowerCase().includes(cleanId.toLowerCase()) ||
            c.location.toLowerCase().includes(cleanId.toLowerCase())
        )
        if (match) {
          setComplaint(match)
          setNotFound(false)
        } else {
          setComplaint(null)
          setNotFound(true)
        }
      }
    } catch {
      setComplaint(null)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="cf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cf-live-track-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cf-ltm-header">
          <div>
            <div className="cf-gov-badge-sm">OFFICIAL GRIEVANCE TRACKER</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-neutral-950)', marginTop: '2px' }}>
              Docket Status Inquiry
            </h2>
          </div>
          <button
            type="button"
            className="cf-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="cf-ltm-search-wrap">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLookup(query)
            }}
            className="cf-ltm-form"
          >
            <input
              type="text"
              className="cf-ltm-input"
              placeholder="Enter Docket Number (e.g. CF-1001)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
              {loading ? 'Verifying...' : 'Search Docket'}
            </button>
          </form>

          <div className="cf-ltm-samples">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-600)' }}>
              Sample Dockets:
            </span>
            {SAMPLE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className="cf-chip-btn"
                onClick={() => {
                  setQuery(id)
                  handleLookup(id)
                }}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="cf-ltm-body">
          {loading && (
            <div className="cf-ltm-loading">
              <div className="cf-spinner" />
              <span>Retrieving official departmental audit record...</span>
            </div>
          )}

          {notFound && !loading && (
            <div className="cf-ltm-notfound">
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <h4>No Record Found</h4>
              <p style={{ fontSize: '0.875rem' }}>Please verify the Docket ID or try sample numbers: <code>CF-1001</code>, <code>CF-1002</code>, <code>CF-1004</code>.</p>
            </div>
          )}

          {complaint && !loading && (
            <div className="cf-ltm-card">
              <div className="cf-ltm-card-header">
                <div>
                  <div className="cf-inline-wrap" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span className="cf-complaint-card-id">{complaint.id}</span>
                    <ComplaintStatus status={complaint.status} />
                    <ComplaintPriority priority={complaint.priority} />
                  </div>
                  <h3 className="cf-ltm-complaint-title">{complaint.title}</h3>
                  <div className="cf-ltm-location">📍 {complaint.location}</div>
                </div>
              </div>

              <div className="cf-ltm-meta-box">
                <div>
                  <span className="meta-label">Department</span>
                  <strong>{complaint.category}</strong>
                </div>
                <div>
                  <span className="meta-label">Filing Date</span>
                  <strong>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'Recent'}</strong>
                </div>
                <div>
                  <span className="meta-label">Designated Worker</span>
                  <strong>{complaint.assignedWorker ? complaint.assignedWorker.name : (complaint.assignedWorkerName || 'Triage In Progress')}</strong>
                </div>
              </div>

              {((complaint.photos && complaint.photos.length > 0) || (complaint.evidence && complaint.evidence.length > 0)) && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-600)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Photo Evidence
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(complaint.photos || complaint.evidence || []).map((img, idx) => {
                      const src = typeof img === 'string' ? img : img?.url || ''
                      const fullUrl = src.startsWith('http') ? src : `http://localhost:5000${src}`
                      return (
                        <img
                          key={idx}
                          src={fullUrl}
                          alt="Grievance Evidence"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-neutral-300)' }}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {complaint.timeline && complaint.timeline.length > 0 && (
                <div className="cf-ltm-timeline">
                  <div className="cf-ltm-timeline-title">Audit Trail & Action Milestones</div>
                  <div className="cf-ltm-steps">
                    {complaint.timeline.map((step) => {
                      const isDone = step.state === 'completed'
                      const isActive = step.state === 'active'
                      return (
                        <div key={step.id} className={`cf-ltm-step ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`}>
                          <div className="cf-ltm-step-circle">
                            {isDone ? '✓' : isActive ? '⚡' : '○'}
                          </div>
                          <div className="cf-ltm-step-info">
                            <span className="cf-ltm-step-name">{step.title}</span>
                            {step.notes && <span className="cf-ltm-step-note">{step.notes}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="cf-ltm-footer-actions">
                <Link
                  to="/login"
                  className="btn btn-primary"
                  onClick={onClose}
                  style={{ width: '100%' }}
                >
                  Access Citizen Portal for Full Dossier →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
