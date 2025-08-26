// filepath: d:\Dok Pribadi\merahputih\code\frontend\src\pages\Account\components\AccountAddressForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Form, Input, Button, Table, Space, Modal, InputNumber,
  Popconfirm, message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getAccountAddresses, getAccountAddressById } from '../../../api/accountAddressApi';
import AddressHierarchySelector from '../../../components/AddressHierarchySelector';

const AccountAddressForm = ({ addresses = [], onChange, accountId, isEdit }) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localAddresses, setLocalAddresses] = useState(addresses || []);
  const [addressHierarchy, setAddressHierarchy] = useState({});

  useEffect(() => {
    // Initialize local addresses from props

    setLocalAddresses(addresses || []);
  }, [addresses]);

  const showModal = (address) => {
    setEditingAddress(address || null);
    form.resetFields();

    if (address) {
      form.setFieldsValue(address);

      // Set hierarchy data for existing address
      setAddressHierarchy({
        country: address.country || '',
        province: address.province || '',
        city: address.city || '',
        district: address.district || '',
        sub_district: address.sub_district || '',
        postal_code: address.postalcode || address.postal_code || ''
      });
    } else {
      // Reset hierarchy for new address
      setAddressHierarchy({});
    }

    setVisible(true);
  };

  const handleAddressHierarchyChange = (hierarchyData) => {
    setAddressHierarchy(hierarchyData);

    // Update form fields with hierarchy data
    form.setFieldsValue({
      country: hierarchyData.country || '',
      province: hierarchyData.province || '',
      city: hierarchyData.city || '',
      district: hierarchyData.district || '',
      sub_district: hierarchyData.sub_district || '',
      postalcode: hierarchyData.postal_code || ''
    });
  };

  const handleCancel = () => {
    setVisible(false);
    setAddressHierarchy({});
    setEditingAddress(null);
    form.resetFields();
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

      // Close modal and reset states
      setVisible(false);
      setAddressHierarchy({});
      setEditingAddress(null);
      message.success(editingAddress ? 'Address updated successfully' : 'Address added successfully');
    } catch (error) {
      message.error('Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch updated addresses from server
  const fetchUpdatedAddresses = async () => {
    try {

      const response = await getAccountAddresses(accountId);


      // Determine the correct data path based on the response structure
      let updatedData = [];
      if (response?.data?.account_address) {
        updatedData = response.data.account_address;
      } else if (response?.data?.data?.account_address) {
        updatedData = response.data.data.account_address;
      } else if (Array.isArray(response?.data)) {
        updatedData = response.data;
      }



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
      title: 'Website',
      dataIndex: 'website',
      key: 'website',
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
        dataSource={localAddresses}
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
            <Input placeholder="Enter address line 1" autoComplete="address-line1" />
          </Form.Item>

          <Form.Item
            name="address2"
            label="Address Line 2"
          >
            <Input placeholder="Enter address line 2" autoComplete="address-line2" />
          </Form.Item>

          {/* Address Hierarchy Selector */}
          <div style={{ marginBottom: 24 }}>
            <AddressHierarchySelector
              value={addressHierarchy}
              onChange={handleAddressHierarchyChange}
              required={true}
            />
          </div>

          {/* Hidden fields for form validation */}
          <Form.Item name="country" hidden rules={[{ required: true, message: 'Please select country' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="province" hidden rules={[{ required: true, message: 'Please select province' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" hidden rules={[{ required: true, message: 'Please select city' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="district" hidden rules={[{ required: true, message: 'Please select district' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sub_district" hidden rules={[{ required: true, message: 'Please select sub district' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="postalcode" hidden rules={[{ required: true, message: 'Please select postal code' }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="phone_no"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              {
                validator: (_, value) => {
                  if (!value || value.startsWith('62')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Nomor harus diawali dengan 62'));
                }
              }
            ]}
          >
            <Input placeholder="Enter phone number" autoComplete="tel" />
          </Form.Item>

          <Form.Item
            name="website"
            label="Website"
            rules={[{ message: 'Please enter website' }]}
          >
            <Input placeholder="Enter website" autoComplete="off" />
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

export default AccountAddressForm;