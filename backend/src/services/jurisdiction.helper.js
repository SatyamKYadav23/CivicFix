/**
 * Jurisdiction Helper
 * Maps authority department names to ComplaintCategory enums
 * and verifies authority domain coverage.
 */

const CATEGORY_MAP = {
  ROADS_POTHOLES: ['road', 'pothole'],
  STREET_LIGHTS: ['light', 'street', 'electric', 'illumination'],
  WATER_SUPPLY: ['water', 'leak', 'pipe', 'supply'],
  SANITATION_WASTE: ['sanitation', 'waste', 'garbage', 'trash', 'cleaning'],
  DRAINAGE_SEWAGE: ['drain', 'drainage', 'sewage', 'sewer'],
  PARKS_PUBLIC_SPACES: ['park', 'green', 'public space', 'recreation', 'garden'],
  PUBLIC_TRANSPORT: ['transport', 'traffic', 'transit', 'bus', 'roadway'],
  OTHER: ['other', 'general'],
};

/**
 * Check whether an authority department covers a given complaint category
 * @param {string} complaintCategory - ComplaintCategory enum value
 * @param {string|null} authorityDepartment - User's department string
 * @returns {boolean}
 */
function matchesJurisdiction(complaintCategory, authorityDepartment) {
  if (!authorityDepartment || authorityDepartment === 'ALL') return true;
  if (authorityDepartment === 'Municipal Operations & Infrastructure') return true;

  const aDept = (authorityDepartment || '').toLowerCase().trim();
  const cCat = (complaintCategory || '').toLowerCase().trim();

  if (cCat === aDept || cCat.includes(aDept) || aDept.includes(cCat)) return true;

  // Check category keywords against department name
  for (const [catEnum, keywords] of Object.entries(CATEGORY_MAP)) {
    if (catEnum === complaintCategory) {
      if (keywords.some((kw) => aDept.includes(kw))) {
        return true;
      }
    }
  }

  // Fallback for general departments
  if (aDept.includes('general') || aDept.includes('operations') || aDept.includes('central')) {
    return true;
  }

  return false;
}

/**
 * Given an authority department, return the array of matching ComplaintCategory enums.
 * If the department covers all (or is empty / Admin), returns null (meaning no filter needed).
 * @param {string|null} department
 * @returns {string[]|null}
 */
function getCategoriesForDepartment(department) {
  if (!department || department === 'ALL' || department === 'Municipal Operations & Infrastructure') {
    return null; // All categories
  }

  const d = department.toLowerCase().trim();
  if (d.includes('general') || d.includes('operations') || d.includes('central')) {
    return null;
  }

  const matched = [];
  for (const [catEnum, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => d.includes(kw))) {
      matched.push(catEnum);
    }
  }

  return matched.length > 0 ? matched : null;
}

module.exports = {
  CATEGORY_MAP,
  matchesJurisdiction,
  getCategoriesForDepartment,
};

