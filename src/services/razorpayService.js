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

export const razorpayService = {
  /**
   * Create Razorpay order from backend (POST /api/v1/customer/payment/razorpay-order)
   */
  async createRazorpayOrder() {
    try {
      const response = await axios.post(
        `${BASE_API_URL}/v1/customer/payment/razorpay-order`,
        {},
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      const message = error.response?.data?.message || 'Failed to initialize online payment';
      throw new Error(message);
    }
  },

  /**
   * Verify Razorpay payment signature & create final order (POST /api/v1/customer/payment/verify-razorpay)
   */
  async verifyRazorpayPayment(payload) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}/v1/customer/payment/verify-razorpay`,
        payload,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying Razorpay payment signature:', error);
      const message = error.response?.data?.message || 'Payment verification failed';
      throw new Error(message);
    }
  },
};
