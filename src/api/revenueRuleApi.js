import axiosInstance from "../config/axiosInstance";

const REVENUE_RULES_API = '/revenue-rules';

const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error.response?.data || error;
};

export const revenueRuleApi = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(REVENUE_RULES_API);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`${REVENUE_RULES_API}/${id}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  create: async (data) => {
    try {
      // Remove undefined or null values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await axiosInstance.post(REVENUE_RULES_API, cleanData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  update: async (id, data) => {
    try {
      // Remove undefined or null values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await axiosInstance.patch(`${REVENUE_RULES_API}/${id}`, cleanData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  delete: async (id) => {
    try {
      await axiosInstance.delete(`${REVENUE_RULES_API}/${id}`);
    } catch (error) {
      handleError(error);
    }
  }
};
