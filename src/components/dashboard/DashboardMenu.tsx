import Link from 'next/link';
import '../../app/dashboard.css';

export default function DashboardMenu() {
  return (
    <div className="dashboard-menu">
      <h1 className="menu-title">Select an Application</h1>
      <div className="card-grid">
        <Link href="/thinking" className="app-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/>
              <line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/>
              <line x1="17" y1="17" x2="22" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
          </div>
          <div className="card-content">
            <h2 className="card-title">Thinking Fun</h2>
            <p className="card-desc">How Thinking Works For Us</p>
            <p className="card-desc">18th Nov 2026</p>
          </div>
        </Link>
        
        {/* Placeholder for future apps */}
        <div className="app-card placeholder">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div className="card-content">
            <h2 className="card-title">Coming Soon</h2>
            <p className="card-desc">More interactive experiences are on the way.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
