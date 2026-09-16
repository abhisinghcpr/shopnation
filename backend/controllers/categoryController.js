/**
 * categoryController.js
 * Category CRUD with Cloudinary image storage.
 * Images are uploaded to Cloudinary via multer-storage-cloudinary.
 * Old images are deleted from Cloudinary safely on replace or delete.
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const { deleteCloudinaryImage } = require('../config/cloudinary');

/**
 * @desc    Get all categories with MongoDB product count
 * @route   GET /api/v1/categories
 * @access  Public / Admin
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id });
        return {
          ...cat,
          id: cat._id.toString(),
          productCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category by ID
 * @route   GET /api/v1/categories/:id
 * @access  Public / Admin
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }
    const productCount = await Product.countDocuments({ category: category._id });
    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new category (Cloudinary image upload via multer-storage-cloudinary)
 * @route   POST /api/v1/categories
 * @access  Private (Admin Only)
 */
const createCategory = async (req, res, next) => {
  const uploadedPublicId = req.file?.filename || null;

  try {
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    // Cloudinary: req.file.path = secure_url, req.file.filename = public_id
    let imageUrl = '';
    let imagePublicId = '';
    if (req.file) {
      imageUrl = req.file.path;
      imagePublicId = req.file.filename;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      image: imageUrl,
      imagePublicId,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        ...category.toObject(),
        productCount: 0,
      },
    });
  } catch (error) {
    if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
    next(error);
  }
};

/**
 * @desc    Update category (Cloudinary image replacement with old image cleanup)
 * @route   PUT /api/v1/categories/:id
 * @access  Private (Admin Only)
 */
const updateCategory = async (req, res, next) => {
  const uploadedPublicId = req.file?.filename || null;

  try {
    const { name, description, isActive } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

    // Handle image replacement
    if (req.file) {
      const oldPublicId = category.imagePublicId;
      category.image = req.file.path;           // new Cloudinary secure_url
      category.imagePublicId = req.file.filename; // new Cloudinary public_id

      // Delete old image asynchronously
      if (oldPublicId) {
        deleteCloudinaryImage(oldPublicId).catch((err) =>
          console.error('[Cloudinary] Failed to delete old category image:', err.message)
        );
      }
    } else if (req.body.image !== undefined && req.body.image !== category.image) {
      category.image = req.body.image;
      if (!req.body.image) category.imagePublicId = '';
    }

    await category.save();
    const productCount = await Product.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (error) {
    if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
    next(error);
  }
};

/**
 * @desc    Delete category (removes Cloudinary image before DB delete)
 * @route   DELETE /api/v1/categories/:id
 * @access  Private (Admin Only)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Delete Cloudinary image safely before removing DB record
    if (category.imagePublicId) {
      await deleteCloudinaryImage(category.imagePublicId);
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
