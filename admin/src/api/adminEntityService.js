import api from './axios';

// ----------------------------------------------------
// 1. Entity Categories API
// ----------------------------------------------------
export const getEntityCategories = async () => {
  const response = await api.get('/admin/entity-categories');
  return response.data;
};

export const createEntityCategory = async (categoryData) => {
  const response = await api.post('/admin/entity-categories', categoryData);
  return response.data;
};

export const updateEntityCategory = async (id, categoryData) => {
  const response = await api.put(`/admin/entity-categories/${id}`, categoryData);
  return response.data;
};

export const deleteEntityCategory = async (id) => {
  const response = await api.delete(`/admin/entity-categories/${id}`);
  return response.data;
};

// ----------------------------------------------------
// 2. Business Entity Registration & Management API
// ----------------------------------------------------
export const getBusinessEntities = async (params = {}) => {
  const response = await api.get('/admin/business-entities', { params });
  return response.data;
};

export const registerBusinessEntity = async (businessData) => {
  const response = await api.post('/admin/business-entities', businessData);
  return response.data;
};

export const updateBusinessEntity = async (id, businessData) => {
  const response = await api.put(`/admin/business-entities/${id}`, businessData);
  return response.data;
};

export const updateBusinessStatus = async (id, statusData) => {
  const response = await api.put(`/admin/business-entities/${id}/status`, statusData);
  return response.data;
};

export const deleteBusinessEntity = async (id) => {
  const response = await api.delete(`/admin/business-entities/${id}`);
  return response.data;
};

// ----------------------------------------------------
// 3. Freelancer Entity Registration & Management API
// ----------------------------------------------------
export const getFreelancers = async (params = {}) => {
  const response = await api.get('/admin/freelancers', { params });
  return response.data;
};

export const registerFreelancer = async (freelancerData) => {
  const response = await api.post('/admin/freelancers', freelancerData);
  return response.data;
};

export const updateFreelancer = async (id, freelancerData) => {
  const response = await api.put(`/admin/freelancers/${id}`, freelancerData);
  return response.data;
};

export const updateFreelancerStatus = async (id, statusData) => {
  const response = await api.put(`/admin/freelancers/${id}/status`, statusData);
  return response.data;
};

export const deleteFreelancer = async (id) => {
  const response = await api.delete(`/admin/freelancers/${id}`);
  return response.data;
};
