// App.jsx
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Contributions from './pages/Contributions'
import Providers from './pages/Providers'
import Claims from './pages/Claims'
import FraudAlerts from './pages/FraudAlerts'

const PAGES = {
  dashboard: Dashboard,
  members: Members,
  contributions: Contributions,
  providers: Providers,
  claims: Claims,
  fraud: FraudAlerts,
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const PageComponent = PAGES[activePage] || Dashboard

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
      />
      <div className={`main-area ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar
          activePage={activePage}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />
        <main className="page-content">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}