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

export const createAccountPIC = async (accountId, picData) => {
  try {
    // Log the exact data being sent
    console.log('Creating PIC with data:', JSON.stringify({ 
      ...picData, 
      account_id: accountId 
    }));
    
    const response = await axiosInstance.post('/account-pic', {
      ...picData,
      account_id: accountId
    });
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

export const updateAccountPIC = async (accountId, picId, picData) => {
  try {
    console.log('Updating PIC with data:', JSON.stringify({ 
      ...picData, 
      account_id: accountId 
    }));
    
    const response = await axiosInstance.patch(`/account-pic/${picId}`, {
      ...picData,
      account_id: accountId
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