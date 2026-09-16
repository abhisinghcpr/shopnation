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

export const addressService = {
  /**
   * Fetch customer addresses (GET /api/v1/customer/addresses)
   */
  async getAddresses() {
    try {
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ADDRESSES.GET}`,
        getCustomerAuthHeaders()
      );
      return response.data.addresses || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      const message = error.response?.data?.message || 'Failed to fetch addresses';
      throw new Error(message);
    }
  },

  /**
   * Add new address (POST /api/v1/customer/addresses)
   */
  async addAddress(addressData) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ADDRESSES.ADD}`,
        addressData,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error adding address:', error);
      const message = error.response?.data?.message || 'Failed to add address';
      throw new Error(message);
    }
  },

  /**
   * Update address (PUT /api/v1/customer/addresses/:id)
   */
  async updateAddress(addressId, addressData) {
    try {
      const response = await axios.put(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ADDRESSES.UPDATE(addressId)}`,
        addressData,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      const message = error.response?.data?.message || 'Failed to update address';
      throw new Error(message);
    }
  },

  /**
   * Delete address (DELETE /api/v1/customer/addresses/:id)
   */
  async deleteAddress(addressId) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ADDRESSES.DELETE(addressId)}`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting address:', error);
      const message = error.response?.data?.message || 'Failed to delete address';
      throw new Error(message);
    }
  },

  /**
   * Set default address (PATCH /api/v1/customer/addresses/:id/default)
   */
  async setDefaultAddress(addressId) {
    try {
      const response = await axios.patch(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ADDRESSES.SET_DEFAULT(addressId)}`,
        {},
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error setting default address:', error);
      const message = error.response?.data?.message || 'Failed to set default address';
      throw new Error(message);
    }
  },
};
