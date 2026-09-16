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

export const productService = {
  /**
   * Fetch All Products (GET /api/v1/products)
   */
  async getProducts() {
    try {
      const response = await axios.get(`${BASE_API_URL}${API_ENDPOINTS.PRODUCTS_V1.LIST}`);
      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Create Product (POST /api/v1/products)
   * Supports FormData for image file upload
   */
  async createProduct(formDataPayload) {
    try {
      const isMultipart = formDataPayload instanceof FormData;
      const response = await axios.post(
        `${BASE_API_URL}${API_ENDPOINTS.PRODUCTS_V1.CREATE}`,
        formDataPayload,
        getAuthHeaders(isMultipart)
      );
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      const message = error.response?.data?.message || 'Failed to create product';
      throw new Error(message);
    }
  },

  /**
   * Update Product (PUT /api/v1/products/:id)
   * Supports FormData for image file upload
   */
  async updateProduct(id, formDataPayload) {
    try {
      const isMultipart = formDataPayload instanceof FormData;
      const response = await axios.put(
        `${BASE_API_URL}${API_ENDPOINTS.PRODUCTS_V1.UPDATE(id)}`,
        formDataPayload,
        getAuthHeaders(isMultipart)
      );
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      const message = error.response?.data?.message || 'Failed to update product';
      throw new Error(message);
    }
  },

  /**
   * Delete Product (DELETE /api/v1/products/:id)
   */
  async deleteProduct(id) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}${API_ENDPOINTS.PRODUCTS_V1.DELETE(id)}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      const message = error.response?.data?.message || 'Failed to delete product';
      throw new Error(message);
    }
  },
};
