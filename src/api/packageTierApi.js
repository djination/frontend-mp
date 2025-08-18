import axiosInstance from '../config/axiosInstance';

// Package Tier API endpoints
export const createPackageTier = async (tierData) => {
  try {
    const response = await axiosInstance.post('/account-revenue-rules/package-tiers', tierData);
    return response.data;
  } catch (error) {
    console.error('Error creating package tier:', error);
    throw error;
  }
};

export const getPackageTiersByAccount = async (accountId) => {
  try {
    const response = await axiosInstance.get(`/account-revenue-rules/package-tiers/account/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching package tiers:', error);
    throw error;
  }
};

export const getPackageTier = async (tierId) => {
  try {
    const response = await axiosInstance.get(`/account-revenue-rules/package-tiers/${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching package tier:', error);
    throw error;
  }
};

export const updatePackageTier = async (tierId, updateData) => {
  try {
    const response = await axiosInstance.patch(`/account-revenue-rules/package-tiers/${tierId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating package tier:', error);
    throw error;
  }
};

export const deletePackageTier = async (tierId) => {
  try {
    const response = await axiosInstance.delete(`/account-revenue-rules/package-tiers/${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting package tier:', error);
    throw error;
  }
};

export const createBulkPackageTiers = async (accountId, tiers) => {
  try {
    const response = await axiosInstance.post(`/account-revenue-rules/package-tiers/bulk/${accountId}`, tiers);
    return response.data;
  } catch (error) {
    console.error('Error creating bulk package tiers:', error);
    throw error;
  }
};
