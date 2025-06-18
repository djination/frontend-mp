import axiosInstance from '../config/axiosInstance';

export const getBusinessTypes = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/type-of-business', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching business types:', error);
    throw error;
  }
};

export const getBusinessTypeById = async (id) => {
  try {
    const response = await axiosInstance.get(`/type-of-business/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching business type with ID ${id}:`, error);
    throw error;
  }
};

export const createBusinessType = async (data) => {
  try {
    const response = await axiosInstance.post('/type-of-business', data);
    return response.data;
  } catch (error) {
    console.error('Error creating business type:', error);
    throw error;
  }
};

export const updateBusinessType = async (id, data) => {
  try {
    const response = await axiosInstance.patch(`/type-of-business/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating business type with ID ${id}:`, error);
    throw error;
  }
};

export const deleteBusinessType = async (id) => {
  try {
    await axiosInstance.delete(`/type-of-business/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting business type with ID ${id}:`, error);
    throw error;
  }
};