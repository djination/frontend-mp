import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Switch } from 'antd';
import { useAuth } from "./AuthContext";
import {
  DashboardOutlined, UserOutlined, SettingOutlined,
  BankOutlined, ShopOutlined, TeamOutlined, ApartmentOutlined,
  FileTextOutlined, BuildOutlined, ControlOutlined,
  CreditCardOutlined, ProfileOutlined, BulbOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { SubMenu } = Menu;

const Sidebar = ({ setGlobalIsDarkMode }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState(['parameter']);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Effect untuk menerapkan tema
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  // Auto-expand menus based on current path
  useEffect(() => {
    if (location.pathname.startsWith("/parameter")) {
      setOpenKeys(prev => prev.includes('parameter') ? prev : [...prev, 'parameter']);
    }
    if (location.pathname.startsWith("/account")) {
      setOpenKeys(prev => prev.includes('account') ? prev : [...prev, 'account']);
    }
  }, [location.pathname]);
  
  // Parameter submenu items dengan icons dan labels
  const parameterItems = [
    { key: '/parameter/industry', label: 'Industry', icon: <BuildOutlined /> },
    { key: '/parameter/business-type', label: 'Business Type', icon: <ShopOutlined /> },
    { key: '/parameter/bank', label: 'Bank', icon: <BankOutlined /> },
    { key: '/parameter/bank-category', label: 'Bank Category', icon: <BankOutlined /> },
    { key: '/parameter/position', label: 'Position', icon: <TeamOutlined /> },
    { key: '/parameter/account-type', label: 'Account Type', icon: <ProfileOutlined /> },
    { key: '/parameter/account-category', label: 'Account Category', icon: <ProfileOutlined /> },
    { key: '/parameter/services', label: 'Services', icon: <ControlOutlined /> },
    { key: '/parameter/settlement-methods', label: 'Settlement Methods', icon: <CreditCardOutlined /> },
    { key: '/parameter/document-type', label: 'Document Type', icon: <FileTextOutlined /> }
  ];

  // Mendapatkan current path untuk active state
  const currentPath = location.pathname;
  const selectedKey = currentPath;

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else {
      navigate(key);
    }
  };

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // Toggle dark/light mode
  const toggleTheme = (checked) => {
    setIsDarkMode(checked);
    if (setGlobalIsDarkMode) {
      setGlobalIsDarkMode(checked);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Menu items structure for antd v5+
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/account',
      icon: <UserOutlined />,
      label: 'Account',
    },
    {
      key: 'parameter',
      icon: <SettingOutlined />,
      label: 'Parameter',
      children: parameterItems,
      style: { background: isDarkMode ? '#111827' : '#1e3a8a' }
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      style: { marginTop: 'auto', color: '#f56565' }
    }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full w-64 ${isDarkMode ? 'bg-gray-900' : 'bg-blue-900'} overflow-y-auto`}>
      <div className={`py-4 px-6 ${isDarkMode ? 'bg-gray-950' : 'bg-blue-950'} flex justify-between items-center`}>
        <h2 className="text-xl font-semibold text-white">CustomerDB</h2>
        <Switch 
          checkedChildren={<BulbOutlined />}
          unCheckedChildren={<BulbOutlined />}
          checked={isDarkMode}
          onChange={toggleTheme}
          className="ml-2"
        />
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onClick={handleMenuClick}
        style={{ 
          height: 'calc(100% - 64px)', 
          borderRight: 0,
          background: isDarkMode ? '#111827' : '#1e3a8a'
        }}
        items={menuItems}
      />
    </div>
  );
};

export default Sidebar;