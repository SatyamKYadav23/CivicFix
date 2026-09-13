export function EmptyState({ title = 'No data yet', description, action }) {
  return (
    <section className="cf-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  )
}
