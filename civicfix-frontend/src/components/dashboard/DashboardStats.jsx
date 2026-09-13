import { StatCard } from './StatCard.jsx'

/**
 * DashboardStats Component
 * Responsive grid container rendering role-tailored dashboard stat blocks.
 */
export function DashboardStats({ stats = [], children, className = '' }) {
  return (
    <div className={`cf-stat-grid ${className}`.trim()} role="region" aria-label="Dashboard statistics">
      {children
        ? children
        : stats.map((stat, idx) => (
            <StatCard
              key={stat.id || stat.label || idx}
              label={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              iconVariant={stat.iconVariant}
              trend={stat.trend}
              trendDirection={stat.trendDirection}
              onClick={stat.onClick}
            />
          ))}
    </div>
  )
}

