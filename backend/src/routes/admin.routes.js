const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  getAllJobs,
  toggleJobStatus,
  deleteJob,
  approveJob,
  rejectJob,
  getPendingJobsCount,
  getAllReferrals,
  sendBulkEmailToUsers
} = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/admin.middleware');

// All routes require authentication and admin privileges
router.use(protect);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Job management
router.get('/jobs', getAllJobs);
router.get('/jobs/pending/count', getPendingJobsCount);
router.put('/jobs/:id/toggle', toggleJobStatus);
router.put('/jobs/:id/approve', approveJob);
router.put('/jobs/:id/reject', rejectJob);
router.delete('/jobs/:id', deleteJob);

// Referral management
router.get('/referrals', getAllReferrals);

// Bulk email
router.post('/email/bulk', sendBulkEmailToUsers);

module.exports = router;
