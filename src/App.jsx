import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { theme, App as AntdApp } from 'antd';
import { useAuth } from "./components/AuthContext";

// Page components
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LoadingSpinner from "./components/LoadingSpinner";
import NotFoundPage from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import MenuManagementPage from "./pages/UserRole/MenuManagementPage";
import RoleManagementPage from "./pages/UserRole/RoleManagementPage";
import UserManagementPage from './pages/UserRole/UserManagementPage';
import ProfilePage from './pages/Profile/ProfilePage';

// Existing page imports
import ServicesPage from "./pages/Services/ServicesPage";
import AccountList from './pages/Account/AccountListPage';
import AddAccount from './pages/Account/AddAccountPage';
import EditAccount from './pages/Account/EditAccountPage';
import MasterIndustry from "./pages/Parameter/MasterIndustry";
import MasterBusinessType from "./pages/Parameter/MasterBusinessType";
import MasterBank from "./pages/Parameter/MasterBank";
import MasterBankCategory from "./pages/Parameter/MasterBankCategory";
import MasterPosition from "./pages/Parameter/MasterPosition";
import MasterAccountType from "./pages/Parameter/MasterAccountType";
import MasterAccountCategory from "./pages/Parameter/MasterAccountCategory";
import MasterDocumentType from "./pages/Parameter/MasterDocumentType";
import PostalCodeMaster from "./pages/Master/PostalCodeMaster";
import RevenueRule from "./pages/RevenueRule/RevenueRule";
import CdmProvidersPage from './pages/Master/CdmProvider/CdmProvidersPage';
import BackendExtConfigPage from './pages/Account/components/BackendExtConfigPage';

// Component map for dynamic routing
import { componentMap } from './utils/componentMap';

// Layout component that includes Sidebar
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, loading, userMenus, hasPermission } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Effect to detect theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // For detecting changes made in the same application
    const checkThemeChange = setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      if ((currentTheme === 'dark') !== isDarkMode) {
        setIsDarkMode(currentTheme === 'dark');
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkThemeChange);
    };
  }, [isDarkMode]);

  // Don't render anything until we've checked auth
  if (loading) {
    return <LoadingSpinner />;
  }

  const { defaultAlgorithm, darkAlgorithm } = theme;

  // Find component by path
  const getComponentForPath = (path) => {
    // Check in component map first
    if (componentMap[path]) {
      return componentMap[path];
    }
    
    // Fallback for existing routes not yet in component map
    const staticRoutes = {
      '/dashboard': Dashboard,
      '/account': AccountList,
      '/account/add': AddAccount,
      '/account/edit/:id': EditAccount,
      '/master/industry': MasterIndustry,
      '/parameter/business-type': MasterBusinessType,
      '/parameter/bank': MasterBank,
      '/parameter/bank-category': MasterBankCategory,
      '/parameter/position': MasterPosition,
      '/parameter/account-type': MasterAccountType,
      '/parameter/account-category': MasterAccountCategory,
      '/parameter/document-type': MasterDocumentType,
      '/parameter/revenue-rules': RevenueRule,
      '/users': UserManagementPage,
      '/profile': ProfilePage,
      '/master/services': ServicesPage,
      '/master/cdm-providers': CdmProvidersPage,
      '/master/backend-config': BackendExtConfigPage,
    };
    
    if (staticRoutes[path]) {
      return staticRoutes[path];
    }
    
    // Default to NotFound
    return NotFoundPage;
  };

  // Check if user has access to a specific path
  const hasAccessToPath = (path) => {
    if (!isAuthenticated) return false;
    
    // During initial setup, allow access to all routes
    if (!userMenus || userMenus.length === 0) return true;
    
    // Special case for admin routes that aren't in menus yet
    if (path === '/menus' && hasPermission('menu:read')) return true;
    if (path === '/roles' && hasPermission('role:read')) return true;
    if (path === '/users' && hasPermission('user:read')) return true;
    
    // Default routes that should always be accessible
    if (path === '/dashboard') return true;
    
    // Recursive function to check paths in menu tree
    const checkPathInMenus = (menus, targetPath) => {
      for (const menu of menus) {
        if (menu.path === targetPath && menu.isActive) {
          return true;
        }
        if (menu.children?.length) {
          if (checkPathInMenus(menu.children, targetPath)) {
            return true;
          }
        }
      }
      return false;
    };
    
    return checkPathInMenus(userMenus, path);
  };

  return (
    <AntdApp
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? '#1890ff' : '#1e3a8a',
          borderRadius: 6,
        },
        components: {
          Card: {
            colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
          },
          Table: {
            colorBgContainer: isDarkMode ? '#1f1f1f' : '#ffffff',
          },
          Layout: {
            colorBgBase: isDarkMode ? '#141414' : '#f0f2f5',
          }
        }
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes wrapped in Layout */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
              ) : (
                <Navigate to="/login" />
              )
            }
          >
            {/* Default route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* Admin routes */}
            <Route
              path="/menus"
              element={
                hasPermission('menu:read') ? <MenuManagementPage /> : <UnauthorizedPage />
              }
            />
            
            <Route
              path="/roles"
              element={
                hasPermission('role:read') ? <RoleManagementPage /> : <UnauthorizedPage />
              }
            />

            <Route
              path="/users"
              element={
                hasPermission('user:read') ? <UserManagementPage /> : <UnauthorizedPage />
              }
            />
            
            {/* Static routes (keeping for backward compatibility) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<AccountList />} />
            <Route path="/account/add" element={<AddAccount />} />
            <Route path="/account/edit/:id" element={<EditAccount />} />

            {/* Master routes */}
            <Route path="/master">
              <Route path="industry" element={<MasterIndustry />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="postal-code" element={<PostalCodeMaster />} />
              <Route path="cdm-providers" element={<CdmProvidersPage />} />
              <Route path="backend-config" element={<BackendExtConfigPage />} />
            </Route>
            
            {/* Parameter routes */}
            <Route path="/parameter">
              <Route path="business-type" element={<MasterBusinessType />} />
              <Route path="bank" element={<MasterBank />} />
              <Route path="bank-category" element={<MasterBankCategory />} />
              <Route path="position" element={<MasterPosition />} />
              <Route path="account-type" element={<MasterAccountType />} />
              <Route path="account-category" element={<MasterAccountCategory />} />
              <Route path="document-type" element={<MasterDocumentType />} />
              <Route path="revenue-rules" element={<RevenueRule />} />
            </Route>
            
            {/* Dynamic routes from user menus */}
            {userMenus && userMenus.map(menu => (
              <Route
                key={menu.path}
                path={menu.path}
                element={
                  hasAccessToPath(menu.path) ? 
                  React.createElement(getComponentForPath(menu.path)) :
                  <UnauthorizedPage />
                }
              />
            ))}
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </AntdApp>
  );
}

export default App;