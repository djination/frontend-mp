import axiosInstance from "../config/axiosInstance";

export const getAccountCategories = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account-category', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account categories:', error);
    throw error;
  }
};

export const getAccountCategoryById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account-category/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account category with ID ${id}:`, error);
    throw error;
  }
};

export const createAccountCategory = async (categoryData) => {
  try {
    const response = await axiosInstance.post('/account-category', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating account category:', error);
    throw error;
  }
};

export const updateAccountCategory = async (id, categoryData) => {
  try {
    const response = await axiosInstance.patch(`/account-category/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating account category with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccountCategory = async (id) => {
  try {
    await axiosInstance.delete(`/account-category/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting account category with ID ${id}:`, error);
    throw error;
  }
};