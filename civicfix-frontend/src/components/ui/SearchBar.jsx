import { useState } from 'react'
import { Button } from './Button.jsx'
import { Input } from './Input.jsx'

export function SearchBar({ placeholder = 'Search', value, onSearch, onClear }) {
  const [localValue, setLocalValue] = useState(value || '')

  const currentValue = value === undefined ? localValue : value

  return (
    <form
      className="cf-searchbar"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch?.(currentValue)
      }}
    >
      <Input
        id="search"
        aria-label="Search"
        placeholder={placeholder}
        value={currentValue}
        onChange={(event) => {
          if (value === undefined) {
            setLocalValue(event.target.value)
          }
        }}
      />
      <Button type="submit" size="sm">
        Search
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          if (value === undefined) {
            setLocalValue('')
          }
          onClear?.()
        }}
      >
        Clear
      </Button>
    </form>
  )
}
