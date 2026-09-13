export function Select({ id, label, options = [], placeholder = 'Select option', error, helperText, className = '', ...props }) {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

  return (
    <div className={`cf-field ${className}`.trim()}>
      {label ? (
        <label htmlFor={id} id={`${id}-label`} style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-1)', fontSize: '0.875rem' }}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={`cf-input cf-select ${error ? 'is-error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="cf-field-error" role="alert" style={{ color: 'var(--color-danger-600)', fontSize: '0.75rem', marginTop: '4px' }}>
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="cf-field-helper" style={{ color: 'var(--color-neutral-500)', fontSize: '0.75rem', marginTop: '4px' }}>
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
