import { useState, useEffect, useCallback, useMemo } from 'react'
import { complaintService } from '../services/complaintService.js'

export function useComplaints(initialFilters = {}) {
  const [complaints, setComplaints] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const filterKey = useMemo(() => JSON.stringify(initialFilters), [initialFilters])

  useEffect(() => {
    setFilters(initialFilters)
  }, [filterKey])

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await complaintService.getComplaints(filters)
      const list = Array.isArray(data) ? data : (data?.complaints || data?.items || [])
      setComplaints(list)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load complaints')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    complaintService.getComplaints(filters).then(
      (data) => {
        if (isCurrent) {
          const list = Array.isArray(data) ? data : (data?.complaints || data?.items || [])
          setComplaints(list)
          setError(null)
          setIsLoading(false)
        }
      },
      (err) => {
        if (isCurrent) {
          setError(err.message || 'Failed to load complaints')
          setIsLoading(false)
        }
      }
    )
    return () => {
      isCurrent = false
    }
  }, [filters])

  const createComplaint = async (complaintData, currentUser) => {
    const newComplaint = await complaintService.createComplaint(complaintData, currentUser)
    setComplaints((prev) => [newComplaint, ...prev])
    return newComplaint
  }

  const updateStatus = async (id, newStatus, notes, actor) => {
    const updated = await complaintService.updateStatus(id, newStatus, notes, actor)
    setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  const assignWorker = async (complaintId, workerId, actor) => {
    const updated = await complaintService.assignWorker(complaintId, workerId, actor)
    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)))
    return updated
  }

  const submitFeedback = async (complaintId, rating, comment, citizenName) => {
    const updated = await complaintService.submitFeedback(complaintId, rating, comment, citizenName)
    setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)))
    return updated
  }

  return {
    complaints,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchComplaints,
    createComplaint,
    updateStatus,
    assignWorker,
    submitFeedback,
  }
}
