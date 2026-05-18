const PAGE_TITLES = {
  dashboard: 'Dashboard',
  members: 'Member Management',
  contributions: 'Contributions',
  providers: 'Healthcare Providers',
  claims: 'Claims Processing',
  fraud: 'Fraud & Alerts',
}

export default function Navbar({ activePage, onToggleSidebar }) {
  const now = new Date().toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button className="navbar__toggle" onClick={onToggleSidebar} title="Toggle sidebar">
          <i className="bi bi-list" />
        </button>
        <h1 className="navbar__title">{PAGE_TITLES[activePage] || 'SHA System'}</h1>
      </div>

      <div className="navbar__right">
        <span className="navbar__date">
          <i className="bi bi-calendar3" />
          {now}
        </span>
        <button className="navbar__icon-btn" title="Notifications">
          <i className="bi bi-bell" />
          <span className="navbar__badge">3</span>
        </button>
        <div className="navbar__user">
          <div className="navbar__avatar">
            <i className="bi bi-person-fill" />
          </div>
          <div className="navbar__user-info">
            <span className="navbar__user-name">Admin</span>
            <span className="navbar__user-role">SHA Officer</span>
          </div>
        </div>
      </div>
    </header>
  )
}