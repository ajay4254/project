import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, uList, gList] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminGames(),
      ]);
      setStats(s);
      setUsers(uList);
      setGames(gList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteAdminUser(userId);
      loadData();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container loading">
        <div className="spinner"></div>
        <h2>Loading admin portal...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>⚙️ System Administration</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
          Manage platform accounts, game catalog, and review global usage metrics.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats?.total_users || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👵</div>
          <div className="stat-value">{stats?.total_patients || 0}</div>
          <div className="stat-label">Patients / Elderly</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🩺</div>
          <div className="stat-value">{stats?.total_caregivers || 0}</div>
          <div className="stat-label">Caregivers</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-value">{stats?.total_game_sessions || 0}</div>
          <div className="stat-label">Game Sessions Played</div>
        </div>
      </div>

      {/* Game Catalog Overview */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h3>🎮 Cognitive Games Catalog</h3>
        <table className="admin-table" style={{ marginTop: 'var(--space-md)' }}>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Game Name</th>
              <th>Type Identifier</th>
              <th>Status</th>
              <th>Total Plays</th>
              <th>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {games.map(g => (
              <tr key={g.id}>
                <td style={{ fontSize: '1.5rem' }}>{g.icon}</td>
                <td><strong>{g.name}</strong></td>
                <td><code>{g.game_type}</code></td>
                <td><span className="badge badge-good">Active</span></td>
                <td>{g.total_plays}</td>
                <td>{g.avg_score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Management */}
      <div className="card">
        <h3>👥 User Management</h3>
        <table className="admin-table" style={{ marginTop: 'var(--space-md)' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Age</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-needs-attention' : u.role === 'caregiver' ? 'badge-moderate' : 'badge-good'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>{u.age || '-'}</td>
                <td>{u.phone || '-'}</td>
                <td>{u.is_active ? <span className="badge badge-good">Active</span> : <span className="badge badge-needs-attention">Inactive</span>}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    Delete 🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
