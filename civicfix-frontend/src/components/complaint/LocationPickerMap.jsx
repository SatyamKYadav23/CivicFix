import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Default fallback coordinates (New Delhi Central / India Gate)
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }
const DEFAULT_ZOOM = 14

/**
 * Creates custom SVG DivIcon for the map pin marker
 */
function createCustomPinIcon(isDetecting = false) {
  return L.divIcon({
    className: 'cf-custom-marker-wrapper',
    html: `
      <div class="cf-marker-pin-outer ${isDetecting ? 'is-pulse' : ''}">
        <div class="cf-marker-pulse-ring"></div>
        <div class="cf-marker-pin-body">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1f5fa8" stroke="#ffffff" stroke-width="1.5" />
            <circle cx="12" cy="9" r="3" fill="#ffffff" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 44],
    popupAnchor: [0, -42],
  })
}

/**
 * Format coordinates for user display
 */
export function formatCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return '—'
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`
}

/**
 * Perform reverse geocoding using Nominatim OpenStreetMap API
 */
async function reverseGeocode(lat, lng) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    })
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error('Geocoding server responded with error')
    const data = await res.json()

    if (data && data.address) {
      const addr = data.address
      const road = addr.road || addr.street || addr.pedestrian || addr.path || ''
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || ''
      const city = addr.city || addr.town || addr.municipality || addr.state_district || addr.county || ''
      const state = addr.state || ''
      const postcode = addr.postcode || ''

      // Build structured formatted address
      const parts = [road, neighbourhood, city, state, postcode].filter(Boolean)
      const fullAddress = parts.length > 0 ? parts.join(', ') : data.display_name || ''
      const landmarkSuggestion = addr.amenity || addr.building || addr.shop || addr.tourism || neighbourhood || ''

      return {
        success: true,
        address: fullAddress,
        displayName: data.display_name,
        landmark: landmarkSuggestion,
        city: city || state,
        raw: data,
      }
    }

    return {
      success: true,
      address: data.display_name || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      landmark: '',
      city: '',
      raw: data,
    }
  } catch (err) {
    console.warn('Reverse geocoding error or timeout, using coordinate fallback:', err)
    return {
      success: false,
      address: `Incident site (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      landmark: '',
      city: '',
      error: err.message,
    }
  }
}

/**
 * Perform search geocoding using Nominatim OpenStreetMap API
 */
async function searchGeocode(query) {
  if (!query || query.trim().length < 3) return []
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query.trim()
    )}&limit=5&addressdetails=1`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    })
    clearTimeout(timeoutId)

    if (!res.ok) return []
    const results = await res.json()
    return (results || []).map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      name: item.name || item.display_name.split(',')[0],
      type: item.type,
    }))
  } catch (err) {
    console.warn('Search geocoding error:', err)
    return []
  }
}

export function LocationPickerMap({
  value = null, // { lat: number, lng: number }
  onChange = () => {},
  onAddressResolved = () => {},
  readOnly = false,
  height = '360px',
  initialAddress = '',
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const accuracyCircleRef = useRef(null)

  // Internal component state
  const [currentCoords, setCurrentCoords] = useState(() => value || DEFAULT_CENTER)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState('') // 'success' | 'error' | 'detecting' | ''
  const [statusMessage, setStatusMessage] = useState('')
  const [accuracy, setAccuracy] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Search Bar state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Keep internal coordinates synced if external value changes significantly
  useEffect(() => {
    if (
      value &&
      typeof value.lat === 'number' &&
      typeof value.lng === 'number' &&
      (Math.abs(value.lat - currentCoords.lat) > 0.0001 ||
        Math.abs(value.lng - currentCoords.lng) > 0.0001)
    ) {
      setCurrentCoords(value)
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lng])
        mapInstanceRef.current.panTo([value.lat, value.lng], { animate: true })
      }
    }
  }, [value, currentCoords.lat, currentCoords.lng])

  // Process reverse geocoding on coordinates update
  const handleCoordsChange = useCallback(
    async (coords, shouldGeocode = true, source = 'map') => {
      setCurrentCoords(coords)
      onChange(coords)

      if (shouldGeocode) {
        setIsGeocoding(true)
        const geocodeResult = await reverseGeocode(coords.lat, coords.lng)
        setIsGeocoding(false)
        if (geocodeResult.address) {
          onAddressResolved({
            address: geocodeResult.address,
            landmark: geocodeResult.landmark,
            city: geocodeResult.city,
            coordinates: coords,
            source,
          })
        }
      }
    },
    [onChange, onAddressResolved]
  )

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialLat = value?.lat || DEFAULT_CENTER.lat
    const initialLng = value?.lng || DEFAULT_CENTER.lng

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: DEFAULT_ZOOM,
      zoomControl: !readOnly,
      scrollWheelZoom: !readOnly,
      dragging: !readOnly,
      touchZoom: !readOnly,
      doubleClickZoom: !readOnly,
    })

    // High quality OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add marker
    const marker = L.marker([initialLat, initialLng], {
      icon: createCustomPinIcon(),
      draggable: !readOnly,
      autoPan: true,
    }).addTo(map)

    markerRef.current = marker
    mapInstanceRef.current = map

    if (!readOnly) {
      // Handle Map Click
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        // Remove GPS circle when user manually moves pin
        if (accuracyCircleRef.current) {
          map.removeLayer(accuracyCircleRef.current)
          accuracyCircleRef.current = null
          setAccuracy(null)
        }
        setDetectionStatus('')
        setStatusMessage('Pin placed manually on map.')
        handleCoordsChange({ lat, lng }, true, 'click')
      })

      // Handle Marker Drag
      marker.on('dragend', () => {
        const latlng = marker.getLatLng()
        const { lat, lng } = latlng
        if (accuracyCircleRef.current) {
          map.removeLayer(accuracyCircleRef.current)
          accuracyCircleRef.current = null
          setAccuracy(null)
        }
        setDetectionStatus('')
        setStatusMessage('Pin adjusted.')
        handleCoordsChange({ lat, lng }, true, 'drag')
      })
    }

    // Force tile recalculation once container is visible
    setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [readOnly, handleCoordsChange, value?.lat, value?.lng])

  // Handle GPS Auto Location Detection
  const handleDetectAutoLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setDetectionStatus('error')
      setStatusMessage('Geolocation is not supported by your current browser.')
      return
    }

    setIsDetectingLocation(true)
    setDetectionStatus('detecting')
    setStatusMessage('Locating your GPS position...')

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords
        setIsDetectingLocation(false)
        setDetectionStatus('success')
        setAccuracy(Math.round(acc))
        setStatusMessage(`GPS Location detected (accurate to ~${Math.round(acc)}m)`)

        const newCoords = { lat: latitude, lng: longitude }
        setCurrentCoords(newCoords)

        if (mapInstanceRef.current && markerRef.current) {
          const map = mapInstanceRef.current
          const marker = markerRef.current

          marker.setLatLng([latitude, longitude])

          // Render / update accuracy circle
          if (accuracyCircleRef.current) {
            map.removeLayer(accuracyCircleRef.current)
          }
          accuracyCircleRef.current = L.circle([latitude, longitude], {
            radius: Math.min(acc, 250),
            color: '#1f5fa8',
            fillColor: '#2c6fbd',
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(map)

          map.flyTo([latitude, longitude], 16, {
            duration: 1.2,
          })
        }

        // Auto reverse-geocode detected coordinates
        handleCoordsChange(newCoords, true, 'gps')
      },
      (err) => {
        setIsDetectingLocation(false)
        setDetectionStatus('error')
        let msg = 'Failed to detect location.'
        if (err.code === 1) {
          msg = 'Location access was denied. Please allow location permissions in your browser or select on the map.'
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please pick your location by clicking the map or searching.'
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please click on the map to pinpoint.'
        }
        setStatusMessage(msg)
      },
      geoOptions
    )
  }, [handleCoordsChange])

  // Handle Search Queries
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowSearchResults(true)
    const results = await searchGeocode(searchQuery)
    setSearchResults(results)
    setIsSearching(false)
  }

  const handleSelectSearchResult = (result) => {
    const newCoords = { lat: result.lat, lng: result.lng }
    setCurrentCoords(newCoords)
    setShowSearchResults(false)
    setSearchQuery(result.name)

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([result.lat, result.lng])
      mapInstanceRef.current.flyTo([result.lat, result.lng], 16, { duration: 1 })
    }

    if (accuracyCircleRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
      accuracyCircleRef.current = null
      setAccuracy(null)
    }

    setDetectionStatus('success')
    setStatusMessage(`Selected "${result.name}"`)
    handleCoordsChange(newCoords, true, 'search')
  }

  // Quick Preset Locations (Delhi/NCR civic zones)
  const handleSelectPreset = (presetName, lat, lng) => {
    const newCoords = { lat, lng }
    setCurrentCoords(newCoords)

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1 })
    }

    if (accuracyCircleRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
      accuracyCircleRef.current = null
      setAccuracy(null)
    }

    setDetectionStatus('success')
    setStatusMessage(`Moved to ${presetName}`)
    handleCoordsChange(newCoords, true, 'preset')
  }

  return (
    <div className="cf-map-picker-component">
      {!readOnly && (
        <div className="cf-map-picker-header">
          {/* 1. Main Action Bar: Auto GPS + Search */}
          <div className="cf-map-action-bar">
            {/* Auto Detect Button */}
            <button
              type="button"
              className={`cf-map-gps-btn ${isDetectingLocation ? 'is-loading' : ''}`}
              onClick={handleDetectAutoLocation}
              disabled={isDetectingLocation}
              title="Use GPS to detect your precise current location"
            >
              <span className="cf-mgb-icon">
                {isDetectingLocation ? '📡' : '🎯'}
              </span>
              <span className="cf-mgb-text">
                {isDetectingLocation ? 'Detecting GPS Location…' : 'Detect Auto Location'}
              </span>
            </button>

            {/* Live Search Input */}
            <div className="cf-map-search-wrapper">
              <form onSubmit={handleSearchSubmit} className="cf-map-search-form">
                <input
                  type="text"
                  className="cf-map-search-input"
                  placeholder="Search sector, colony, landmark, or street…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (!showSearchResults && e.target.value.length >= 3) {
                      setShowSearchResults(true)
                    }
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchResults(true)
                  }}
                />
                <button
                  type="submit"
                  className="cf-map-search-submit"
                  disabled={isSearching || !searchQuery.trim()}
                  title="Search location"
                >
                  {isSearching ? '…' : '🔍'}
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="cf-map-search-dropdown">
                  <div className="cf-msd-header">
                    <span>Search Results</span>
                    <button
                      type="button"
                      className="cf-msd-close"
                      onClick={() => setShowSearchResults(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <ul className="cf-msd-list">
                    {searchResults.map((res, idx) => (
                      <li
                        key={idx}
                        className="cf-msd-item"
                        onClick={() => handleSelectSearchResult(res)}
                      >
                        <span className="cf-msd-item-icon">📍</span>
                        <div className="cf-msd-item-info">
                          <strong className="cf-msd-item-title">{res.name}</strong>
                          <span className="cf-msd-item-desc">{res.displayName}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 2. Quick Zone Chips */}
          <div className="cf-map-quick-chips">
            <span className="cf-mqc-label">Quick Centers:</span>
            <button
              type="button"
              className="cf-map-chip"
              onClick={() => handleSelectPreset('Central Secretariat / Connaught Place', 28.6139, 77.2090)}
            >
              🏛️ Central Zone
            </button>
            <button
              type="button"
              className="cf-map-chip"
              onClick={() => handleSelectPreset('South Zone / Green Park', 28.5585, 77.2028)}
            >
              🌳 South Zone
            </button>
            <button
              type="button"
              className="cf-map-chip"
              onClick={() => handleSelectPreset('Sector 12 / West Zone', 28.5921, 77.0460)}
            >
              🏢 West Sector 12
            </button>
            <button
              type="button"
              className="cf-map-chip"
              onClick={() => handleSelectPreset('North Zone / Civil Lines', 28.6816, 77.2228)}
            >
              🏛️ North Zone
            </button>
          </div>

          {/* 3. Feedback / Status Banner */}
          {statusMessage && (
            <div className={`cf-map-status-pill ${detectionStatus ? `is-${detectionStatus}` : ''}`}>
              <span className="cf-msp-icon">
                {detectionStatus === 'success' ? '✓' : detectionStatus === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="cf-msp-text">{statusMessage}</span>
              {isGeocoding && <span className="cf-msp-sub">Resolving address details…</span>}
            </div>
          )}
        </div>
      )}

      {/* Map View Canvas Container */}
      <div
        className={`cf-map-canvas-container ${readOnly ? 'is-readonly' : ''}`}
        style={{ height }}
      >
        <div ref={mapContainerRef} className="cf-map-inner-element" />

        {/* Map Instructions Badge */}
        {!readOnly && (
          <div className="cf-map-overlay-hint">
            📍 Click anywhere or drag the blue pin to pinpoint the exact defect location
          </div>
        )}

        {/* Live Coordinates Pill */}
        <div className="cf-map-coords-pill">
          <span className="cf-mcp-label">Coordinates:</span>
          <strong>{formatCoordinates(currentCoords?.lat, currentCoords?.lng)}</strong>
          {accuracy && <span className="cf-mcp-acc">±{accuracy}m</span>}
        </div>
      </div>

      {/* Geocoding indicator footer */}
      {isGeocoding && (
        <div className="cf-map-geocoding-bar">
          <span className="cf-mgb-spinner"></span>
          <span>Fetching street address from municipal OpenStreetMap registry…</span>
        </div>
      )}
    </div>
  )
}
