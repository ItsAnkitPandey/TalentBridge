const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.get('/', organizationController.getAllOrganizations);
router.get('/:id', organizationController.getOrganization);
router.post('/', protect, admin, organizationController.createOrganization);
router.put('/:id', protect, admin, organizationController.updateOrganization);

module.exports = router;
