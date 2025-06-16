import axiosInstance from "../config/axiosInstance";

export const getIndustry = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/industry', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account categories:', error);
    throw error;
  }
};

export const getIndustryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/industry/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account category with ID ${id}:`, error);
    throw error;
  }
};

export const createIndustry = async (industry) => {
  try {
    const response = await axiosInstance.post('/industry', industry);
    return response.data;
  } catch (error) {
    console.error('Error creating account category:', error);
    throw error;
  }
};

export const updateIndustry = async (id, industry) => {
  try {
    const response = await axiosInstance.patch(`/industry/${id}`, industry);
    return response.data;
  } catch (error) {
    console.error(`Error updating account category with ID ${id}:`, error);
    throw error;
  }
};

export const deleteIndustry = async (id) => {
  try {
    await axiosInstance.delete(`/industry/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting account category with ID ${id}:`, error);
    throw error;
  }
};