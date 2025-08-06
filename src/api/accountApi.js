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

/**
 * Get accounts formatted for select options
 * @returns {Promise<Array>} Account options for select
 */
export const getAccountOptions = async () => {
  try {
    const response = await axiosInstance.get('/account/options');
    return response.data;
  } catch (error) {
    console.error('Error fetching account options:', error);
    throw error;
  }
};

/**
 * Get account referrals
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>} Account referrals
 */
export const getAccountReferrals = async (accountId) => {
  try {
    const response = await axiosInstance.get(`/account/${accountId}/referrals`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching referrals for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Create account referrals
 * @param {string} accountId - Account ID
 * @param {Array} referralAccountIds - Array of referral account IDs
 * @returns {Promise<Object>} Created referrals
 */
export const createAccountReferrals = async (accountId, referralAccountIds) => {
  try {
    const response = await axiosInstance.post(`/account/${accountId}/referrals`, {
      referral_account_ids: referralAccountIds
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating referrals for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Update account referral
 * @param {string} accountId - Account ID
 * @param {string} referralId - Referral ID
 * @param {string} referralAccountId - New referral account ID
 * @returns {Promise<Object>} Updated referral
 */
export const updateAccountReferral = async (accountId, referralId, referralAccountId) => {
  try {
    const response = await axiosInstance.put(`/account/${accountId}/referrals/${referralId}`, {
      referral_account_id: referralAccountId
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating referral ${referralId}:`, error);
    throw error;
  }
};

/**
 * Delete account referral
 * @param {string} accountId - Account ID
 * @param {string} referralId - Referral ID
 * @returns {Promise<Object>} Success response
 */
export const deleteAccountReferral = async (accountId, referralId) => {
  try {
    const response = await axiosInstance.delete(`/account/${accountId}/referrals/${referralId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting referral ${referralId}:`, error);
    throw error;
  }
};