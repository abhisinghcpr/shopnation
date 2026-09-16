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

export const cartService = {
  /**
   * Fetch customer cart (GET /api/v1/customer/cart)
   */
  async getCart() {
    try {
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.CART.GET}`,
        getCustomerAuthHeaders()
      );
      return response.data.cart || [];
    } catch (error) {
      console.error('Error fetching cart:', error);
      const message = error.response?.data?.message || 'Failed to fetch cart';
      throw new Error(message);
    }
  },

  /**
   * Add product to cart (POST /api/v1/customer/cart)
   */
  async addToCart(productId, quantity = 1) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.CART.ADD}`,
        { productId, quantity },
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding product to cart:', error);
      const message = error.response?.data?.message || 'Failed to add product to cart';
      throw new Error(message);
    }
  },

  /**
   * Update cart item quantity (PUT /api/v1/customer/cart/item/:productId)
   */
  async updateCartItem(productId, quantity) {
    try {
      const response = await axios.put(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.CART.UPDATE_ITEM(productId)}`,
        { quantity },
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      const message = error.response?.data?.message || 'Failed to update quantity';
      throw new Error(message);
    }
  },

  /**
   * Remove item from cart (DELETE /api/v1/customer/cart/item/:productId)
   */
  async removeCartItem(productId) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.CART.REMOVE_ITEM(productId)}`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      const message = error.response?.data?.message || 'Failed to remove item';
      throw new Error(message);
    }
  },

  /**
   * Clear cart (DELETE /api/v1/customer/cart)
   */
  async clearCart() {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.CART.CLEAR}`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      const message = error.response?.data?.message || 'Failed to clear cart';
      throw new Error(message);
    }
  },
};
