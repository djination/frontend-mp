import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Switch } from 'antd';
import { useAuth } from "./AuthContext";
import * as AntdIcons from '@ant-design/icons';
import { LogoutOutlined, BulbOutlined } from '@ant-design/icons';

const Sidebar = ({ setGlobalIsDarkMode }) => {
  const { logout, userMenus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  
  // Effect for theme
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [isDarkMode]);
  
  // Set selected key based on current path
  useEffect(() => {
    // Find parent keys to open submenu
    const findParentKeys = (menus, path) => {
      for (const menu of menus) {
        if (menu.path === path) {
          return [];
        }
        if (menu.children && menu.children.length > 0) {
          const childKeys = findParentKeys(menu.children, path);
          if (childKeys.length > 0) {
            return [menu.path, ...childKeys];
          }
          // Check if any child has the current path
          const hasChildWithPath = menu.children.some(child => child.path === path);
          if (hasChildWithPath) {
            return [menu.path];
          }
        }
      }
      return [];
    };
    
    if (userMenus && userMenus.length > 0) {
      const parentKeys = findParentKeys(userMenus, location.pathname);
      if (parentKeys.length > 0) {
        setOpenKeys(parentKeys);
      }
    }
  }, [location.pathname, userMenus]);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
  
  // Helper to get icon component
  const getIcon = (iconName) => {
    if (!iconName) return null;
    return AntdIcons[iconName] ? React.createElement(AntdIcons[iconName]) : null;
  };
  
  // Recursively build menu items from userMenus
  const buildMenuItems = (menus) => {
    if (!menus || !Array.isArray(menus)) {
      console.warn('Menus is not an array:', menus);
      return [];
    }
    
    // Gunakan menu tree yang sudah dibangun dari backend
    const buildItems = (menuList) => {
      return menuList
        .filter(menu => menu.isActive !== false) // Allow undefined isActive
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map(menu => {
          const icon = getIcon(menu.icon);
          
          // Jika menu memiliki children, render sebagai submenu
          if (menu.children && menu.children.length > 0) {
            return {
              key: menu.path || `menu-${menu.id}`,
              icon: icon,
              label: menu.name,
              children: buildItems(menu.children),
              style: { background: isDarkMode ? '#111827' : '#1e3a8a' }
            };
          }
          
          // Jika tidak ada children, render sebagai menu item biasa
          return {
            key: menu.path || `menu-${menu.id}`,
            icon: icon,
            label: menu.name,
          };
        });
    };
    
    return buildItems(menus);
  };
  
  // Build dynamic menu items
  const dynamicMenuItems = buildMenuItems(userMenus || []);
  
  // Add logout at the end
  const menuItems = [
    ...dynamicMenuItems,
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      style: { marginTop: 'auto', color: '#f56565' }
    }
  ];

  const handleMenuClick = ({ key }) => {    
    if (key === 'logout') {
      handleLogout();
    } else if (key && key !== '#' && !key.startsWith('menu-')) {
      // Only navigate if it's a valid path and not a placeholder
      navigate(key);
    }
  };

  return (
    <div className={`fixed left-0 top-0 h-full w-64 ${isDarkMode ? 'bg-gray-900' : 'bg-blue-900'} overflow-y-auto`}>
      <div className={`py-4 px-6 ${isDarkMode ? 'bg-gray-950' : 'bg-blue-950'} flex justify-between items-center`}>
        <h2 className="text-xl font-semibold text-white">App Name</h2>
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
        selectedKeys={[location.pathname]}
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