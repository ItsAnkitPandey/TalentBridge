import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Link as MuiLink,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationsAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: 'employee',
    organization_id: '',
    job_title: '',
    years_of_experience: 0
  });
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationsAPI.getAll();
      setOrganizations(response.data.data.organizations);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert years_of_experience to integer
    if (name === 'years_of_experience') {
      const intValue = value === '' ? 0 : parseInt(value, 10);
      setFormData({
        ...formData,
        [name]: isNaN(intValue) ? 0 : intValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/.test(formData.password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;

    if (formData.user_type === 'fresher') {
      delete registerData.organization_id;
      delete registerData.job_title;
      delete registerData.years_of_experience;
    } else {
      // Ensure years_of_experience is an integer
      registerData.years_of_experience = parseInt(registerData.years_of_experience, 10) || 0;
    }
    
    const result = await register(registerData);

    if (result.success) {
      navigate('/');
    } else {
      // Display error message from backend
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="first_name"
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="last_name"
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </Box>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>I am a</InputLabel>
            <Select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              label="I am a"
            >
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="fresher">Fresher</MenuItem>
            </Select>
          </FormControl>

          {formData.user_type === 'employee' && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Organization</InputLabel>
                <Select
                  name="organization_id"
                  value={formData.organization_id}
                  onChange={handleChange}
                  label="Organization"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField margin="normal"
                fullWidth
                id="job_title"
                label="Job Title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
              />

              <TextField
                margin="normal"
                fullWidth
                type="number"
                id="years_of_experience"
                label="Years of Experience"
                name="years_of_experience"
                value={formData.years_of_experience}
                onChange={handleChange}
                inputProps={{
                  min: 0,
                  max: 50,
                  step: 1
                }}
                helperText="Enter years as a whole number (e.g., 2, 3, 5)"
              />
            </>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <MuiLink component={Link} to="/login" variant="body2">
              Already have an account? Sign In
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
