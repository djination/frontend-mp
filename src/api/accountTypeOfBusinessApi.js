import axiosInstance from "../config/axiosInstance";

export const getTypeOfBusiness = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/type-of-business', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account categories:', error);
    throw error;
  }
};

export const getTypeOfBusinessById = async (id) => {
  try {
    const response = await axiosInstance.get(`/type-of-business/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account category with ID ${id}:`, error);
    throw error;
  }
};

export const createTypeOfBusiness = async (typeOfBusiness) => {
  try {
    const response = await axiosInstance.post('/type-of-business', typeOfBusiness);
    return response.data;
  } catch (error) {
    console.error('Error creating account category:', error);
    throw error;
  }
};

export const updateTypeOfBusiness = async (id, typeOfBusiness) => {
  try {
    const response = await axiosInstance.patch(`/type-of-business/${id}`, typeOfBusiness);
    return response.data;
  } catch (error) {
    console.error(`Error updating account category with ID ${id}:`, error);
    throw error;
  }
};

export const deleteTypeOfBusiness = async (id) => {
  try {
    await axiosInstance.delete(`/type-of-business/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting account category with ID ${id}:`, error);
    throw error;
  }
};