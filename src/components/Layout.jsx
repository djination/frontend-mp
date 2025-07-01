import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <>
      <Sidebar setGlobalIsDarkMode={setIsDarkMode} />
      <div 
        className="ml-64 min-h-screen transition-colors duration-300"
        style={{ 
          backgroundColor: isDarkMode ? '#141414' : '#f0f2f5',
          color: isDarkMode ? '#ffffff' : '#000000'
        }}
      >
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Layout;