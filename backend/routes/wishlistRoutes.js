const express = require('express');
const router = express.Router();
const {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { protectCustomer } = require('../middleware/customerAuthMiddleware');

router.use(protectCustomer);

router.get('/', getWishlist);
router.post('/toggle/:productId', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
