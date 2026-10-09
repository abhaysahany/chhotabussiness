import api from './axios';

/**
 * Fetch Live Published Support Videos & Articles from Database for User Panel
 */
export const getUserSupportTopics = async (params = {}) => {
  const response = await api.get('/public/support-topics', { params });
  return response.data;
};

/**
 * Track/Increment View Count on Support Topic in Database
 */
export const trackSupportTopicView = async (id) => {
  const response = await api.post(`/public/support-topics/${id}/view`);
  return response.data;
};

/**
 * Vote Helpful on Support Topic in Database
 */
export const voteSupportTopicHelpful = async (id) => {
  const response = await api.post(`/public/support-topics/${id}/helpful`);
  return response.data;
};
