export function Toast({ variant = 'info', title, message, action, onClose }) {
  return (
    <div className={`cf-toast cf-toast-${variant}`} role="status" aria-live="polite">
      <div>
        {title ? <p className="cf-toast-title">{title}</p> : null}
        <p>{message}</p>
      </div>
      <div className="cf-toast-actions">
        {action}
        {onClose ? (
          <button type="button" className="cf-icon-button cf-icon-button-ghost" onClick={onClose} aria-label="Close toast">
            x
          </button>
        ) : null}
      </div>
    </div>
  )
}
