const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateJob } = require('../middleware/validation.middleware');
const { 
  requireEmailVerification, 
  canPostJobs, 
  rateLimitJobPosting 
} = require('../middleware/verification.middleware');

router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJob);
router.get('/organization/:orgId', jobController.getJobsByOrganization);
router.post(
  '/', 
  protect, 
  requireEmailVerification, 
  canPostJobs, 
  rateLimitJobPosting, 
  validateJob, 
  jobController.createJob
);
router.put('/:id', protect, requireEmailVerification, jobController.updateJob);
router.delete('/:id', protect, requireEmailVerification, jobController.deleteJob);

module.exports = router;
