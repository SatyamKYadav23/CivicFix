import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CivicFixLogo } from '../../components/ui/CivicFixLogo.jsx'
import { BeforeAfterShowcase } from '../../components/home/BeforeAfterShowcase.jsx'
import { LiveTrackModal } from '../../components/home/LiveTrackModal.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const CATEGORIES = [
  {
    icon: '🛣️',
    title: 'Roads & Footpaths',
    text: 'Potholes, crater depressions, broken kerbs, missing manhole covers, and damaged sidewalks.',
    sla: 'SLA: 24 Hours',
    tone: 'road',
    categoryKey: 'ROADS_POTHOLES',
  },
  {
    icon: '💧',
    title: 'Water Supply & Pipelines',
    text: 'Underground main ruptures, low pressure, dirty water contamination, and pipeline leaks.',
    sla: 'SLA: 6 Hours',
    tone: 'water',
    categoryKey: 'WATER_SUPPLY',
  },
  {
    icon: '💡',
    title: 'Street Lighting & Safety',
    text: 'Faulty LED luminaires, dark pedestrian zones, flickering poles, and exposed wire boxes.',
    sla: 'SLA: 12 Hours',
    tone: 'light',
    categoryKey: 'STREET_LIGHTS',
  },
  {
    icon: '🗑️',
    title: 'Sanitation & Solid Waste',
    text: 'Overflowing community dumpsters, uncollected garbage heaps, and public hygiene hazards.',
    sla: 'SLA: 12 Hours',
    tone: 'clean',
    categoryKey: 'SANITATION_WASTE',
  },
  {
    icon: '🌧️',
    title: 'Drainage & Stormwater',
    text: 'Monsoon waterlogging, choked storm drains, blocked culverts, and sewer overflows.',
    sla: 'SLA: 18 Hours',
    tone: 'drain',
    categoryKey: 'DRAINAGE_SEWAGE',
  },
  {
    icon: '🌳',
    title: 'Parks & Public Amenities',
    text: 'Fallen tree branches, broken park benches, vandalized playground gear, and overgrown grass.',
    sla: 'SLA: 36 Hours',
    tone: 'park',
    categoryKey: 'PARKS_PUBLIC_SPACES',
  },
]

const ECOSYSTEM_STEPS = [
  {
    num: '01',
    title: 'Citizens File Geotagged Reports',
    text: 'Snap a live photo, pin the exact map location, and submit grievances in under 60 seconds with zero paperwork.',
  },
  {
    num: '02',
    title: 'Department AI Triage & Routing',
    text: 'CivicFix automatically routes tickets to the nodal authority corresponding to the division (Roads, Water, Electrical, Sanitation).',
  },
  {
    num: '03',
    title: 'Field Response & On-Site Repair',
    text: 'Assigned municipal crews receive real-time mobile work orders, execute field repairs, and upload timestamped proof.',
  },
  {
    num: '04',
    title: 'Citizen Verification & Public Audit',
    text: 'The reporting citizen reviews photographic evidence, rates the repair quality, and confirms closure before docket sealing.',
  },
]

const TESTIMONIALS = [
  {
    stars: 5,
    quote:
      'Reported an 8-inch deep crater on Outer Ring Road on my morning drive. By 3 PM, the road crew had compacted fresh asphalt and lane paint. The photo tracking gave me total confidence.',
    name: 'Kavita Sundaram',
    role: 'Resident, Ward 14',
    avatar: 'KS',
  },
  {
    stars: 5,
    quote:
      'Our colony walkway had three broken streetlights leaving the entire stretch dark. Submitted via CivicFix and replacement LED fixtures were installed within 6 hours. Excellent governance.',
    name: 'Satyam Sharma',
    role: 'Resident, Sector 12',
    avatar: 'SS',
  },
  {
    stars: 5,
    quote:
      'A high-pressure water pipe burst right in front of our market square. The water squad arrived in 25 minutes, shut the valve, and welded the main the same afternoon.',
    name: 'Priya Patel',
    role: 'Market Association Head, Sector 8',
    avatar: 'PP',
  },
]

const FAQS = [
  {
    q: 'How does photographic evidence prevent false grievance closure?',
    a: 'Field technicians are required to upload high-resolution GPS-geotagged and timestamped photos of the completed work. The citizen who reported the issue is notified immediately and has final approval to accept or dispute the resolution.',
  },
  {
    q: 'What is the standard SLA response timeline for different issues?',
    a: 'Emergency issues like critical water main bursts have a 6-hour response SLA. Streetlight outages and garbage overflow are prioritized within 12 hours, while standard road asphalt repairs are targeted within 24 hours.',
  },
  {
    q: 'Can I track a complaint without creating an account or logging in?',
    a: 'Yes! Anyone can enter their Docket ID (such as CF-1001) in the Grievance Tracker on this homepage to inspect real-time progress, assigned technician info, and audit milestones instantly.',
  },
  {
    q: 'What happens if a municipal department fails to resolve an issue in time?',
    a: 'Our automated SLA engine flags delayed tickets and automatically escalates them to the Municipal Zonal Commissioner and Chief Municipal Administrator with red alerts on their control dashboards.',
  },
  {
    q: 'Are my personal contact details shared publicly with workers or third parties?',
    a: 'No. Your phone number and email are kept strictly confidential within the municipal administration system. Field workers only see the grievance description, category, and geolocation coordinates.',
  },
]

export function LandingPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [trackModalOpen, setTrackModalOpen] = useState(false)
  const [trackQuery, setTrackQuery] = useState('')
  const [openFaq, setOpenFaq] = useState(0)

  const handleHeroTrackSubmit = (e) => {
    e.preventDefault()
    if (trackQuery.trim()) {
      setTrackModalOpen(true)
    }
  }

  const reportLink = isAuthenticated ? '/citizen/complaints/new' : '/register'

  return (
    <div className="landing-page">
      {/* ---------------- 1. Hero Section ---------------- */}
      <section className="landing-hero">
        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />

        <div className="container landing-hero-grid">
          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <span>🏛️</span> Official Municipal Grievance & Urban Redressal System
            </div>

            <h1>
              Empowering Citizens.{' '}
              <span className="landing-hero-gradient-text">Fixing Cities in Real Time.</span>
            </h1>

            <p>
              Report potholes, dark streetlights, pipe leaks, and civic hazards in under 60 seconds.
              Track real-time progress from field assignment to verified completion with transparent
              photographic evidence.
            </p>

            {/* Quick-Track Input Form */}
            <form onSubmit={handleHeroTrackSubmit} className="landing-hero-track-bar">
              <span style={{ fontSize: '1.2rem', paddingLeft: '8px' }}>🔎</span>
              <input
                type="text"
                placeholder="Enter Docket Number (e.g. CF-1001, CF-1004)..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: '999px', padding: '0.6rem 1.4rem', whiteSpace: 'nowrap' }}
              >
                Track Status →
              </button>
            </form>

            <div className="landing-hero-actions">
              <Link to={reportLink} className="landing-primary-action">
                <span>+</span> Report Civic Issue
              </Link>
              <a href="#categories" className="landing-secondary-action">
                Browse Departments ↓
              </a>
            </div>

            <div className="landing-trust-strip">
              <div className="landing-trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>100% Photo-Verified</span>
              </div>
              <div className="landing-trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>GPS-Geotagged Proof</span>
              </div>
              <div className="landing-trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>24x7 SLA Automated Escalation</span>
              </div>
            </div>
          </div>

          {/* Right Hero Live Telemetry Preview Card */}
          <div className="landing-telemetry-card">
            <div className="landing-telemetry-header">
              <div className="landing-telemetry-badge">
                <CivicFixLogo style={{ width: '22px', height: '22px' }} />
                <span>MUNICIPAL LIVE TELEMETRY</span>
              </div>
              <div className="landing-telemetry-live">
                <span className="cf-pulse-dot" />
                <span>IN PROGRESS</span>
              </div>
            </div>

            <div className="landing-telemetry-body">
              <div className="landing-telemetry-title">
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Water Supply Division
                  </span>
                  <h3>Water Main Rupture & Road Flooding</h3>
                  <p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    Sector 8 Market Junction, Ward 14
                  </p>
                </div>
                <span className="landing-telemetry-id">#CF-1002</span>
              </div>

              {/* Progress Stepper */}
              <div className="landing-telemetry-stepper">
                <div className="landing-stepper-track">
                  <div className="landing-stepper-line" />
                  <div className="landing-stepper-progress" />
                  <div className="landing-stepper-nodes">
                    <div className="landing-stepper-node done">✓</div>
                    <div className="landing-stepper-node done">✓</div>
                    <div className="landing-stepper-node active">⚡</div>
                    <div className="landing-stepper-node">○</div>
                  </div>
                </div>
                <div className="landing-stepper-labels">
                  <span>Reported</span>
                  <span>Triaged</span>
                  <span>On-Site Repair</span>
                  <span>Closure</span>
                </div>
              </div>

              {/* Assigned Worker Info */}
              <div className="landing-telemetry-assignee">
                <div className="landing-telemetry-avatar">AS</div>
                <div className="landing-telemetry-assignee-info">
                  <small>Assigned Field Crew</small>
                  <strong>Amit Sharma</strong>
                  <span>Emergency Water Squad · ETA ~15 min</span>
                </div>
                <div style={{ background: '#ecfdf5', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Active
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📷</span>
                <span>Mandatory GPS photo evidence required before docket closure.</span>
              </div>
            </div>

            <div className="landing-telemetry-footer">
              <span>SLA Clock: <strong>3.1h remaining (Target: 6h)</strong></span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-primary-600)' }}
                onClick={() => {
                  setTrackQuery('CF-1002')
                  setTrackModalOpen(true)
                }}
              >
                Inspect Docket Details →
              </button>
            </div>

            {/* Floating verification tag */}
            <div className="landing-telemetry-floating-tag">
              <span>🛡️</span>
              <span>GPS Geotag Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. Impact Metrics Strip ---------------- */}
      <section className="landing-metrics-strip">
        <div className="container">
          <div className="landing-metrics-grid">
            <div className="landing-metric-card">
              <strong>12,850+</strong>
              <span>Photo-Verified Civic Resolutions</span>
            </div>
            <div className="landing-metric-card">
              <strong>&lt; 4.5 Hours</strong>
              <span>Average Resolution Turnaround</span>
            </div>
            <div className="landing-metric-card">
              <strong>98.4%</strong>
              <span>Citizen Satisfaction Rating</span>
            </div>
            <div className="landing-metric-card">
              <strong>14 Wards</strong>
              <span>24/7 Field Crew Deployment</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 3. Core Civic Categories ---------------- */}
      <section id="categories" className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-badge">MUNICIPAL SERVICES</span>
            <h2>What Would You Like Fixed Today?</h2>
            <p>
              Select an issue category to report directly to the specialized municipal department
              responsible for your sector.
            </p>
          </div>

          <div className="landing-category-grid-modern">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.title}
                to={reportLink}
                className={`landing-cat-card ${cat.tone}`}
              >
                <div>
                  <div className="landing-cat-top">
                    <div className="landing-cat-icon">{cat.icon}</div>
                    <span className="landing-cat-sla">{cat.sla}</span>
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.text}</p>
                </div>
                <div className="landing-cat-link">
                  <span>Report this issue</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 4. Interactive Resolution Showcase ---------------- */}
      <section id="showcase" className="landing-section" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-badge">TRANSPARENCY IN ACTION</span>
            <h2>Photo-Verified Field Resolutions</h2>
            <p>
              Inspect authentic before-and-after transformations handled by our rapid municipal response teams.
              Toggle views to compare repair quality and citizen feedback.
            </p>
          </div>

          {/* Interactive Before & After Showcase Component */}
          <BeforeAfterShowcase />
        </div>
      </section>

      {/* ---------------- 5. 4-Stakeholder Ecosystem ---------------- */}
      <section id="how-it-works" className="landing-section landing-ecosystem-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-badge">THE CIVICFIX ADVANTAGE</span>
            <h2>One Unified Platform. Complete Accountability.</h2>
            <p>
              CivicFix synchronizes citizens, department leadership, field response teams, and platform auditors
              in an unbreakable, transparent loop.
            </p>
          </div>

          <div className="landing-ecosystem-grid">
            {ECOSYSTEM_STEPS.map((step) => (
              <div key={step.num} className="landing-eco-card">
                <div className="landing-eco-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 6. Citizen Testimonials ---------------- */}
      <section className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-badge">CITIZEN VOICES</span>
            <h2>Trusted by Residents Across All Wards</h2>
            <p>
              Hear from citizens who made their neighborhoods safer, cleaner, and brighter using CivicFix.
            </p>
          </div>

          <div className="landing-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="landing-testimonial-card">
                <div>
                  <div className="landing-testimonial-stars">
                    {'★'.repeat(t.stars)}
                  </div>
                  <p>"{t.quote}"</p>
                </div>
                <div className="landing-testimonial-author">
                  <div className="landing-author-avatar">{t.avatar}</div>
                  <div className="landing-author-info">
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 7. FAQ Accordion ---------------- */}
      <section id="faq" className="landing-section landing-faq-section">
        <div className="container">
          <div className="landing-section-header">
            <span className="landing-section-badge">QUESTIONS & ANSWERS</span>
            <h2>Everything You Need to Know</h2>
            <p>
              Learn how grievance reporting, SLA timelines, and photo verification operate behind the scenes.
            </p>
          </div>

          <div className="landing-faq-container">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div key={faq.q} className={`landing-faq-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className="indicator">+</span>
                  </button>
                  {isOpen && (
                    <div className="landing-faq-body">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------------- 8. Bottom Conversion CTA ---------------- */}
      <section className="landing-final-section">
        <div className="container">
          <div className="landing-final-card-modern">
            <span className="landing-section-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
              YOUR CITY STARTS WITH YOU
            </span>
            <h2>See Something Broken in Your Neighborhood?</h2>
            <p>
              Take 60 seconds to file a report. Help municipal teams locate and resolve civic issues faster
              than ever before.
            </p>
            <div className="landing-final-buttons">
              <Link to={reportLink} className="landing-cta-light">
                + Report an Issue Now
              </Link>
              <button
                type="button"
                className="landing-cta-ghost"
                onClick={() => {
                  setTrackQuery('CF-1001')
                  setTrackModalOpen(true)
                }}
              >
                Track Grievance Status →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Live Tracking Modal ---------------- */}
      <LiveTrackModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        initialQuery={trackQuery}
      />
    </div>
  )
}
