import axios from 'axios';
import { BASE_API_URL, STORAGE_KEYS } from '../config/apiConfig';

const getCustomerAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { headers };
};

const getAdminAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { headers };
};

export const reviewService = {
  /**
   * Fetch reviews & statistics for a specific product
   */
  async getProductReviews(productId) {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/v1/customer/products/${productId}/reviews`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      const message = error.response?.data?.message || 'Failed to fetch reviews';
      throw new Error(message);
    }
  },

  /**
   * Submit a new customer review
   */
  async createReview(payload) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}/v1/customer/reviews`,
        payload,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      const message = error.response?.data?.message || 'Failed to submit review';
      throw new Error(message);
    }
  },

  /**
   * Update an existing review
   */
  async updateReview(reviewId, payload) {
    try {
      const response = await axios.put(
        `${BASE_API_URL}/v1/customer/reviews/${reviewId}`,
        payload,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      const message = error.response?.data?.message || 'Failed to update review';
      throw new Error(message);
    }
  },

  /**
   * Delete own review
   */
  async deleteReview(reviewId) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}/v1/customer/reviews/${reviewId}`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      const message = error.response?.data?.message || 'Failed to delete review';
      throw new Error(message);
    }
  },

  /**
   * Admin: Get all reviews with optional product/rating/search filters
   */
  async getAllReviewsAdmin(params = {}) {
    try {
      const response = await axios.get(`${BASE_API_URL}/v1/admin/reviews`, {
        ...getAdminAuthHeaders(),
        params,
      });
      return response.data.reviews || [];
    } catch (error) {
      console.error('Error fetching admin reviews:', error);
      const message = error.response?.data?.message || 'Failed to fetch reviews';
      throw new Error(message);
    }
  },

  /**
   * Admin: Delete inappropriate review
   */
  async deleteReviewAdmin(reviewId) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}/v1/admin/reviews/${reviewId}`,
        getAdminAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting review by admin:', error);
      const message = error.response?.data?.message || 'Failed to delete review';
      throw new Error(message);
    }
  },
};
