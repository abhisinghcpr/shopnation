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

const getAdminAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { headers };
};

export const orderService = {
  /**
   * Place Order (POST /api/v1/customer/orders)
   */
  async placeOrder(payload) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ORDERS.CREATE}`,
        payload,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      const message = error.response?.data?.message || 'Failed to place order';
      throw new Error(message);
    }
  },

  /**
   * Fetch customer orders (GET /api/v1/customer/orders)
   */
  async getCustomerOrders() {
    try {
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ORDERS.LIST}`,
        getCustomerAuthHeaders()
      );
      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      const message = error.response?.data?.message || 'Failed to fetch order history';
      throw new Error(message);
    }
  },

  /**
   * Fetch customer order detail (GET /api/v1/customer/orders/:id)
   */
  async getCustomerOrderById(orderId) {
    try {
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.CUSTOMER.ORDERS.BY_ID(orderId)}`,
        getCustomerAuthHeaders()
      );
      return response.data.order;
    } catch (error) {
      console.error('Error fetching order detail:', error);
      const message = error.response?.data?.message || 'Failed to fetch order details';
      throw new Error(message);
    }
  },

  /**
   * Cancel customer order (POST /api/v1/customer/orders/:id/cancel)
   */
  async cancelCustomerOrder(orderId, reason = '') {
    try {
      const response = await axios.post(
        `${BASE_API_URL}/v1/customer/orders/${orderId}/cancel`,
        { reason },
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      const message = error.response?.data?.message || 'Failed to cancel order';
      throw new Error(message);
    }
  },

  /**
   * Reorder customer items into live cart (POST /api/v1/customer/orders/:id/reorder)
   */
  async reorderCustomerItems(orderId) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}/v1/customer/orders/${orderId}/reorder`,
        {},
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error reordering items:', error);
      const message = error.response?.data?.message || 'Failed to reorder items';
      throw new Error(message);
    }
  },

  /**
   * Admin: Get all orders with search & status filters (GET /api/v1/admin/orders)
   */
  async getAllOrdersAdmin(params = {}) {
    try {
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.ADMIN.ORDERS.LIST}`,
        {
          ...getAdminAuthHeaders(),
          params,
        }
      );
      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      const message = error.response?.data?.message || 'Failed to fetch admin orders';
      throw new Error(message);
    }
  },

  /**
   * Admin: Get single order by ID (GET /api/v1/admin/orders/:id)
   */
  async getAdminOrderById(orderId) {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/v1/admin/orders/${orderId}`,
        getAdminAuthHeaders()
      );
      return response.data.order;
    } catch (error) {
      console.error('Error fetching admin order details:', error);
      const message = error.response?.data?.message || 'Failed to fetch admin order details';
      throw new Error(message);
    }
  },

  /**
   * Admin: Update order status (PUT /api/v1/admin/orders/:id/status)
   */
  async updateOrderStatusAdmin(orderId, statusPayload) {
    try {
      const response = await axios.put(
        `${BASE_API_URL}${API_ENDPOINTS.ADMIN.ORDERS.UPDATE_STATUS(orderId)}`,
        statusPayload,
        getAdminAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      const message = error.response?.data?.message || 'Failed to update order status';
      throw new Error(message);
    }
  },
};
