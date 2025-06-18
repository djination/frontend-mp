// filepath: d:\Dok Pribadi\merahputih\code\frontend\src\pages\Account\components\AccountAddressForm.jsx
import { useEffect, useState } from 'react';
import { 
  Form, Input, Button, Table, Space, Modal, InputNumber,
  Popconfirm, message 
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getAccountAddresses, getAccountAddressById } from '../../../api/accountAddressApi';

const AccountAddressForm = ({ addresses = [], onChange, accountId, isEdit }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localAddresses, setLocalAddresses] = useState(addresses || []);

  useEffect(() => {
    // Initialize local addresses from props
    console.log("Initializing local addresses from props:", addresses);
    setLocalAddresses(addresses || []);
  }, [addresses]);

  const showModal = (address) => {
    setEditingAddress(address || null);
    form.resetFields();
    if (address) {
      console.log("Editing address:", address);
      form.setFieldsValue(address);
    }
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingAddress) {
        // Update local state only
        const updatedAddresses = localAddresses.map(addr =>
          (addr.id === editingAddress.id || addr.tempId === editingAddress.tempId)
            ? { ...addr, ...values }
            : addr
        );
        setLocalAddresses(updatedAddresses);
        onChange(updatedAddresses);
      } else {
        // Add new address to local state
        const newAddress = {
          ...values,
          tempId: Date.now()
        };
        const updatedAddresses = [...localAddresses, newAddress];
        setLocalAddresses(updatedAddresses);
        onChange(updatedAddresses);
      }
      setVisible(false);
    } catch (error) {
      message.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch updated addresses from server
  const fetchUpdatedAddresses = async () => {
    try {
      console.log("Fetching updated addresses for account:", accountId);
      const response = await getAccountAddresses(accountId);
      console.log("Updated addresses response:", response);
      
      // Determine the correct data path based on the response structure
      let updatedData = [];
      if (response?.data?.account_address) {
        updatedData = response.data.account_address;
      } else if (response?.data?.data?.account_address) {
        updatedData = response.data.data.account_address;
      } else if (Array.isArray(response?.data)) {
        updatedData = response.data;
      }
      
      console.log("Processing updated address data:", updatedData);
      
      if (updatedData && updatedData.length > 0) {
        setLocalAddresses(updatedData);
        onChange(updatedData);
      }
    } catch (error) {
      console.error('Error fetching updated addresses:', error);
      // We don't show an error message here as we've already updated the UI with local state
    }
  };

  const handleDelete = (address) => {
    // Only update local state
    const updatedAddresses = localAddresses.filter(addr =>
      addr !== address && addr.tempId !== address.tempId && addr.id !== address.id
    );
    setLocalAddresses(updatedAddresses);
    onChange(updatedAddresses);
  };

  

  const columns = [
    {
      title: 'Address',
      dataIndex: 'address1',
      key: 'address1',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'Province',
      dataIndex: 'province',
      key: 'province',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: 'Postal Code',
      dataIndex: 'postalcode',
      key: 'postalcode',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this address?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Debugging untuk cek komponen berjalan
  console.log("Rendering AccountAddressForm, addresses:", addresses);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          Add Address
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={addresses}
        rowKey={record => record.id || record.tempId}
        pagination={false}
      />
      
      <Modal
        title={editingAddress ? 'Edit Address' : 'Add Address'}
        open={visible}
        onCancel={handleCancel}
        onOk={handleSave}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="address1"
            label="Address Line 1"
            rules={[{ required: true, message: 'Please enter address line 1' }]}
          >
            <Input placeholder="Enter address line 1" />
          </Form.Item>
          
          <Form.Item
            name="address2"
            label="Address Line 2"
          >
            <Input placeholder="Enter address line 2" />
          </Form.Item>
          
          <Form.Item
            name="sub_district"
            label="Sub District"
            rules={[{ required: true, message: 'Please enter sub district' }]}
          >
            <Input placeholder="Enter sub district" />
          </Form.Item>
          
          <Form.Item
            name="district"
            label="District"
            rules={[{ required: true, message: 'Please enter district' }]}
          >
            <Input placeholder="Enter district" />
          </Form.Item>
          
          <Form.Item
            name="city"
            label="City"
            rules={[{ required: true, message: 'Please enter city' }]}
          >
            <Input placeholder="Enter city" />
          </Form.Item>
          
          <Form.Item
            name="province"
            label="Province"
            rules={[{ required: true, message: 'Please enter province' }]}
          >
            <Input placeholder="Enter province" />
          </Form.Item>
          
          <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: 'Please enter country' }]}
          >
            <Input placeholder="Enter country" />
          </Form.Item>
          
          <Form.Item
            name="postalcode"
            label="Postal Code"
            rules={[{ required: true, message: 'Please enter postal code' }]}
          >
            <Input placeholder="Enter postal code" />
          </Form.Item>
          
          <Form.Item
            name="phone_no"
            label="Phone Number"
            rules={[{ message: 'Please enter phone number' }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item name="latitude" label="Latitude">
            <InputNumber style={{ width: '100%' }} precision={6} />
          </Form.Item>
          
          <Form.Item name="longitude" label="Longitude">
            <InputNumber style={{ width: '100%' }} precision={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// AccountAddressForm.defaultProps = {
//   addresses: PropTypes.array,
//   onChange: PropTypes.func.isRequired,
//   accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//   isEdit: PropTypes.bool.isRequired,
// };

export default AccountAddressForm;