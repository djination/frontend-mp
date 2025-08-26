import axiosInstance from '../config/axiosInstance';

const BACKEND_EXT_BASE_URL = '/backend-ext';

export const backendExtApi = {
  // Configuration Management
  createConfig: async (configData) => {
    const response = await axiosInstance.post(BACKEND_EXT_BASE_URL, configData);
    return response.data;
  },

  getConfigs: async () => {
    const response = await axiosInstance.get(BACKEND_EXT_BASE_URL);
    return response.data;
  },

  getActiveConfigs: async () => {
    const response = await axiosInstance.get(`${BACKEND_EXT_BASE_URL}/active`);
    return response.data;
  },

  getConfigById: async (id) => {
    const response = await axiosInstance.get(`${BACKEND_EXT_BASE_URL}/${id}`);
    return response.data;
  },

  updateConfig: async (id, configData) => {
    const response = await axiosInstance.patch(`${BACKEND_EXT_BASE_URL}/${id}`, configData);
    return response.data;
  },

  deleteConfig: async (id) => {
    const response = await axiosInstance.delete(`${BACKEND_EXT_BASE_URL}/${id}`);
    return response.data;
  },

  // OAuth Token Management
  getOAuthToken: async (tokenRequest) => {
    const response = await axiosInstance.post(`${BACKEND_EXT_BASE_URL}/oauth/token`, tokenRequest);
    return response.data;
  },

  // API Request Methods
  makeSimplifiedApiRequest: async (requestData) => {
    const response = await axiosInstance.post(`${BACKEND_EXT_BASE_URL}/api/simple-request`, requestData);
    return response.data;
  },

  makeApiRequest: async (requestData) => {
    const response = await axiosInstance.post(`${BACKEND_EXT_BASE_URL}/api/request`, requestData);
    return response.data;
  },

  // Cache Management
  getCacheStatus: async () => {
    const response = await axiosInstance.get(`${BACKEND_EXT_BASE_URL}/cache/status`);
    return response.data;
  },

  clearCacheForConfig: async (configId) => {
    const response = await axiosInstance.delete(`${BACKEND_EXT_BASE_URL}/cache/clear/${configId}`);
    return response.data;
  },

  clearAllCache: async () => {
    const response = await axiosInstance.delete(`${BACKEND_EXT_BASE_URL}/cache/clear-all`);
    return response.data;
  },

  // Test Connection
  testConnection: async (configData) => {
    const response = await axiosInstance.post(`${BACKEND_EXT_BASE_URL}/test-connection`, configData);
    return response.data;
  },
};

export default backendExtApi;
