import axiosInstance from "../config/axiosInstance";

export const getAccounts = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

export const getAccountById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account with ID ${id}:`, error);
    throw error;
  }
};

export const getAccountDescendants = async (id) => {
  try {
    const response = await axiosInstance.get(`/account/${id}/tree`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching descendants for account ${id}:`, error);
    throw error;
  }
};

export const getAccountAncestors = async (id) => {
  try {
    const response = await axiosInstance.get(`/account/${id}/ancestors`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ancestors for account ${id}:`, error);
    throw error;
  }
};

export const createAccount = async (accountData) => {
  try {
    const response = await axiosInstance.post('/account', accountData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

export const updateAccount = async (id, accountData) => {
  try {
    const response = await axiosInstance.patch(`/account/${id}`, accountData);
    return response.data;
  } catch (error) {
    console.error(`Error updating account with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccount = async (id) => {
  try {
    await axiosInstance.delete(`/account/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting account with ID ${id}:`, error);
    throw error;
  }
};

export const getParentAccounts = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account/parent-tree', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching parent accounts:', error);
    throw error;
  }
};

/**
 * Generate account_no dari backend.
 * @param {Object} params - { account_type_name: string, parent_id?: string }
 * @returns {Promise<{ account_no: string }>}
 */
export const generateAccountNo = async (params) => {
  try {
    const response = await axiosInstance.get('/account/generate-account-no', { params });
    return response.data;
  } catch (error) {
    console.error('Error generating account_no:', error);
    throw error;
  }
};