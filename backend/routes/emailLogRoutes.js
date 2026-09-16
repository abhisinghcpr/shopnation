const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  getEmailLogs,
  retryEmail,
  deleteEmailLog,
  clearFailedLogs,
} = require('../controllers/emailLogController');

// All routes protected by admin auth
router.get('/', protectAdmin, getEmailLogs);
router.post('/:id/retry', protectAdmin, retryEmail);
router.delete('/clear-failed', protectAdmin, clearFailedLogs);
router.delete('/:id', protectAdmin, deleteEmailLog);

module.exports = router;
