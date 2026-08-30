import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    preferred_language: 'en',
    emergency_contact: '',
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        gender: user.gender || 'Male',
        phone: user.phone || '',
        preferred_language: user.preferred_language || 'en',
        emergency_contact: user.emergency_contact || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');

    try {
      const updated = await api.updateProfile({
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
      });
      updateUser(updated);
      setMsg('Profile updated successfully! ✨');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1>👤 My Profile & Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your personal details, language preferences, and emergency contact.
        </p>
      </div>

      <div className="card">
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)', paddingBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email} • Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                name="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                name="phone"
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                name="age"
                type="number"
                min="1"
                max="120"
                className="form-input"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Preferred Language (NER Regional Ready)</label>
              <select
                name="preferred_language"
                className="form-select"
                value={formData.preferred_language}
                onChange={handleChange}
              >
                <option value="en">English (Default)</option>
                <option value="as">Assamese (অসমীয়া)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="mni">Manipuri (মৈতৈলোন্)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Info</label>
              <input
                name="emergency_contact"
                type="text"
                className="form-input"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="e.g. Daughter: 9876500000"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={saving}
            style={{ marginTop: 'var(--space-lg)' }}
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes ✓'}
          </button>
        </form>
      </div>
    </div>
  );
}
