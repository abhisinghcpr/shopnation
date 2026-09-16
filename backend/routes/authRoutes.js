const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminProfile, logoutAdmin } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Public Admin Route
router.post('/login', loginAdmin);

// Protected Admin Routes
router.get('/profile', protectAdmin, getAdminProfile);
router.post('/logout', protectAdmin, logoutAdmin);

module.exports = router;
