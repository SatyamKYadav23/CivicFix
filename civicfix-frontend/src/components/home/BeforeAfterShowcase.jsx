import React, { useState } from 'react'
import { CivicIllustration } from './HomeVisuals.jsx'

const CASE_STUDIES = [
  {
    id: 'pothole',
    title: 'Crater Pothole on Arterial Road',
    category: 'Roads & Infrastructure',
    icon: '🛣️',
    complaintId: 'CF-1004',
    location: 'Outer Ring Road, Near Flyover Pillar 32',
    beforeType: 'pothole-before',
    afterType: 'pothole-after',
    beforeDesc: 'Deep 8-inch asphalt depression causing severe traffic jams and bike hazards.',
    afterDesc: 'Cold-mix asphalt compacted, leveling verified, and reflective lane paint applied.',
    turnaround: '4.5 Hours (SLA: 24h)',
    technician: 'Ramesh Singh (PWD Road Fleet)',
    citizenReview: '"Reported during my morning commute, completely fixed before my drive back!"',
    citizenName: 'Kavita Sundaram',
    rating: 5,
  },
  {
    id: 'light',
    title: 'Dark Alleyway Street Light Restoration',
    category: 'Street Lights & Safety',
    icon: '💡',
    complaintId: 'CF-1001',
    location: 'Sector 12, Block B Junction, New Delhi',
    beforeType: 'light-before',
    afterType: 'light-after',
    beforeDesc: 'Vandalized junction box and blown lamp leaving 200m walkway in complete darkness.',
    afterDesc: 'Replaced with IP66 weather-sealed 90W LED fitting and smart dusk-to-dawn sensor.',
    turnaround: '6.2 Hours (SLA: 12h)',
    technician: 'Raj Kumar (Electrical Division)',
    citizenReview: '"Pedestrian safety restored immediately. The whole street is bright again."',
    citizenName: 'Satyam Sharma',
    rating: 5,
  },
  {
    id: 'water',
    title: 'High-Pressure Water Main Rupture',
    category: 'Water Supply & Pipelines',
    icon: '💧',
    complaintId: 'CF-1002',
    location: 'Sector 8 Market Square, New Delhi',
    beforeType: 'water-before',
    afterType: 'water-after',
    beforeDesc: 'High-pressure 8-bar main burst causing localized road flooding and low pressure.',
    afterDesc: 'Emergency isolating valve shutoff, stainless collar welded, and pressure restored.',
    turnaround: '3.1 Hours (SLA: 6h)',
    technician: 'Amit Sharma (Emergency Water Squad)',
    citizenReview: '"Critical flooding stopped in 45 minutes, pipeline welded the same afternoon."',
    citizenName: 'Priya Patel',
    rating: 5,
  },
  {
    id: 'sanitation',
    title: 'Illegal Garbage Dump Cleared & Greened',
    category: 'Sanitation & Environment',
    icon: '🗑️',
    complaintId: 'CF-1007',
    location: 'Community Park Perimeter, Ward 6',
    beforeType: 'sanitation-before',
    afterType: 'sanitation-after',
    beforeDesc: 'Overflowing commercial waste dump breeding insects and foul odor.',
    afterDesc: '3.5 tonnes cleared, bio-disinfected, twin segregated bins installed, and lawn planted.',
    turnaround: '5.0 Hours (SLA: 12h)',
    technician: 'Sunil Verma (Sanitation Operations)',
    citizenReview: '"Transformed a terrible eye-sore into a clean, green community walking spot."',
    citizenName: 'Dr. Alok Nath',
    rating: 5,
  },
]

export function BeforeAfterShowcase() {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0)
  const [viewMode, setViewMode] = useState('split') // 'before' | 'split' | 'after'

  const currentCase = CASE_STUDIES[activeCaseIndex]

  return (
    <div className="cf-ba-container">
      {/* Case Navigation Tabs */}
      <div className="cf-ba-tabs" role="tablist" aria-label="Resolution Case Studies">
        {CASE_STUDIES.map((c, idx) => {
          const isActive = idx === activeCaseIndex
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`cf-ba-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                setActiveCaseIndex(idx)
              }}
            >
              <span className="cf-ba-tab-icon">{c.icon}</span>
              <span className="cf-ba-tab-title">{c.title}</span>
            </button>
          )
        })}
      </div>

      {/* Main Interactive Comparison Grid */}
      <div className="cf-ba-main-card">
        <div className="cf-ba-visual-side">
          {/* Controls Bar */}
          <div className="cf-ba-controls-bar">
            <span className="cf-ba-tag">
              Case {currentCase.complaintId} • {currentCase.category}
            </span>

            <div className="cf-ba-mode-buttons" role="group" aria-label="Visual view toggle">
              <button
                type="button"
                className={`cf-mode-btn ${viewMode === 'before' ? 'is-active' : ''}`}
                onClick={() => setViewMode('before')}
              >
                ⚠️ Before
              </button>
              <button
                type="button"
                className={`cf-mode-btn ${viewMode === 'split' ? 'is-active' : ''}`}
                onClick={() => setViewMode('split')}
              >
                ⚡ Split Slider
              </button>
              <button
                type="button"
                className={`cf-mode-btn ${viewMode === 'after' ? 'is-active' : ''}`}
                onClick={() => setViewMode('after')}
              >
                ✅ Verified After
              </button>
            </div>
          </div>

          {/* Dynamic Visual Stage */}
          <div className="cf-ba-stage-wrap">
            {viewMode === 'before' && (
              <div className="cf-ba-stage-single">
                <CivicIllustration type={currentCase.beforeType} height={260} className="cf-ba-svg" />
                <div className="cf-ba-stage-caption danger">
                  <strong>Initial Citizen Grievance State</strong>
                  <span>{currentCase.beforeDesc}</span>
                </div>
              </div>
            )}

            {viewMode === 'after' && (
              <div className="cf-ba-stage-single">
                <CivicIllustration type={currentCase.afterType} height={260} className="cf-ba-svg" />
                <div className="cf-ba-stage-caption success">
                  <strong>Field Resolution & Photo Verification</strong>
                  <span>{currentCase.afterDesc}</span>
                </div>
              </div>
            )}

            {viewMode === 'split' && (
              <div className="cf-ba-interactive-slider-stage">
                <div className="cf-ba-split-grid">
                  <div className="cf-ba-split-side before">
                    <div className="cf-ba-split-header danger">
                      <span>⚠️ BEFORE FIX</span>
                    </div>
                    <CivicIllustration type={currentCase.beforeType} height={220} className="cf-ba-svg" />
                  </div>

                  <div className="cf-ba-split-side after">
                    <div className="cf-ba-split-header success">
                      <span>✅ AFTER PHOTO-VERIFICATION</span>
                    </div>
                    <CivicIllustration type={currentCase.afterType} height={220} className="cf-ba-svg" />
                  </div>
                </div>

                <div className="cf-ba-slider-info">
                  <span>💡 Both before & after images are permanently cryptographically archived in the citizen grievance audit ledger.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details & Field Inspection Stamp Side */}
        <div className="cf-ba-details-side">
          <div className="cf-ba-verified-badge">
            <span className="cf-stamp-icon">🛡️</span>
            <div>
              <strong>Municipal Field Inspection Sealed</strong>
              <div className="cf-stamp-sub">GPS Lat/Long Authenticated • Zero Tamper</div>
            </div>
          </div>

          <h3 className="cf-ba-title">{currentCase.title}</h3>
          <p className="cf-ba-location">📍 {currentCase.location}</p>

          <div className="cf-ba-meta-grid">
            <div className="cf-ba-meta-item">
              <span className="meta-label">Resolution Time</span>
              <strong className="meta-val text-success">⚡ {currentCase.turnaround}</strong>
            </div>
            <div className="cf-ba-meta-item">
              <span className="meta-label">Assigned Technician</span>
              <strong className="meta-val">👷 {currentCase.technician}</strong>
            </div>
          </div>

          {/* Citizen Testimonial Quote */}
          <div className="cf-ba-quote-card">
            <div className="cf-ba-stars">
              {'⭐'.repeat(currentCase.rating)}
              <span className="cf-ba-rating-text">5.0 / 5.0 Rating</span>
            </div>
            <p className="cf-ba-quote-text">{currentCase.citizenReview}</p>
            <div className="cf-ba-citizen-name">— {currentCase.citizenName} (Verified Resident)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
