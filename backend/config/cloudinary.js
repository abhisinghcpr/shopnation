/**
 * cloudinary.js
 * Cloudinary v2 SDK configuration for ShopNation.
 * Credentials are loaded ONLY from environment variables — never hardcoded.
 * The API secret is never logged or sent to clients.
 */

const cloudinary = require('cloudinary').v2;

// Configure using environment variables only
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

/**
 * Safe helper to delete a Cloudinary asset by public_id.
 * Will not throw — logs error message only (no secrets).
 * @param {string} publicId - The public_id of the Cloudinary asset
 */
const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      console.log(`[Cloudinary] Deleted image: ${publicId}`);
    } else {
      console.warn(`[Cloudinary] Delete returned non-ok for: ${publicId}`, result.result);
    }
  } catch (err) {
    // Safe log — never print credentials
    console.error(`[Cloudinary] Failed to delete image ${publicId}:`, err.message);
  }
};

module.exports = { cloudinary, deleteCloudinaryImage };
