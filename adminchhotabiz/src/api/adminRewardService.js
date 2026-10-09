import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Fetch all reward items from database
 */
export const getAdminRewards = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/rewards`, { params });
    if (res.data?.status === 'success') {
      return res.data.rewards || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin rewards:', err);
    throw err;
  }
};

/**
 * Create new reward item in database (supports FormData for file upload)
 */
export const createAdminReward = async (payload) => {
  try {
    const isFormData = payload instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await axios.post(`${API_BASE_URL}/admin/rewards`, payload, { headers });
    return res.data;
  } catch (err) {
    console.error('Error creating reward:', err);
    throw err;
  }
};

/**
 * Update existing reward item (supports FormData or JSON)
 */
export const updateAdminReward = async (id, payload) => {
  try {
    const isFormData = payload instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    // For PHP multipart with PUT, POST with _method=PUT or direct POST is safer
    if (isFormData) {
      payload.append('_method', 'PUT');
      const res = await axios.post(`${API_BASE_URL}/admin/rewards/${id}`, payload, { headers });
      return res.data;
    } else {
      const res = await axios.put(`${API_BASE_URL}/admin/rewards/${id}`, payload);
      return res.data;
    }
  } catch (err) {
    console.error('Error updating reward:', err);
    throw err;
  }
};

/**
 * Delete reward item
 */
export const deleteAdminReward = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/admin/rewards/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting reward:', err);
    throw err;
  }
};

/**
 * Fetch all reward claims submitted by users
 */
export const getAdminRewardClaims = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/reward-claims`, { params });
    if (res.data?.status === 'success') {
      return res.data.claims || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching reward claims:', err);
    throw err;
  }
};

/**
 * Update claim fulfillment status (Approve, Dispatch with tracking, Deliver, Reject)
 */
export const updateAdminClaimStatus = async (id, payload) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/reward-claims/${id}/status`, payload);
    return res.data;
  } catch (err) {
    console.error('Error updating claim status:', err);
    throw err;
  }
};
