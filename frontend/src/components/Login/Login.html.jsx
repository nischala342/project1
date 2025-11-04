import React from 'react';

export const LoginTemplate = ({ formData, loading, error, onToggle, handleChange, handleSubmit }) => (
  <div className="auth-container">
    <div className="auth-branding">
      <div className="auth-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <line x1="10" y1="10" x2="14" y2="10" strokeWidth="2"/>
          <line x1="10" y1="14" x2="14" y2="14" strokeWidth="2"/>
        </svg>
      </div>
      <h1 className="auth-app-name">Structo</h1>
      <p className="auth-tagline">Project Management Made Simple</p>
    </div>
    <h2>Login</h2>
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Enter your password"
          minLength="6"
        />
      </div>
      {error && <div className="error-message">{error}</div>}
      <button type="submit" disabled={loading} className="auth-button">
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
    <p className="toggle-text">
      Don't have an account?{' '}
      <span className="toggle-link" onClick={onToggle}>
        Register
      </span>
    </p>
  </div>
);

