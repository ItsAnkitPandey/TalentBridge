import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { LocationOn, Business, Work, AttachFile } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI, referralsAPI } from '../services/api';
import { formatExperienceLevel } from '../utils/jobUtils';
import { useAuth } from '../contexts/AuthContext';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openReferralDialog, setOpenReferralDialog] = useState(false);
  const [referralData, setReferralData] = useState({
    message: '',
    resume_url: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getById(id);
      setJob(response.data.data.job);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReferral = async () => {
    try {
      setError('');
      setSubmitting(true);
      await referralsAPI.createRequest({
        job_id: id,
        ...referralData
      });
      setSuccess('Referral request sent successfully!');
      setOpenReferralDialog(false);
      setReferralData({ message: '', resume_url: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send referral request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!job) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5">Job not found</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          {job.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="action" />
            <Typography variant="body1">
              {job.organization?.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="action" />
            <Typography variant="body1">
              {job.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Work color="action" />
            <Typography variant="body1">
              {job.job_type}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {job.external_job_id && (
            <Chip label={`Job ID: ${job.external_job_id}`} color="secondary" variant="outlined" sx={{ fontWeight: 'bold' }} />
          )}
          <Chip label={formatExperienceLevel(job.experience_level)} color="primary" />
          <Chip label={job.remote_type} />
          <Chip label={`${job.views_count} views`} variant="outlined" />
        </Box>

        {user && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenReferralDialog(true)}
              sx={{ mr: 2 }}
            >
              Request Referral
            </Button>
            {job.application_url && (
              <Button
                variant="outlined"
                color="primary"
                href={job.application_url}
                target="_blank"
              >
                Apply Directly
              </Button>
            )}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Job Description
        </Typography>
        <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
          {job.description}
        </Typography>

        {job.requirements && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Requirements
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {job.requirements}
            </Typography>
          </>
        )}

        {job.required_skills && job.required_skills.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Required Skills
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {job.required_skills.map((skill, index) => (
                <Chip key={index} label={skill} variant="outlined" />
              ))}
            </Box>
          </>
        )}

        {job.benefits && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Benefits
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {job.benefits}
            </Typography>
          </>
        )}

        {job.salary_min && job.salary_max && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
              Salary Range
            </Typography>
            <Typography variant="body1">
              {job.salary_currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
            </Typography>
          </>
        )}
      </Paper>

      {/* Referral Request Dialog */}
      <Dialog open={openReferralDialog} onClose={() => !submitting && setOpenReferralDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Referral</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Message (Optional)"
            multiline
            rows={4}
            margin="normal"
            value={referralData.message}
            onChange={(e) => setReferralData({ ...referralData, message: e.target.value })}
            placeholder="Why are you interested in this position?"
            disabled={submitting}
          />
          <TextField
            fullWidth
            label="Resume URL (Optional)"
            margin="normal"
            value={referralData.resume_url}
            onChange={(e) => setReferralData({ ...referralData, resume_url: e.target.value })}
            placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
            disabled={submitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReferralDialog(false)} disabled={submitting}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleRequestReferral}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobDetails;
