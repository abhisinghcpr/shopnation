const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadProductImage } = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getProducts)
  .post(protectAdmin, uploadProductImage.single('image'), createProduct);

router.route('/:id')
  .put(protectAdmin, uploadProductImage.single('image'), updateProduct)
  .delete(protectAdmin, deleteProduct);

module.exports = router;
