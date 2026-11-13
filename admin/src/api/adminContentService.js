import api from './axios';

/**
 * Fetch All Content Assets from Database for Admin
 */
export const getAdminContentAssets = async (params = {}) => {
  const response = await api.get('/admin/content-assets', { params });
  return response.data;
};

/**
 * Upload & Save New Content Asset to Database
 * Supports FormData (with file) or JSON (with external file_url)
 */
export const createContentAsset = async (assetData) => {
  let response;
  if (assetData instanceof FormData) {
    response = await api.post('/admin/content-assets', assetData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } else {
    response = await api.post('/admin/content-assets', assetData);
  }
  return response.data;
};

/**
 * Update Existing Content Asset
 */
export const updateContentAsset = async (id, assetData) => {
  let response;
  if (assetData instanceof FormData) {
    response = await api.post(`/admin/content-assets/${id}`, assetData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } else {
    response = await api.put(`/admin/content-assets/${id}`, assetData);
  }
  return response.data;
};

/**
 * Delete Content Asset from Database
 */
export const deleteContentAsset = async (id) => {
  const response = await api.delete(`/admin/content-assets/${id}`);
  return response.data;
};
