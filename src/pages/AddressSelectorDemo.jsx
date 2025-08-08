import React, { useState } from 'react';
import { Card, Typography, Space } from 'antd';
import AddressHierarchySelector from '../components/AddressHierarchySelector';

const { Title, Text } = Typography;

const AddressSelectorDemo = () => {
  const [selectedAddress, setSelectedAddress] = useState({});

  const handleAddressChange = (addressData) => {
    setSelectedAddress(addressData);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Address Hierarchy Selector Demo</Title>
      
      <Card title="Select Address" style={{ marginBottom: 24 }}>
        <AddressHierarchySelector
          value={selectedAddress}
          onChange={handleAddressChange}
          required={true}
        />
      </Card>

      <Card title="Selected Address Data">
        <Space direction="vertical">
          <Text><strong>Country:</strong> {selectedAddress.country || 'Not selected'}</Text>
          <Text><strong>Province:</strong> {selectedAddress.province || 'Not selected'}</Text>
          <Text><strong>City:</strong> {selectedAddress.city || 'Not selected'}</Text>
          <Text><strong>District:</strong> {selectedAddress.district || 'Not selected'}</Text>
          <Text><strong>Sub District:</strong> {selectedAddress.sub_district || 'Not selected'}</Text>
          <Text><strong>Postal Code:</strong> {selectedAddress.postal_code || 'Not selected'}</Text>
        </Space>
      </Card>

      <Card title="JSON Output" style={{ marginTop: 16 }}>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
          {JSON.stringify(selectedAddress, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default AddressSelectorDemo;
