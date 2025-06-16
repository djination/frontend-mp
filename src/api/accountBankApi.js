import axiosInstance from "../config/axiosInstance";

export const getAccountBanks = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account-bank', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account banks:', error);
    throw error;
  }
};

export const getAccountBankById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account-bank/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Account bank with ID ${id}:`, error);
    throw error;
  }
};

export const createAccountBank = async (accountBankData) => {
  try {
    const response = await axiosInstance.post('/account-bank', accountBankData);
    return response.data;
  } catch (error) {
    console.error('Error creating Account bank:', error);
    throw error;
  }
};

export const updateAccountBank = async (id, accountBankData) => {
  try {
    const response = await axiosInstance.patch(`/account-bank/${id}`, accountBankData);
    return response.data;
  } catch (error) {
    console.error(`Error updating Account bank with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccountBank = async (id) => {
  try {
    await axiosInstance.delete(`/account-bank/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting Account bank with ID ${id}:`, error);
    throw error;
  }
};