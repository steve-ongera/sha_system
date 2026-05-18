import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const LEVEL_COLORS = {
  1: 'blue',
  2: 'teal',
  3: 'amber',
  4: 'green',
  5: 'red',
}

function ProviderCard({ provider, onAccredit }) {
  const levelColor = LEVEL_COLORS[provider.level] || 'gray'

  return (
    <div className="provider-card">
      <div className="provider-card__header">
        <div className="provider-card__icon">
          <i className="bi bi-hospital" />
        </div>
        <div className="provider-card__meta">
          <h4 className="provider-card__name">{provider.name}</h4>
          <span className="monospace text-sm">{provider.provider_code}</span>
        </div>
        {provider.is_accredited ? (
          <span className="badge badge--green"><i className="bi bi-patch-check-fill" /> Accredited</span>
        ) : (
          <span className="badge badge--gray">Unaccredited</span>
        )}
      </div>

      <div className="provider-card__body">
        <div className="provider-card__row">
          <i className="bi bi-geo-alt text-muted" />
          <span>{provider.county}{provider.sub_county ? `, ${provider.sub_county}` : ''}</span>
        </div>
        <div className="provider-card__row">
          <i className="bi bi-telephone text-muted" />
          <span>{provider.phone_number || '—'}</span>
        </div>
        <div className="provider-card__row">
          <i className="bi bi-layers text-muted" />
          <span>
            Level <span className={`badge badge--${levelColor}`}>{provider.level}</span>
            {' · '}{provider.facility_type}
          </span>
        </div>
        <div className="provider-card__row">
          <i className="bi bi-file-medical text-muted" />
          <span>{provider.total_claims ?? 0} total claims</span>
        </div>
      </div>

      {!provider.is_accredited && (
        <div className="provider-card__footer">
          <button className="btn btn--sm btn--primary" onClick={() => onAccredit(provider.id)}>
            <i className="bi bi-patch-check" /> Accredit Provider
          </button>
        </div>
      )}
    </div>
  )
}

export default function Providers() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({ search: '', county: '', accredited: '', level: '' })
  const [view, setView] = useState('grid') // 'grid' | 'table'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.county) params.county = filters.county
    if (filters.accredited !== '') params.accredited = filters.accredited
    if (filters.level) params.level = filters.level

    api.providers.list(params)
      .then(data => setProviders(data.results || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleAccredit = async (id) => {
    if (!window.confirm('Accredit this provider?')) return
    try {
      const res = await api.providers.accredit(id)
      showToast(res.message)
      load()
    } catch (e) { showToast(e.message, 'error') }
  }

  const accreditedCount = providers.filter(p => p.is_accredited).length

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
          <h2 className="page__title">Healthcare Providers</h2>
          <p className="page__subtitle">Manage accredited facilities and hospitals</p>
        </div>
        <div className="page__header-actions">
          <button
            className={`btn btn--icon ${view === 'grid' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setView('grid')}
          >
            <i className="bi bi-grid-3x3-gap" />
          </button>
          <button
            className={`btn btn--icon ${view === 'table' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setView('table')}
          >
            <i className="bi bi-table" />
          </button>
        </div>
      </div>

      <div className="mini-stats">
        <div className="mini-stat">
          <i className="bi bi-hospital text-teal" />
          <div>
            <span className="mini-stat__value">{providers.length}</span>
            <span className="mini-stat__label">Total providers</span>
          </div>
        </div>
        <div className="mini-stat">
          <i className="bi bi-patch-check-fill text-green" />
          <div>
            <span className="mini-stat__value">{accreditedCount}</span>
            <span className="mini-stat__label">Accredited</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__search">
          <i className="bi bi-search" />
          <input
            className="input"
            placeholder="Search name or code…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <input
          className="input"
          placeholder="Filter by county…"
          value={filters.county}
          onChange={e => setFilters(f => ({ ...f, county: e.target.value }))}
        />
        <select className="select" value={filters.accredited} onChange={e => setFilters(f => ({ ...f, accredited: e.target.value }))}>
          <option value="">All Accreditation</option>
          <option value="true">Accredited</option>
          <option value="false">Unaccredited</option>
        </select>
        <select className="select" value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}>
          <option value="">All Levels</option>
          {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
        </select>
        <button className="btn btn--secondary" onClick={load}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><i className="bi bi-arrow-repeat spin" /> Loading providers…</div>
      ) : error ? (
        <div className="page-error"><i className="bi bi-exclamation-triangle" /> {error}</div>
      ) : view === 'grid' ? (
        providers.length === 0 ? (
          <div className="page-empty"><i className="bi bi-hospital" /> No providers found.</div>
        ) : (
          <div className="provider-grid">
            {providers.map(p => (
              <ProviderCard key={p.id} provider={p} onAccredit={handleAccredit} />
            ))}
          </div>
        )
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead className="table__head">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>County</th>
                <th>Level</th>
                <th>Type</th>
                <th>Claims</th>
                <th>Accredited</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 ? (
                <tr><td colSpan={8} className="table__empty">No providers found.</td></tr>
              ) : providers.map(p => (
                <tr key={p.id} className="table__row">
                  <td className="table__cell"><span className="monospace">{p.provider_code}</span></td>
                  <td className="table__cell"><strong>{p.name}</strong></td>
                  <td className="table__cell">{p.county}</td>
                  <td className="table__cell"><span className={`badge badge--${LEVEL_COLORS[p.level] || 'gray'}`}>Level {p.level}</span></td>
                  <td className="table__cell">{p.facility_type}</td>
                  <td className="table__cell">{p.total_claims ?? 0}</td>
                  <td className="table__cell">
                    {p.is_accredited
                      ? <span className="badge badge--green"><i className="bi bi-check-lg" /> Yes</span>
                      : <span className="badge badge--gray">No</span>}
                  </td>
                  <td className="table__cell table__cell--actions">
                    {!p.is_accredited && (
                      <button className="btn btn--xs btn--primary" onClick={() => handleAccredit(p.id)}>
                        <i className="bi bi-patch-check" /> Accredit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table__count">{providers.length} record{providers.length !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  )
}