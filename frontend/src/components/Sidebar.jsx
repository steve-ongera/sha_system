// components/Sidebar.jsx
const NAV_ITEMS = [
  { key: 'dashboard',      label: 'Dashboard',       icon: 'bi-grid-1x2',          badge: null },
  { key: 'members',        label: 'Members',          icon: 'bi-people',             badge: null },
  { key: 'contributions',  label: 'Contributions',    icon: 'bi-wallet2',            badge: null },
  { key: 'providers',      label: 'Providers',        icon: 'bi-hospital',           badge: null },
  { key: 'claims',         label: 'Claims',           icon: 'bi-file-medical',       badge: null },
  { key: 'fraud',          label: 'Fraud Alerts',     icon: 'bi-shield-exclamation', badge: 'alert' },
  { key: 'notifications',  label: 'Notifications',    icon: 'bi-bell',               badge: null },
]

export default function Sidebar({ activePage, onNavigate, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      {/* Brand */}
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

      {/* Nav */}
      <nav className="sidebar__nav">
        {isOpen && (
          <span className="sidebar__section-label">MAIN MENU</span>
        )}
        {NAV_ITEMS.map(({ key, label, icon, badge }) => (
          <button
            key={key}
            className={`sidebar__nav-item ${activePage === key ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => onNavigate(key)}
            title={!isOpen ? label : undefined}
          >
            <i className={`bi ${icon} sidebar__nav-icon`} />
            {isOpen && <span className="sidebar__nav-label">{label}</span>}
            {isOpen && badge === 'alert' && (
              <span className="sidebar__nav-badge">!</span>
            )}
            {activePage === key && <span className="sidebar__active-bar" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        {isOpen ? (
          <>
            <div className="sidebar__footer-user">
              <div className="sidebar__footer-avatar">
                <i className="bi bi-person-fill" />
              </div>
              <div>
                <div className="sidebar__footer-name">Admin Officer</div>
                <div className="sidebar__footer-role">SHA Administrator</div>
              </div>
            </div>
            <div className="sidebar__version">
              <i className="bi bi-shield-check" />
              <span>SHA v2.0 · Kenya</span>
            </div>
          </>
        ) : (
          <div className="sidebar__footer-avatar sidebar__footer-avatar--center">
            <i className="bi bi-person-fill" />
          </div>
        )}
      </div>
    </aside>
  )
}