// Frontend API service
import axiosInstance from "../config/axiosInstance";

export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/users/me/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await axiosInstance.patch('/users/me/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.post('/users/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};