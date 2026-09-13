import { getPriorityLabel } from '../../utils/complaintHelpers.js'

/**
  * ComplaintPriority Component
  * Displays a clean text-based urgency priority chip for Low, Medium, High, or Critical.
  */
 export function ComplaintPriority({ priority = 'MEDIUM', className = '' }) {
   const label = getPriorityLabel(priority)
   const normalized = (priority || 'medium').toLowerCase()
   const priorityClass = `cf-priority-pill cf-priority-${normalized} ${className}`.trim()

   return (
     <span
       className={priorityClass}
       aria-label={`Urgency Priority: ${label}`}
     >
       {label}
     </span>
   )
 }
