/**
 * uploadMiddleware.js
 * Multer + CloudinaryStorage upload middleware for ShopNation.
 * Images are streamed directly to Cloudinary — no local disk writes.
 * Allowed types: jpg, jpeg, png, webp | Max size: 4MB
 */

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// ─── File Filter ─────────────────────────────────────────────────────────────
// Allow only web-safe image formats
const imageFileFilter = (req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|webp)$/i;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

// ─── Product Image Storage ────────────────────────────────────────────────────
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopnation/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// ─── Category Image Storage ───────────────────────────────────────────────────
const categoryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'shopnation/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// ─── Multer Instances ─────────────────────────────────────────────────────────
const uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: imageFileFilter,
});

const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: imageFileFilter,
});

/**
 * Default export — kept for any code that imports `upload` directly.
 * Uses product storage as default.
 */
const upload = uploadProductImage;

module.exports = upload;
module.exports.uploadProductImage = uploadProductImage;
module.exports.uploadCategoryImage = uploadCategoryImage;
