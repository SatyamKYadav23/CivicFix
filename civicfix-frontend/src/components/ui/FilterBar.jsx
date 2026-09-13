import { Button } from './Button.jsx'

export function FilterBar({ title = 'Filters', children, onApply, onReset }) {
  return (
    <section className="cf-filterbar" aria-label={title}>
      <div className="cf-filterbar-fields">{children}</div>
      <div className="cf-filterbar-actions">
        <Button size="sm" onClick={onApply}>
          Apply
        </Button>
        <Button size="sm" variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </div>
    </section>
  )
}
