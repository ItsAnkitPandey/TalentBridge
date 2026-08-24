const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const { protect, canProvideReferrals } = require('../middleware/auth.middleware');
const { validateReferralRequest } = require('../middleware/validation.middleware');
const { 
  requireEmailVerification, 
  rateLimitReferralRequests 
} = require('../middleware/verification.middleware');

router.post(
  '/request', 
  protect, 
  requireEmailVerification, 
  rateLimitReferralRequests, 
  validateReferralRequest, 
  referralController.createReferralRequest
);
router.get('/requests', protect, requireEmailVerification, canProvideReferrals, referralController.getReferralRequests);
router.get('/my-requests', protect, referralController.getMyReferralRequests);
router.get('/provided', protect, referralController.getProvidedReferrals);
router.put('/:id/accept', protect, requireEmailVerification, canProvideReferrals, referralController.acceptReferralRequest);
router.put('/:id/reject', protect, requireEmailVerification, canProvideReferrals, referralController.rejectReferralRequest);
router.put('/:id/complete', protect, requireEmailVerification, referralController.completeReferral);

module.exports = router;
