import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import PostJob from './pages/PostJob';
import Referrals from './pages/Referrals';
import MyReferrals from './pages/MyReferrals';
import Profile from './pages/Profile';
import Users from './pages/Users';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import LoadingSpinner from './components/LoadingSpinner';

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }) {
  const toast = useToast();

  React.useEffect(() => {
    toast.error(`Application Error: ${error.message}`);
  }, [error, toast]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center',
      }}
    >
      <h1>Oops! Something went wrong</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          background: '#1976d2',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Try Again
      </button>
    </Box>
  );
}

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading application..." />;
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, mt: 8 }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/resend-verification" element={<ResendVerification />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route
              path="/jobs/post"
              element={
                <ProtectedRoute>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/referrals"
              element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-referrals"
              element={
                <ProtectedRoute>
                  <MyReferrals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Box>
    </Box>
    </ErrorBoundary>
  );
}

export default App;
