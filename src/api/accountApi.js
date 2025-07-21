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

// ======================= MASS UPLOAD FUNCTIONS =======================

/**
 * Mass upload accounts from CSV file
 * @param {FormData} formData - FormData containing the CSV file
 * @returns {Promise<Object>} Upload result with success/error counts
 */
export const massUploadAccounts = async (formData) => {
  try {
    const response = await axiosInstance.post('/account/mass-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    });
    return response.data;
  } catch (error) {
    console.error('Mass upload error:', error);
    throw error;
  }
};

/**
 * Download CSV template for account mass upload
 * @returns {Promise<Blob>} CSV template file
 */
export const downloadAccountTemplate = async () => {
  try {
    const response = await axiosInstance.get('/account/template/download', {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Template download error:', error);
    throw error;
  }
};

/**
 * Get lookup data for CSV reference
 * @returns {Promise<Object>} Available industries, types, categories, etc.
 */
export const getAccountLookupData = async () => {
  try {
    const response = await axiosInstance.get('/account/lookup-data');
    return response.data;
  } catch (error) {
    console.error('Lookup data error:', error);
    throw error;
  }
};