import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} 
        tip="Loading..." 
      />
    </div>
  );
};

export default LoadingSpinner;