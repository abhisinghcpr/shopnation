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

export const notificationService = {
  /**
   * Fetch notifications list for logged-in customer
   */
  async getNotifications() {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/v1/customer/notifications`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      const message = error.response?.data?.message || 'Failed to fetch notifications';
      throw new Error(message);
    }
  },

  /**
   * Fetch unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/v1/customer/notifications/unread-count`,
        getCustomerAuthHeaders()
      );
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id) {
    try {
      const response = await axios.patch(
        `${BASE_API_URL}/v1/customer/notifications/${id}/read`,
        {},
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification read:', error);
      const message = error.response?.data?.message || 'Failed to mark notification read';
      throw new Error(message);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.patch(
        `${BASE_API_URL}/v1/customer/notifications/read-all`,
        {},
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      const message = error.response?.data?.message || 'Failed to mark all notifications read';
      throw new Error(message);
    }
  },

  /**
   * Delete single notification
   */
  async deleteNotification(id) {
    try {
      const response = await axios.delete(
        `${BASE_API_URL}/v1/customer/notifications/${id}`,
        getCustomerAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      const message = error.response?.data?.message || 'Failed to delete notification';
      throw new Error(message);
    }
  },

  /**
   * Admin: Send custom notification regarding an order
   */
  async sendAdminNotification(payload) {
    try {
      const response = await axios.post(
        `${BASE_API_URL}/v1/admin/notifications/send`,
        payload,
        getAdminAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error sending admin notification:', error);
      const message = error.response?.data?.message || 'Failed to send notification';
      throw new Error(message);
    }
  },
};
