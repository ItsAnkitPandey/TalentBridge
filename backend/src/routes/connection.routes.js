const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connection.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/follow/:userId', protect, connectionController.followUser);
router.delete('/unfollow/:userId', protect, connectionController.unfollowUser);
router.get('/followers/:userId', connectionController.getFollowers);
router.get('/following/:userId', connectionController.getFollowing);

module.exports = router;
