export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <section className="cf-state cf-state-error" role="alert">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {onRetry ? (
        <button type="button" className="cf-button cf-button-destructive cf-button-sm" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </section>
  )
}
