import axios from "../config/axiosInstance";
import { refreshPermissionsCache } from "./permissionApi";

export const getMenus = async (includeInactive = false) => {
  try {
    const response = await axios.get('/menus', { 
      params: { includeInactive } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching menus:', error);
    throw error;
  }
};

export const getMenuTree = async () => {
  try {
    const response = await axios.get('/menus/tree');
    return response.data;
  } catch (error) {
    console.error('Error fetching menu tree:', error);
    throw error;
  }
};

export const getMenu = async (id) => {
  try {
    const response = await axios.get(`/menus/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu ${id}:`, error);
    throw error;
  }
};

export const createMenu = async (menuData) => {
  console.log('Sending menu data:', menuData); // Add this for debugging
  try {
    const response = await axios.post('/menus', menuData);
    return response.data;
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
  }
};

export const updateMenu = async (id, data) => {
  try {
    const response = await axios.patch(`/menus/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating menu ${id}:`, error);
    throw error;
  }
};

export const deleteMenu = async (id) => {
  try {
    const response = await axios.delete(`/menus/${id}`);
    
    // Refresh permissions cache after menu deletion
    try {
      await refreshPermissionsCache();
    } catch (refreshError) {
      console.warn('Failed to refresh permissions cache after menu deletion:', refreshError);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error deleting menu ${id}:`, error);
    throw error;
  }
};