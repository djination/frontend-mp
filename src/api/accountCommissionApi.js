import axiosInstance from '../config/axiosInstance';

// Commission Rate API
export const createCommissionRate = async (accountId, commissionData) => {
  try {
    const response = await axiosInstance.post(`/account/${accountId}/commission-rates`, commissionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCommissionRates = async (accountId) => {
  try {
    const response = await axiosInstance.get(`/account/${accountId}/commission-rates`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCommissionRate = async (commissionRateId, updateData) => {
  try {
    const response = await axiosInstance.put(`/account/commission-rates/${commissionRateId}`, updateData);
    return response.data;
  } catch (error) {
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

export const syncVendorToExternalApi = async (accountId, configId = null) => {
  try {
    const params = configId ? { config_id: configId } : {};
    const response = await axiosInstance.post(
      `/account/${accountId}/vendor-details/sync`,
      null,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error syncing vendor to external API:', error);
    throw error;
  }
};