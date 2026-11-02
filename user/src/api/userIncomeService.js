import api from './axios';

/**
 * Fetch authenticated user's Direct Income summary & record.
 * GET /api/user/income/direct
 */
export const getUserDirectIncome = async () => {
  try {
    const response = await api.get('/user/income/direct');
    return response.data;
  } catch (err) {
    console.error('Error fetching direct income summary:', err);
    throw (err.response?.data || err);
  }
};

/**
 * Fetch authenticated user's Level Income summary & Level 2–5 breakdown.
 * GET /api/user/income/levels
 */
export const getUserLevelIncome = async () => {
  try {
    const response = await api.get('/user/income/levels');
    return response.data;
  } catch (err) {
    console.error('Error fetching level income summary:', err);
    throw (err.response?.data || err);
  }
};
