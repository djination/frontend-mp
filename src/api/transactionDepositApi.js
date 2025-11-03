import axiosInstance from '../config/axiosInstance';

/**
 * Get transaction deposits with filters and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.machine_name - Filter by machine name
 * @param {string} params.machine_id - Filter by machine ID
 * @param {string} params.start_date - Start date (YYYY-MM-DD)
 * @param {string} params.end_date - End date (YYYY-MM-DD)
 * @param {string} params.transaction_status - Filter by status (SUCCESS, FAILED, PENDING)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Response with data and meta
 */
export const getTransactionDeposits = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/transaction-deposit', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction deposits:', error);
    throw error;
  }
};

/**
 * Sync transaction deposits from external API
 * @param {string} configId - Optional backend-ext config ID
 * @returns {Promise<Object>} Sync result with summary
 */
export const syncFromExternalApi = async (configId = null) => {
  try {
    const params = configId ? { config_id: configId } : {};
    const response = await axiosInstance.post('/transaction-deposit/sync', null, { params });
    return response.data;
  } catch (error) {
    console.error('Error syncing transaction deposits:', error);
    throw error;
  }
};

export default {
  getTransactionDeposits,
  syncFromExternalApi,
};

