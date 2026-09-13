export function Checkbox({ id, label, helperText, error, className = '', ...props }) {
  return (
    <div className={`cf-field ${className}`.trim()}>
      <label className="cf-check-wrapper" htmlFor={id}>
        <input id={id} type="checkbox" className="cf-check-input" {...props} />
        <span>{label}</span>
      </label>
      {error ? <p className="cf-field-error">{error}</p> : helperText ? <p className="cf-field-helper">{helperText}</p> : null}
    </div>
  )
}
