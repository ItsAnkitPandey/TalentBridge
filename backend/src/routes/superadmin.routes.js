const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  createAdmin,
  updateAdminStatus,
  deleteAdmin,
  checkSuperAdmin
} = require('../controllers/superadmin.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// Check if current user is super admin
router.get('/check', checkSuperAdmin);

// Admin management routes
router.get('/admins', getAllAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdminStatus);
router.delete('/admins/:id', deleteAdmin);

module.exports = router;
