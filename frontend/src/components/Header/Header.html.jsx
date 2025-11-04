import React from 'react';
import { Link } from 'react-router-dom';

export const HeaderTemplate = ({ user, isActive, isAdmin }) => (
  <header className="app-header">
    <div className="header-content">
      <Link to="/home" className="header-title">
        <div className="logo-container">
          <svg className="logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
            <line x1="10" y1="10" x2="14" y2="10" strokeWidth="2"/>
            <line x1="10" y1="14" x2="14" y2="14" strokeWidth="2"/>
          </svg>
          <span className="logo-text">Structo</span>
        </div>
      </Link>
      <div className="header-icons">
        <Link 
          to="/dashboard"
          className={`icon-button dashboard-button ${isActive('/dashboard') ? 'active' : ''}`}
          title="Dashboard"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </Link>
        <Link 
          to="/projects"
          className={`icon-button projects-button ${isActive('/projects') ? 'active' : ''}`}
          title="Projects"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </Link>
        {isAdmin && (
          <Link 
            to="/admin"
            className={`icon-button admin-button ${isActive('/admin') ? 'active' : ''}`}
            title="Admin Panel"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </Link>
        )}
        <Link 
          to="/support"
          className={`icon-button support-button ${isActive('/support') ? 'active' : ''}`}
          title="Customer Support"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </Link>
        <Link 
          to="/profile"
          className={`icon-button profile-button ${isActive('/profile') ? 'active' : ''}`}
          title="Profile"
        >
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt="Profile" 
              className="profile-pic-small"
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </Link>
      </div>
    </div>
  </header>
);

