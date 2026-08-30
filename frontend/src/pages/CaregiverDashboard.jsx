import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';

export default function CaregiverDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientPerf, setPatientPerf] = useState(null);
  const [patientAI, setPatientAI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, pList] = await Promise.all([
        api.getCaregiverDashboard(),
        api.getLinkedPatients(),
      ]);
      setDashboardData(dash);
      setPatients(pList);

      if (pList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      Promise.all([
        api.getPatientPerformance(selectedPatientId),
        api.getAIAnalysisForUser(selectedPatientId),
      ])
        .then(([perf, ai]) => {
          setPatientPerf(perf);
          setPatientAI(ai);
        })
        .catch(console.error);
    }
  }, [selectedPatientId]);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    try {
      await api.linkPatient(linkEmail);
      setLinkSuccess('Patient linked successfully!');
      setLinkEmail('');
      loadData();
    } catch (err) {
      setLinkError(err.message || 'Failed to link patient');
    }
  };

  if (loading) {
    return (
      <div className="page-container loading">
        <div className="spinner"></div>
        <h2>Loading caregiver portal...</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>🩺 Caregiver & Family Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
          Monitor cognitive engagement, activity adherence, and supportive analytics for your elderly family members.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{dashboardData?.total_patients || 0}</div>
          <div className="stat-label">Linked Elderly Users</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎮</div>
          <div className="stat-value">{dashboardData?.today_activities || 0}</div>
          <div className="stat-label">Games Played Today</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{dashboardData?.overall_avg_score || 0}%</div>
          <div className="stat-label">Combined Avg Score</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{dashboardData?.total_games_completed || 0}</div>
          <div className="stat-label">Total Sessions Tracked</div>
        </div>
      </div>

      {/* Link New Patient Card */}
      <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h3>+ Link an Elderly User</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Enter the registered email of the elderly patient to connect and monitor their cognitive activities.
        </p>

        {linkError && <div className="alert alert-error">{linkError}</div>}
        {linkSuccess && <div className="alert alert-success">{linkSuccess}</div>}

        <form onSubmit={handleLinkPatient} style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <input
            type="email"
            className="form-input"
            style={{ flex: 1, minWidth: '260px' }}
            placeholder="e.g. patient2@cognimind.com"
            value={linkEmail}
            onChange={(e) => setLinkEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            Link Patient 🔗
          </button>
        </form>
      </div>

      {/* Patients Selector & Detailed View */}
      {patients.length > 0 ? (
        <>
          <h2>Select Patient to View Detailed Analytics:</h2>
          <div className="patient-list" style={{ margin: 'var(--space-lg) 0 var(--space-2xl) 0' }}>
            {patients.map(p => (
              <div
                key={p.id}
                className="patient-card"
                style={{
                  border: selectedPatientId === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedPatientId === p.id ? 'var(--primary-bg)' : '#fff',
                }}
                onClick={() => setSelectedPatientId(p.id)}
              >
                <div className="patient-name">{p.name}</div>
                <div className="patient-meta">
                  Age: {p.age || 'N/A'} • {p.email}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="patient-score">{p.avg_score}% Avg</span>
                  <span className="badge badge-stable">{p.games_played} Games</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Patient Report */}
          {patientPerf && (
            <div className="card" style={{ padding: 'var(--space-2xl)', marginBottom: 'var(--space-2xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                <div>
                  <h2>Detailed Report: {patientPerf.patient?.name}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Age: {patientPerf.patient?.age || 'N/A'} • Total Games: {patientPerf.games_completed}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <span className={`badge badge-${patientPerf.category}`}>
                    {patientPerf.category?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`badge badge-${patientPerf.trend}`}>
                    Trend: {patientPerf.trend?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Weekly Graph */}
              <div className="chart-container" style={{ background: 'var(--bg)', padding: 'var(--space-lg)' }}>
                <h4>7-Day Performance Trend</h4>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={patientPerf.weekly_data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" />
                      <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                      <Tooltip formatter={(val) => [`${val}%`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Supportive Insights */}
              {patientAI && (
                <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: '#FAF5FF', borderRadius: 'var(--radius-md)', border: '1px solid #E9D5FF' }}>
                  <h4 style={{ color: '#581C87', marginBottom: 'var(--space-sm)' }}>🤖 AI Supportive Insights for Caregivers</h4>
                  <ul style={{ paddingLeft: 'var(--space-lg)', color: '#4C1D95' }}>
                    {patientAI.insights?.map((ins, i) => (
                      <li key={i} style={{ marginBottom: 'var(--space-xs)' }}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Activity Table */}
              <div style={{ marginTop: 'var(--space-2xl)' }}>
                <h4>Recent Game Sessions:</h4>
                <table className="admin-table" style={{ marginTop: 'var(--space-md)' }}>
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Difficulty</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientPerf.recent_results?.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.game_name}</strong></td>
                        <td><span className="badge badge-stable">{r.difficulty}</span></td>
                        <td><span style={{ fontWeight: '700', color: r.score >= 80 ? 'var(--accent-green)' : r.score >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>{r.score}%</span></td>
                        <td>{r.played_at ? new Date(r.played_at).toLocaleDateString() : 'Recent'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center" style={{ padding: 'var(--space-2xl)' }}>
          <p>No elderly users linked yet. Use the form above to link your first patient.</p>
        </div>
      )}

      <div className="disclaimer">
        ℹ️ <strong>Caregiver Notice:</strong> All scores and trends are intended to provide recreational cognitive monitoring and do not replace professional medical evaluations.
      </div>
    </div>
  );
}
