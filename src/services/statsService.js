import axios from 'axios';
import { API_ENDPOINTS, BASE_API_URL, STORAGE_KEYS } from '../config/apiConfig';

export const statsService = {
  /**
   * Fetch Dashboard Overview Metrics from MongoDB
   */
  async getDashboardStats() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const response = await axios.get(
        `${BASE_API_URL}${API_ENDPOINTS.ADMIN.DASHBOARD_STATS}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
};
