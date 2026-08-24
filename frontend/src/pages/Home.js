import React from 'react';
import { Container, Typography, Box, Button, Grid, Paper, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Work, People, TrendingUp, Handshake } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Work sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Browse Jobs',
      description: 'Access thousands of job openings from top companies like TCS, Wipro, Cognizant, and more.'
    },
    {
      icon: <Handshake sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Get Referrals',
      description: 'Request referrals from employees working in your dream companies.'
    },
    {
      icon: <People sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Provide Referrals',
      description: 'Help others by providing referrals and grow your professional network.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Track Progress',
      description: 'Monitor your referral requests and application status in one place.'
    }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
          >
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              TalentBridge
            </Typography>
          </motion.div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Typography variant="h5" paragraph>
              Connecting Talent Through Trust - Get referrals and land your dream job
            </Typography>
          </motion.div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Box sx={{ mt: 4 }}>
              {user ? (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/jobs')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                    }
                  }}
                >
                  Browse Jobs
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      mr: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.4)'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      color: 'white',
                      borderColor: 'white',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                    onClick={() => navigate('/jobs')}
                  >
                    View Jobs
                  </Button>
                </>
              )}
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} textAlign="center">
          {[
            { value: '1000+', label: 'Active Jobs', delay: 0 },
            { value: '500+', label: 'Referrers', delay: 0.1 },
            { value: '50+', label: 'Companies', delay: 0.2 }
          ].map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: stat.delay, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.05 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: stat.delay + 0.2, type: 'spring' }}
                  >
                    <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </motion.div>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700 }}>
            Why Choose Us?
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph>
            Everything you need to accelerate your job search
          </Typography>
        </motion.div>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      {!user && (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
              Join thousands of job seekers and referrers today
            </Typography>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 6px 30px rgba(25, 118, 210, 0.5)'
                  }
                }}
              >
                Create Free Account
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      )}
    </motion.div>
  );
};

export default Home;
