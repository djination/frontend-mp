import axiosInstance from "../config/axiosInstance";

export const getBankCategories = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/bank-category', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bank categories:', error);
    throw error;
  }
};

export const getBankCategoryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/bank-category/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching bank category with ID ${id}:`, error);
    throw error;
  }
};

export const createBankCategory = async (categoryData) => {
  try {
    const response = await axiosInstance.post('/bank-category', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating bank category:', error);
    throw error;
  }
};

export const updateBankCategory = async (id, categoryData) => {
  try {
    const response = await axiosInstance.patch(`/bank-category/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating bank category with ID ${id}:`, error);
    throw error;
  }
};

export const deleteBankCategory = async (id) => {
  try {
    await axiosInstance.delete(`/bank-category/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting bank category with ID ${id}:`, error);
    throw error;
  }
};