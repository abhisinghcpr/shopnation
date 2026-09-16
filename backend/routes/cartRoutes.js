const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { protectCustomer } = require('../middleware/customerAuthMiddleware');

router.use(protectCustomer);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route('/item/:productId')
  .put(updateCartItemQuantity)
  .delete(removeCartItem);

module.exports = router;
