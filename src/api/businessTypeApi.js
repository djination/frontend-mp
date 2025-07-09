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

// Get parent types only (for dropdown)
export const getParentBusinessTypes = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/type-of-business/parents', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching parent business types:', error);
    throw error;
  }
};

// Get children of a specific parent
export const getChildBusinessTypes = async (parentId, params = {}) => {
  try {
    const response = await axiosInstance.get(`/type-of-business/${parentId}/children`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching child business types for parent ${parentId}:`, error);
    throw error;
  }
};

// Get tree structure
export const getBusinessTypeTree = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/type-of-business/tree', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching business type tree:', error);
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