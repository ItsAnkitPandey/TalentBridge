import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/api/admin/stats`);
  return response.data;
};

// Get all users with pagination
export const getAllUsers = async (params = {}) => {
  const response = await axios.get(`${API_URL}/api/admin/users`, { params });
  return response.data;
};

// Delete user
export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`);
  return response.data;
};

// Get all jobs with pagination
export const getAllJobs = async (params = {}) => {
  const response = await axios.get(`${API_URL}/api/admin/jobs`, { params });
  return response.data;
};

// Toggle job status
export const toggleJobStatus = async (jobId) => {
  const response = await axios.put(`${API_URL}/api/admin/jobs/${jobId}/toggle`);
  return response.data;
};

// Approve job
export const approveJob = async (jobId) => {
  const response = await axios.put(`${API_URL}/api/admin/jobs/${jobId}/approve`);
  return response.data;
};

// Reject job
export const rejectJob = async (jobId, reason) => {
  const response = await axios.put(`${API_URL}/api/admin/jobs/${jobId}/reject`, { reason });
  return response.data;
};

// Get pending jobs count
export const getPendingJobsCount = async () => {
  const response = await axios.get(`${API_URL}/api/admin/jobs/pending/count`);
  return response.data;
};

// Delete job
export const deleteJob = async (jobId) => {
  const response = await axios.delete(`${API_URL}/api/admin/jobs/${jobId}`);
  return response.data;
};

// Get all referrals with pagination
export const getAllReferrals = async (params = {}) => {
  const response = await axios.get(`${API_URL}/api/admin/referrals`, { params });
  return response.data;
};

// Send bulk email
export const sendBulkEmail = async (data) => {
  const response = await axios.post(`${API_URL}/api/admin/email/bulk`, data);
  return response.data;
};
