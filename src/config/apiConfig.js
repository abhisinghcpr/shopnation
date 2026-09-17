/**
 * Central Configuration for E-Commerce Application
 * English-only configuration for API Endpoints, LocalStorage, and Static Uploads.
 */

export const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://localhost:3000';

/**
 * Format image URL properly handling:
 * - Cloudinary secure URLs (https://res.cloudinary.com/...) — returned as-is
 * - Remote HTTP/HTTPS URLs — returned as-is
 * - Local /uploads/ paths (legacy) — prepended with UPLOADS_BASE_URL
 * - Empty/null — returns empty string
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // Already a full URL (Cloudinary or any remote)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // Legacy local upload paths
  if (imagePath.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_URL}${imagePath}`;
  }
  return `${UPLOADS_BASE_URL}/uploads/${imagePath}`;
};

/**
 * Returns an inline SVG data URI used as a fallback when an image fails to load.
 */
export const getFallbackImage = () =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f0f0f0'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23aaa'>No Image</text></svg>`;

// MongoDB Collection Names Reference
export const DB_COLLECTIONS = {
  ADMINS: 'admins',
  CUSTOMERS: 'customers',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
};

// API Endpoints Mapping
export const API_ENDPOINTS = {
  // Category Endpoints (/api/v1/categories)
  CATEGORIES_V1: {
    LIST: '/v1/categories',
    CREATE: '/v1/categories',
    BY_ID: (id) => `/v1/categories/${id}`,
    UPDATE: (id) => `/v1/categories/${id}`,
    DELETE: (id) => `/v1/categories/${id}`,
  },

  // Products Endpoints (/api/v1/products)
  PRODUCTS_V1: {
    LIST: '/v1/products',
    CREATE: '/v1/products',
    BY_ID: (id) => `/v1/products/${id}`,
    UPDATE: (id) => `/v1/products/${id}`,
    DELETE: (id) => `/v1/products/${id}`,
  },

  // Admin Specific Endpoints
  ADMIN: {
    AUTH: {
      LOGIN: '/v1/admin/login',
      LOGOUT: '/v1/admin/logout',
      PROFILE: '/v1/admin/profile',
    },
    DASHBOARD_STATS: '/v1/admin/dashboard/stats',
    ORDERS: {
      LIST: '/v1/admin/orders',
      UPDATE_STATUS: (id) => `/v1/admin/orders/${id}/status`,
    },
  },

  // Customer Specific Endpoints
  CUSTOMER: {
    AUTH: {
      REGISTER: '/v1/customer/auth/register',
      LOGIN: '/v1/customer/auth/login',
      PROFILE: '/v1/customer/auth/profile',
    },
    CART: {
      GET: '/v1/customer/cart',
      ADD: '/v1/customer/cart',
      UPDATE_ITEM: (productId) => `/v1/customer/cart/item/${productId}`,
      REMOVE_ITEM: (productId) => `/v1/customer/cart/item/${productId}`,
      CLEAR: '/v1/customer/cart',
    },
    WISHLIST: {
      GET: '/v1/customer/wishlist',
      TOGGLE: (productId) => `/v1/customer/wishlist/toggle/${productId}`,
      REMOVE: (productId) => `/v1/customer/wishlist/${productId}`,
    },
    ADDRESSES: {
      GET: '/v1/customer/addresses',
      ADD: '/v1/customer/addresses',
      UPDATE: (id) => `/v1/customer/addresses/${id}`,
      DELETE: (id) => `/v1/customer/addresses/${id}`,
      SET_DEFAULT: (id) => `/v1/customer/addresses/${id}/default`,
    },
    ORDERS: {
      CREATE: '/v1/customer/orders',
      LIST: '/v1/customer/orders',
      BY_ID: (id) => `/v1/customer/orders/${id}`,
    },
  },
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'ecommerce_admin_token',
  ADMIN_USER: 'ecommerce_admin_user',
  CUSTOMER_TOKEN: 'ecommerce_customer_token',
  CUSTOMER_USER: 'ecommerce_customer_user',
  CUSTOMER_CART: 'ecommerce_customer_cart',
};
