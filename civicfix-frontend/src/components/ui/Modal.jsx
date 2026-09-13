import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ open = false, isOpen = false, title, children, footer, onClose }) {
  const isVisible = Boolean(open || isOpen)

  useEffect(() => {
    if (!isVisible) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isVisible, onClose])

  if (!isVisible) {
    return null
  }

  return createPortal(
    <div className="cf-overlay" role="presentation" onClick={onClose}>
      <section
        className="cf-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(560px, 95vw)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
        }}
      >
        <header className="cf-modal-header">
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{title}</h3>
          <button
            type="button"
            className="cf-icon-button cf-icon-button-ghost"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <div
          className="cf-modal-body"
          style={{
            padding: 'var(--space-4)',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 130px)',
          }}
        >
          {children}
        </div>
        {footer ? (
          <footer className="cf-modal-footer" style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-neutral-200)' }}>
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body
  )
}
