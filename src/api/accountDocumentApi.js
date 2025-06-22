import axiosInstance from '../config/axiosInstance';

// Get account documents by account ID
export const getAccountDocuments = async (accountId) => {
  if (!accountId) throw new Error("accountId is required");
  return axiosInstance.get(`/account-document/account/${accountId}`);
};

// Upload document
export const uploadAccountDocument = async (formData) => {
  try {
    // Debug formData
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    
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