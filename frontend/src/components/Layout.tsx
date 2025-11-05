import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>SlotSwapper</h1>
        </div>
        <div className="nav-links">
          <Link
            to="/dashboard"
            className={location.pathname === '/dashboard' ? 'active' : ''}
          >
            Calendar
          </Link>
          <Link
            to="/marketplace"
            className={location.pathname === '/marketplace' ? 'active' : ''}
          >
            Marketplace
          </Link>
          <Link
            to="/notifications"
            className={location.pathname === '/notifications' ? 'active' : ''}
          >
            Notifications
          </Link>
        </div>
        <div className="nav-user">
          <span>Hi, {user?.name}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

