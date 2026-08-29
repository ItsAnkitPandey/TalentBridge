const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');

const uploadProfilePicture = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
			return callback(null, true);
		}

		return callback(new Error('Only JPEG, PNG, and WebP images are allowed'));
	}
});

router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/profile/picture', protect, uploadProfilePicture.single('profile_picture'), userController.uploadProfilePicture);


module.exports = router;
