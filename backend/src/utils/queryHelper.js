/**
 * Query Helper - Standardized Pagination, Search, Filtering, Sorting & Date-Range
 */

/**
 * Parse and sanitize pagination parameters
 * Prevents invalid values (negative, NaN, zero, excessive limits)
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - Default items per page (default: 10)
 * @param {number} maxLimit - Hard ceiling for limit (default: 100)
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query = {}, defaultLimit = 10, maxLimit = 100) {
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build standard pagination metadata
 * @param {number} total - Total matching records count
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
function buildPaginationMeta(total = 0, page = 1, limit = 10) {
  const safeTotal = Math.max(0, parseInt(total, 10) || 0);
  const totalPages = safeTotal === 0 ? 1 : Math.ceil(safeTotal / limit);

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
  };
}

/**
 * Parse and validate sorting parameters against a whitelist of allowed fields
 * Prevents SQL injection and invalid column errors
 * @param {Object} query - Express req.query
 * @param {string[]} allowedFields - Whitelisted sort field names
 * @param {string} defaultField - Fallback sort field (default: 'createdAt')
 * @param {string} defaultOrder - Fallback order 'asc' or 'desc' (default: 'desc')
 * @returns {{ orderBy: Object, sortBy: string, sortOrder: string }}
 */
function parseSorting(
  query = {},
  allowedFields = ['createdAt'],
  defaultField = 'createdAt',
  defaultOrder = 'desc'
) {
  const requestedField = (query.sortBy || query.sort || '').trim();
  const sortBy = allowedFields.includes(requestedField) ? requestedField : defaultField;

  const rawOrder = (query.sortOrder || query.order || defaultOrder).toLowerCase().trim();
  const sortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

  return {
    orderBy: { [sortBy]: sortOrder },
    sortBy,
    sortOrder,
  };
}

/**
 * Parse ISO date-range parameters (startDate/endDate or from/to)
 * Supports YYYY-MM-DD or full ISO strings
 * @param {Object} query - Express req.query
 * @param {string} field - Database timestamp field to filter (default: 'createdAt')
 * @returns {Object} Prisma date filter condition or empty object
 */
function parseDateRange(query = {}, field = 'createdAt') {
  const rawStart = query.startDate || query.from || query.dateFrom;
  const rawEnd = query.endDate || query.to || query.dateTo;

  let gte = undefined;
  let lte = undefined;

  if (rawStart) {
    const d = new Date(rawStart);
    if (!isNaN(d.getTime())) {
      gte = d;
    }
  }

  if (rawEnd) {
    let endStr = String(rawEnd).trim();
    // If given YYYY-MM-DD, set to end of that day (23:59:59.999)
    if (/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
      endStr = `${endStr}T23:59:59.999Z`;
    }
    const d = new Date(endStr);
    if (!isNaN(d.getTime())) {
      lte = d;
    }
  }

  if (gte && lte) {
    return { [field]: { gte, lte } };
  } else if (gte) {
    return { [field]: { gte } };
  } else if (lte) {
    return { [field]: { lte } };
  }

  return {};
}

/**
 * Parse single or comma-separated enum strings into an array of uppercase values
 * E.g., 'SUBMITTED,UNDER_REVIEW' => ['SUBMITTED', 'UNDER_REVIEW']
 * @param {string|string[]} value
 * @param {string[]} [allowedValues] - Optional whitelist
 * @returns {string[]|null}
 */
function parseMultiEnum(value, allowedValues = null) {
  if (!value) return null;

  let values = [];
  if (Array.isArray(value)) {
    values = value.map((v) => String(v).trim().toUpperCase());
  } else if (typeof value === 'string') {
    values = value
      .split(',')
      .map((v) => v.trim().toUpperCase())
      .filter(Boolean);
  }

  if (allowedValues && allowedValues.length > 0) {
    values = values.filter((v) => allowedValues.includes(v));
  }

  return values.length > 0 ? values : null;
}

module.exports = {
  parsePagination,
  buildPaginationMeta,
  parseSorting,
  parseDateRange,
  parseMultiEnum,
};

