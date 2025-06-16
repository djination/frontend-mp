import axiosInstance from "../config/axiosInstance";

export const getPositions = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/position', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching position:', error);
    throw error;
  }
};

export const getPositionById = async (id) => {
  try {
    const response = await axiosInstance.get(`/position/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching position with ID ${id}:`, error);
    throw error;
  }
};

export const createPosition = async (positionData) => {
  try {
    const response = await axiosInstance.post('/position', positionData);
    return response.data;
  } catch (error) {
    console.error('Error creating position:', error);
    throw error;
  }
};

export const updatePosition = async (id, positionData) => {
  try {
    const response = await axiosInstance.patch(`/position/${id}`, positionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating position with ID ${id}:`, error);
    throw error;
  }
};

export const deletePosition = async (id) => {
  try {
    await axiosInstance.delete(`/position/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting account category with ID ${id}:`, error);
    throw error;
  }
};