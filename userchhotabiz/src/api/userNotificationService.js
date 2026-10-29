import api from './axios';

/**
 * Fetch live notifications for current user (targeted + broadcast)
 */
export const getUserNotifications = async (userCode) => {
  try {
    const res = await api.get('/user/notifications', {
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
    const res = await api.post(`/user/notifications/${id}/read`, {
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
    const res = await api.post('/user/notifications/read-all', {
      user_code: userCode,
    });
    return res.data;
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    throw err;
  }
};
