import axiosInstance from "../config/axiosInstance";

export const getAccountServices = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account-service', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account services:', error);
    throw error;
  }
};

export const getAccountServiceById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account-service/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Account service with ID ${id}:`, error);
    throw error;
  }
};

export const getAccountServicesByAccount = (accountId) => {
  return axiosInstance.get(`/account-service/account/${accountId}`);
};

export const createAccountService = async (accountServiceData) => {
  try {
    const response = await axiosInstance.post('/account-service', accountServiceData);
    return response.data;
  } catch (error) {
    console.error('Error creating Account service:', error);
    throw error;
  }
};

export const updateAccountService = async (id, accountServiceData) => {
  try {
    const response = await axiosInstance.patch(`/account-service/${id}`, accountServiceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating Account service with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccountService = async (id) => {
  try {
    await axiosInstance.delete(`/account-service/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting Account service with ID ${id}:`, error);
    throw error;
  }
};