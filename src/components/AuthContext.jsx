import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { getUserMenusAndPermissions } from "../api/userApi";
// import axios from "../config/axiosInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
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
      const fetchUserMenusAndPermissions = async () => {
        try {
          const response = await getUserMenusAndPermissions();
          // const response = await axios.get('/users/me/menus-permissions');
          setUserMenus(response.data.menus || []);
          setUserPermissions(response.data.permissions || []);
        } catch (error) {
          console.error('Failed to fetch user menus and permissions:', error);
          // If unauthorized, log out
          if (error.response?.status === 401) {
            logout();
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserMenusAndPermissions();
    } else {
      setLoading(false);
    }
  }, [token]);
  
  return (
    <AuthContext.Provider value={{ 
      token, 
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