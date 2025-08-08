import axiosInstance from "../config/axiosInstance";

export const getAccountAddresses = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/account-address', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching account address:', error);
    throw error;
  }
};

export const getAccountAddressById = async (id) => {
  try {
    const response = await axiosInstance.get(`/account-address/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Account address with ID ${id}:`, error);
    throw error;
  }
};

export const createAccountAddress = async (accountAddressData) => {
  try {
    const response = await axiosInstance.post('/account-address', accountAddressData);
    return response.data;
  } catch (error) {
    console.error('Error creating Account address:', error);
    throw error;
  }
};

export const updateAccountAddress = async (id, accountAddressData) => {
  try {
    const response = await axiosInstance.patch(`/account-address/${id}`, accountAddressData);
    return response.data;
  } catch (error) {
    console.error(`Error updating Account address with ID ${id}:`, error);
    throw error;
  }
};

export const deleteAccountAddress = async (id) => {
  try {
    await axiosInstance.delete(`/account-address/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting Account address with ID ${id}:`, error);
    throw error;
  }
};

// === POSTAL CODE HIERARCHY API FUNCTIONS ===

/**
 * Get all countries
 */
export const getCountries = async () => {
  try {
    const response = await axiosInstance.get('/postalcode/hierarchy/countries');
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

/**
 * Get provinces by country
 */
export const getProvincesByCountry = async (country) => {
  try {
    const response = await axiosInstance.get('/postalcode/hierarchy/provinces', {
      params: { country }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

/**
 * Get cities by province and country
 */
export const getCitiesByProvince = async (province, country) => {
  try {
    const response = await axiosInstance.get('/postalcode/hierarchy/cities', {
      params: { province, country }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * Get districts by city, province and country
 */
export const getDistrictsByCity = async (city, province, country) => {
  try {
    const response = await axiosInstance.get('/postalcode/hierarchy/districts', {
      params: { city, province, country }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

/**
 * Get sub districts by district, city, province and country
 */
export const getSubDistrictsByDistrict = async (district, city, province, country) => {
  try {
    const response = await axiosInstance.get('/postalcode/hierarchy/sub-districts', {
      params: { district, city, province, country }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sub districts:', error);
    throw error;
  }
};

/**
 * Get postal codes by location hierarchy
 */
export const getPostalCodes = async (subDistrict, district, city, province, country) => {
  try {
    const response = await axiosInstance.get('/postalcode/hierarchy/postal-codes', {
      params: { 
        subDistrict: subDistrict, 
        district, 
        city, 
        province, 
        country 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching postal codes:', error);
    throw error;
  }
};