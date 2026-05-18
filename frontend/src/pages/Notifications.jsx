import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const CHANNEL_CONFIG = {
  sms:    { icon: 'bi-phone',        label: 'SMS',    badge: 'bg-info text-dark' },
  email:  { icon: 'bi-envelope',     label: 'Email',  badge: 'bg-primary' },
  system: { icon: 'bi-bell',         label: 'System', badge: 'bg-secondary' },
}

const STATUS_CONFIG = {
  pending:   { badge: 'bg-warning text-dark', icon: 'bi-clock',        label: 'Pending' },
  sent:      { badge: 'bg-success',           icon: 'bi-check',         label: 'Sent' },
  delivered: { badge: 'bg-success',           icon: 'bi-check-all',     label: 'Delivered' },
  failed:    { badge: 'bg-danger',            icon: 'bi-x-circle',      label: 'Failed' },
}

function NotificationRow({ notif }) {
  const channel = CHANNEL_CONFIG[notif.channel] || CHANNEL_CONFIG.system
  const statusCfg = STATUS_CONFIG[notif.status] || STATUS_CONFIG.pending

  return (
    <tr>
      <td>
        <div className="fw-semibold small">{notif.member_name || '—'}</div>
      </td>
      <td>
        <span className={`badge ${channel.badge}`}>
          <i className={`bi ${channel.icon} me-1`}></i>
          {channel.label}
        </span>
      </td>
      <td>
        <div className="small fw-semibold">{notif.subject || notif.message_type || '—'}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem', maxWidth: 280 }} title={notif.message}>
          {notif.message?.length > 80 ? notif.message.slice(0, 80) + '…' : notif.message}
        </div>
      </td>
      <td>
        <span className={`badge ${statusCfg.badge}`}>
          <i className={`bi ${statusCfg.icon} me-1`}></i>
          {statusCfg.label}
        </span>
      </td>
      <td className="text-muted small">
        {notif.created_at ? new Date(notif.created_at).toLocaleString() : '—'}
      </td>
      <td className="text-muted small">
        {notif.sent_at ? new Date(notif.sent_at).toLocaleString() : '—'}
      </td>
    </tr>
  )
}

function SendModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    member: '',
    channel: 'sms',
    subject: '',
    message: '',
    message_type: 'general',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!form.member || !form.message) {
      setError('Member ID and message are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.notifications.create(form)
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-send me-2"></i>Send Notification
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Member ID *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter member ID"
                  value={form.member}
                  onChange={set('member')}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Channel</label>
                <select className="form-select" value={form.channel} onChange={set('channel')}>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.message_type} onChange={set('message_type')}>
                  <option value="general">General</option>
                  <option value="contribution_reminder">Contribution Reminder</option>
                  <option value="claim_update">Claim Update</option>
                  <option value="account_update">Account Update</option>
                  <option value="fraud_alert">Fraud Alert</option>
                </select>
              </div>
              {form.channel === 'email' && (
                <div className="col-12">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Email subject..."
                    value={form.subject}
                    onChange={set('subject')}
                  />
                </div>
              )}
              <div className="col-12">
                <label className="form-label">Message *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Enter your message..."
                  value={form.message}
                  onChange={set('message')}
                />
                <div className="form-text">{form.message.length} characters</div>
              </div>
            </div>
            {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSend} disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
              <i className="bi bi-send me-1"></i>Send Notification
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (channelFilter) params.channel = channelFilter
      const data = await api.notifications.list(params)
      setNotifications(data.results ?? data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, channelFilter])

  useEffect(() => { load() }, [load])

  const handleModalSuccess = () => { setShowModal(false); load() }

  const filtered = notifications.filter(n =>
    !search ||
    n.member_name?.toLowerCase().includes(search.toLowerCase()) ||
    n.message?.toLowerCase().includes(search.toLowerCase()) ||
    n.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    delivered: notifications.filter(n => n.status === 'delivered').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">
            <i className="bi bi-bell me-2"></i>Notifications
          </h2>
          <p className="text-muted mb-0">SMS, email, and system alerts to members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-send me-2"></i>Send Notification
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Sent', value: counts.total, icon: 'bi-envelope-paper', color: 'primary' },
          { label: 'Pending', value: counts.pending, icon: 'bi-clock', color: 'warning' },
          { label: 'Delivered', value: counts.delivered, icon: 'bi-check-all', color: 'success' },
          { label: 'Failed', value: counts.failed, icon: 'bi-x-circle', color: 'danger' },
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
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-transparent"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by member, message..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
                <option value="">All Channels</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="system">System</option>
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

      {/* Failed banner */}
      {counts.failed > 0 && !statusFilter && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{counts.failed} notification{counts.failed > 1 ? 's' : ''} failed to deliver.</span>
        </div>
      )}

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <div className="mt-2 text-muted">Loading notifications...</div>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Member</th>
                    <th>Channel</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="bi bi-bell-slash fs-2 d-block mb-2"></i>
                        No notifications found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(notif => (
                      <NotificationRow key={notif.id} notif={notif} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <SendModal onClose={() => setShowModal(false)} onSuccess={handleModalSuccess} />
      )}
    </div>
  )
}