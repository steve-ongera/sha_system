import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const STATUS_COLORS = {
  confirmed: 'green',
  pending: 'amber',
  failed: 'red',
}

const METHOD_ICONS = {
  mpesa: 'bi-phone',
  bank: 'bi-bank',
  employer: 'bi-building',
  cash: 'bi-cash',
}

function ContributionRow({ contribution, onConfirm }) {
  const color = STATUS_COLORS[contribution.status] || 'gray'
  const icon = METHOD_ICONS[contribution.payment_method] || 'bi-credit-card'

  return (
    <tr className="table__row">
      <td className="table__cell">
        <span className="monospace text-sm">{contribution.transaction_reference || '—'}</span>
      </td>
      <td className="table__cell">
        <strong>{contribution.member_name}</strong>
        <span className="text-muted d-block">{contribution.member_sha}</span>
      </td>
      <td className="table__cell">
        <strong>KES {Number(contribution.amount).toLocaleString()}</strong>
      </td>
      <td className="table__cell">
        <span className="method-tag">
          <i className={`bi ${icon}`} /> {contribution.payment_method}
        </span>
      </td>
      <td className="table__cell">{contribution.payment_period}</td>
      <td className="table__cell">
        <span className={`badge badge--${color}`}>{contribution.status}</span>
      </td>
      <td className="table__cell">
        {contribution.paid_at
          ? new Date(contribution.paid_at).toLocaleDateString('en-KE')
          : '—'}
      </td>
      <td className="table__cell table__cell--actions">
        {contribution.status === 'pending' && (
          <button className="btn btn--xs btn--success" onClick={() => onConfirm(contribution.id)}>
            <i className="bi bi-check2" /> Confirm
          </button>
        )}
      </td>
    </tr>
  )
}

export default function Contributions() {
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({ status: '', method: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.method) params.method = filters.method

    api.contributions.list(params)
      .then(data => setContributions(data.results || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleConfirm = async (id) => {
    try {
      const res = await api.contributions.confirm(id)
      showToast(res.message)
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const totalConfirmed = contributions
    .filter(c => c.status === 'confirmed')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  const pendingCount = contributions.filter(c => c.status === 'pending').length

  return (
    <div className="page">
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <i className={`bi ${toast.type === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'}`} />
          {toast.msg}
        </div>
      )}

      <div className="page__header">
        <div>
          <h2 className="page__title">Contributions</h2>
          <p className="page__subtitle">Track and confirm member premium payments</p>
        </div>
      </div>

      <div className="mini-stats">
        <div className="mini-stat">
          <i className="bi bi-wallet2 text-green" />
          <div>
            <span className="mini-stat__value">KES {totalConfirmed.toLocaleString()}</span>
            <span className="mini-stat__label">Confirmed (current view)</span>
          </div>
        </div>
        <div className="mini-stat">
          <i className="bi bi-hourglass-split text-amber" />
          <div>
            <span className="mini-stat__value">{pendingCount}</span>
            <span className="mini-stat__label">Awaiting confirmation</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <select className="select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select className="select" value={filters.method} onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}>
          <option value="">All Methods</option>
          <option value="mpesa">M-Pesa</option>
          <option value="bank">Bank Transfer</option>
          <option value="employer">Employer</option>
          <option value="cash">Cash</option>
        </select>
        <button className="btn btn--secondary" onClick={load}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><i className="bi bi-arrow-repeat spin" /> Loading contributions…</div>
      ) : error ? (
        <div className="page-error"><i className="bi bi-exclamation-triangle" /> {error}</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead className="table__head">
              <tr>
                <th>Reference</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Period</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length === 0 ? (
                <tr><td colSpan={8} className="table__empty">No contributions found.</td></tr>
              ) : contributions.map(c => (
                <ContributionRow key={c.id} contribution={c} onConfirm={handleConfirm} />
              ))}
            </tbody>
          </table>
          <div className="table__count">{contributions.length} record{contributions.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  )
}