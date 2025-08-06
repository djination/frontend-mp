import axiosInstance from '../config/axiosInstance';

export const getCdmProviders = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/cdm-provider', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching CDM providers:', error);
    throw error;
  }
};

export const getCdmProviderById = async (id) => {
  try {
    const response = await axiosInstance.get(`/cdm-provider/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching CDM provider with ID ${id}:`, error);
    throw error;
  }
};

export const createCdmProvider = async (cdmProviderData) => {
  try {
    const response = await axiosInstance.post('/cdm-provider', cdmProviderData);
    return response.data;
  } catch (error) {
    console.error('Error creating CDM provider:', error);
    throw error;
  }
};

export const updateCdmProvider = async (id, cdmProviderData) => {
  try {
    const response = await axiosInstance.patch(`/cdm-provider/${id}`, cdmProviderData);
    return response.data;
  } catch (error) {
    console.error(`Error updating CDM provider with ID ${id}:`, error);
    throw error;
  }
};

export const deleteCdmProvider = async (id) => {
  try {
    const response = await axiosInstance.delete(`/cdm-provider/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting CDM provider with ID ${id}:`, error);
    throw error;
  }
};

export const getCdmProviderTree = async () => {
  try {
    const response = await axiosInstance.get('/cdm-provider/tree');
    return response.data;
  } catch (error) {
    console.error('Error fetching CDM provider tree:', error);
    throw error;
  }
};

export const moveCdmProvider = async (id, targetParentId) => {
  try {
    const response = await axiosInstance.patch(`/cdm-provider/${id}/move`, { parentId: targetParentId });
    return response.data;
  } catch (error) {
    console.error(`Error moving CDM provider with ID ${id}:`, error);
    throw error;
  }
};