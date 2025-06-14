import axiosInstance from "../config/axiosInstance";


export const getServices = async () => {
  try {
    const response = await axiosInstance.get('/services');
    return response.data;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const getServiceById = async (id) => {
  try {
    const response = await axiosInstance.get(`/services/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching service with ID ${id}:`, error);
    throw error;
  }
};

export const createService = async (serviceData) => {
  try {
    const response = await axiosInstance.post('/services', serviceData);
    return response.data;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const updateService = async (id, serviceData) => {
  try {
    const response = await axiosInstance.patch(`/services/${id}`, serviceData);
    return response.data;
  } catch (error) {
    console.error(`Error updating service with ID ${id}:`, error);
    throw error;
  }
};

export const deleteService = async (id) => {
  try {
    await axiosInstance.delete(`/services/${id}`);
  } catch (error) {
    console.error(`Error deleting service with ID ${id}:`, error);
    throw error;
  }
}; 