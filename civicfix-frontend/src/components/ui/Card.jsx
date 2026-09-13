export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <article className={`cf-card ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="cf-card-header">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      )}
      <div className="cf-card-body">{children}</div>
    </article>
  )
}
