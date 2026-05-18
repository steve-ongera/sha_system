import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">
        <i className={`bi ${icon}`} />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value ?? '—'}</span>
        <span className="stat-card__label">{label}</span>
        {sub && <span className="stat-card__sub">{sub}</span>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.dashboard.stats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading"><i className="bi bi-arrow-repeat spin" /> Loading stats…</div>
  if (error) return <div className="page-error"><i className="bi bi-exclamation-triangle" /> {error}</div>

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">System Overview</h2>
          <p className="page__subtitle">Real-time health insurance metrics for Kenya</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="bi-people-fill" label="Total Members" value={stats?.total_members?.toLocaleString()} sub={`${stats?.active_members?.toLocaleString()} active`} color="blue" />
        <StatCard icon="bi-wallet2" label="Total Contributions" value={`KES ${Number(stats?.total_contributions_kes || 0).toLocaleString()}`} color="green" />
        <StatCard icon="bi-file-medical" label="Total Claims" value={stats?.total_claims?.toLocaleString()} sub={`${stats?.pending_claims} pending`} color="amber" />
        <StatCard icon="bi-hospital" label="Providers" value={stats?.total_providers?.toLocaleString()} sub={`${stats?.accredited_providers} accredited`} color="teal" />
        <StatCard icon="bi-check-circle" label="Approved Claims" value={stats?.approved_claims?.toLocaleString()} color="green" />
        <StatCard icon="bi-shield-exclamation" label="Fraud Alerts" value={stats?.open_fraud_alerts?.toLocaleString()} sub={stats?.critical_alerts > 0 ? `${stats.critical_alerts} critical` : 'none critical'} color="red" />
      </div>

      <div className="dashboard__info">
        <div className="info-card">
          <h3 className="info-card__title"><i className="bi bi-info-circle" /> About SHA</h3>
          <p>The Social Health Authority (SHA) is Kenya's national health insurance system, replacing NHIF. It connects citizens, hospitals, employers, and government databases into one unified digital health platform.</p>
          <div className="info-card__modules">
            {[
              ['bi-person-badge', 'Member Management'],
              ['bi-currency-exchange', 'Contributions'],
              ['bi-building-add', 'Provider Management'],
              ['bi-file-earmark-medical', 'Claims Processing'],
              ['bi-shield-lock', 'Fraud Detection'],
              ['bi-bell-fill', 'Notifications'],
            ].map(([icon, label]) => (
              <span key={label} className="module-tag">
                <i className={`bi ${icon}`} /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}