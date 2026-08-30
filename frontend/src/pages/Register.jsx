import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    age: '',
    gender: 'Male',
    phone: '',
    preferred_language: 'en',
    emergency_contact: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
      };

      const user = await register(payload);
      if (user.role === 'patient') navigate('/dashboard');
      else if (user.role === 'caregiver') navigate('/caregiver');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '640px' }}>
        <div className="auth-header">
          <div className="logo">🌱</div>
          <h1>Create an Account</h1>
          <p>Join CogniMind for personalized cognitive care and memory assistance</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">I am registering as:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <button
                type="button"
                className={`btn ${formData.role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData(p => ({ ...p, role: 'patient' }))}
              >
                👵 Elderly User / Patient
              </button>
              <button
                type="button"
                className={`btn ${formData.role === 'caregiver' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData(p => ({ ...p, role: 'caregiver' }))}
              >
                🩺 Caregiver / Doctor
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Kamala Devi"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. kamala@gmail.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">Password *</label>
              <input
                id="reg-pass"
                name="password"
                type="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          {formData.role === 'patient' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-age">Age</label>
                  <input
                    id="reg-age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    className="form-input"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 70"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-gender">Gender</label>
                  <select
                    id="reg-gender"
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
                  <label className="form-label" htmlFor="reg-lang">Preferred Language (NER friendly)</label>
                  <select
                    id="reg-lang"
                    name="preferred_language"
                    className="form-select"
                    value={formData.preferred_language}
                    onChange={handleChange}
                  >
                    <option value="en">English</option>
                    <option value="as">Assamese (অসমীয়া)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="mni">Manipuri (মৈতৈলোন্)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-contact">Emergency Contact</label>
                  <input
                    id="reg-contact"
                    name="emergency_contact"
                    type="text"
                    className="form-input"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="e.g. Son: 9876500000"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: 'var(--space-md)' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration ✨'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
