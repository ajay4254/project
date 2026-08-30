import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getPatientDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 🌅';
    if (hour < 18) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  const handleCompleteReminder = async (id) => {
    try {
      await api.completeReminder(id);
      loadDashboard();
    } catch (err) {
      alert('Error updating reminder: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container loading">
        <div className="spinner"></div>
        <h2>Loading your activities...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ─── Big Welcome Banner ─────────────────── */}
      <div className="welcome-section">
        <h1>{getGreeting()}, {user?.name || 'Friend'}!</h1>
        <p>Ready to exercise your brain and keep your memory sharp today?</p>
        
        <div className="welcome-stats">
          <div className="welcome-stat">
            <div className="stat-value">{data?.todays_progress || 0}%</div>
            <div className="stat-label">Today's Avg Score</div>
          </div>
          <div className="welcome-stat">
            <div className="stat-value">{data?.games_played_today || 0}</div>
            <div className="stat-label">Games Played Today</div>
          </div>
          <div className="welcome-stat">
            <div className="stat-value">
              <span className={`badge badge-${data?.performance_category || 'moderate'}`}>
                {data?.performance_category?.replace('_', ' ').toUpperCase() || 'MODERATE'}
              </span>
            </div>
            <div className="stat-label">Activity Status</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ─── AI Recommended Activity ───────────── */}
      {data?.recommended_activity && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '2px solid #FCD34D', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <h3 style={{ color: '#92400E', margin: 0 }}>Recommended Activity For You</h3>
              </div>
              <p style={{ color: '#78350F', fontSize: 'var(--font-size-base)', margin: 0 }}>
                Play <strong>{data.recommended_activity.game_name}</strong> ({data.recommended_activity.difficulty}) to strengthen your focus!
              </p>
            </div>
            <button
              className="btn btn-warning btn-lg"
              onClick={() => navigate(`/games/${data.recommended_activity.game_type}?difficulty=${data.recommended_activity.difficulty}`)}
            >
              Start Game 🚀
            </button>
          </div>
        </div>
      )}

      {/* ─── 4 Large Elderly-Friendly Action Cards ── */}
      <h2 style={{ marginBottom: 'var(--space-md)' }}>What would you like to do?</h2>
      
      <div className="dashboard-cards">
        <div className="dashboard-card play-games" onClick={() => navigate('/games')}>
          <div className="card-emoji">🎮</div>
          <div className="card-label">1. PLAY GAMES</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>Memory & attention puzzles</p>
        </div>

        <div className="dashboard-card my-progress" onClick={() => navigate('/progress')}>
          <div className="card-emoji">📈</div>
          <div className="card-label">2. MY PROGRESS</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>View your scores & trends</p>
        </div>

        <div className="dashboard-card memory-assist" onClick={() => navigate('/reminders')}>
          <div className="card-emoji">⏰</div>
          <div className="card-label">3. MEMORY REMINDERS</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>Medicine & doctor schedules</p>
        </div>

        <div className="dashboard-card my-profile" onClick={() => navigate('/profile')}>
          <div className="card-emoji">👤</div>
          <div className="card-label">4. MY PROFILE</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>Language & emergency info</p>
        </div>
      </div>

      {/* ─── Upcoming Reminders List ─────────────── */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2>⏰ Upcoming Reminders</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reminders')}>
            + Add / View All
          </button>
        </div>

        {data?.upcoming_reminders?.length === 0 ? (
          <div className="card text-center" style={{ padding: 'var(--space-xl)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No pending reminders for today. You're all caught up! 🎉</p>
          </div>
        ) : (
          <div className="reminder-list">
            {data?.upcoming_reminders?.map((rem) => (
              <div key={rem.id} className="reminder-item">
                <div className={`reminder-icon ${rem.type || 'personal'}`}>
                  {rem.type === 'medicine' ? '💊' : rem.type === 'doctor' ? '🩺' : rem.type === 'daily_activity' ? '🚶' : '⏰'}
                </div>
                <div className="reminder-content">
                  <div className="reminder-title">{rem.title}</div>
                  <div className="reminder-meta">Scheduled for {rem.time} • {rem.date}</div>
                </div>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleCompleteReminder(rem.id)}
                  title="Mark as completed"
                >
                  ✓ Done
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Health Disclaimer ──────────────────── */}
      <div className="disclaimer">
        ℹ️ <strong>CogniMind Notice:</strong> This platform provides recreational cognitive activities and supportive progress tracking. It does not provide medical diagnosis or replace professional healthcare consultations.
      </div>
    </div>
  );
}
