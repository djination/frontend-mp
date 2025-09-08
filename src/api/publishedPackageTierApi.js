import axiosInstance from '../config/axiosInstance';

// Published Package Tier API endpoints
export const createPublishedPackageTier = async (tierData) => {
  try {
    const response = await axiosInstance.post('/published-package-tiers', tierData);
    return response.data;
  } catch (error) {
    console.error('Error creating published package tier:', error);
    throw error;
  }
};

export const getPublishedPackageTiers = async () => {
  try {
    const response = await axiosInstance.get('/published-package-tiers');
    return response.data;
  } catch (error) {
    console.error('Error fetching published package tiers:', error);
    throw error;
  }
};

export const getPublishedPackageTier = async (tierId) => {
  try {
    const response = await axiosInstance.get(`/published-package-tiers/${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching published package tier:', error);
    throw error;
  }
};

export const updatePublishedPackageTier = async (tierId, updateData) => {
  try {
    const response = await axiosInstance.patch(`/published-package-tiers/${tierId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating published package tier:', error);
    throw error;
  }
};

export const deletePublishedPackageTier = async (tierId) => {
  try {
    const response = await axiosInstance.delete(`/published-package-tiers/${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting published package tier:', error);
    throw error;
  }
};

export const createBulkPublishedPackageTiers = async (tiers) => {
  try {
    const response = await axiosInstance.post('/published-package-tiers/bulk', tiers);
    return response.data;
  } catch (error) {
    console.error('Error creating bulk published package tiers:', error);
    throw error;
  }
};

export const uploadPublishedPackageTiers = async (formData) => {
  try {
    const response = await axiosInstance.post('/published-package-tiers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading published package tiers:', error);
    throw error;
  }
};
