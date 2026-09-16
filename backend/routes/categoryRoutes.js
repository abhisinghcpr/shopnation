const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadCategoryImage } = require('../middleware/uploadMiddleware');

router.route('/')
  .get(getCategories)
  .post(protectAdmin, uploadCategoryImage.single('image'), createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protectAdmin, uploadCategoryImage.single('image'), updateCategory)
  .delete(protectAdmin, deleteCategory);

module.exports = router;
