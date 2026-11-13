import api from './axios';

/**
 * Fetch the single active Global Commission Settings configuration
 * and dynamic level column metadata.
 */
export const getGlobalCommissionSettings = async () => {
  const response = await api.get('/admin/commission-settings');
  return response.data;
};

/**
 * Update the single Global Commission Settings record.
 * Requires Admin authentication and exact 100% total distribution.
 */
export const saveGlobalCommissionSettings = async (settingsData) => {
  const response = await api.post('/admin/commission-settings', settingsData);
  return response.data;
};
