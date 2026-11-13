import api from './axios';

/**
 * Fetch All Support Topics / Videos / Articles from Database for Admin
 */
export const getAdminSupportTopics = async (params = {}) => {
  const response = await api.get('/admin/support-topics', { params });
  return response.data;
};

/**
 * Create New Support Video & Article in Database
 */
export const createSupportTopic = async (topicData) => {
  const response = await api.post('/admin/support-topics', topicData);
  return response.data;
};

/**
 * Update Existing Support Topic in Database
 */
export const updateSupportTopic = async (id, topicData) => {
  const response = await api.put(`/admin/support-topics/${id}`, topicData);
  return response.data;
};

/**
 * Toggle Status of Support Topic (published / draft)
 */
export const updateSupportTopicStatus = async (id, status) => {
  const response = await api.put(`/admin/support-topics/${id}/status`, { status });
  return response.data;
};

/**
 * Delete Support Topic from Database
 */
export const deleteSupportTopic = async (id) => {
  const response = await api.delete(`/admin/support-topics/${id}`);
  return response.data;
};
