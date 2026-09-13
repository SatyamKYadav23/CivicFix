import { useId } from 'react'

export function FileUploader({ id, label = 'Upload files', accept, multiple = false, helperText, onFilesSelected }) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className="cf-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="file"
        className="cf-input"
        accept={accept}
        multiple={multiple}
        onChange={(event) => onFilesSelected?.(Array.from(event.target.files || []))}
      />
      {helperText ? <p className="cf-field-helper">{helperText}</p> : null}
    </div>
  )
}
