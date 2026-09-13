import { useState, useEffect } from 'react'
import { workerService } from '../../services/workerService.js'
import { complaintService } from '../../services/complaintService.js'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { Spinner } from '../ui/Spinner.jsx'

export function AssignWorkerModal({
  complaint,
  isOpen = false,
  onClose,
  onAssigned,
}) {
  const [workers, setWorkers] = useState([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [instructions, setInstructions] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !complaint) return
    setIsLoading(true)
    setError('')
    setSelectedWorkerId('')
    setInstructions('')

    workerService
      .getWorkers(complaint?.category)
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setWorkers(list)
          setIsLoading(false)
        } else {
          // If category filter returned 0, load all available department workers
          return workerService.getWorkers().then((all) => {
            setWorkers(all || [])
            setIsLoading(false)
          })
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load technician roster.')
        setIsLoading(false)
      })
  }, [isOpen, complaint])

  if (!isOpen || !complaint) return null

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedWorkerId) {
      setError('Please select a technician to assign.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const selectedWorker = workers.find((w) => w.id === selectedWorkerId)
      await complaintService.assignComplaint(
        complaint.id,
        selectedWorkerId,
        instructions.trim() || `Assigned to ${selectedWorker?.name || 'field worker'}.`
      )

      if (onAssigned) {
        onAssigned(complaint.id, selectedWorker)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to dispatch work order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="cf-modal-overlay" onClick={onClose}>
      <div className="cf-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="cf-mc-header">
          <div>
            <span className="cf-mc-badge">Work Order Dispatch</span>
            <h3 className="cf-mc-title">Assign Technician to Grievance</h3>
            <span className="cf-complaint-card-id" style={{ marginTop: '2px', display: 'inline-block' }}>
              {complaint.id} &middot; {complaint.category || 'General'}
            </span>
          </div>
          <button type="button" className="cf-mc-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)' }}>
          <strong style={{ color: 'var(--color-neutral-950)', display: 'block', fontSize: '0.9375rem' }}>
            {complaint.title}
          </strong>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-600)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {typeof complaint.location === 'object' ? complaint.location.address : complaint.location}
          </span>
        </div>

        {error && (
          <div className="cf-modal-error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleAssignSubmit} className="cf-mc-form">
          <div className="cf-form-group">
            <label className="cf-form-label">Select Field Technician *</label>

            {isLoading ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <Spinner size="sm" />
              </div>
            ) : workers.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-danger-600)' }}>
                No technicians registered. Please add a technician from the Workers tab first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '220px', overflowY: 'auto' }}>
                {workers.map((worker) => {
                  const isSelected = selectedWorkerId === worker.id
                  const isAvailable = worker.status === 'AVAILABLE'

                  return (
                    <div
                      key={worker.id}
                      onClick={() => setSelectedWorkerId(worker.id)}
                      style={{
                        background: isSelected ? '#eff6ff' : 'var(--color-white)',
                        border: isSelected ? '2px solid var(--color-primary-600)' : '1.5px solid var(--color-neutral-200)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-700)',
                          flexShrink: 0
                        }}>
                          {worker.name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--color-neutral-950)', fontSize: '0.875rem', display: 'block' }}>
                            {worker.name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>
                            {worker.department || 'General'} &middot; {Array.isArray(worker.skills) ? worker.skills.join(', ') : (worker.skills || 'Technician')}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Badge variant={isAvailable ? 'success' : 'warning'}>
                          {worker.status || 'AVAILABLE'}
                        </Badge>
                        <input
                          type="radio"
                          name="selectedWorker"
                          checked={isSelected}
                          onChange={() => setSelectedWorkerId(worker.id)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="cf-form-group">
            <label className="cf-form-label">Dispatch Instructions / Priority Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Please bring extra 4-inch PVC couplings and inspect the main drain manifold."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="cf-form-input"
              style={{ resize: 'vertical', minHeight: '72px' }}
            />
          </div>

          <div className="cf-mc-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!selectedWorkerId}>
              Dispatch Technician
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
