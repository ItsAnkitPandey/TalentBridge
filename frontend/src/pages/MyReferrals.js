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
  Paper
} from '@mui/material';
import { Business, LocationOn, Person, CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { referralsAPI } from '../services/api';

const MyReferrals = () => {
  const [tabValue, setTabValue] = useState(0);
  const [requestedReferrals, setRequestedReferrals] = useState([]);
  const [providedReferrals, setProvidedReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle fontSize="small" />;
      case 'rejected':
        return <Cancel fontSize="small" />;
      case 'completed':
        return <CheckCircle fontSize="small" />;
      default:
        return <HourglassEmpty fontSize="small" />;
    }
  };

  const ReferralCard = ({ referral, isRequested }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6">
            {referral.job?.title}
          </Typography>
          <Chip
            icon={getStatusIcon(referral.status)}
            label={referral.status}
            color={getStatusColor(referral.status)}
            size="small"
          />
        </Box>

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

        {isRequested ? (
          <>
            {referral.referrer && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Referred by: {referral.referrer.first_name} {referral.referrer.last_name}
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Requested by: {referral.requester.first_name} {referral.requester.last_name}
            </Typography>
          </Box>
        )}

        {referral.response_message && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Response:
            </Typography>
            <Typography variant="body2">
              {referral.response_message}
            </Typography>
          </Box>
        )}

        {referral.message && isRequested && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Your Message:
            </Typography>
            <Typography variant="body2">
              {referral.message}
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Requested on: {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'N/A'}
        </Typography>
        {referral.accepted_at && (
          <Typography variant="caption" color="text.secondary">
            Accepted on: {new Date(referral.accepted_at).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

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
        My Referrals
      </Typography>

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
                Accept referral requests to help others
              </Typography>
            </Paper>
          ) : (
            providedReferrals.map((referral) => (
              <ReferralCard key={referral.id} referral={referral} isRequested={false} />
            ))
          )}
        </Box>
      )}
    </Container>
  );
};

export default MyReferrals;
