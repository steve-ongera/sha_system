import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const STATUS_COLORS = {
  active: 'badge--green',
  inactive: 'badge--gray',
  suspended: 'badge--red',
  pending: 'badge--amber',
}

function Badge({ value }) {
  return <span className={`badge ${STATUS_COLORS[value] || 'badge--gray'}`}>{value}</span>
}

function MemberModal({ member, onClose, onSaved }) {
  const isEdit = !!member?.id
  const [form, setForm] = useState(
    member || {
      full_name: '', national_id: '', phone_number: '', email: '',
      date_of_birth: '', gender: 'male', county: '', employer_name: '',
      employment_type: 'formal', status: 'pending',
    }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await api.members.update(member.id, form)
      } else {
        await api.members.create(form)
      }
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{isEdit ? 'Edit Member' : 'Register New Member'}</h3>
          <button className="modal__close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="modal__body">
          {error && <div className="form-error"><i className="bi bi-exclamation-triangle" /> {error}</div>}
          <div className="form-grid">
            <div className="form-group form-group--full">
              <label>Full Name</label>
              <input value={form.full_name} onChange={set('full_name')} placeholder="e.g. Jane Wanjiku Mwangi" />
            </div>
            <div className="form-group">
              <label>National ID</label>
              <input value={form.national_id} onChange={set('national_id')} placeholder="12345678" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input value={form.phone_number} onChange={set('phone_number')} placeholder="+254712345678" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>County</label>
              <input value={form.county} onChange={set('county')} placeholder="e.g. Nairobi" />
            </div>
            <div className="form-group">
              <label>Employer</label>
              <input value={form.employer_name} onChange={set('employer_name')} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select value={form.employment_type} onChange={set('employment_type')}>
                <option value="formal">Formal</option>
                <option value="informal">Informal</option>
                <option value="self_employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={set('status')}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><i className="bi bi-arrow-repeat spin" /> Saving…</> : (isEdit ? 'Save Changes' : 'Register Member')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DependantsPanel({ member, onClose }) {
  const [dependants, setDependants] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ full_name: '', relationship: 'spouse', date_of_birth: '', member: member.id })
  const [adding, setAdding] = useState(false)

  const loadDeps = useCallback(() => {
    api.dependants.list(member.id).then(data => {
      setDependants(Array.isArray(data) ? data : data.results || [])
      setLoading(false)
    })
  }, [member.id])

  useEffect(() => { loadDeps() }, [loadDeps])

  const add = async () => {
    setAdding(true)
    try {
      await api.dependants.create(form)
      loadDeps()
      setForm({ full_name: '', relationship: 'spouse', date_of_birth: '', member: member.id })
    } finally {
      setAdding(false)
    }
  }

  const remove = async (id) => {
    await api.dependants.delete(id)
    setDependants(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3><i className="bi bi-people" /> Dependants — {member.full_name}</h3>
          <button className="modal__close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        <div className="modal__body">
          <div className="dependant-add-form">
            <input placeholder="Full name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
            </select>
            <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
            <button className="btn btn--primary btn--sm" onClick={add} disabled={adding || !form.full_name}>
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </div>
          {loading ? <p>Loading…</p> : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Relationship</th><th>DOB</th><th></th></tr></thead>
              <tbody>
                {dependants.length === 0 && <tr><td colSpan={4} className="empty-row">No dependants registered.</td></tr>}
                {dependants.map(d => (
                  <tr key={d.id}>
                    <td>{d.full_name}</td>
                    <td><span className="badge badge--blue">{d.relationship}</span></td>
                    <td>{d.date_of_birth}</td>
                    <td>
                      <button className="btn btn--danger btn--sm" onClick={() => remove(d.id)}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [countyFilter, setCountyFilter] = useState('')
  const [editMember, setEditMember] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [dependantsMember, setDependantsMember] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    if (countyFilter) params.county = countyFilter
    api.members.list(params)
      .then(data => setMembers(Array.isArray(data) ? data : data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, statusFilter, countyFilter])

  useEffect(() => { load() }, [load])

  const handleVerify = async (id) => { await api.members.verify(id); load() }
  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this member?')) return
    await api.members.suspend(id); load()
  }
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this member permanently?')) return
    await api.members.delete(id); load()
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Members</h2>
          <p className="page__subtitle">Manage SHA member registrations and status</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <i className="bi bi-person-plus" /> Register Member
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <i className="bi bi-search" />
          <input placeholder="Search name, SHA no., ID, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <input placeholder="Filter county…" value={countyFilter} onChange={e => setCountyFilter(e.target.value)} style={{ maxWidth: 160 }} />
        <button className="btn btn--ghost btn--sm" onClick={load}><i className="bi bi-arrow-clockwise" /></button>
      </div>

      {loading && <div className="page-loading"><i className="bi bi-arrow-repeat spin" /> Loading members…</div>}
      {error && <div className="page-error"><i className="bi bi-exclamation-triangle" /> {error}</div>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SHA No.</th><th>Name</th><th>National ID</th>
                <th>Phone</th><th>County</th><th>Status</th><th>Registered</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr><td colSpan={8} className="empty-row"><i className="bi bi-inbox" /> No members found.</td></tr>
              )}
              {members.map(m => (
                <tr key={m.id}>
                  <td><code className="mono">{m.sha_number}</code></td>
                  <td className="td--bold">{m.full_name}</td>
                  <td>{m.national_id}</td>
                  <td>{m.phone_number}</td>
                  <td>{m.county}</td>
                  <td><Badge value={m.status} /></td>
                  <td>{m.registration_date}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn--ghost btn--sm" title="Edit" onClick={() => setEditMember(m)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn--ghost btn--sm" title="Dependants" onClick={() => setDependantsMember(m)}>
                        <i className="bi bi-people" />
                      </button>
                      {m.status !== 'active' && (
                        <button className="btn btn--green btn--sm" title="Verify & Activate" onClick={() => handleVerify(m.id)}>
                          <i className="bi bi-check-circle" />
                        </button>
                      )}
                      {m.status !== 'suspended' && (
                        <button className="btn btn--amber btn--sm" title="Suspend" onClick={() => handleSuspend(m.id)}>
                          <i className="bi bi-pause-circle" />
                        </button>
                      )}
                      <button className="btn btn--danger btn--sm" title="Delete" onClick={() => handleDelete(m.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <MemberModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />}
      {editMember && <MemberModal member={editMember} onClose={() => setEditMember(null)} onSaved={() => { setEditMember(null); load() }} />}
      {dependantsMember && <DependantsPanel member={dependantsMember} onClose={() => setDependantsMember(null)} />}
    </div>
  )
}