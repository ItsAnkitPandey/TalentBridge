import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { Email } from '@mui/icons-material';
import axios from 'axios';

const ResendVerification = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/resend-verification`,
        { email }
      );

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to resend verification email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Email color="primary" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Resend Verification Email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email address and we'll send you a new verification link
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Verification email sent successfully! Please check your inbox and spam folder.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading || success}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || success}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Sending...' : 'Send Verification Email'}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Back to Login
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default ResendVerification;
