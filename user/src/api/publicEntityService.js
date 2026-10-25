import axios from './axios';

export const getPublicCategories = async () => {
  try {
    const response = await axios.get('/public/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching public categories:', error);
    throw error;
  }
};

export const getPublicBusinesses = async () => {
  try {
    const response = await axios.get('/public/businesses');
    return response.data;
  } catch (error) {
    console.error('Error fetching public businesses:', error);
    throw error;
  }
};

export const getPublicFreelancers = async () => {
  try {
    const response = await axios.get('/public/freelancers');
    return response.data;
  } catch (error) {
    console.error('Error fetching public freelancers:', error);
    throw error;
  }
};
