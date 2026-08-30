const API_BASE = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  headers(includeAuth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = this.getToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }

  async request(method, path, body = null, auth = true) {
    const options = {
      method,
      headers: this.headers(auth),
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, options);
    
    if (res.status === 204) return null;
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Something went wrong');
    }
    return data;
  }

  // ─── Auth ────────────────────────────────
  register(userData) {
    return this.request('POST', '/auth/register', userData, false);
  }

  login(email, password) {
    return this.request('POST', '/auth/login', { email, password }, false);
  }

  getProfile() {
    return this.request('GET', '/auth/me');
  }

  updateProfile(data) {
    return this.request('PUT', '/auth/me', data);
  }

  // ─── Dashboard ──────────────────────────
  getPatientDashboard() {
    return this.request('GET', '/dashboard/patient');
  }

  // ─── Games ──────────────────────────────
  getGames() {
    return this.request('GET', '/games/');
  }

  getGame(id) {
    return this.request('GET', `/games/${id}`);
  }

  startGameSession(gameId, difficulty) {
    return this.request('POST', `/games/${gameId}/start`, { game_id: gameId, difficulty });
  }

  submitGameResult(gameId, resultData) {
    return this.request('POST', `/games/${gameId}/submit`, resultData);
  }

  getResults() {
    return this.request('GET', '/games/results/all');
  }

  getResult(id) {
    return this.request('GET', `/games/results/${id}`);
  }

  // ─── Performance ────────────────────────
  getPerformance() {
    return this.request('GET', '/performance/');
  }

  getWeeklyPerformance() {
    return this.request('GET', '/performance/weekly');
  }

  getMonthlyPerformance() {
    return this.request('GET', '/performance/monthly');
  }

  // ─── Reminders ──────────────────────────
  getReminders() {
    return this.request('GET', '/reminders/');
  }

  createReminder(data) {
    return this.request('POST', '/reminders/', data);
  }

  updateReminder(id, data) {
    return this.request('PUT', `/reminders/${id}`, data);
  }

  completeReminder(id) {
    return this.request('PATCH', `/reminders/${id}/complete`);
  }

  deleteReminder(id) {
    return this.request('DELETE', `/reminders/${id}`);
  }

  // ─── Caregiver ──────────────────────────
  getCaregiverDashboard() {
    return this.request('GET', '/caregiver/dashboard');
  }

  getLinkedPatients() {
    return this.request('GET', '/caregiver/patients');
  }

  linkPatient(email) {
    return this.request('POST', '/caregiver/patients', { patient_email: email });
  }

  unlinkPatient(id) {
    return this.request('DELETE', `/caregiver/patients/${id}`);
  }

  getPatientPerformance(patientId) {
    return this.request('GET', `/caregiver/patients/${patientId}/performance`);
  }

  // ─── AI Analysis ────────────────────────
  getAIAnalysis() {
    return this.request('GET', '/ai/analysis');
  }

  getAIAnalysisForUser(userId) {
    return this.request('GET', `/ai/analysis/${userId}`);
  }

  // ─── Recommendations ────────────────────
  getRecommendations() {
    return this.request('GET', '/recommendations/');
  }

  // ─── Admin ──────────────────────────────
  getAdminUsers() {
    return this.request('GET', '/admin/users');
  }

  updateAdminUser(userId, data) {
    return this.request('PUT', `/admin/users/${userId}`, data);
  }

  deleteAdminUser(userId) {
    return this.request('DELETE', `/admin/users/${userId}`);
  }

  getAdminStats() {
    return this.request('GET', '/admin/stats');
  }

  getAdminGames() {
    return this.request('GET', '/admin/games');
  }
}

const api = new ApiService();
export default api;
