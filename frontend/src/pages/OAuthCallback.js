import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../services/api';
import { CheckCircle } from '@mui/icons-material';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error parameter
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setErrorMessage('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Extract tokens from URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (!token || !refreshToken) {
          setStatus('error');
          setErrorMessage('Invalid authentication response. Missing tokens.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Store tokens in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        // Fetch user data to populate auth context
        try {
          await api.get('/auth/me');
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }

        // Show success briefly before redirecting
        setStatus('success');
        setTimeout(() => {
          // Redirect to home, which will trigger AuthContext to load user
          window.location.href = '/';
        }, 1500);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('An error occurred during authentication.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Container component="main" maxWidth="xs" sx={{ 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          {status === 'processing' && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Completing Sign In...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we authenticate you
              </Typography>
            </>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Success!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting you to the app...
              </Typography>
            </motion.div>
          )}

          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Redirecting to login...
              </Typography>
            </>
          )}
        </Box>
      </motion.div>
    </Container>
  );
};

export default OAuthCallback;
