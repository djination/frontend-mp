import axiosInstance from "../config/axiosInstance";

export const getIndustries = async (params = {}) => {
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

export const bulkCreateIndustries = async (data) => {
  try {
    const response = await axiosInstance.post('/industry/bulk', data, {
      timeout: 120000, // 2 minutes for bulk operations
    });
    return response.data;
  } catch (error) {
    console.error('Error bulk creating industries:', error);
    
    // Return a structured error response instead of throwing
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout - server took too long to respond',
        results: data.map(item => ({
          success: false,
          item: item,
          error: 'Request timeout'
        }))
      };
    }
    
    if (error.response?.data) {
      return {
        success: false,
        error: error.response.data.message || 'Server error',
        results: data.map(item => ({
          success: false,
          item: item,
          error: error.response.data.message || 'Server error'
        }))
      };
    }
    
    // For other errors, still return structured response
    return {
      success: false,
      error: error.message || 'Unknown error',
      results: data.map(item => ({
        success: false,
        item: item,
        error: error.message || 'Unknown error'
      }))
    };
  }
};