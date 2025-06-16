import axiosInstance from "../config/axiosInstance";

export const getBanks = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/bank', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
};

export const getBankById = async (id) => {
  try {
    const response = await axiosInstance.get(`/bank/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching bank with ID ${id}:`, error);
    throw error;
  }
};

export const createBank = async (bankData) => {
  try {
    const response = await axiosInstance.post('/bank', bankData);
    return response.data;
  } catch (error) {
    console.error('Error creating bank:', error);
    throw error;
  }
};

export const updateBank = async (id, bankData) => {
  try {
    const response = await axiosInstance.patch(`/bank/${id}`, bankData);
    return response.data;
  } catch (error) {
    console.error(`Error updating bank with ID ${id}:`, error);
    throw error;
  }
};

export const deleteBank = async (id) => {
  try {
    await axiosInstance.delete(`/bank/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting bank with ID ${id}:`, error);
    throw error;
  }
};