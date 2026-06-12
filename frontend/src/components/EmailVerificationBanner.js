import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import { Email, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Component to display email verification warning banner
 * Shows when user is logged in but email is not verified
 */
const EmailVerificationBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only show if user is logged in and not verified
  if (!user || user.is_verified) {
    return null;
  }

  return (
    <Alert 
      severity="warning" 
      icon={<Email />}
      sx={{ 
        mb: 2,
        position: 'sticky',
        top: 64, // Below navbar
        zIndex: 1000
      }}
      action={
        <Button 
          color="inherit" 
          size="small"
          onClick={() => navigate('/resend-verification')}
        >
          Resend Email
        </Button>
      }
    >
      <AlertTitle>
        <strong>Email Verification Required</strong>
      </AlertTitle>
      Please verify your email address to access all features. Check your inbox for the verification link.
    </Alert>
  );
};

/**
 * Component to display when user tries to access restricted feature
 */
export const EmailVerificationRequired = ({ feature = 'this feature' }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Warning color="warning" sx={{ fontSize: 80, mb: 2 }} />
      <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
        <AlertTitle>Email Verification Required</AlertTitle>
        You must verify your email address before you can access {feature}.
        Please check your inbox for the verification link.
      </Alert>
      <Button
        variant="contained"
        onClick={() => navigate('/resend-verification')}
        sx={{ mr: 2 }}
      >
        Resend Verification Email
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate('/')}
      >
        Go to Home
      </Button>
    </Box>
  );
};

/**
 * Higher-order component to protect routes that require verification
 */
export const withEmailVerification = (Component) => {
  return function VerifiedComponent(props) {
    const { user } = useAuth();

    if (!user || !user.is_verified) {
      return <EmailVerificationRequired />;
    }

    return <Component {...props} />;
  };
};

export default EmailVerificationBanner;
