import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const SEVERITY_CONFIG = {
  low:      { badge: 'bg-info text-dark',    icon: 'bi-info-circle',           label: 'Low' },
  medium:   { badge: 'bg-warning text-dark', icon: 'bi-exclamation-circle',    label: 'Medium' },
  high:     { badge: 'bg-orange text-white', icon: 'bi-exclamation-triangle',  label: 'High' },
  critical: { badge: 'bg-danger',            icon: 'bi-exclamation-octagon-fill', label: 'Critical' },
}

const STATUS_CONFIG = {
  open:           { badge: 'bg-danger bg-opacity-10 text-danger border border-danger', label: 'Open' },
  resolved:       { badge: 'bg-success bg-opacity-10 text-success border border-success', label: 'Resolved' },
  false_positive: { badge: 'bg-secondary bg-opacity-10 text-secondary border border-secondary', label: 'False Positive' },
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium
  return (
    <span className={`badge ${cfg.badge}`}>
      <i className={`bi ${cfg.icon} me-1`}></i>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open
  return <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
}

function AlertRow({ alert, onResolve }) {
  return (
    <tr className={alert.severity === 'critical' ? 'table-danger' : alert.severity === 'high' ? 'table-warning' : ''}>
      <td>
        <div className="fw-semibold small font-monospace">{alert.claim_number || '—'}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          {new Date(alert.detected_at).toLocaleDateString()}
        </div>
      </td>
      <td>
        <div className="fw-semibold">{alert.member_name || '—'}</div>
      </td>
      <td className="text-muted small">{alert.provider_name || '—'}</td>
      <td>
        <div className="fw-semibold small">{alert.alert_type}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem', maxWidth: 200 }} title={alert.description}>
          {alert.description?.length > 60 ? alert.description.slice(0, 60) + '…' : alert.description}
        </div>
      </td>
      <td><SeverityBadge severity={alert.severity} /></td>
      <td><StatusBadge status={alert.status} /></td>
      <td>
        {alert.resolved_at
          ? <span className="text-muted small">{new Date(alert.resolved_at).toLocaleDateString()}</span>
          : '—'}
      </td>
      <td>
        {alert.status === 'open' && (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-success"
              title="Mark Resolved"
              onClick={() => onResolve(alert, 'resolved')}
            >
              <i className="bi bi-check-lg"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              title="Mark False Positive"
              onClick={() => onResolve(alert, 'false_positive')}
            >
              <i className="bi bi-x-circle"></i>
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function ResolveModal({ alert, resolution, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await api.fraudAlerts.resolve(alert.id, { resolution, notes })
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isResolve = resolution === 'resolved'

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isResolve ? 'Mark as Resolved' : 'Mark as False Positive'}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3 p-3 bg-light rounded">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-semibold">{alert.alert_type}</div>
                  <div className="text-muted small">{alert.member_name} · {alert.provider_name || 'N/A'}</div>
                </div>
                <SeverityBadge severity={alert.severity} />
              </div>
              {alert.description && (
                <div className="mt-2 small text-muted">{alert.description}</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Resolution Notes</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={isResolve ? 'Describe investigation outcome...' : 'Explain why this is a false positive...'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className={`btn btn-${isResolve ? 'success' : 'secondary'}`}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
              {isResolve ? 'Mark Resolved' : 'Mark False Positive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [modal, setModal] = useState(null) // { alert, resolution }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (severityFilter) params.severity = severityFilter
      if (statusFilter) params.status = statusFilter
      const data = await api.fraudAlerts.list(params)
      setAlerts(data.results ?? data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [severityFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const handleResolve = (alert, resolution) => setModal({ alert, resolution })
  const handleModalSuccess = () => { setModal(null); load() }

  const counts = {
    open: alerts.filter(a => a.status === 'open').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'open').length,
    high: alerts.filter(a => a.severity === 'high' && a.status === 'open').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">
            <i className="bi bi-shield-exclamation text-danger me-2"></i>
            Fraud Alerts
          </h2>
          <p className="text-muted mb-0">Monitor and resolve suspicious activity</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Open Alerts', value: counts.open, icon: 'bi-shield-x', color: 'danger' },
          { label: 'Critical', value: counts.critical, icon: 'bi-exclamation-octagon-fill', color: 'danger' },
          { label: 'High Severity', value: counts.high, icon: 'bi-exclamation-triangle-fill', color: 'warning' },
          { label: 'Resolved', value: counts.resolved, icon: 'bi-shield-check', color: 'success' },
        ].map(card => (
          <div key={card.label} className="col-sm-6 col-xl-3">
            <div className={`card border-0 shadow-sm h-100 ${card.color === 'danger' && card.value > 0 ? 'border-start border-danger border-4' : ''}`}>
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-3 p-3 bg-${card.color} bg-opacity-10`}>
                  <i className={`bi ${card.icon} fs-4 text-${card.color}`}></i>
                </div>
                <div>
                  <div className="text-muted small">{card.label}</div>
                  <div className={`fs-4 fw-bold ${card.color === 'danger' && card.value > 0 ? 'text-danger' : ''}`}>
                    {card.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Critical banner */}
      {counts.critical > 0 && statusFilter === 'open' && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill fs-5"></i>
          <strong>{counts.critical} critical alert{counts.critical > 1 ? 's' : ''} require immediate attention.</strong>
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger"></div>
              <div className="mt-2 text-muted">Loading alerts...</div>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Claim #</th>
                    <th>Member</th>
                    <th>Provider</th>
                    <th>Alert</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Resolved At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <i className="bi bi-shield-check fs-2 d-block mb-2 text-success"></i>
                        {statusFilter === 'open' ? 'No open fraud alerts.' : 'No alerts found.'}
                      </td>
                    </tr>
                  ) : (
                    alerts.map(alert => (
                      <AlertRow key={alert.id} alert={alert} onResolve={handleResolve} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ResolveModal
          alert={modal.alert}
          resolution={modal.resolution}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}