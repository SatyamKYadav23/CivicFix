export function Pagination({ page = 1, total = 1, onPageChange }) {
  const pages = Array.from({ length: total }, (_, index) => index + 1)

  return (
    <nav className="cf-pagination" aria-label="Pagination">
      <button type="button" className="cf-page-button" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
        Previous
      </button>
      {pages.map((value) => (
        <button
          key={value}
          type="button"
          className={`cf-page-button ${value === page ? 'is-active' : ''}`}
          onClick={() => onPageChange?.(value)}
          aria-current={value === page ? 'page' : undefined}
        >
          {value}
        </button>
      ))}
      <button type="button" className="cf-page-button" disabled={page >= total} onClick={() => onPageChange?.(page + 1)}>
        Next
      </button>
    </nav>
  )
}
