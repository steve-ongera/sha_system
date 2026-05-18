import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const STATUS_BADGES = {
  submitted:    'bg-secondary',
  under_review: 'bg-warning text-dark',
  approved:     'bg-success',
  rejected:     'bg-danger',
  paid:         'bg-primary',
}

const STATUS_LABELS = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  approved:     'Approved',
  rejected:     'Rejected',
  paid:         'Paid',
}

function ClaimRow({ claim, onAction }) {
  return (
    <tr>
      <td>
        <span className="fw-semibold font-monospace small">{claim.claim_number}</span>
      </td>
      <td>
        <div className="fw-semibold">{claim.member_name}</div>
        <div className="text-muted small font-monospace">{claim.member_sha}</div>
      </td>
      <td className="text-muted small">{claim.provider_name}</td>
      <td>
        <div className="fw-semibold">KES {Number(claim.claimed_amount).toLocaleString()}</div>
        {claim.approved_amount && (
          <div className="text-success small">Approved: KES {Number(claim.approved_amount).toLocaleString()}</div>
        )}
      </td>
      <td>
        <span className={`badge ${STATUS_BADGES[claim.status] || 'bg-secondary'}`}>
          {STATUS_LABELS[claim.status] || claim.status}
        </span>
        {claim.is_flagged && (
          <span className="badge bg-danger ms-1">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>Flagged
          </span>
        )}
      </td>
      <td className="text-muted small">{claim.diagnosis || '—'}</td>
      <td className="text-muted small">
        {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : '—'}
      </td>
      <td>
        <div className="d-flex gap-1 flex-wrap">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onAction('view', claim)}
            title="View Details"
          >
            <i className="bi bi-eye"></i>
          </button>
          {(claim.status === 'submitted' || claim.status === 'under_review') && (
            <>
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => onAction('approve', claim)}
                title="Approve"
              >
                <i className="bi bi-check-lg"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onAction('reject', claim)}
                title="Reject"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </>
          )}
          {!claim.is_flagged && claim.status !== 'rejected' && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => onAction('flag', claim)}
              title="Flag for Fraud"
            >
              <i className="bi bi-flag"></i>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function ActionModal({ action, claim, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [approvedAmount, setApprovedAmount] = useState(claim?.claimed_amount || '')
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [severity, setSeverity] = useState('medium')

  if (!claim) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (action === 'approve') {
        await api.claims.approve(claim.id, { approved_amount: approvedAmount, notes })
      } else if (action === 'reject') {
        await api.claims.reject(claim.id, { notes })
      } else if (action === 'flag') {
        await api.claims.flag(claim.id, { reason, severity })
      }
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const titles = { approve: 'Approve Claim', reject: 'Reject Claim', flag: 'Flag for Fraud' }
  const btnVariant = { approve: 'success', reject: 'danger', flag: 'warning' }

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{titles[action]}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3 p-3 bg-light rounded">
              <div className="fw-semibold">{claim.claim_number}</div>
              <div className="text-muted small">{claim.member_name} · {claim.provider_name}</div>
              <div className="mt-1">Claimed: <strong>KES {Number(claim.claimed_amount).toLocaleString()}</strong></div>
            </div>

            {action === 'approve' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Approved Amount (KES)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={approvedAmount}
                    onChange={e => setApprovedAmount(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reviewer Notes</label>
                  <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </>
            )}

            {action === 'reject' && (
              <div className="mb-3">
                <label className="form-label">Rejection Reason</label>
                <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Explain reason for rejection..." />
              </div>
            )}

            {action === 'flag' && (
              <>
                <div className="mb-3">
                  <label className="form-label">Fraud Reason</label>
                  <textarea className="form-control" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe suspicious activity..." />
                </div>
                <div className="mb-3">
                  <label className="form-label">Severity</label>
                  <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </>
            )}

            {error && <div className="alert alert-danger py-2">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className={`btn btn-${btnVariant[action]}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              {titles[action]}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClaimDetailModal({ claim, onClose }) {
  if (!claim) return null
  const fields = [
    ['Claim Number', claim.claim_number],
    ['Member', `${claim.member_name} (${claim.member_sha})`],
    ['Provider', claim.provider_name],
    ['Diagnosis', claim.diagnosis],
    ['Treatment', claim.treatment],
    ['Admission Date', claim.admission_date],
    ['Discharge Date', claim.discharge_date],
    ['Claimed Amount', `KES ${Number(claim.claimed_amount).toLocaleString()}`],
    ['Approved Amount', claim.approved_amount ? `KES ${Number(claim.approved_amount).toLocaleString()}` : '—'],
    ['Status', STATUS_LABELS[claim.status] || claim.status],
    ['Flagged', claim.is_flagged ? 'Yes' : 'No'],
    ['Reviewer Notes', claim.reviewer_notes || '—'],
    ['Submitted At', claim.submitted_at ? new Date(claim.submitted_at).toLocaleString() : '—'],
    ['Reviewed At', claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleString() : '—'],
  ]
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Claim Details</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <dl className="row mb-0">
              {fields.map(([label, value]) => (
                <> 
                  <dt key={label} className="col-sm-4 text-muted">{label}</dt>
                  <dd key={`${label}-v`} className="col-sm-8">{value || '—'}</dd>
                </>
              ))}
            </dl>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Claims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [flaggedFilter, setFlaggedFilter] = useState('')
  const [modal, setModal] = useState(null) // { type: 'view'|'approve'|'reject'|'flag', claim }
  const [showNewForm, setShowNewForm] = useState(false)
  const [newClaim, setNewClaim] = useState({ member: '', provider: '', claimed_amount: '', diagnosis: '', treatment: '', admission_date: '', discharge_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (flaggedFilter) params.flagged = flaggedFilter
      const data = await api.claims.list(params)
      setClaims(data.results ?? data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, flaggedFilter])

  useEffect(() => { load() }, [load])

  const handleAction = (type, claim) => setModal({ type, claim })

  const handleModalSuccess = () => {
    setModal(null)
    load()
  }

  const handleSubmitNew = async () => {
    setSubmitting(true)
    setFormError('')
    try {
      await api.claims.create(newClaim)
      setShowNewForm(false)
      setNewClaim({ member: '', provider: '', claimed_amount: '', diagnosis: '', treatment: '', admission_date: '', discharge_date: '' })
      load()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = claims.filter(c =>
    !search ||
    c.claim_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.member_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.provider_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.diagnosis?.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length,
    approved: claims.filter(c => c.status === 'approved').length,
    flagged: claims.filter(c => c.is_flagged).length,
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">Claims</h2>
          <p className="text-muted mb-0">Review and process hospital reimbursement requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
          <i className="bi bi-plus-lg me-2"></i>New Claim
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Claims', value: counts.total, icon: 'bi-file-medical', color: 'primary' },
          { label: 'Pending Review', value: counts.pending, icon: 'bi-hourglass-split', color: 'warning' },
          { label: 'Approved', value: counts.approved, icon: 'bi-check-circle', color: 'success' },
          { label: 'Flagged', value: counts.flagged, icon: 'bi-flag-fill', color: 'danger' },
        ].map(card => (
          <div key={card.label} className="col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className={`rounded-3 p-3 bg-${card.color} bg-opacity-10`}>
                  <i className={`bi ${card.icon} fs-4 text-${card.color}`}></i>
                </div>
                <div>
                  <div className="text-muted small">{card.label}</div>
                  <div className="fs-4 fw-bold">{card.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-transparent"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by claim #, member, provider, diagnosis..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={flaggedFilter} onChange={e => setFlaggedFilter(e.target.value)}>
                <option value="">All Claims</option>
                <option value="true">Flagged Only</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={load}>
                <i className="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Claim Form */}
      {showNewForm && (
        <div className="card border-0 shadow-sm mb-4 border-start border-primary border-4">
          <div className="card-header bg-transparent fw-semibold">Submit New Claim</div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Member ID *</label>
                <input type="number" className="form-control" placeholder="Member ID" value={newClaim.member} onChange={e => setNewClaim(p => ({ ...p, member: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Provider ID *</label>
                <input type="number" className="form-control" placeholder="Provider ID" value={newClaim.provider} onChange={e => setNewClaim(p => ({ ...p, provider: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Claimed Amount (KES) *</label>
                <input type="number" className="form-control" value={newClaim.claimed_amount} onChange={e => setNewClaim(p => ({ ...p, claimed_amount: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Admission Date</label>
                <input type="date" className="form-control" value={newClaim.admission_date} onChange={e => setNewClaim(p => ({ ...p, admission_date: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Discharge Date</label>
                <input type="date" className="form-control" value={newClaim.discharge_date} onChange={e => setNewClaim(p => ({ ...p, discharge_date: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Diagnosis</label>
                <input type="text" className="form-control" value={newClaim.diagnosis} onChange={e => setNewClaim(p => ({ ...p, diagnosis: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Treatment</label>
                <input type="text" className="form-control" value={newClaim.treatment} onChange={e => setNewClaim(p => ({ ...p, treatment: e.target.value }))} />
              </div>
            </div>
            {formError && <div className="alert alert-danger mt-3 py-2">{formError}</div>}
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary" onClick={handleSubmitNew} disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                Submit Claim
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setShowNewForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <div className="mt-2 text-muted">Loading claims...</div>
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
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Diagnosis</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-5 text-muted">No claims found.</td></tr>
                  ) : (
                    filtered.map(claim => (
                      <ClaimRow key={claim.id} claim={claim} onAction={handleAction} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'view' && (
        <ClaimDetailModal claim={modal.claim} onClose={() => setModal(null)} />
      )}
      {(modal?.type === 'approve' || modal?.type === 'reject' || modal?.type === 'flag') && (
        <ActionModal
          action={modal.type}
          claim={modal.claim}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}