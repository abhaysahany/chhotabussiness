import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// ==========================================
// PRODUCTS API
// ==========================================

export const getAdminProducts = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/catalog/products`, { params });
    if (res.data?.status === 'success') {
      return res.data.products || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin products:', err);
    throw err;
  }
};

export const createAdminProduct = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await axios.post(`${API_BASE_URL}/catalog/products`, data, config);
    return res.data;
  } catch (err) {
    console.error('Error creating product:', err);
    throw err;
  }
};

export const updateAdminProduct = async (id, data) => {
  try {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      data.append('_method', 'PUT');
      const res = await axios.post(`${API_BASE_URL}/catalog/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await axios.put(`${API_BASE_URL}/catalog/products/${id}`, data);
      return res.data;
    }
  } catch (err) {
    console.error('Error updating product:', err);
    throw err;
  }
};

export const deleteAdminProduct = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/catalog/products/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting product:', err);
    throw err;
  }
};

// ==========================================
// SERVICES API
// ==========================================

export const getAdminServices = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/catalog/services`, { params });
    if (res.data?.status === 'success') {
      return res.data.services || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching admin services:', err);
    throw err;
  }
};

export const createAdminService = async (data) => {
  try {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await axios.post(`${API_BASE_URL}/catalog/services`, data, config);
    return res.data;
  } catch (err) {
    console.error('Error creating service:', err);
    throw err;
  }
};

export const updateAdminService = async (id, data) => {
  try {
    const isFormData = data instanceof FormData;
    if (isFormData) {
      data.append('_method', 'PUT');
      const res = await axios.post(`${API_BASE_URL}/catalog/services/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await axios.put(`${API_BASE_URL}/catalog/services/${id}`, data);
      return res.data;
    }
  } catch (err) {
    console.error('Error updating service:', err);
    throw err;
  }
};

export const deleteAdminService = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/catalog/services/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting service:', err);
    throw err;
  }
};

// ==========================================
// CATEGORIES API
// ==========================================

export const getAdminCategories = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/catalog/categories`);
    if (res.data?.status === 'success') {
      return res.data.categories || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
};
