import axios from "../config/axiosInstance";

// Variable untuk menyimpan cache permissions
let permissionsCache = null;

/**
 * Get all permissions
 * @param {boolean} includeInactive - Whether to include inactive permissions
 * @returns {Promise} - Promise with permission data
 */
export const getPermissions = async (includeInactive = false) => {
  try {
    const response = await axios.get('/permissions', { 
      params: { includeInactive } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};


/**
 * Get all permissions with caching
 * @param {boolean} includeInactive - Whether to include inactive permissions
 * @param {boolean} forceRefresh - Force refresh from backend
 * @returns {Promise} - Promise with permission data
 */
export const getPermissionsWithCache = async (includeInactive = false, forceRefresh = false) => {
  if (!permissionsCache || forceRefresh) {
    try {
      const response = await getPermissions(includeInactive);
      permissionsCache = response;
      return response;
    } catch (error) {
      console.error('Error refreshing permissions cache:', error);
      throw error;
    }
  }
  
  return permissionsCache;
};

/**
 * Force refresh the permissions cache
 * @returns {Promise} - Promise with refreshed permission data
 */
export const refreshPermissionsCache = async () => {
  return await getPermissionsWithCache(false, true);
};

/**
 * Get a specific permission by ID
 * @param {string} id - Permission ID
 * @returns {Promise} - Promise with permission data
 */
export const getPermission = async (id) => {
  try {
    const response = await axios.get(`/permissions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permission ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new permission
 * @param {Object} data - Permission data
 * @returns {Promise} - Promise with created permission
 */
export const createPermission = async (data) => {
  try {
    const response = await axios.post('/permissions', data);
    return response.data;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

/**
 * Update an existing permission
 * @param {string} id - Permission ID
 * @param {Object} data - Updated permission data
 * @returns {Promise} - Promise with updated permission
 */
export const updatePermission = async (id, data) => {
  try {
    const response = await axios.patch(`/permissions/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating permission ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a permission (soft delete)
 * @param {string} id - Permission ID
 * @returns {Promise} - Promise with deletion result
 */
export const deletePermission = async (id) => {
  try {
    const response = await axios.delete(`/permissions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting permission ${id}:`, error);
    throw error;
  }
};