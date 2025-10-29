import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation({ onLinkClick }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <nav className="main-navigation">
      <div className="nav-section">
        <div className="nav-section-title">NAVIGATE</div>
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={handleClick}>
          <span className="nav-icon">📝</span>
          <span className="nav-text">New Entry</span>
        </Link>
        <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`} onClick={handleClick}>
          <span className="nav-icon">📚</span>
          <span className="nav-text">History</span>
        </Link>
        <Link to="/calendar" className={`nav-link ${isActive('/calendar') ? 'active' : ''}`} onClick={handleClick}>
          <span className="nav-icon">📅</span>
          <span className="nav-text">Calendar</span>
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-title">SYSTEM</div>
        <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`} onClick={handleClick}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </Link>
        <a
          href="/apk/latest.apk"
          className="nav-link"
          onClick={handleClick}
          download
        >
          <span className="nav-icon">📦</span>
          <span className="nav-text">Download Android APK</span>
        </a>
      </div>
    </nav>
  );
}

export default Navigation;

