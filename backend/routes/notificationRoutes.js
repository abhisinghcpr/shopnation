const express = require('express');
const router = express.Router();
const {
  getCustomerNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendAdminNotification,
} = require('../controllers/notificationController');
const { protectCustomer } = require('../middleware/customerAuthMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');

// Customer Protected Routes
router.get('/customer/notifications', protectCustomer, getCustomerNotifications);
router.get('/customer/notifications/unread-count', protectCustomer, getUnreadCount);
router.patch('/customer/notifications/read-all', protectCustomer, markAllAsRead);
router.patch('/customer/notifications/:id/read', protectCustomer, markAsRead);
router.delete('/customer/notifications/:id', protectCustomer, deleteNotification);

// Admin Protected Routes
router.post('/admin/notifications/send', protectAdmin, sendAdminNotification);

module.exports = router;
