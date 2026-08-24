import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobsAPI, organizationsAPI } from '../services/api';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization_id: '',
    job_type: 'full-time',
    experience_level: 'mid',
    location: '',
    remote_type: 'on-site',
    salary_min: '',
    salary_max: '',
    required_skills: [],
    requirements: '',
    benefits: '',
    application_url: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleDeleteSkill = (skillToDelete) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(skill => skill !== skillToDelete)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await jobsAPI.create(formData);
      // Show approval message if job requires approval
      const message = response.data.message || 'Job posted successfully!';
      setSuccess(message);
      setTimeout(() => navigate('/jobs'), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Post a Job
        </Typography>

        {user?.user_type !== 'admin' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Job Approval Process:</strong> All job postings are reviewed by our admin team before being published. 
            You will be notified once your job is approved and visible to candidates.
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            label="Job Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Organization</InputLabel>
            <Select
              name="organization_id"
              value={formData.organization_id}
              onChange={handleChange}
              label="Organization"
            >
              {organizations.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            label="Job Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={6}
          />

          <TextField
            fullWidth
            required
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            margin="normal"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                label="Job Type"
              >
                <MenuItem value="full-time">Full Time</MenuItem>
                <MenuItem value="part-time">Part Time</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="internship">Internship</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                label="Experience Level"
              >
                <MenuItem value="fresher">Fresher (0 Yrs)</MenuItem>
                <MenuItem value="entry">Entry Level (1-3 Yrs)</MenuItem>
                <MenuItem value="mid">Mid Level (4-7 Yrs)</MenuItem>
                <MenuItem value="senior">Senior (8-12 Yrs)</MenuItem>
                <MenuItem value="lead">Lead (12+ Yrs)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Remote Type</InputLabel>
              <Select
                name="remote_type"
                value={formData.remote_type}
                onChange={handleChange}
                label="Remote Type"
              >
                <MenuItem value="on-site">On-site</MenuItem>
                <MenuItem value="remote">Remote</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Minimum Salary"
              name="salary_min"
              type="number"
              value={formData.salary_min}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Maximum Salary"
              name="salary_max"
              type="number"
              value={formData.salary_max}
              onChange={handleChange}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Required Skills
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Add skill"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button variant="outlined" onClick={handleAddSkill}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formData.required_skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={() => handleDeleteSkill(skill)}
                />
              ))}
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
          />

          <TextField
            fullWidth
            label="Benefits"
            name="benefits"
            value={formData.benefits}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Application URL"
            name="application_url"
            value={formData.application_url}
            onChange={handleChange}
            margin="normal"
            placeholder="https://company.com/careers/apply"
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/jobs')}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PostJob;
