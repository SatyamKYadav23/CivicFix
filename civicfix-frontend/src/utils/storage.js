/**
 * Safe localStorage wrapper with in-memory fallback
 */
const memoryStorage = new Map()

const isLocalStorageAvailable = (() => {
  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
})()

export function getStorageItem(key, defaultValue = null) {
  try {
    if (isLocalStorageAvailable) {
      const item = window.localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : defaultValue
    }
    return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function setStorageItem(key, value) {
  try {
    if (isLocalStorageAvailable) {
      window.localStorage.setItem(key, JSON.stringify(value))
    } else {
      memoryStorage.set(key, value)
    }
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error)
    memoryStorage.set(key, value)
  }
}

export function removeStorageItem(key) {
  try {
    if (isLocalStorageAvailable) {
      window.localStorage.removeItem(key)
    }
    memoryStorage.delete(key)
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error)
  }
}

export function clearStorage() {
  try {
    if (isLocalStorageAvailable) {
      window.localStorage.clear()
    }
    memoryStorage.clear()
  } catch (error) {
    console.warn('Error clearing localStorage:', error)
  }
}

