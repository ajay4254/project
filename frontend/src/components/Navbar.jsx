import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🧠</span>
          <span>CogniMind</span>
        </Link>
        <div className="navbar-nav">
          <Link to="/login" className="navbar-link">Login</Link>
          <Link to="/register" className="navbar-link" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)' }}>Register</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🧠</span>
        <span>CogniMind</span>
      </Link>

      <div className="navbar-nav">
        {user.role === 'patient' && (
          <>
            <Link to="/dashboard" className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              🏠 Home
            </Link>
            <Link to="/games" className={`navbar-link ${location.pathname.startsWith('/games') ? 'active' : ''}`}>
              🎮 Play Games
            </Link>
            <Link to="/progress" className={`navbar-link ${location.pathname === '/progress' ? 'active' : ''}`}>
              📊 My Progress
            </Link>
            <Link to="/reminders" className={`navbar-link ${location.pathname === '/reminders' ? 'active' : ''}`}>
              ⏰ Reminders
            </Link>
            <Link to="/profile" className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              👤 Profile
            </Link>
          </>
        )}

        {user.role === 'caregiver' && (
          <>
            <Link to="/caregiver" className={`navbar-link ${location.pathname === '/caregiver' ? 'active' : ''}`}>
              🩺 Patients
            </Link>
            <Link to="/reminders" className={`navbar-link ${location.pathname === '/reminders' ? 'active' : ''}`}>
              ⏰ Reminders
            </Link>
            <Link to="/profile" className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              👤 Profile
            </Link>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <Link to="/admin" className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              ⚙️ Admin Portal
            </Link>
            <Link to="/profile" className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}>
              👤 Profile
            </Link>
          </>
        )}

        <div className="navbar-user">
          <span className="avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
          <span style={{ fontSize: '0.95rem' }}>{user.name.split(' ')[0]} ({user.role})</span>
          <button onClick={handleLogout} className="btn-logout" title="Sign Out">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
