import axios from 'axios';
import { API_ENDPOINTS, BASE_API_URL, STORAGE_KEYS } from '../config/apiConfig';

const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // NOTE: Do NOT set Content-Type for multipart/form-data.
  // Axios automatically sets it with the correct boundary when sending FormData.
  return { headers };
};

export const categoryService = {
  /**
   * Fetch All Categories (GET /api/v1/categories)
   */
  async getCategories() {
    try {
      const response = await axios.get(`${BASE_API_URL}${API_ENDPOINTS.CATEGORIES_V1.LIST}`);
      return response.data.categories || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  },

  /**
   * Fetch Category By ID (GET /api/v1/categories/:id)
   */
  async getCategoryById(id) {
    try {
      const response = await axios.get(`${BASE_API_URL}${API_ENDPOINTS.CATEGORIES_V1.BY_ID(id)}`);
      return response.data.category;
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      throw error;
    }
  },

  /**
   * Create Category (POST /api/v1/categories)
   * Supports FormData for image upload
   */
  async createCategory(formDataPayload) {
    try {
      const isMultipart = formDataPayload instanceof FormData;
      const response = await axios.post(
        `${BASE_API_URL}${API_ENDPOINTS.CATEGORIES_V1.CREATE}`,
        formDataPayload,
        getAuthHeaders(isMultipart)
      );
      return response.data;
    } catch (error) {
      console.error('Error in createCategory:', error);
      const message = error.response?.data?.message || 'Failed to create category';
      throw new Error(message);
    }
  },

  /**
   * Update Category (PUT /api/v1/categories/:id)
   * Supports FormData for image upload
   */
  async updateCategory(id, formDataPayload) {
    try {
      const isMultipart = formDataPayload instanceof FormData;
      const response = await axios.put(
        `${BASE_API_URL}${API_ENDPOINTS.CATEGORIES_V1.UPDATE(id)}`,
        formDataPayload,
        getAuthHeaders(isMultipart)
      );
      return response.data;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      const message = error.response?.data?.message || 'Failed to update category';
      throw new Error(message);
    }
  },

  /**
   * Delete Category (DELETE /api/v1/categories/:id)
   */
  async deleteCategory(id) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}${API_ENDPOINTS.CATEGORIES_V1.DELETE(id)}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      const message = error.response?.data?.message || 'Failed to delete category';
      throw new Error(message);
    }
  },
};
