// Add this method to your existing userApi.js
import axios from '../config/axiosInstance';

export const getUserMenusAndPermissions = async () => {
  try {
    const response = await axios.get('/users/me/menus-permissions');
    return response.data;
  } catch (error) {
    console.error('Error fetching user menus and permissions:', error);
    throw error;
  }
};