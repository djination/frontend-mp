import axiosInstance from "../config/axiosInstance";


export const getAccountType = async () => {
  try {
    const response = await axiosInstance.get('/account-type');
    return response.data;
  } catch (error) {
    console.error('Error fetching account-type:', error);
    throw error;
  }
};

export const getAccountTypeById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account-type/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Account Type with ID ${id}:`, error);
    throw error;
  }
};

export const createAccountType = async (accountType) => {
  try {
    const response = await axiosInstance.post('/account-type', accountType);
    return response.data;
  } catch (error) {
    console.error('Error creating Account Type:', error);
    throw error;
  }
};

export const updateAccountType = async (id, accountType) => {
  try {
    const response = await axiosInstance.patch(`/account-type/${id}`, accountType);
    return response.data;
  } catch (error) {
    console.error(`Error updating Account Type with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccountType = async (id) => {
  try {
    await axiosInstance.delete(`/account-type/${id}`);
  } catch (error) {
    console.error(`Error deleting Account Type with ID ${id}:`, error);
    throw error;
  }
}; 