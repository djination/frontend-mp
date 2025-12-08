import axiosInstance from "../config/axiosInstance";

export const getMasterMachines = async (params = {}) => {
  try {
    const response = await axiosInstance.get('/master-machine', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching master machines:', error);
    throw error;
  }
};

export const getMasterMachineById = async (id) => {
  try {
    const response = await axiosInstance.get(`/master-machine/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Master Machine with ID ${id}:`, error);
    throw error;
  }
};

export const createMasterMachine = async (machineData) => {
  try {
    const response = await axiosInstance.post('/master-machine', machineData);
    return response.data;
  } catch (error) {
    console.error('Error creating Master Machine:', error);
    
    if (error.response) {
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          error.response.statusText || 
                          'Failed to create master machine';
      const detailedError = new Error(errorMessage);
      detailedError.response = error.response;
      throw detailedError;
    }
    
    throw error;
  }
};

export const updateMasterMachine = async (id, machineData) => {
  try {
    const response = await axiosInstance.patch(`/master-machine/${id}`, machineData);
    return response.data;
  } catch (error) {
    console.error(`Error updating Master Machine with ID ${id}:`, error);
    throw error;
  }
};

export const deleteMasterMachine = async (id) => {
  try {
    await axiosInstance.delete(`/master-machine/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting Master Machine with ID ${id}:`, error);
    throw error;
  }
};

