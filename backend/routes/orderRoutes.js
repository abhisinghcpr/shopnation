const express = require('express');
const router = express.Router();
const {
  placeOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelCustomerOrder,
  reorderCustomerItems,
  getCustomerOrders,
  getCustomerOrderById,
  getAllOrdersAdmin,
  getAdminOrderById,
  updateOrderStatusAdmin,
} = require('../controllers/orderController');
const { protectCustomer } = require('../middleware/customerAuthMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');

// Customer Protected Routes
router.post('/customer/orders', protectCustomer, placeOrder);
router.post('/customer/payment/razorpay-order', protectCustomer, createRazorpayOrder);
router.post('/customer/payment/verify-razorpay', protectCustomer, verifyRazorpayPayment);
router.post('/customer/orders/:id/cancel', protectCustomer, cancelCustomerOrder);
router.post('/customer/orders/:id/reorder', protectCustomer, reorderCustomerItems);
router.get('/customer/orders', protectCustomer, getCustomerOrders);
router.get('/customer/orders/:id', protectCustomer, getCustomerOrderById);

// Admin Protected Routes
router.get('/admin/orders', protectAdmin, getAllOrdersAdmin);
router.get('/admin/orders/:id', protectAdmin, getAdminOrderById);
router.put('/admin/orders/:id/status', protectAdmin, updateOrderStatusAdmin);

module.exports = router;
