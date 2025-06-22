import axiosInstance from '../config/axiosInstance';

// Get all document types with optional filtering
export const getDocumentTypes = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/document-type', { params });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get document type by ID
export const getDocumentTypeById = async (id) => {
  return axiosInstance.get(`/document-type/${id}`);
};

// Create new document type
export const createDocumentType = async (data) => {
  return axiosInstance.post('/document-type', data);
};

// Update document type
export const updateDocumentType = async (id, data) => {
  return axiosInstance.patch(`/document-type/${id}`, data);
};

// Delete document type
export const deleteDocumentType = async (id) => {
  return axiosInstance.delete(`/document-type/${id}`);
};