import axiosInstance from "../config/axiosInstance";

export const getAccountAddresses = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account-address', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account address:', error);
    throw error;
  }
};

export const getAccountAddressById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account-address/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Account address with ID ${id}:`, error);
    throw error;
  }
};

export const createAccountAddress = async (accountAddressData) => {
  try {
    const response = await axiosInstance.post('/account-address', accountAddressData);
    return response.data;
  } catch (error) {
    console.error('Error creating Account address:', error);
    throw error;
  }
};

export const updateAccountAddress = async (id, accountAddressData) => {
  try {
    const response = await axiosInstance.patch(`/account-address/${id}`, accountAddressData);
    return response.data;
  } catch (error) {
    console.error(`Error updating Account address with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccountAddress = async (id) => {
  try {
    await axiosInstance.delete(`/account-address/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting Account address with ID ${id}:`, error);
    throw error;
  }
};