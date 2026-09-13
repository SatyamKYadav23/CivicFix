import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES, CATEGORIES } from '../../utils/constants.js'
import { getStatusLabel } from '../../utils/complaintHelpers.js'
import { Button } from '../ui/Button.jsx'

/**
 * ComplaintFilters Component
 * Search and filter controls bar for complaint queues, citizen history, and admin lists.
 */
export function ComplaintFilters({
  searchTerm = '',
  status = 'ALL',
  priority = 'ALL',
  category = 'ALL',
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onReset,
  totalCount,
  className = '',
}) {
  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    ...Object.values(COMPLAINT_STATUSES).map((st) => ({
      value: st,
      label: getStatusLabel(st),
    })),
  ]

  const priorityOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: COMPLAINT_PRIORITIES.CRITICAL, label: 'Critical' },
    { value: COMPLAINT_PRIORITIES.HIGH, label: 'High' },
    { value: COMPLAINT_PRIORITIES.MEDIUM, label: 'Medium' },
    { value: COMPLAINT_PRIORITIES.LOW, label: 'Low' },
  ]

  const categoryOptions = [
    { value: 'ALL', label: 'All Categories' },
    ...CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` })),
  ]

  const hasActiveFilters =
    Boolean(searchTerm) || status !== 'ALL' || priority !== 'ALL' || category !== 'ALL'

  return (
    <div className={`cf-filters-toolbar ${className}`.trim()}>
      <div className="cf-filters-grid">
        <div className="cf-filter-field">
          <label htmlFor="complaint-search" className="cf-field-label">
            Search
          </label>
          <input
            id="complaint-search"
            type="search"
            className="cf-input"
            placeholder="Search by title, ID, or location…"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        <div className="cf-filter-field">
          <label htmlFor="filter-status-select" className="cf-field-label">
            Status
          </label>
          <select
            id="filter-status-select"
            className="cf-input cf-select"
            value={status}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="cf-filter-field">
          <label htmlFor="filter-priority-select" className="cf-field-label">
            Priority
          </label>
          <select
            id="filter-priority-select"
            className="cf-input cf-select"
            value={priority}
            onChange={(e) => onPriorityChange && onPriorityChange(e.target.value)}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="cf-filter-field">
          <label htmlFor="filter-category-select" className="cf-field-label">
            Category
          </label>
          <select
            id="filter-category-select"
            className="cf-input cf-select"
            value={category}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div>
            <Button size="sm" variant="ghost" onClick={onReset}>
              Reset
            </Button>
          </div>
        )}
      </div>

      {typeof totalCount === 'number' && (
        <div className="cf-filters-summary">
          <span>Showing <strong>{totalCount}</strong> complaint{totalCount === 1 ? '' : 's'}</span>
          {hasActiveFilters && <span>(Filtered)</span>}
        </div>
      )}
    </div>
  )
}

