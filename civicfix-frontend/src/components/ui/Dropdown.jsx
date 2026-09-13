import { useId, useState } from 'react'

export function Dropdown({ label = 'Actions', items = [], onSelect }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className="cf-dropdown">
      <button
        type="button"
        className="cf-button cf-button-secondary cf-button-sm"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={id}
      >
        {label}
      </button>
      {open ? (
        <ul className="cf-dropdown-menu" id={id} role="menu">
          {items.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                className="cf-dropdown-item"
                onClick={() => {
                  onSelect?.(item.value)
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
