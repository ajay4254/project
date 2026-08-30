import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: new Date().toISOString().split('T')[0],
    reminder_time: '10:00',
    repeat_type: 'none',
    reminder_type: 'medicine',
    user_id: null,
  });

  const [patients, setPatients] = useState([]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await api.getReminders();
      setReminders(data);

      if (user?.role === 'caregiver') {
        const pList = await api.getLinkedPatients();
        setPatients(pList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [user]);

  const handleToggleComplete = async (id) => {
    try {
      await api.completeReminder(id);
      loadReminders();
    } catch (err) {
      alert('Error updating reminder: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await api.deleteReminder(id);
      loadReminders();
    } catch (err) {
      alert('Error deleting reminder: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createReminder(formData);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        reminder_date: new Date().toISOString().split('T')[0],
        reminder_time: '10:00',
        repeat_type: 'none',
        reminder_type: 'medicine',
        user_id: null,
      });
      loadReminders();
    } catch (err) {
      alert('Failed to create reminder: ' + err.message);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'medicine': return '💊';
      case 'doctor': return '🩺';
      case 'daily_activity': return '🚶';
      case 'event': return '🎉';
      default: return '⏰';
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>⏰ Memory Assistance & Reminders</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Never miss important medications, doctor visits, and daily activities.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
          + Create New Reminder
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="card text-center" style={{ padding: 'var(--space-3xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📅</div>
          <h2>No reminders set yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Stay organized by adding reminders for medicines, walks, appointments, and family calls.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            Add Your First Reminder ⏰
          </button>
        </div>
      ) : (
        <div className="reminder-list">
          {reminders.map((r) => (
            <div key={r.id} className={`reminder-item ${r.is_completed ? 'completed' : ''}`}>
              <div className={`reminder-icon ${r.reminder_type}`}>
                {getIcon(r.reminder_type)}
              </div>

              <div className="reminder-content">
                <div className="reminder-title" style={{ textDecoration: r.is_completed ? 'line-through' : 'none' }}>
                  {r.title}
                </div>
                {r.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 'var(--space-xs) 0' }}>
                    {r.description}
                  </p>
                )}
                <div className="reminder-meta">
                  ⏰ {r.reminder_time} • 📅 {r.reminder_date} • 🔁 Repeat: {r.repeat_type}
                </div>
              </div>

              <div className="reminder-actions">
                {!r.is_completed ? (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleToggleComplete(r.id)}
                  >
                    ✓ Mark Done
                  </button>
                ) : (
                  <span className="badge badge-good">Completed ✓</span>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(r.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Reminder */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Reminder</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {user?.role === 'caregiver' && patients.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Set Reminder For Patient</label>
                  <select
                    className="form-select"
                    value={formData.user_id || ''}
                    onChange={(e) => setFormData(p => ({ ...p, user_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
                  >
                    <option value="">Myself</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reminder Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Take Blood Pressure Tablet"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reminder Type</label>
                <select
                  className="form-select"
                  value={formData.reminder_type}
                  onChange={(e) => setFormData(p => ({ ...p, reminder_type: e.target.value }))}
                >
                  <option value="medicine">💊 Medicine</option>
                  <option value="doctor">🩺 Doctor Appointment</option>
                  <option value="daily_activity">🚶 Daily Activity / Walk</option>
                  <option value="event">🎉 Important Event</option>
                  <option value="personal">📝 Personal Reminder</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData(p => ({ ...p, reminder_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.reminder_time}
                    onChange={(e) => setFormData(p => ({ ...p, reminder_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Repeat Schedule</label>
                <select
                  className="form-select"
                  value={formData.repeat_type}
                  onChange={(e) => setFormData(p => ({ ...p, repeat_type: e.target.value }))}
                >
                  <option value="none">No Repeat (Once)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Instructions</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Take 1 tablet with water after food"
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Reminder ⏰
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
