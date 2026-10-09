import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Fetch all sent notification logs and stats
 */
export const getAdminNotifications = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/notifications`, { params });
    if (res.data?.status === 'success') {
      return res.data;
    }
    return { notifications: [], stats: {} };
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    throw err;
  }
};

/**
 * Send notification to single user, active users, deactive users, or all
 */
export const sendAdminNotification = async (payload) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/notifications/send`, payload);
    return res.data;
  } catch (err) {
    console.error('Error sending notification:', err);
    throw err;
  }
};
