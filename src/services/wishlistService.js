import axios from 'axios';
import { API_ENDPOINTS, BASE_API_URL, STORAGE_KEYS } from '../config/apiConfig';

const getCustomerAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.CUSTOMER_TOKEN);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { headers };
};

export const wishlistService = {
  /**
   * Fetch customer wishlist (GET /api/v1/customer/wishlist)
   */
  async getWishlist() {
    try {
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.WISHLIST.GET}`,
        getCustomerAuthHeaders()
      );
      return response.data.wishlist || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      const message = error.response?.data?.message || 'Failed to fetch wishlist';
      throw new Error(message);
    }
  },

  /**
   * Toggle product in wishlist (POST /api/v1/customer/wishlist/toggle/:productId)
   */
  async toggleWishlist(productId) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.WISHLIST.TOGGLE(productId)}`,
        {},
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      const message = error.response?.data?.message || 'Failed to update wishlist';
      throw new Error(message);
    }
  },

  /**
   * Remove item from wishlist (DELETE /api/v1/customer/wishlist/:productId)
   */
  async removeFromWishlist(productId) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.WISHLIST.REMOVE(productId)}`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      throw new Error(message);
    }
  },
};
