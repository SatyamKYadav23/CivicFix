import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Drawer({ open, side = 'right', title, children, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="cf-overlay" role="presentation" onClick={onClose}>
      <aside
        className={`cf-drawer ${side === 'left' ? 'is-left' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cf-modal-header">
          <h3>{title}</h3>
          <button type="button" className="cf-icon-button cf-icon-button-ghost" onClick={onClose} aria-label="Close drawer">
            x
          </button>
        </header>
        <div className="cf-modal-body">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
