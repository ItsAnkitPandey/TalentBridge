import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Box,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Paper
} from '@mui/material';
import { Business, LocationOn, Work } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { usersAPI, connectionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (query = '') => {
    try {
      setLoading(true);
      const response = await usersAPI.search({ 
        query, 
        canProvideReferrals: 'true' 
      });
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers(searchQuery);
  };

  const handleConnect = async (userId) => {
    try {
      await connectionsAPI.follow(userId);
      // Optionally refresh or update UI
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Container sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Find Referrers
          </Typography>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Paper
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Search by name, skills, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  sx={{
                    px: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  Search
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>

        {users.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No users found
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {users.map((userItem, index) => (
              <Grid item xs={12} sm={6} md={4} key={userItem.id}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s',
                      border: '1px solid transparent',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <Avatar
                            src={userItem.profile_picture}
                            sx={{ width: 80, height: 80, mb: 1 }}
                          >
                            {userItem.first_name?.[0]}{userItem.last_name?.[0]}
                          </Avatar>
                        </motion.div>
                        <Typography variant="h6" align="center" sx={{ fontWeight: 600 }}>
                          {userItem.first_name} {userItem.last_name}
                        </Typography>
                      </Box>

                      {userItem.job_title && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <Work fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {userItem.job_title}
                          </Typography>
                        </Box>
                      )}

                      {userItem.organization && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <Business fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {userItem.organization.name}
                          </Typography>
                        </Box>
                      )}

                      {userItem.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {userItem.location}
                          </Typography>
                        </Box>
                      )}

                      {userItem.years_of_experience > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {userItem.years_of_experience} years of experience
                        </Typography>
                      )}

                      {userItem.bio && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {userItem.bio.substring(0, 100)}{userItem.bio.length > 100 ? '...' : ''}
                        </Typography>
                      )}

                      {userItem.skills && userItem.skills.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {userItem.skills.slice(0, 3).map((skill, idx) => (
                            <Chip
                              key={idx}
                              label={skill}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                          {userItem.skills.length > 3 && (
                            <Chip
                              label={`+${userItem.skills.length - 3}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}

                      {userItem.can_provide_referrals && (
                        <Chip
                          label="Available for Referrals"
                          color="success"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {user && user.id !== userItem.id && (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ width: '100%' }}
                          >
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => handleConnect(userItem.id)}
                              sx={{
                                borderRadius: 2,
                                boxShadow: '0 2px 10px rgba(25, 118, 210, 0.3)',
                                '&:hover': {
                                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)'
                                }
                              }}
                            >
                              Connect
                            </Button>
                          </motion.div>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </motion.div>
  );
};

export default Users;
