import axiosInstance from '../config/axiosInstance';

// Get account documents by account ID
export const getAccountDocuments = async (accountId) => {
  if (!accountId) throw new Error("accountId is required");
  return axiosInstance.get(`/account-document/account/${accountId}`);
};

// Upload document
export const uploadAccountDocument = async (formData) => {
  try {    
    return await axiosInstance.post('/account-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    console.error('Upload error:', error.response?.data);
    throw error;
  }
};

// Delete document
export const deleteAccountDocument = async (id) => {
  return axiosInstance.delete(`/account-document/${id}`);
};