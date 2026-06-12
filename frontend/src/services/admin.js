import axios from 'axios';
import api from './api';


// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// Get all users with pagination
export const getAllUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const response = await api.delete('/admin/users/${userId}');
  return response.data;
};

// Get all jobs with pagination
export const getAllJobs = async (params = {}) => {
  const response = await api.get('/admin/jobs', { params });
  return response.data;
};

// Toggle job status
export const toggleJobStatus = async (jobId) => {
  const response = await api.put('/admin/jobs/${jobId}/toggle');
  return response.data;
};

// Approve job
export const approveJob = async (jobId) => {
  const response = await api.put('/admin/jobs/${jobId}/approve');
  return response.data;
};

// Reject job
export const rejectJob = async (jobId, reason) => {
  const response = await api.put('/admin/jobs/${jobId}/reject', { reason });
  return response.data;
};

// Get pending jobs count
export const getPendingJobsCount = async () => {
  const response = await api.get('/admin/jobs/pending/count');
  return response.data;
};

// Delete job
export const deleteJob = async (jobId) => {
  const response = await api.delete('/admin/jobs/${jobId}');
  return response.data;
};

// Get all referrals with pagination
export const getAllReferrals = async (params = {}) => {
  const response = await api.get('/admin/referrals', { params });
  return response.data;
};

// Send bulk email
export const sendBulkEmail = async (data) => {
  const response = await api.post('/admin/email/bulk', data);
  return response.data;
};
