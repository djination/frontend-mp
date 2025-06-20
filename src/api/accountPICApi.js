import axiosInstance from "../config/axiosInstance";

export const getAccountPICs = async (accountId) => {
  try {
    const response = await axiosInstance.get(`/account/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account PICs:', error);
    throw error;
  }
};

export const getAccountPICById = async (accountId, picId) => {
  try {
    const response = await axiosInstance.get(`/account-pic/${picId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching PIC with ID ${picId}:`, error);
    throw error;
  }
};

export const createAccountPIC = async (picData) => {
  try {
    // Kirim data langsung tanpa modifikasi tambahan
    const response = await axiosInstance.post('/account-pic', picData);
    return response.data;
  } catch (error) {
    console.error('Error creating Account pic:', error);
    
    // Add detailed error logging
    if (error.response) {
      console.error('Error response from server:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

export const updateAccountPIC = async (picId, picData) => {
  try {
    const response = await axiosInstance.patch(`/account-pic/${picId}`, {
      ...picData,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating PIC with ID ${picId}:`, error);
    
    if (error.response) {
      console.error('Error response from server:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

export const deleteAccountPIC = async (accountId, picId) => {
  try {
    await axiosInstance.delete(`/account-pic/${picId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting PIC with ID ${picId}:`, error);
    throw error;
  }
};