import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Smooth scroll to top on route change
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>SlotSwapper</h1>
        </div>
        <button 
          className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="desktop-nav">
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
            <ThemeToggle />
            <span>Hi, {user?.name}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <h2>Menu</h2>
          </div>
          <div className="mobile-menu-links">
            <Link
              to="/dashboard"
              className={location.pathname === '/dashboard' ? 'active' : ''}
              onClick={closeMenu}
            >
              Calendar
            </Link>
            <Link
              to="/marketplace"
              className={location.pathname === '/marketplace' ? 'active' : ''}
              onClick={closeMenu}
            >
              Marketplace
            </Link>
            <Link
              to="/notifications"
              className={location.pathname === '/notifications' ? 'active' : ''}
              onClick={closeMenu}
            >
              Notifications
            </Link>
          </div>
          <div className="mobile-menu-footer">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <ThemeToggle />
            </div>
            <div className="mobile-user-info">
              <span>Hi, {user?.name}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn mobile-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

