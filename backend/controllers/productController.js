/**
 * productController.js
 * Product CRUD with Cloudinary image storage.
 * Images are uploaded to Cloudinary via multer-storage-cloudinary.
 * Old images are deleted from Cloudinary safely on replace or delete.
 * Secrets are never logged or returned in API responses.
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const { deleteCloudinaryImage } = require('../config/cloudinary');

/**
 * @desc    Get all products
 * @route   GET /api/v1/products
 * @access  Public / Admin
 */
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product (Cloudinary image upload via multer-storage-cloudinary)
 * @route   POST /api/v1/products
 * @access  Private (Admin Only)
 */
const createProduct = async (req, res, next) => {
  // Capture uploaded file info so we can clean up on error
  const uploadedPublicId = req.file?.filename || null;

  try {
    const {
      name,
      category,
      price,
      discountType,
      discountValue,
      quantity,
      rating,
      reviewCount,
      description,
      isActive,
    } = req.body;

    if (!name || !category || price === undefined || quantity === undefined) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Product Name, Category, Price, and Quantity are required fields',
      });
    }

    const priceNum = Number(price);
    const qtyNum = Number(quantity);
    const discVal = Number(discountValue) || 0;
    const ratingNum = Number(rating) || 0;
    const reviewNum = Number(reviewCount) || 0;

    if (priceNum < 0 || qtyNum < 0) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Price and Quantity cannot be negative',
      });
    }

    if (discountType === 'percentage' && (discVal < 0 || discVal > 100)) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100',
      });
    }

    if (discountType === 'fixed' && (discVal < 0 || discVal > priceNum)) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Fixed discount cannot exceed original price',
      });
    }

    if (ratingNum < 0 || ratingNum > 5) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 0 and 5',
      });
    }

    let categoryObj;
    if (typeof category === 'string' && category.match(/^[0-9a-fA-F]{24}$/)) {
      categoryObj = await Category.findById(category);
    } else {
      categoryObj = await Category.findOne({ name: category });
    }

    if (!categoryObj) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist',
      });
    }

    // Cloudinary: req.file.path = secure_url, req.file.filename = public_id
    let imageUrl = '';
    let imagePublicId = '';
    if (req.file) {
      imageUrl = req.file.path;         // Cloudinary secure_url
      imagePublicId = req.file.filename; // Cloudinary public_id
    } else if (req.body.image) {
      imageUrl = req.body.image; // Fallback for URL-only input
    }

    const product = await Product.create({
      name: name.trim(),
      category: categoryObj._id,
      price: priceNum,
      discountType: discountType || 'percentage',
      discountValue: discVal,
      quantity: qtyNum,
      rating: ratingNum,
      reviewCount: reviewNum,
      description: description ? description.trim() : '',
      image: imageUrl,
      imagePublicId,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    // Clean up Cloudinary upload if DB save failed
    if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
    next(error);
  }
};

/**
 * @desc    Update product (Cloudinary image replacement with old image cleanup)
 * @route   PUT /api/v1/products/:id
 * @access  Private (Admin Only)
 */
const updateProduct = async (req, res, next) => {
  const uploadedPublicId = req.file?.filename || null;

  try {
    const {
      name,
      category,
      price,
      discountType,
      discountValue,
      quantity,
      rating,
      reviewCount,
      description,
      isActive,
    } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (name) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (discountType !== undefined) product.discountType = discountType;
    if (discountValue !== undefined) product.discountValue = Number(discountValue);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (rating !== undefined) product.rating = Number(rating);
    if (reviewCount !== undefined) product.reviewCount = Number(reviewCount);
    if (description !== undefined) product.description = description.trim();
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    // Validations
    if (product.price < 0 || product.quantity < 0) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Price and Quantity cannot be negative',
      });
    }

    if (product.discountType === 'percentage' && (product.discountValue < 0 || product.discountValue > 100)) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100',
      });
    }

    if (product.discountType === 'fixed' && (product.discountValue < 0 || product.discountValue > product.price)) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Fixed discount cannot exceed original price',
      });
    }

    if (product.rating < 0 || product.rating > 5) {
      if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 0 and 5',
      });
    }

    // Handle image replacement
    if (req.file) {
      // Delete the old Cloudinary image only AFTER the new one is uploaded (it's already up)
      const oldPublicId = product.imagePublicId;
      product.image = req.file.path;          // new Cloudinary secure_url
      product.imagePublicId = req.file.filename; // new Cloudinary public_id

      // Delete old image asynchronously - don't block the response
      if (oldPublicId) {
        deleteCloudinaryImage(oldPublicId).catch((err) =>
          console.error('[Cloudinary] Failed to delete old product image:', err.message)
        );
      }
    } else if (req.body.image !== undefined && req.body.image !== product.image) {
      // If image URL changed via body (e.g. cleared), update it
      product.image = req.body.image;
      if (!req.body.image) product.imagePublicId = ''; // cleared
    }
    // If no new file and no image in body → keep existing image unchanged

    if (category) {
      let categoryObj;
      if (typeof category === 'string' && category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryObj = await Category.findById(category);
      } else {
        categoryObj = await Category.findOne({ name: category });
      }
      if (categoryObj) {
        product.category = categoryObj._id;
      }
    }

    await product.save();
    const updatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    if (uploadedPublicId) await deleteCloudinaryImage(uploadedPublicId);
    next(error);
  }
};

/**
 * @desc    Delete product (removes Cloudinary image safely before DB delete)
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Admin Only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Delete Cloudinary image (safe — won't throw if fails)
    if (product.imagePublicId) {
      await deleteCloudinaryImage(product.imagePublicId);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
