import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';

export default function Progress() {
  const [view, setView] = useState('weekly'); // 'weekly' | 'monthly' | 'all'
  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      view === 'weekly' ? api.getWeeklyPerformance() : view === 'monthly' ? api.getMonthlyPerformance() : api.getPerformance(),
      api.getAIAnalysis(),
    ])
      .then(([perf, ai]) => {
        setData(perf);
        setAiData(ai);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [view]);

  const getChartData = () => {
    if (view === 'weekly') return data?.weekly_scores || [];
    if (view === 'monthly') return data?.monthly_scores || [];
    return data?.daily_scores || [];
  };

  const getXKey = () => {
    if (view === 'weekly') return 'date';
    if (view === 'monthly') return 'week';
    return 'date';
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>📊 Cognitive Progress & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
          Review your cognitive score history, engagement trends, and AI supportive insights.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${view === 'weekly' ? 'active' : ''}`} onClick={() => setView('weekly')}>
          📅 Last 7 Days (Weekly)
        </button>
        <button className={`tab ${view === 'monthly' ? 'active' : ''}`} onClick={() => setView('monthly')}>
          🗓️ Last 30 Days (Monthly)
        </button>
        <button className={`tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>
          📈 All-Time Overview
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Calculating your performance metrics...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{data?.avg_score || 0}%</div>
              <div className="stat-label">Average Game Score</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{data?.accuracy || 0}%</div>
              <div className="stat-label">Response Accuracy</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{Math.round(data?.avg_response_time || 0)}s</div>
              <div className="stat-label">Avg Response Time</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{data?.games_completed || 0}</div>
              <div className="stat-label">Total Games Played</div>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="chart-container">
            <h3>📈 Score Progression Trend ({view.toUpperCase()})</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={getChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey={getXKey()} stroke="var(--text-secondary)" />
                  <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--border)' }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 6, fill: 'var(--primary)' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Performance Insights */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)', border: '2px solid #C4B5FD', marginBottom: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <span style={{ fontSize: '2rem' }}>🤖</span>
              <h2 style={{ color: '#581C87', margin: 0 }}>AI Supportive Performance Analysis</h2>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
              <div>
                <strong>Performance Level: </strong>
                <span className={`badge badge-${aiData?.category || 'moderate'}`}>
                  {aiData?.category?.replace('_', ' ').toUpperCase() || 'MODERATE'}
                </span>
              </div>
              <div>
                <strong>Recent Trend: </strong>
                <span className={`badge badge-${aiData?.trend || 'stable'}`}>
                  {aiData?.trend?.toUpperCase() || 'STABLE'}
                </span>
              </div>
            </div>

            <h4 style={{ color: '#6B21A8', marginBottom: 'var(--space-sm)' }}>Key Insights:</h4>
            <ul style={{ paddingLeft: 'var(--space-xl)', color: '#4C1D95' }}>
              {aiData?.insights?.map((ins, idx) => (
                <li key={idx} style={{ marginBottom: 'var(--space-xs)' }}>{ins}</li>
              ))}
            </ul>
          </div>

          {/* Game-by-Game Breakdown */}
          {data?.game_breakdown && data.game_breakdown.length > 0 && (
            <div className="chart-container">
              <h3>🎮 Score Breakdown by Game Type</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={data.game_breakdown} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="game_name" stroke="var(--text-secondary)" />
                    <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                    <Tooltip
                      contentStyle={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--border)' }}
                      formatter={(val) => [`${val}%`, 'Avg Score']}
                    />
                    <Bar dataKey="avg_score" fill="var(--primary-light)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      <div className="disclaimer">
        ℹ️ <strong>Informational Use Only:</strong> Cognitive game scores, response trends, and AI recommendations are supportive indicators designed for wellness tracking. They do not constitute medical screening, clinical diagnosis, or therapeutic advice.
      </div>
    </div>
  );
}
