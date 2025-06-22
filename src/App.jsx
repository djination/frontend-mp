import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, theme } from 'antd';
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./components/AuthContext";
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
import SettlementMethodPage from "./pages/SettlementMethod/SettlementMethodPage";
import MasterDocumentType from "./pages/Parameter/MasterDocumentType";
import RevenueRule from "./pages/RevenueRule/RevenueRule";

function App() {
  const { isAuthenticated } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Effect untuk mendeteksi perubahan tema dari komponen lain
  useEffect(() => {
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem('theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Untuk mendeteksi perubahan yang dilakukan dalam aplikasi yang sama
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

  const { defaultAlgorithm, darkAlgorithm } = theme;

  return (
    <ConfigProvider
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
        {isAuthenticated && <Sidebar setGlobalIsDarkMode={setIsDarkMode} />}
        <div 
          className={`${isAuthenticated ? "ml-64" : ""} min-h-screen transition-colors duration-300`}
          style={{ 
            backgroundColor: isDarkMode ? '#141414' : '#f0f2f5',
            color: isDarkMode ? '#ffffff' : '#000000'
          }}
        >
          <div className="p-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/account" element={isAuthenticated ? <AccountList /> : <Navigate to="/login" />} />
              <Route path="/account/add" element={isAuthenticated ? <AddAccount /> : <Navigate to="/login" />} />
              <Route path="/account/edit/:id" element={isAuthenticated ? <EditAccount /> : <Navigate to="/login" />} />
              {/* Group all parameter routes under /parameter */}
              <Route path="/parameter">
                <Route path="industry" element={isAuthenticated ? <MasterIndustry /> : <Navigate to="/login" />} />
                <Route path="business-type" element={isAuthenticated ? <MasterBusinessType /> : <Navigate to="/login" />} />
                <Route path="bank" element={isAuthenticated ? <MasterBank /> : <Navigate to="/login" />} />
                <Route path="bank-category" element={isAuthenticated ? <MasterBankCategory /> : <Navigate to="/login" />} />
                <Route path="position" element={isAuthenticated ? <MasterPosition /> : <Navigate to="/login" />} />
                <Route path="account-type" element={isAuthenticated ? <MasterAccountType /> : <Navigate to="/login" />} />
                <Route path="account-category" element={isAuthenticated ? <MasterAccountCategory /> : <Navigate to="/login" />} />
                <Route path="services" element={isAuthenticated ? <ServicesPage /> : <Navigate to="/login" />} />
                {/* <Route path="settlement-methods" element={isAuthenticated ? <SettlementMethodPage /> : <Navigate to="/login" />} /> */}
                <Route path="document-type" element={isAuthenticated ? <MasterDocumentType /> : <Navigate to="/login" />} />
                <Route path="revenue-rules" element={isAuthenticated ? <RevenueRule />  : <Navigate to="/login" />} />
              </Route>
              <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;