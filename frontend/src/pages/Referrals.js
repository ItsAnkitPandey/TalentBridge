import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  Divider
} from '@mui/material';
import { Business, LocationOn, Email, Work } from '@mui/icons-material';
import { referralsAPI } from '../services/api';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'accept' or 'reject'
  const [responseMessage, setResponseMessage] = useState('');
  const [referrerNotes, setReferrerNotes] = useState('');
  const [internalReferralId, setInternalReferralId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const response = await referralsAPI.getRequests({ status: 'requested' });
      setReferrals(response.data.data.referrals);
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
      setError('Failed to load referral requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (referral, type) => {
    setSelectedReferral(referral);
    setActionType(type);
    setDialogOpen(true);
    setResponseMessage('');
    setReferrerNotes('');
    setInternalReferralId('');
    setProofUrl('');
    setProofNotes('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReferral(null);
    setActionType('');
    setResponseMessage('');
    setReferrerNotes('');
    setInternalReferralId('');
    setProofUrl('');
    setProofNotes('');
  };

  const handleAction = async () => {
    try {
      setError('');
      if (actionType === 'accept') {
        await referralsAPI.accept(selectedReferral.id, {
          response_message: responseMessage,
          referrer_notes: referrerNotes,
          internal_referral_id: internalReferralId,
          proof_url: proofUrl,
          proof_notes: proofNotes
        });
        setSuccess('Referral request accepted successfully!');
      } else {
        await referralsAPI.reject(selectedReferral.id, {
          response_message: responseMessage
        });
        setSuccess('Referral request rejected');
      }
      handleCloseDialog();
      fetchReferrals();
    } catch (error) {
      setError(error.response?.data?.message || 'Action failed');
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
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Referral Requests
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {referrals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending referral requests
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {referrals.map((referral) => (
            <Card key={referral.id}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar
                    src={referral.requester?.profile_picture}
                    sx={{ width: 60, height: 60 }}
                  >
                    {referral.requester?.first_name?.[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {referral.requester?.first_name} {referral.requester?.last_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, my: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {referral.requester?.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Work fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {referral.requester?.years_of_experience} years exp.
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" gutterBottom>
                      Job: {referral.job?.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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

                    {referral.message && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Message:
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {referral.message}
                        </Typography>
                      </>
                    )}

                    {referral.requester?.skills && referral.requester.skills.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">Skills:</Typography>
                        {referral.requester.skills.map((skill, index) => (
                          <Chip key={index} label={skill} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}

                    {referral.resume_url && (
                      <Button
                        size="small"
                        href={referral.resume_url}
                        target="_blank"
                        sx={{ mt: 2 }}
                      >
                        View Resume
                      </Button>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenDialog(referral, 'accept')}
                      >
                        Accept & Refer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleOpenDialog(referral, 'reject')}
                      >
                        Decline
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'accept' ? 'Accept Referral Request' : 'Decline Referral Request'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Response Message"
            multiline
            rows={3}
            margin="normal"
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            placeholder={actionType === 'accept' 
              ? "Let them know you'll be providing the referral..." 
              : "Optionally provide a reason for declining..."}
          />
          {actionType === 'accept' && (
            <>
              <TextField
                fullWidth
                label="Internal Referral ID / Workday Code (Optional)"
                margin="normal"
                value={internalReferralId}
                onChange={(e) => setInternalReferralId(e.target.value)}
                placeholder="e.g., REF-98421 or Workday Confirmation ID"
                helperText="Provide if you have already submitted them in your company portal"
              />
              <TextField
                fullWidth
                label="Proof URL / Screenshot Link (Optional)"
                margin="normal"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="e.g., https://drive.google.com/... or confirmation link"
              />
              <TextField
                fullWidth
                label="Submission / Proof Notes (Optional)"
                multiline
                rows={2}
                margin="normal"
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="e.g., Submitted via Workday portal on 29 Aug"
              />
              <TextField
                fullWidth
                label="Internal Notes (Private)"
                multiline
                rows={2}
                margin="normal"
                value={referrerNotes}
                onChange={(e) => setReferrerNotes(e.target.value)}
                placeholder="Add any private notes for your records..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'accept' ? 'primary' : 'error'}
            onClick={handleAction}
          >
            {actionType === 'accept' ? 'Accept' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Referrals;
