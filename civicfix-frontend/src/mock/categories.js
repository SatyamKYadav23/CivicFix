import { CATEGORIES } from '../utils/constants.js'

export const INITIAL_CATEGORIES = CATEGORIES.map((cat, index) => ({
  ...cat,
  slaHours: index === 0 ? 48 : index === 2 ? 12 : 24,
  active: true,
}))

