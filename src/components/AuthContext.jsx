import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getUserMenusAndPermissions, getCurrentUser } from "../api/userApi";
// import axios from "../config/axiosInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [userMenus, setUserMenus] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const login = (access, refresh) => {
    localStorage.setItem("token", access);
    localStorage.setItem("refresh", refresh);
    setToken(access);
  };
  
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    setToken(null);
    setUser(null);
    setUserMenus([]);
    setUserPermissions([]);
  };
  
  const hasPermission = (permissionCode) => {
    return userPermissions.some(p => p.code === permissionCode);
  };
  
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
    
    if (storedToken) {
      const fetchUserData = async () => {
        try {
          // Fetch both user profile and menus/permissions
          const [userResponse, menusPermissionsResponse] = await Promise.all([
            getCurrentUser(),
            getUserMenusAndPermissions()
          ]);
          
          setUser(userResponse.data);
          setUserMenus(menusPermissionsResponse.data.menus || []);
          setUserPermissions(menusPermissionsResponse.data.permissions || []);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // If unauthorized, log out
          if (error.response?.status === 401) {
            logout();
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);
  
  return (
    <AuthContext.Provider value={{ 
      token, 
      user,
      login, 
      logout, 
      isAuthenticated: !!token,
      userMenus,
      userPermissions,
      hasPermission,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}