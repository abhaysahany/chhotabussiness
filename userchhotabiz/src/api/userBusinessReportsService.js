import api from './axios';

/**
 * Fetch database-driven Business Reports
 * Returns real MySQL data: sales performance, category revenue breakdown,
 * received payment, balance payment, and dump payment.
 */
export const getUserBusinessReports = async (params = {}) => {
  try {
    const res = await api.get('/user/business-reports', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching user business reports from database:', error);
    throw error;
  }
};
