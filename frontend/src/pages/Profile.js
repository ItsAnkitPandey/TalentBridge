import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Avatar,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  Divider
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    linkedin_url: user?.linkedin_url || '',
    github_url: user?.github_url || '',
    job_title: user?.job_title || '',
    years_of_experience: user?.years_of_experience || 0,
    location: user?.location || '',
    can_provide_referrals: user?.can_provide_referrals || false
  });
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(user?.skills || []);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleDeleteSkill = (skillToDelete) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await usersAPI.updateProfile({
        ...formData,
        skills
      });
      updateUser(response.data.data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      linkedin_url: user?.linkedin_url || '',
      github_url: user?.github_url || '',
      job_title: user?.job_title || '',
      years_of_experience: user?.years_of_experience || 0,
      location: user?.location || '',
      can_provide_referrals: user?.can_provide_referrals || false
    });
    setSkills(user?.skills || []);
    setEditing(false);
    setError('');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            My Profile
          </Typography>
          {!editing && (
            <Button variant="outlined" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={user?.profile_picture}
            sx={{ width: 120, height: 120, mb: 2 }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          {editing && (
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              size="small"
            >
              Upload Photo
              <input hidden accept="image/*" type="file" />
            </Button>
          )}
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={!editing}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={!editing}
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            value={user?.email}
            disabled
            margin="normal"
            helperText="Email cannot be changed"
          />

          <TextField
            fullWidth
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Job Title"
            name="job_title"
            value={formData.job_title}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
          />

          <TextField
            fullWidth
            type="number"
            label="Years of Experience"
            name="years_of_experience"
            value={formData.years_of_experience}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
          />

          <TextField
            fullWidth
            label="LinkedIn URL"
            name="linkedin_url"
            value={formData.linkedin_url}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
          />

          <TextField
            fullWidth
            label="GitHub URL"
            name="github_url"
            value={formData.github_url}
            onChange={handleChange}
            disabled={!editing}
            margin="normal"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Skills
          </Typography>
          {editing && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
          )}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {skills.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No skills added yet
              </Typography>
            ) : (
              skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  onDelete={editing ? () => handleDeleteSkill(skill) : undefined}
                />
              ))
            )}
          </Box>

          {editing && user?.user_type === 'employee' && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.can_provide_referrals}
                  onChange={handleChange}
                  name="can_provide_referrals"
                />
              }
              label="I can provide referrals"
            />
          )}

          {editing && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="h4" color="primary.main">
                {user?.referral_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Referrals Provided
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="success.main">
                {user?.successful_referral_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful Referrals
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
