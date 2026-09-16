const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/statsController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard/stats', protectAdmin, getDashboardStats);

module.exports = router;
