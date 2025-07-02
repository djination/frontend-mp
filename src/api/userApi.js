import axios from '../config/axiosInstance';

export const getUsers = async (filters = {}) => {
  try {
    const response = await axios.get('/users', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUser = async (id) => {
  try {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    // Log the response error details
    if (error.response && error.response.data) {
      console.error('Server error details:', error.response.data);
    }
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.patch(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    // Using PATCH for soft delete instead of DELETE
    const response = await axios.patch(`/users/${id}`, {
      isActive: false
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    throw error;
  }
};

export const getUserMenusAndPermissions = async () => {
  try {
    const response = await axios.get('/users/me/menus-permissions');
    return response.data;
  } catch (error) {
    console.error('Error fetching user menus and permissions:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get('/users/me/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }
};

export const updateCurrentUserProfile = async (profileData) => {
  try {
    const response = await axios.patch('/users/me/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await axiosInstance.post('/user/change-password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};