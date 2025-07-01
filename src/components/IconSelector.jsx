import React from 'react';
import { Select } from 'antd';
import * as AntdIcons from '@ant-design/icons';

const { Option } = Select;

// Extract icon component names from Ant Design Icons
const iconList = Object.keys(AntdIcons)
  .filter(key => key.endsWith('Outlined') || key.endsWith('Filled') || key.endsWith('TwoTone'))
  .sort();

const IconSelector = ({ value, onChange }) => {
  const renderIcon = (iconName) => {
    const Icon = AntdIcons[iconName];
    return Icon ? <Icon style={{ marginRight: 8 }} /> : null;
  };

  return (
    <Select
      showSearch
      placeholder="Select an icon"
      optionFilterProp="children"
      value={value}
      onChange={onChange}
      style={{ width: '100%' }}
      allowClear
    >
      {iconList.map(iconName => (
        <Option key={iconName} value={iconName}>
          {renderIcon(iconName)} {iconName}
        </Option>
      ))}
    </Select>
  );
};

export default IconSelector;