import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import GamesList from './pages/GamesList';
import MemoryMatch from './pages/games/MemoryMatch';
import NumberRecall from './pages/games/NumberRecall';
import ImageRecall from './pages/games/ImageRecall';
import GameResult from './pages/GameResult';
import Reminders from './pages/Reminders';
import Progress from './pages/Progress';
import CaregiverDashboard from './pages/CaregiverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
        <h2>Loading CogniMind...</h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'caregiver') return <Navigate to="/caregiver" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleDefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'patient') return <Navigate to="/dashboard" replace />;
  if (user.role === 'caregiver') return <Navigate to="/caregiver" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RoleDefaultRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Patient Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              } />

              <Route path="/games" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <GamesList />
                </ProtectedRoute>
              } />

              <Route path="/games/memory_match" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <MemoryMatch />
                </ProtectedRoute>
              } />

              <Route path="/games/number_recall" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <NumberRecall />
                </ProtectedRoute>
              } />

              <Route path="/games/image_recall" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <ImageRecall />
                </ProtectedRoute>
              } />

              <Route path="/game-result" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <GameResult />
                </ProtectedRoute>
              } />

              <Route path="/progress" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <Progress />
                </ProtectedRoute>
              } />

              {/* Shared Routes */}
              <Route path="/reminders" element={
                <ProtectedRoute allowedRoles={['patient', 'caregiver']}>
                  <Reminders />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Caregiver Routes */}
              <Route path="/caregiver" element={
                <ProtectedRoute allowedRoles={['caregiver']}>
                  <CaregiverDashboard />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
