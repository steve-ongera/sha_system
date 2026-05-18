// Sidebar.jsx
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { key: 'members', label: 'Members', icon: 'bi-people' },
  { key: 'contributions', label: 'Contributions', icon: 'bi-wallet2' },
  { key: 'providers', label: 'Providers', icon: 'bi-hospital' },
  { key: 'claims', label: 'Claims', icon: 'bi-file-medical' },
  { key: 'fraud', label: 'Fraud Alerts', icon: 'bi-shield-exclamation' },
]

export default function Sidebar({ activePage, onNavigate, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <i className="bi bi-heart-pulse-fill" />
        </span>
        {isOpen && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">SHA</span>
            <span className="sidebar__brand-sub">Social Health Authority</span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`sidebar__nav-item ${activePage === key ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => onNavigate(key)}
            title={!isOpen ? label : undefined}
          >
            <i className={`bi ${icon} sidebar__nav-icon`} />
            {isOpen && <span className="sidebar__nav-label">{label}</span>}
            {activePage === key && <span className="sidebar__active-bar" />}
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        {isOpen && (
          <div className="sidebar__version">
            <i className="bi bi-shield-check" />
            <span>SHA v2.0 · Kenya</span>
          </div>
        )}
      </div>
    </aside>
  )
}