import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Pagination,
  CircularProgress,
} from '@mui/material';
import {
  People,
  Work,
  TrendingUp,
  Block,
  CheckCircle,
  Delete,
  Visibility,
  Send,
  PendingActions,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import * as adminAPI from '../services/admin';
import * as superAdminAPI from '../services/superadmin';

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    successRate: 0,
  });
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [jobFilter, setJobFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [rejectDialog, setRejectDialog] = useState({ open: false, jobId: null, reason: '' });
  const [referralDetailsDialog, setReferralDetailsDialog] = useState({ open: false, referral: null });
  const [jobDetailsDialog, setJobDetailsDialog] = useState({ open: false, job: null });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [addAdminDialog, setAddAdminDialog] = useState({ open: false, loading: false });
  const [adminFormData, setAdminFormData] = useState({ email: '', password: '', first_name: '', last_name: '' });
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [pagination, setPagination] = useState({
    users: { page: 1, totalPages: 1 },
    jobs: { page: 1, totalPages: 1 },
    referrals: { page: 1, totalPages: 1 },
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, id: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState({
    open: false,
    recipients: 'all',
    subject: '',
    message: '',
  });

  const fetchDashboardData = useCallback(async (isInitialLoad = false) => {
    try {
      // Only show full-page loading on initial load
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTabLoading(true);
      }
      
      // Fetch stats (always needed)
      const statsRes = await adminAPI.getDashboardStats();
      setStats(statsRes.data.stats);

      // Fetch pending jobs count
      const pendingRes = await adminAPI.getPendingJobsCount();
      setPendingJobsCount(pendingRes.data.count);

      // Fetch tab-specific data
      if (activeTab === 0) {
        const usersRes = await adminAPI.getAllUsers({ 
          page: pagination.users.page, 
          limit: 10 
        });
        setUsers(usersRes.data.users);
        setPagination(prev => ({
          ...prev,
          users: {
            page: usersRes.data.pagination.page,
            totalPages: usersRes.data.pagination.totalPages,
          },
        }));
      } else if (activeTab === 1) {
        const params = { 
          page: pagination.jobs.page, 
          limit: 10 
        };
        
        // Add approval filter
        if (jobFilter === 'pending') {
          params.is_approved = 'false';
        } else if (jobFilter === 'approved') {
          params.is_approved = 'true';
        }
        
        const jobsRes = await adminAPI.getAllJobs(params);
        setJobs(jobsRes.data.jobs);
        setPagination(prev => ({
          ...prev,
          jobs: {
            page: jobsRes.data.pagination.page,
            totalPages: jobsRes.data.pagination.totalPages,
          },
        }));
      } else if (activeTab === 2) {
        const referralsRes = await adminAPI.getAllReferrals({ 
          page: pagination.referrals.page, 
          limit: 10 
        });
        setReferrals(referralsRes.data.referrals);
        setPagination(prev => ({
          ...prev,
          referrals: {
            page: referralsRes.data.pagination.page,
            totalPages: referralsRes.data.pagination.totalPages,
          },
        }));
      } else if (activeTab === 3 && isSuperAdmin) {
        // Fetch admins for super admin
        const adminsRes = await superAdminAPI.getAllAdmins();
        setAdmins(adminsRes.data.data.admins);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setTabLoading(false);
      }
    }
  }, [activeTab, pagination.users.page, pagination.jobs.page, pagination.referrals.page, jobFilter, toast]);

  useEffect(() => {
    fetchDashboardData(true); // Initial load
    // Check if user is super admin
    superAdminAPI.checkSuperAdmin().then(res => {
      setIsSuperAdmin(res.data.data.isSuperAdmin);
    }).catch((err) => {
      console.error('Super admin check error:', err);
      setIsSuperAdmin(false);
    });
  }, []); // Only run once on mount

  useEffect(() => {
    // Fetch data when tab, pagination, or filter changes (but not on initial mount)
    if (!loading) {
      fetchDashboardData(false);
    }
  }, [activeTab, pagination.users.page, pagination.jobs.page, pagination.referrals.page, jobFilter]);

  const handleDeleteUser = async (userId) => {
    try {
      setConfirmLoading(true);
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      setConfirmDialog({ open: false, action: null, id: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleToggleJobStatus = async (jobId) => {
    try {
      await adminAPI.toggleJobStatus(jobId);
      toast.success('Job status updated');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      setConfirmLoading(true);
      await adminAPI.deleteJob(jobId);
      toast.success('Job deleted successfully');
      setConfirmDialog({ open: false, action: null, id: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    try {
      await adminAPI.approveJob(jobId);
      toast.success('Job approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve job');
    }
  };

  const handleRejectJob = async () => {
    try {
      if (!rejectDialog.reason.trim()) {
        toast.error('Please provide a rejection reason');
        return;
      }
      
      await adminAPI.rejectJob(rejectDialog.jobId, rejectDialog.reason);
      toast.success('Job rejected successfully');
      setRejectDialog({ open: false, jobId: null, reason: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject job');
    }
  };

  const handleViewReferral = (referral) => {
    setReferralDetailsDialog({ open: true, referral });
  };

  const handleViewJob = (job) => {
    setJobDetailsDialog({ open: true, job });
  };

  const handleCreateAdmin = async () => {
    try {
      setAddAdminDialog({ ...addAdminDialog, loading: true });
      
      if (!adminFormData.email || !adminFormData.password || !adminFormData.first_name || !adminFormData.last_name) {
        toast.error('Please fill in all fields');
        setAddAdminDialog({ ...addAdminDialog, loading: false });
        return;
      }

      await superAdminAPI.createAdmin(adminFormData);
      toast.success('Admin created successfully');
      setAddAdminDialog({ open: false, loading: false });
      setAdminFormData({ email: '', password: '', first_name: '', last_name: '' });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
      setAddAdminDialog({ ...addAdminDialog, loading: false });
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      await superAdminAPI.updateAdminStatus(adminId, !currentStatus);
      toast.success('Admin status updated successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    try {
      setConfirmLoading(true);
      await superAdminAPI.deleteAdmin(adminId);
      toast.success('Admin deleted successfully');
      setConfirmDialog({ open: false, action: null, id: null });
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleSendBulkEmail = async () => {
    try {
      if (!emailDialog.subject || !emailDialog.message) {
        toast.error('Please fill in subject and message');
        return;
      }

      await adminAPI.sendBulkEmail({
        recipients: emailDialog.recipients,
        subject: emailDialog.subject,
        message: emailDialog.message,
      });
      toast.success('Emails sent successfully');
      setEmailDialog({ open: false, recipients: 'all', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send emails');
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'deleteUser') {
      handleDeleteUser(confirmDialog.id);
    } else if (confirmDialog.action === 'deleteJob') {
      handleDeleteJob(confirmDialog.id);
    } else if (confirmDialog.action === 'deleteAdmin') {
      handleDeleteAdmin(confirmDialog.id);
    }
  };

  // Check if user is admin
  if (!user || user.user_type !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          border: `1px solid ${color}30`,
          borderRadius: 3,
          transition: 'all 0.3s',
          '&:hover': {
            boxShadow: `0 8px 30px ${color}40`,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: `${color}20`,
                color,
              }}
            >
              <Icon sx={{ fontSize: 32 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading admin dashboard..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setEmailDialog({ 
              open: true, 
              recipients: 'all',
              subject: '',
              message: ''
            })}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Send Bulk Email
          </Button>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={People}
            color="#1976d2"
            subtitle="Active accounts"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            icon={Work}
            color="#2e7d32"
            subtitle="All job postings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approval"
            value={pendingJobsCount}
            icon={PendingActions}
            color="#ed6c02"
            subtitle="Jobs awaiting review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={TrendingUp}
            color="#9c27b0"
            subtitle="Active listings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Referrals"
            value={stats.totalReferrals}
            icon={TrendingUp}
            color="#ed6c02"
            subtitle={`${stats.activeReferrals} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={CheckCircle}
            color="#9c27b0"
            subtitle="Completed referrals"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Users" />
          <Tab label="Jobs" />
          <Tab label="Referrals" />
          {isSuperAdmin && <Tab label="Admins" />}
        </Tabs>
      </Paper>

      {/* Users Tab */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TableContainer component={Paper} sx={{ borderRadius: 3, position: 'relative', minHeight: 300 }}>
            {tabLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                  borderRadius: 3,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Referrals</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <EmptyState 
                        icon="inbox"
                        title="No users found"
                        message="There are no users in the system yet."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.user_type}
                          size="small"
                          color={user.user_type === 'employee' ? 'primary' : user.user_type === 'admin' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          size="small"
                          color="success"
                        />
                      </TableCell>
                      <TableCell>{user.referralCount || 0}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setConfirmDialog({
                            open: true,
                            action: 'deleteUser',
                            id: user.id,
                          })}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {pagination.users.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.users.totalPages}
                page={pagination.users.page}
                onChange={(e, page) => setPagination(prev => ({
                  ...prev,
                  users: { ...prev.users, page }
                }))}
                color="primary"
              />
            </Box>
          )}
        </motion.div>
      )}

      {/* Jobs Tab */}
      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={jobFilter}
                label="Filter by Status"
                onChange={(e) => setJobFilter(e.target.value)}
              >
                <MenuItem value="all">All Jobs</MenuItem>
                <MenuItem value="pending">Pending Approval ({pendingJobsCount})</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TableContainer component={Paper} sx={{ borderRadius: 3, position: 'relative', minHeight: 300 }}>
            {tabLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                  borderRadius: 3,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Posted By</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Approval</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Applications</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <EmptyState 
                        icon="briefcase"
                        title="No jobs found"
                        message={jobFilter === 'pending' ? 'No jobs pending approval' : 'There are no jobs in the system yet.'}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.organization?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {job.poster ? `${job.poster.first_name} ${job.poster.last_name}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.is_approved ? 'Approved' : 'Pending'}
                          size="small"
                          color={job.is_approved ? 'success' : 'warning'}
                          icon={job.is_approved ? <CheckCircle /> : <PendingActions />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={job.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={job.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{job.applicationsCount || 0}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewJob(job)}
                          title="View Full Details"
                        >
                          <Visibility />
                        </IconButton>
                        {!job.is_approved && (
                          <>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleApproveJob(job.id)}
                              title="Approve Job"
                            >
                              <ThumbUp />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => setRejectDialog({ open: true, jobId: job.id, reason: '' })}
                              title="Reject Job"
                            >
                              <ThumbDown />
                            </IconButton>
                          </>
                        )}
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleToggleJobStatus(job.id)}
                          title="Toggle Active Status"
                        >
                          <Block />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setConfirmDialog({
                            open: true,
                            action: 'deleteJob',
                            id: job.id,
                          })}
                          title="Delete Job"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {pagination.jobs.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.jobs.totalPages}
                page={pagination.jobs.page}
                onChange={(e, page) => setPagination(prev => ({
                  ...prev,
                  jobs: { ...prev.jobs, page }
                }))}
                color="primary"
              />
            </Box>
          )}
        </motion.div>
      )}

      {/* Referrals Tab */}
      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TableContainer component={Paper} sx={{ borderRadius: 3, position: 'relative', minHeight: 300 }}>
            {tabLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                  borderRadius: 3,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Job</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Referrer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <EmptyState 
                        icon="inbox"
                        title="No referrals found"
                        message="There are no referral requests yet."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  referrals.map((referral) => (
                    <TableRow key={referral.id} hover>
                      <TableCell>{referral.job?.title || 'N/A'}</TableCell>
                      <TableCell>
                        {referral.requester 
                          ? `${referral.requester.first_name} ${referral.requester.last_name}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {referral.referrer 
                          ? `${referral.referrer.first_name} ${referral.referrer.last_name}`
                          : 'Pending'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={referral.status}
                          size="small"
                          color={
                            referral.status === 'accepted'
                              ? 'success'
                              : referral.status === 'completed'
                              ? 'primary'
                              : referral.status === 'requested'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewReferral(referral)}
                          title="View Details"
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {pagination.referrals.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.referrals.totalPages}
                page={pagination.referrals.page}
                onChange={(e, page) => setPagination(prev => ({
                  ...prev,
                  referrals: { ...prev.referrals, page }
                }))}
                color="primary"
              />
            </Box>
          )}
        </motion.div>
      )}

      {/* Admins Tab (Super Admin Only) */}
      {activeTab === 3 && isSuperAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<People />}
              onClick={() => setAddAdminDialog({ open: true, loading: false })}
            >
              Add New Admin
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 3, position: 'relative', minHeight: 300 }}>
            {tabLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                  borderRadius: 3,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <EmptyState 
                        icon="inbox"
                        title="No admins found"
                        message="No admin users in the system yet."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id} hover>
                      <TableCell>
                        {`${admin.first_name} ${admin.last_name}`}
                        {admin.email === 'ankitpandey.272003@gmail.com' && (
                          <Chip 
                            label="Super Admin" 
                            size="small" 
                            color="secondary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={admin.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={admin.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {admin.email !== 'ankitpandey.272003@gmail.com' && admin.id !== user.id && (
                          <>
                            <IconButton 
                              size="small" 
                              color={admin.is_active ? 'warning' : 'success'}
                              onClick={() => handleToggleAdminStatus(admin.id, admin.is_active)}
                              title={admin.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <Block />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => setConfirmDialog({
                                open: true,
                                action: 'deleteAdmin',
                                id: admin.id,
                              })}
                              title="Delete Admin"
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      )}

      {/* Add Admin Dialog */}
      <Dialog
        open={addAdminDialog.open}
        onClose={() => !addAdminDialog.loading && setAddAdminDialog({ open: false, loading: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Admin</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={adminFormData.first_name}
              onChange={(e) => setAdminFormData({ ...adminFormData, first_name: e.target.value })}
              placeholder="Enter first name"
              required
              disabled={addAdminDialog.loading}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={adminFormData.last_name}
              onChange={(e) => setAdminFormData({ ...adminFormData, last_name: e.target.value })}
              placeholder="Enter last name"
              required
              disabled={addAdminDialog.loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={adminFormData.email}
              onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              placeholder="Enter email address"
              required
              disabled={addAdminDialog.loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={adminFormData.password}
              onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
              placeholder="Enter password"
              required
              disabled={addAdminDialog.loading}
              helperText="Minimum 6 characters"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAddAdminDialog({ open: false, loading: false });
              setAdminFormData({ email: '', password: '', first_name: '', last_name: '' });
            }}
            disabled={addAdminDialog.loading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateAdmin}
            disabled={addAdminDialog.loading || !adminFormData.email || !adminFormData.password || !adminFormData.first_name || !adminFormData.last_name}
          >
            {addAdminDialog.loading ? <CircularProgress size={24} /> : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog
        open={emailDialog.open}
        onClose={() => setEmailDialog({ open: false, recipients: 'all', subject: '', message: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Bulk Email</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Recipients</InputLabel>
              <Select
                value={emailDialog.recipients}
                label="Recipients"
                onChange={(e) => setEmailDialog({ ...emailDialog, recipients: e.target.value })}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="employees">Employees Only</MenuItem>
                <MenuItem value="freshers">Freshers Only</MenuItem>
                <MenuItem value="active">Active Users (Last 30 days)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Subject"
              value={emailDialog.subject}
              onChange={(e) => setEmailDialog({ ...emailDialog, subject: e.target.value })}
              placeholder="Enter email subject"
            />
            <TextField
              fullWidth
              label="Message"
              value={emailDialog.message}
              onChange={(e) => setEmailDialog({ ...emailDialog, message: e.target.value })}
              multiline
              rows={6}
              placeholder="Enter your message..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog({ open: false, recipients: 'all', subject: '', message: '' })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSendBulkEmail}
            disabled={!emailDialog.subject || !emailDialog.message}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, id: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'deleteUser' 
            ? 'Delete User' 
            : confirmDialog.action === 'deleteJob' 
            ? 'Delete Job' 
            : 'Delete Admin'
        }
        message={`Are you sure you want to delete this ${
          confirmDialog.action === 'deleteUser' 
            ? 'user' 
            : confirmDialog.action === 'deleteJob' 
            ? 'job' 
            : 'admin'
        }? This action cannot be undone.`}
        severity="error"
        loading={confirmLoading}
      />

      {/* Reject Job Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, jobId: null, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Job Posting</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a reason for rejecting this job posting. The poster will be notified.
            </Typography>
            <TextField
              fullWidth
              label="Rejection Reason"
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              multiline
              rows={4}
              placeholder="e.g., Job description is incomplete, Violates community guidelines, etc."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, jobId: null, reason: '' })}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleRejectJob}
            disabled={!rejectDialog.reason.trim()}
          >
            Reject Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog
        open={jobDetailsDialog.open}
        onClose={() => setJobDetailsDialog({ open: false, job: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Job Details</Typography>
            {jobDetailsDialog.job && !jobDetailsDialog.job.is_approved && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<ThumbUp />}
                  onClick={() => {
                    handleApproveJob(jobDetailsDialog.job.id);
                    setJobDetailsDialog({ open: false, job: null });
                  }}
                >
                  Approve
                </Button>
                <Button 
                  variant="contained" 
                  color="error"
                  startIcon={<ThumbDown />}
                  onClick={() => {
                    setRejectDialog({ open: true, jobId: jobDetailsDialog.job.id, reason: '' });
                    setJobDetailsDialog({ open: false, job: null });
                  }}
                >
                  Reject
                </Button>
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {jobDetailsDialog.job && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Job Header */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="h4" gutterBottom>
                      {jobDetailsDialog.job.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
                      <Chip
                        label={jobDetailsDialog.job.is_approved ? 'Approved' : 'Pending Approval'}
                        color={jobDetailsDialog.job.is_approved ? 'success' : 'warning'}
                        icon={jobDetailsDialog.job.is_approved ? <CheckCircle /> : <PendingActions />}
                      />
                      <Chip
                        label={jobDetailsDialog.job.is_active ? 'Active' : 'Inactive'}
                        color={jobDetailsDialog.job.is_active ? 'success' : 'default'}
                      />
                      <Chip label={jobDetailsDialog.job.job_type} variant="outlined" />
                      <Chip label={jobDetailsDialog.job.remote_type} variant="outlined" />
                      <Chip label={jobDetailsDialog.job.experience_level} variant="outlined" />
                    </Box>
                  </Paper>
                </Grid>

                {/* Company Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work /> Company Information
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>Organization:</strong> {jobDetailsDialog.job.organization?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Location:</strong> {jobDetailsDialog.job.location || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Applications:</strong> {jobDetailsDialog.job.applicationsCount || 0}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Posted By */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People /> Posted By
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>Name:</strong> {jobDetailsDialog.job.poster 
                        ? `${jobDetailsDialog.job.poster.first_name} ${jobDetailsDialog.job.poster.last_name}`
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {jobDetailsDialog.job.poster?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Posted At:</strong> {jobDetailsDialog.job.createdAt 
                        ? new Date(jobDetailsDialog.job.createdAt).toLocaleString()
                        : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Job Description */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Job Description
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                      {jobDetailsDialog.job.description || 'No description provided'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Requirements */}
                {jobDetailsDialog.job.requirements && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Requirements
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                        {jobDetailsDialog.job.requirements}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Required Skills */}
                {jobDetailsDialog.job.required_skills && jobDetailsDialog.job.required_skills.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Required Skills
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        {jobDetailsDialog.job.required_skills.map((skill, index) => (
                          <Chip key={index} label={skill} color="primary" variant="outlined" />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* Benefits */}
                {jobDetailsDialog.job.benefits && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Benefits
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                        {jobDetailsDialog.job.benefits}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Salary Range */}
                {(jobDetailsDialog.job.salary_min || jobDetailsDialog.job.salary_max) && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Salary Range
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {jobDetailsDialog.job.salary_min && jobDetailsDialog.job.salary_max
                          ? `$${jobDetailsDialog.job.salary_min.toLocaleString()} - $${jobDetailsDialog.job.salary_max.toLocaleString()}`
                          : jobDetailsDialog.job.salary_min
                          ? `From $${jobDetailsDialog.job.salary_min.toLocaleString()}`
                          : `Up to $${jobDetailsDialog.job.salary_max.toLocaleString()}`
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Application URL */}
                {jobDetailsDialog.job.application_url && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Application Link
                      </Typography>
                      <Button 
                        variant="outlined" 
                        href={jobDetailsDialog.job.application_url}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View Application Page
                      </Button>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDetailsDialog({ open: false, job: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Referral Details Dialog */}
      <Dialog
        open={referralDetailsDialog.open}
        onClose={() => setReferralDetailsDialog({ open: false, referral: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Referral Details</DialogTitle>
        <DialogContent>
          {referralDetailsDialog.referral && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Job Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Job Information
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {referralDetailsDialog.referral.job?.title || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Company: {referralDetailsDialog.referral.job?.organization?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {referralDetailsDialog.referral.job?.location || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Requester Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Requester
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {referralDetailsDialog.referral.requester 
                        ? `${referralDetailsDialog.referral.requester.first_name} ${referralDetailsDialog.referral.requester.last_name}`
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {referralDetailsDialog.referral.requester?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {referralDetailsDialog.referral.requester?.user_type || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Referrer Information */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Referrer
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {referralDetailsDialog.referral.referrer 
                        ? `${referralDetailsDialog.referral.referrer.first_name} ${referralDetailsDialog.referral.referrer.last_name}`
                        : 'Not Assigned'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {referralDetailsDialog.referral.referrer?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {referralDetailsDialog.referral.referrer?.user_type || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Status and Dates */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Status & Timeline
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip
                        label={referralDetailsDialog.referral.status}
                        color={
                          referralDetailsDialog.referral.status === 'accepted'
                            ? 'success'
                            : referralDetailsDialog.referral.status === 'completed'
                            ? 'primary'
                            : referralDetailsDialog.referral.status === 'requested'
                            ? 'warning'
                            : 'default'
                        }
                      />
                      <Typography variant="body2">
                        <strong>Created:</strong> {referralDetailsDialog.referral.createdAt 
                          ? new Date(referralDetailsDialog.referral.createdAt).toLocaleString()
                          : 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Updated:</strong> {referralDetailsDialog.referral.updatedAt 
                          ? new Date(referralDetailsDialog.referral.updatedAt).toLocaleString()
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Message/Notes */}
                {referralDetailsDialog.referral.message && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Message from Requester
                      </Typography>
                      <Typography variant="body2">
                        {referralDetailsDialog.referral.message}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Additional Information */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Referral ID:</strong> {referralDetailsDialog.referral.id || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Job ID:</strong> {referralDetailsDialog.referral.job_id || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReferralDetailsDialog({ open: false, referral: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
