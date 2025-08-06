import axiosInstance from '../config/axiosInstance';

// Commission Rate API
export const createCommissionRate = async (accountId, commissionData) => {
  console.log('=== API createCommissionRate ===');
  console.log('AccountId:', accountId);
  console.log('Data being sent:', commissionData);
  console.log('URL:', `/account/${accountId}/commission-rates`);
  
  try {
    const response = await axiosInstance.post(`/account/${accountId}/commission-rates`, commissionData);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error in createCommissionRate:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    throw error;
  }
};

export const getCommissionRates = async (accountId) => {
  console.log('=== API getCommissionRates ===');
  console.log('AccountId:', accountId);
  console.log('URL:', `/account/${accountId}/commission-rates`);
  
  try {
    const response = await axiosInstance.get(`/account/${accountId}/commission-rates`);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error in getCommissionRates:', error);
    throw error;
  }
};

export const updateCommissionRate = async (commissionRateId, updateData) => {
  console.log('=== API updateCommissionRate ===');
  console.log('Commission ID:', commissionRateId);
  console.log('Data being sent:', updateData);
  console.log('URL:', `/account/commission-rates/${commissionRateId}`);
  
  try {
    const response = await axiosInstance.put(`/account/commission-rates/${commissionRateId}`, updateData);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error in updateCommissionRate:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    throw error;
  }
};

export const deleteCommissionRate = async (commissionRateId) => {
  const response = await axiosInstance.delete(`/account/commission-rates/${commissionRateId}`);
  return response.data;
};

// Vendor Details API
export const createOrUpdateVendorDetails = async (accountId, vendorData) => {
  const response = await axiosInstance.post(`/account/${accountId}/vendor-details`, vendorData);
  return response.data;
};

export const getVendorDetails = async (accountId) => {
  const response = await axiosInstance.get(`/account/${accountId}/vendor-details`);
  return response.data;
};

export const deleteVendorDetails = async (accountId) => {
  const response = await axiosInstance.delete(`/account/${accountId}/vendor-details`);
  return response.data;
};
