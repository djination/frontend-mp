import axios from "../config/axiosInstance";

export const getRoles = async (includeInactive = false) => {
  try {
    const response = await axios.get('/roles', { 
      params: { includeInactive } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const getRole = async (id) => {
  try {
    const response = await axios.get(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    throw error;
  }
};

export const createRole = async (data) => {
  try {
    const response = await axios.post('/roles', data);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

export const updateRole = async (id, data) => {
  try {
    const response = await axios.patch(`/roles/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await axios.delete(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};