const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  deleteReviewAdmin,
} = require('../controllers/reviewController');
const { protectCustomer } = require('../middleware/customerAuthMiddleware');
const { optionalCustomer } = require('../middleware/optionalCustomerMiddleware');
const { protectAdmin } = require('../middleware/authMiddleware');

// Customer Protected Routes
router.post('/customer/reviews', protectCustomer, createReview);
router.put('/customer/reviews/:id', protectCustomer, updateReview);
router.delete('/customer/reviews/:id', protectCustomer, deleteReview);

// Public / Optional Auth Route
router.get('/customer/products/:productId/reviews', optionalCustomer, getProductReviews);

// Admin Protected Routes
router.get('/admin/reviews', protectAdmin, getAllReviewsAdmin);
router.delete('/admin/reviews/:id', protectAdmin, deleteReviewAdmin);

module.exports = router;
