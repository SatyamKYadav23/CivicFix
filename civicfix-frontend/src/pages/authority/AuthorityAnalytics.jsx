import { Card } from '../../components/ui/Card.jsx'
import { DashboardStats } from '../../components/dashboard/index.js'

export function AuthorityAnalytics() {
  return (
    <div>
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Complaint Analytics & Insights</h1>
          <p className="cf-page-subtitle">SLA compliance, category distribution, and field operational metrics.</p>
        </div>
      </div>

      <DashboardStats
        stats={[
          {
            label: 'Avg Resolution Time',
            value: '18.4 hrs',
            subtitle: 'Target: <24 hrs',
            icon: '⚡',
            iconVariant: 'success',
            trend: '-2.1 hrs vs last month',
            trendDirection: 'up',
          },
          {
            label: 'SLA Adherence',
            value: '91.8%',
            subtitle: 'Jurisdiction benchmark',
            icon: '🎯',
            iconVariant: 'primary',
            trend: '+3.4%',
            trendDirection: 'up',
          },
          {
            label: 'Citizen Satisfaction',
            value: '4.6 / 5',
            subtitle: 'Based on 78 reviews',
            icon: '⭐',
            iconVariant: 'warning',
          },
        ]}
      />

      <div className="cf-showcase-grid" style={{ marginTop: 'var(--space-6)' }}>
        <Card title="Complaints by Category">
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <span>💡 Street Lights</span>
              <strong>42 (30%)</strong>
            </div>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <span>🛣️ Roads & Potholes</span>
              <strong>38 (27%)</strong>
            </div>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <span>💧 Water Supply</span>
              <strong>28 (20%)</strong>
            </div>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <span>🗑️ Sanitation</span>
              <strong>24 (17%)</strong>
            </div>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <span>🌊 Drainage</span>
              <strong>10 (6%)</strong>
            </div>
          </div>
        </Card>

        <Card title="Top Performing Workers">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>Amit Sharma</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>Sanitation</div>
              </div>
              <span className="cf-nav-badge" style={{ backgroundColor: 'var(--color-success-600)' }}>65 Resolved</span>
            </div>
            <div className="cf-inline-wrap" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>Raj Kumar</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>Electrical</div>
              </div>
              <span className="cf-nav-badge" style={{ backgroundColor: 'var(--color-success-600)' }}>42 Resolved</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

