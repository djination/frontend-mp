import React from 'react';
import { InputNumber } from 'antd';
import './NumericInputs.css'; // Import your CSS for styling

export const CurrencyInput = ({ value, onChange, ...props }) => {
  const formatRupiah = (value) => {
    if (value === undefined || value === null) return '';
    return `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  const parseRupiah = (value) => {
    if (value === undefined || value === null) return '';
    return value.replace(/[^\d.]/g, '');
  };

  return (
    <InputNumber
      className="currency-input"
      formatter={formatRupiah}
      parser={parseRupiah}
      min={0}
      step={1000}
      style={{ width: '100%' }}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};

export const PercentageInput = ({ value, onChange, ...props }) => {
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '';
    return `${value}%`;
  };
  
  const parsePercentage = (value) => {
    if (value === undefined || value === null) return '';
    return value.replace('%', '');
  };

  return (
    <InputNumber
      className="percentage-input"
      formatter={formatPercentage}
      parser={parsePercentage}
      min={0}
      max={100}
      precision={2}
      step={0.01}
      style={{ width: '100%' }}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};