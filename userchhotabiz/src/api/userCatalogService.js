import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Fetch all live products from MySQL Database
 */
export const getUserProducts = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/catalog/products`, { params });
    if (res.data?.status === 'success') {
      return res.data.products || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching user catalog products:', err);
    return [];
  }
};

/**
 * Fetch all live services from MySQL Database
 */
export const getUserServices = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/catalog/services`, { params });
    if (res.data?.status === 'success') {
      return res.data.services || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching user catalog services:', err);
    return [];
  }
};

/**
 * Fetch live categories
 */
export const getUserCategories = async () => {
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
