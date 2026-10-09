import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Fetch live notifications for current user (targeted + broadcast)
 */
export const getUserNotifications = async (userCode) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/user/notifications`, {
      params: { user_code: userCode },
    });
    if (res.data?.status === 'success') {
      return res.data;
    }
    return { notifications: [], unread_count: 0 };
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    throw err;
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (id, userCode) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/user/notifications/${id}/read`, {
      user_code: userCode,
    });
    return res.data;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsRead = async (userCode) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/user/notifications/read-all`, {
      user_code: userCode,
    });
    return res.data;
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    throw err;
  }
};
