import api from './axios';

/**
 * Fetch Live Published Content Assets from MySQL Database
 */
export const getUserContentAssets = async (params = {}) => {
  const response = await api.get('/public/content-assets', { params });
  return response.data;
};

/**
 * Track Download count in MySQL database
 */
export const trackAssetDownload = async (id) => {
  const response = await api.post(`/content-assets/${id}/download`);
  return response.data;
};

/**
 * Track Share count in MySQL database
 */
export const trackAssetShare = async (id) => {
  const response = await api.post(`/content-assets/${id}/share`);
  return response.data;
};
