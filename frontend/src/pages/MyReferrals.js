import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Link
} from '@mui/material';
import { 
  Business, 
  LocationOn, 
  Person, 
  CheckCircle, 
  Cancel, 
  HourglassEmpty, 
  AssignmentTurnedIn, 
  OpenInNew,
  Send,
  Update
} from '@mui/icons-material';
import { referralsAPI } from '../services/api';

const referralSteps = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'submitted_to_hr', label: 'Submitted to HR' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'completed', label: 'Hired / Completed' }
];

const getActiveStep = (status) => {
  switch (status) {
    case 'requested': return 0;
    case 'accepted': return 1;
    case 'submitted_to_hr': return 2;
    case 'interviewing': return 3;
    case 'completed': return 4;
    case 'rejected': return -1;
    case 'cancelled': return -1;
    default: return 0;
  }
};

const MyReferrals = () => {
  const [tabValue, setTabValue] = useState(0);
  const [requestedReferrals, setRequestedReferrals] = useState([]);
  const [providedReferrals, setProvidedReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Form Fields
  const [internalReferralId, setInternalReferralId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusResponseMessage, setStatusResponseMessage] = useState('');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const [requestedRes, providedRes] = await Promise.all([
        referralsAPI.getMyRequests(),
        referralsAPI.getProvided()
      ]);
      setRequestedReferrals(requestedRes.data.data.referrals);
      setProvidedReferrals(providedRes.data.data.referrals);
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProofDialog = (referral) => {
    setSelectedReferral(referral);
    setInternalReferralId(referral.internal_referral_id || '');
    setProofUrl(referral.proof_url || '');
    setProofNotes(referral.proof_notes || '');
    setProofDialogOpen(true);
  };

  const handleCloseProofDialog = () => {
    setProofDialogOpen(false);
    setSelectedReferral(null);
    setInternalReferralId('');
    setProofUrl('');
    setProofNotes('');
  };

  const handleSubmitProof = async () => {
    if (!selectedReferral) return;
    try {
      setSubmitting(true);
      setError('');
      await referralsAPI.submitToHr(selectedReferral.id, {
        internal_referral_id: internalReferralId,
        proof_url: proofUrl,
        proof_notes: proofNotes
      });
      setSuccess('HR submission proof recorded successfully!');
      handleCloseProofDialog();
      fetchReferrals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit HR proof');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusDialog = (referral) => {
    setSelectedReferral(referral);
    setNewStatus(referral.status);
    setStatusResponseMessage('');
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedReferral(null);
    setNewStatus('');
    setStatusResponseMessage('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedReferral || !newStatus) return;
    try {
      setSubmitting(true);
      setError('');
      await referralsAPI.updateStatus(selectedReferral.id, {
        status: newStatus,
        response_message: statusResponseMessage
      });
      setSuccess(`Referral status updated to ${newStatus}!`);
      handleCloseStatusDialog();
      fetchReferrals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update referral status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'info';
      case 'submitted_to_hr': return 'secondary';
      case 'interviewing': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle fontSize="small" />;
      case 'submitted_to_hr': return <AssignmentTurnedIn fontSize="small" />;
      case 'interviewing': return <Send fontSize="small" />;
      case 'completed': return <CheckCircle fontSize="small" />;
      case 'rejected': return <Cancel fontSize="small" />;
      default: return <HourglassEmpty fontSize="small" />;
    }
  };

  const ReferralCard = ({ referral, isRequested }) => {
    const activeStep = getActiveStep(referral.status);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box>
              <Typography variant="h6">
                {referral.job?.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Business fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {referral.job?.organization?.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {referral.job?.location}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Chip
              icon={getStatusIcon(referral.status)}
              label={referral.status.replace(/_/g, ' ').toUpperCase()}
              color={getStatusColor(referral.status)}
              size="small"
            />
          </Box>

          {/* Stepper Pipeline for non-rejected referrals */}
          {referral.status !== 'rejected' && referral.status !== 'cancelled' && (
            <Box sx={{ my: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel size="small">
                {referralSteps.map((step) => (
                  <Step key={step.key}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {isRequested ? (
            referral.referrer && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Referrer: {referral.referrer.first_name} {referral.referrer.last_name}
                </Typography>
              </Box>
            )
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Candidate: {referral.requester?.first_name} {referral.requester?.last_name} ({referral.requester?.email})
              </Typography>
            </Box>
          )}

          {/* Proof / HR Confirmation Box */}
          {(referral.internal_referral_id || referral.proof_url || referral.proof_notes) && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AssignmentTurnedIn fontSize="small" /> HR Submission Proof & Referral Details
              </Typography>
              {referral.internal_referral_id && (
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Internal Referral / Tracking ID: <code>{referral.internal_referral_id}</code>
                </Typography>
              )}
              {referral.proof_url && (
                <Box sx={{ mt: 0.5 }}>
                  <Link href={referral.proof_url} target="_blank" rel="noopener" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}>
                    View HR Portal Submission Proof <OpenInNew fontSize="inherit" />
                  </Link>
                </Box>
              )}
              {referral.proof_notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Notes from Referrer: {referral.proof_notes}
                </Typography>
              )}
            </Box>
          )}

          {referral.response_message && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Referrer Message:
              </Typography>
              <Typography variant="body2">
                {referral.response_message}
              </Typography>
            </Box>
          )}

          {/* Action buttons for Referrer */}
          {!isRequested && referral.status !== 'rejected' && referral.status !== 'cancelled' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<AssignmentTurnedIn />}
                onClick={() => handleOpenProofDialog(referral)}
              >
                {referral.internal_referral_id ? 'Update HR Proof' : 'Submit HR Proof / Referral ID'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Update />}
                onClick={() => handleOpenStatusDialog(referral)}
              >
                Update Milestone Status
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: '0.75rem' }}>
            <Typography variant="caption">
              Requested: {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'N/A'}
            </Typography>
            {referral.submitted_at && (
              <Typography variant="caption">
                Submitted to HR: {new Date(referral.submitted_at).toLocaleDateString()}
              </Typography>
            )}
            {referral.completed_at && (
              <Typography variant="caption">
                Hired/Completed: {new Date(referral.completed_at).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        My Referrals
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Requested (${requestedReferrals.length})`} />
          <Tab label={`Provided (${providedReferrals.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box>
          {requestedReferrals.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No referral requests yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Browse jobs and request referrals to get started
              </Typography>
            </Paper>
          ) : (
            requestedReferrals.map((referral) => (
              <ReferralCard key={referral.id} referral={referral} isRequested={true} />
            ))
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {providedReferrals.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No referrals provided yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Accept referral requests from candidates to help them get hired
              </Typography>
            </Paper>
          ) : (
            providedReferrals.map((referral) => (
              <ReferralCard key={referral.id} referral={referral} isRequested={false} />
            ))
          )}
        </Box>
      )}

      {/* Submit HR Proof Dialog */}
      <Dialog open={proofDialogOpen} onClose={handleCloseProofDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Submit HR Portal Referral Proof</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Submit the internal confirmation details after referring the candidate in your company's HR system (Workday, SuccessFactors, Taleo, etc.).
          </Typography>
          <TextField
            fullWidth
            label="Internal Referral ID / Workday Tracking Code"
            margin="normal"
            value={internalReferralId}
            onChange={(e) => setInternalReferralId(e.target.value)}
            placeholder="e.g. REF-98421 or Workday Confirmation ID"
          />
          <TextField
            fullWidth
            label="Proof / Screenshot URL (Optional)"
            margin="normal"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="e.g. https://drive.google.com/... or confirmation screenshot link"
          />
          <TextField
            fullWidth
            label="Submission Notes (Optional)"
            multiline
            rows={3}
            margin="normal"
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            placeholder="e.g., Submitted via Workday portal to Engineering recruiter on 29 Aug"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProofDialog} disabled={submitting}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleSubmitProof} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Save & Notify Candidate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Milestone Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Referral Milestone Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-select-label">Referral Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Referral Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="accepted">Accepted (In Review)</MenuItem>
              <MenuItem value="submitted_to_hr">Submitted to HR</MenuItem>
              <MenuItem value="interviewing">Interviewing</MenuItem>
              <MenuItem value="completed">Hired / Completed</MenuItem>
              <MenuItem value="rejected">Not Selected / Rejected</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Update Note / Response Message"
            multiline
            rows={3}
            margin="normal"
            value={statusResponseMessage}
            onChange={(e) => setStatusResponseMessage(e.target.value)}
            placeholder="Optional message or update for the candidate..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={submitting}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleUpdateStatus} disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyReferrals;
