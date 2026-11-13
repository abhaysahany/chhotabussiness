import api from './axios';

/**
 * Fetch all sent notification logs and stats
 */
export const getAdminNotifications = async (params = {}) => {
  try {
    const res = await api.get('/admin/notifications', { params });
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
    const res = await api.post('/admin/notifications/send', payload);
    return res.data;
  } catch (err) {
    console.error('Error sending notification:', err);
    throw err;
  }
};
