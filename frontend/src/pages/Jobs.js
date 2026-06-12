import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import { Work, LocationOn, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { jobsAPI } from '../services/api';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    experienceLevel: '',
    jobType: '',
    remoteType: ''
  });

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAll(filters);
      setJobs(response.data.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = () => {
    fetchJobs();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      location: '',
      experienceLevel: '',
      jobType: '',
      remoteType: ''
    });
    setTimeout(fetchJobs, 100);
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
            Browse Jobs
          </Typography>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Box
            sx={{
              mb: 4,
              p: 3,
              bgcolor: 'grey.50',
              borderRadius: 3,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              transition: 'all 0.3s',
              '&:hover': {
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search jobs..."
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    name="experienceLevel"
                    value={filters.experienceLevel}
                    onChange={handleFilterChange}
                    label="Experience Level"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="fresher">Fresher</MenuItem>
                    <MenuItem value="entry">Entry Level</MenuItem>
                    <MenuItem value="mid">Mid Level</MenuItem>
                    <MenuItem value="senior">Senior</MenuItem>
                    <MenuItem value="lead">Lead</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    name="jobType"
                    value={filters.jobType}
                    onChange={handleFilterChange}
                    label="Job Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="full-time">Full Time</MenuItem>
                    <MenuItem value="part-time">Part Time</MenuItem>
                    <MenuItem value="contract">Contract</MenuItem>
                    <MenuItem value="internship">Internship</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Remote Type</InputLabel>
                  <Select
                    name="remoteType"
                    value={filters.remoteType}
                    onChange={handleFilterChange}
                    label="Remote Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="on-site">On-site</MenuItem>
                    <MenuItem value="remote">Remote</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      sx={{
                        px: 4,
                        borderRadius: 2,
                        boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                        }
                      }}
                    >
                      Search
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      sx={{
                        px: 4,
                        borderRadius: 2
                      }}
                    >
                      Reset
                    </Button>
                  </motion.div>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h6" align="center" color="text.secondary">
              No jobs found
            </Typography>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {jobs.map((job, index) => (
              <Grid item xs={12} key={job.id}>
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s',
                      border: '1px solid transparent',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                            {job.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Business fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {job.organization?.name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {job.location}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Work fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {job.experience_level}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {job.description?.substring(0, 150)}...
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip label={job.experience_level} size="small" color="primary" />
                            <Chip label={job.job_type} size="small" color="secondary" />
                            <Chip label={job.remote_type} size="small" color="default" />
                            {job.required_skills?.slice(0, 3).map((skill, skillIndex) => (
                              <Chip key={skillIndex} label={skill} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          sx={{ borderRadius: 2 }}
                        >
                          View Details
                        </Button>
                      </motion.div>
                    </CardActions>
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

export default Jobs;
