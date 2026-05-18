const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const res = await fetch(url, config)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const api = {
  dashboard: {
    stats: () => request('/dashboard/stats/'),
  },

  // ─── Members ────────────────────────────────────────────────────────────────
  members: {
    list: (params = {}) => request(`/members/?${new URLSearchParams(params)}`),
    get: (id) => request(`/members/${id}/`),
    create: (data) => request('/members/', { method: 'POST', body: data }),
    update: (id, data) => request(`/members/${id}/`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/members/${id}/`, { method: 'DELETE' }),
    verify: (id) => request(`/members/${id}/verify/`, { method: 'POST' }),
    suspend: (id) => request(`/members/${id}/suspend/`, { method: 'POST' }),
    eligibility: (id) => request(`/members/${id}/eligibility/`),
  },

  // ─── Dependants ─────────────────────────────────────────────────────────────
  dependants: {
    list: (memberId) => request(`/dependants/?member=${memberId}`),
    create: (data) => request('/dependants/', { method: 'POST', body: data }),
    delete: (id) => request(`/dependants/${id}/`, { method: 'DELETE' }),
  },

  // ─── Contributions ──────────────────────────────────────────────────────────
  contributions: {
    list: (params = {}) => request(`/contributions/?${new URLSearchParams(params)}`),
    get: (id) => request(`/contributions/${id}/`),
    create: (data) => request('/contributions/', { method: 'POST', body: data }),
    confirm: (id) => request(`/contributions/${id}/confirm/`, { method: 'POST' }),
    update: (id, data) => request(`/contributions/${id}/`, { method: 'PATCH', body: data }),
  },

  // ─── Providers ──────────────────────────────────────────────────────────────
  providers: {
    list: (params = {}) => request(`/providers/?${new URLSearchParams(params)}`),
    get: (id) => request(`/providers/${id}/`),
    create: (data) => request('/providers/', { method: 'POST', body: data }),
    update: (id, data) => request(`/providers/${id}/`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/providers/${id}/`, { method: 'DELETE' }),
    accredit: (id) => request(`/providers/${id}/accredit/`, { method: 'POST' }),
  },

  // ─── Claims ─────────────────────────────────────────────────────────────────
  claims: {
    list: (params = {}) => request(`/claims/?${new URLSearchParams(params)}`),
    get: (id) => request(`/claims/${id}/`),
    create: (data) => request('/claims/', { method: 'POST', body: data }),
    approve: (id, data) => request(`/claims/${id}/approve/`, { method: 'POST', body: data }),
    reject: (id, data) => request(`/claims/${id}/reject/`, { method: 'POST', body: data }),
    flag: (id, data) => request(`/claims/${id}/flag/`, { method: 'POST', body: data }),
  },

  // ─── Fraud Alerts ───────────────────────────────────────────────────────────
  fraudAlerts: {
    list: (params = {}) => request(`/fraud-alerts/?${new URLSearchParams(params)}`),
    get: (id) => request(`/fraud-alerts/${id}/`),
    resolve: (id, data) => request(`/fraud-alerts/${id}/resolve/`, { method: 'POST', body: data }),
  },

  // ─── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    list: (params = {}) => request(`/notifications/?${new URLSearchParams(params)}`),
    create: (data) => request('/notifications/', { method: 'POST', body: data }),
  },
}