import React from 'react'

/**
 * Clean, High-Definition GovTech Vector Illustrations for Resolution Showcase
 */
export function CivicIllustration({ type, height = 240, className = '' }) {
  const commonProps = {
    viewBox: '0 0 400 240',
    width: '100%',
    height,
    className,
    style: { display: 'block', borderRadius: '8px', overflow: 'hidden' },
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (type) {
    case 'pothole-before':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="potholeRoadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="craterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#111827" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>
            <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#potholeRoadGrad)" />
          <line x1="20" y1="120" x2="110" y2="120" stroke="#fbbf24" strokeWidth="6" strokeDasharray="16 12" strokeOpacity="0.6" />
          <line x1="280" y1="120" x2="380" y2="120" stroke="#fbbf24" strokeWidth="6" strokeDasharray="16 12" strokeOpacity="0.6" />
          <ellipse cx="195" cy="125" rx="75" ry="38" fill="url(#craterGrad)" />
          <path d="M125 120 Q150 148 190 152 Q235 155 265 125 Q245 100 200 98 Q145 102 125 120 Z" fill="#0b0f17" stroke="#4b5563" strokeWidth="2" />
          <path d="M190 152 L175 185 M230 145 L255 175 M140 115 L105 100 M250 110 L285 95" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
          <g transform="translate(90, 75)">
            <ellipse cx="20" cy="80" rx="22" ry="8" fill="#0f172a" opacity="0.4" />
            <polygon points="20,10 5,78 35,78" fill="url(#coneGrad)" />
            <polygon points="17,32 11,54 29,54 23,32" fill="#ffffff" />
            <polygon points="18,58 7,72 33,72 22,58" fill="#ffffff" />
            <rect x="2" y="76" width="36" height="5" rx="2.5" fill="#ea580c" />
          </g>
          <g transform="translate(265, 25)">
            <rect width="115" height="28" rx="14" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
            <text x="57" y="18" fill="#b91c1c" fontSize="11" fontWeight="bold" textAnchor="middle">⚠️ SEVERE CRATER</text>
          </g>
        </svg>
      )

    case 'pothole-after':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="freshAsphaltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="patchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#freshAsphaltGrad)" />
          <rect x="110" y="70" width="180" height="105" rx="8" fill="url(#patchGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="20" y1="120" x2="380" y2="120" stroke="#fef08a" strokeWidth="8" strokeDasharray="24 16" />
          <line x1="120" y1="120" x2="280" y2="120" stroke="#facc15" strokeWidth="8" strokeDasharray="24 16" />
          <line x1="120" y1="85" x2="280" y2="85" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="120" y1="100" x2="280" y2="100" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="120" y1="140" x2="280" y2="140" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="120" y1="155" x2="280" y2="155" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
          <g transform="translate(245, 20)">
            <rect width="135" height="30" rx="15" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
            <text x="67" y="19" fill="#047857" fontSize="11" fontWeight="bold" textAnchor="middle">✅ COMPACTED & SEALED</text>
          </g>
          <circle cx="200" cy="120" r="22" fill="#10b981" opacity="0.9" />
          <path d="M190 120 L197 127 L212 112" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'light-before':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#030712" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#nightSky)" />
          <rect x="0" y="180" width="400" height="60" fill="#090d16" />
          <line x1="0" y1="180" x2="400" y2="180" stroke="#1f2937" strokeWidth="2" />
          <g transform="translate(180, 20)">
            <rect x="18" y="40" width="8" height="150" fill="#374151" rx="2" />
            <path d="M22 40 Q22 10 55 10 L75 15" fill="none" stroke="#374151" strokeWidth="6" strokeLinecap="round" />
            <polygon points="68,14 84,18 80,28 64,24" fill="#1f2937" stroke="#4b5563" />
            <rect x="14" y="125" width="16" height="24" rx="2" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
            <path d="M22 130 L20 138 L25 137 L21 145" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g transform="translate(25, 30)">
            <rect width="130" height="28" rx="14" fill="#450a0a" stroke="#b91c1c" strokeWidth="1" />
            <text x="65" y="18" fill="#f87171" fontSize="11" fontWeight="bold" textAnchor="middle">🌑 0 LUX - DARK ZONE</text>
          </g>
        </svg>
      )

    case 'light-after':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="twilightSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="lightConeGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#fef08a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.02" />
            </linearGradient>
            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="240" fill="url(#twilightSky)" />
          <rect x="0" y="180" width="400" height="60" fill="#334155" />
          <line x1="0" y1="180" x2="400" y2="180" stroke="#64748b" strokeWidth="2" />
          <polygon points="252,35 110,240 380,240" fill="url(#lightConeGrad)" />
          <g transform="translate(180, 20)">
            <rect x="18" y="40" width="8" height="150" fill="#64748b" rx="2" />
            <path d="M22 40 Q22 10 55 10 L75 15" fill="none" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <polygon points="68,14 84,18 80,28 64,24" fill="#e2e8f0" stroke="#94a3b8" />
            <circle cx="73" cy="23" r="28" fill="url(#lampGlow)" />
            <rect x="14" y="125" width="16" height="24" rx="2" fill="#065f46" stroke="#10b981" strokeWidth="1" />
            <circle cx="22" cy="137" r="3" fill="#34d399" />
          </g>
          <g transform="translate(25, 30)">
            <rect width="135" height="28" rx="14" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
            <text x="67" y="18" fill="#047857" fontSize="11" fontWeight="bold" textAnchor="middle">💡 90W SMART LED ACTIVE</text>
          </g>
        </svg>
      )

    case 'water-before':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="waterBurst" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#groundGrad)" />
          <ellipse cx="200" cy="180" rx="130" ry="35" fill="#0284c7" opacity="0.7" />
          <ellipse cx="200" cy="180" rx="90" ry="20" fill="#38bdf8" opacity="0.8" />
          <rect x="40" y="165" width="320" height="25" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <path d="M190 165 C180 110 160 80 195 40 C205 75 225 105 215 165 Z" fill="url(#waterBurst)" opacity="0.9" />
          <path d="M185 165 C175 125 150 95 170 65 C185 95 195 130 195 165 Z" fill="#38bdf8" opacity="0.6" />
          <path d="M210 165 C220 120 250 90 230 60 C215 90 205 130 205 165 Z" fill="#7dd3fc" opacity="0.7" />
          <circle cx="170" cy="55" r="4" fill="#bae6fd" />
          <circle cx="225" cy="48" r="5" fill="#bae6fd" />
          <circle cx="195" cy="28" r="6" fill="#e0f2fe" />
          <g transform="translate(255, 25)">
            <rect width="125" height="28" rx="14" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
            <text x="62" y="18" fill="#b91c1c" fontSize="11" fontWeight="bold" textAnchor="middle">🚨 8-BAR RUPTURE</text>
          </g>
        </svg>
      )

    case 'water-after':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="dryGroundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="metalCollar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#dryGroundGrad)" />
          <rect x="50" y="120" width="300" height="95" rx="8" fill="#1e293b" />
          <rect x="30" y="150" width="340" height="32" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <rect x="165" y="142" width="70" height="48" rx="4" fill="url(#metalCollar)" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="178" cy="152" r="3" fill="#1e293b" />
          <circle cx="178" cy="180" r="3" fill="#1e293b" />
          <circle cx="222" cy="152" r="3" fill="#1e293b" />
          <circle cx="222" cy="180" r="3" fill="#1e293b" />
          <g transform="translate(190, 85)">
            <rect x="8" y="25" width="4" height="20" fill="#94a3b8" />
            <circle cx="10" cy="12" r="16" fill="#ffffff" stroke="#334155" strokeWidth="2" />
            <path d="M5 16 A 10 10 0 0 1 15 16" fill="none" stroke="#22c55e" strokeWidth="3" />
            <line x1="10" y1="12" x2="10" y2="4" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g transform="translate(245, 25)">
            <rect width="135" height="28" rx="14" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
            <text x="67" y="18" fill="#047857" fontSize="11" fontWeight="bold" textAnchor="middle">✅ WELDED & SEALED</text>
          </g>
        </svg>
      )

    case 'sanitation-before':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="dumpBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#dumpBack)" />
          <rect x="0" y="170" width="400" height="70" fill="#1e293b" />
          <g transform="translate(160, 95)">
            <polygon points="15,0 65,0 58,80 22,80" fill="#065f46" stroke="#047857" strokeWidth="2" />
            <line x1="5" y1="5" x2="70" y2="-15" stroke="#047857" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="25" cy="-2" rx="18" ry="12" fill="#111827" />
            <ellipse cx="50" cy="5" rx="16" ry="10" fill="#374151" />
            <polygon points="-10,50 15,30 25,65 -5,70" fill="#78350f" opacity="0.9" />
            <circle cx="75" cy="70" r="14" fill="#1f2937" />
            <ellipse cx="-20" cy="75" rx="25" ry="8" fill="#451a03" />
            <ellipse cx="85" cy="80" rx="30" ry="10" fill="#18181b" />
          </g>
          <circle cx="150" cy="75" r="2" fill="#facc15" />
          <circle cx="215" cy="65" r="2" fill="#facc15" />
          <circle cx="180" cy="55" r="2" fill="#facc15" />
          <g transform="translate(250, 25)">
            <rect width="130" height="28" rx="14" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
            <text x="65" y="18" fill="#b91c1c" fontSize="11" fontWeight="bold" textAnchor="middle">⚠️ 3.5T WASTE DUMP</text>
          </g>
        </svg>
      )

    case 'sanitation-after':
      return (
        <svg {...commonProps}>
          <defs>
            <linearGradient id="cleanPlaza" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <rect width="400" height="240" fill="url(#cleanPlaza)" />
          <rect x="0" y="160" width="400" height="80" fill="#cbd5e1" />
          <line x1="0" y1="160" x2="400" y2="160" stroke="#94a3b8" strokeWidth="2" />
          <line x1="100" y1="160" x2="100" y2="240" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="200" y1="160" x2="200" y2="240" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="300" y1="160" x2="300" y2="240" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.5" />
          <g transform="translate(130, 90)">
            <rect x="0" y="15" width="40" height="65" rx="6" fill="#15803d" stroke="#166534" strokeWidth="2" />
            <rect x="-3" y="10" width="46" height="8" rx="4" fill="#166534" />
            <text x="20" y="48" fill="#bbf7d0" fontSize="10" fontWeight="bold" textAnchor="middle">ORGANIC</text>
            <rect x="52" y="15" width="40" height="65" rx="6" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
            <rect x="49" y="10" width="46" height="8" rx="4" fill="#0369a1" />
            <text x="72" y="48" fill="#bae6fd" fontSize="10" fontWeight="bold" textAnchor="middle">RECYCLE</text>
          </g>
          <g transform="translate(250, 110)">
            <rect x="0" y="25" width="70" height="35" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <circle cx="18" cy="15" r="14" fill="#22c55e" />
            <circle cx="35" cy="10" r="16" fill="#16a34a" />
            <circle cx="52" cy="14" r="14" fill="#22c55e" />
            <circle cx="35" cy="10" r="4" fill="#facc15" />
            <circle cx="18" cy="15" r="3" fill="#f43f5e" />
          </g>
          <g transform="translate(245, 20)">
            <rect width="135" height="28" rx="14" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
            <text x="67" y="18" fill="#047857" fontSize="11" fontWeight="bold" textAnchor="middle">🌿 SANITIZED & GREENED</text>
          </g>
        </svg>
      )

    default:
      return (
        <div style={{ height, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>Municipal Photo Evidence</span>
        </div>
      )
  }
}

/**
 * Clean, Professional GovTech Operational Visuals & Control Center Card
 */
export function GovOpsSummaryCard({ totalActive = 42, resolvedCount = '12,850+', complianceRate = '98.4%' }) {
  return (
    <div className="cf-gov-ops-card">
      <div className="cf-gov-ops-header">
        <div className="cf-gov-seal-badge">
          <span style={{ fontSize: '1.4rem' }}>🏛️</span>
          <div>
            <strong>MUNICIPAL CONTROL CENTER</strong>
            <div className="cf-gov-sub">Smart City Governance Division</div>
          </div>
        </div>
        <div className="cf-gov-live-tag">
          <span className="cf-pulse-dot" />
          <span>LIVE OPS</span>
        </div>
      </div>

      <div className="cf-gov-metrics-grid">
        <div className="cf-gov-metric-box">
          <span className="cf-gmb-label">Active Triage</span>
          <strong className="cf-gmb-val text-primary">{totalActive} Cases</strong>
          <span className="cf-gmb-sub">Across 14 Zonal Wards</span>
        </div>

        <div className="cf-gov-metric-box">
          <span className="cf-gmb-label">SLA Compliance</span>
          <strong className="cf-gmb-val text-success">{complianceRate}</strong>
          <span className="cf-gmb-sub">Within Target Window</span>
        </div>

        <div className="cf-gov-metric-box">
          <span className="cf-gmb-label">Total Resolved</span>
          <strong className="cf-gmb-val">{resolvedCount}</strong>
          <span className="cf-gmb-sub">Photo-Verified Closures</span>
        </div>

        <div className="cf-gov-metric-box">
          <span className="cf-gmb-label">Field Units</span>
          <strong className="cf-gmb-val">18 Teams</strong>
          <span className="cf-gmb-sub">On-Site Deployment</span>
        </div>
      </div>

      <div className="cf-gov-recent-bar">
        <div className="cf-grb-head">
          <span>RECENT RESOLUTIONS LOG</span>
          <span className="cf-grb-status">VERIFIED</span>
        </div>
        <div className="cf-grb-list">
          <div className="cf-grb-item">
            <span className="cf-grb-id">#CF-1002</span>
            <span className="cf-grb-cat">Water Supply</span>
            <span className="cf-grb-loc">Sector 8 Market</span>
            <span className="cf-grb-time">Fixed (3.1h)</span>
          </div>
          <div className="cf-grb-item">
            <span className="cf-grb-id">#CF-1001</span>
            <span className="cf-grb-cat">Street Lights</span>
            <span className="cf-grb-loc">Sector 12 Walkway</span>
            <span className="cf-grb-time">Fixed (5.2h)</span>
          </div>
          <div className="cf-grb-item">
            <span className="cf-grb-id">#CF-1004</span>
            <span className="cf-grb-cat">Roads & Potholes</span>
            <span className="cf-grb-loc">Outer Ring Road</span>
            <span className="cf-grb-time">Fixed (4.5h)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
