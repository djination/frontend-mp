import axiosInstance from "../config/axiosInstance";

export const loginService = async (data) => {
    try {
      const response = await axiosInstance.post('/auth/login/', data);
      return response.data;
    } catch (error) {
      throw error.response;
    }
  };

  export const registerService = async (data) => {
    try {
      const response = await axiosInstance.post('/auth/register/', data);
      return response.data;
    } catch (error) {
      throw error.response;
    }
  };