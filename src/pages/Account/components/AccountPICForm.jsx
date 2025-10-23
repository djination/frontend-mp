import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Table, Space, Modal, Popconfirm, 
  Select, message, Tooltip 
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { getPositions } from '../../../api/positionApi';
import { getAccountPICById, getAccountPICs } from '../../../api/accountPICApi';
import backendExtApi from '../../../api/backendExtApi';

import PropTypes from 'prop-types';

const AccountPICForm = ({ 
  pics = [], 
  onChange, 
  accountId,
  isEdit,
  accountData = null,
  onPICUpdate = null
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingPIC, setEditingPIC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState({});
  const [positions, setPositions] = useState([]);
  const [localPICs, setLocalPICs] = useState(pics || []);

  // Sync localPICs with props when they change
  useEffect(() => {
    console.log('🔍 AccountPICForm props debug:', {
      pics: pics,
      accountData: accountData,
      accountId: accountId,
      isEdit: isEdit
    });
    setLocalPICs(pics || []);
  }, [pics, accountData, accountId, isEdit]);

  useEffect(() => {
    
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await getPositions();
      

      if (response && response.data) {
        // Handle both data structures (direct array or nested in data property)
        const positionsData = Array.isArray(response.data) ? 
                            response.data : 
                            (response.data.data || []);
        
        setPositions(positionsData);
      } else {
        setPositions([]);
      }
    } catch (error) {
      message.error('Failed to fetch positions');
      console.error('Error fetching positions:', error);
      setPositions([]);
    }
  };

  const showModal = (pic) => {
    setEditingPIC(pic || null);
    form.resetFields();
    if (pic) {
      
      form.setFieldsValue({
        ...pic,
        position_id: pic.position?.id || pic.position_id
      });
    }
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields(); // Pastikan form direset saat dibatalkan
  };

  // Perbaiki handleSave untuk menangani pembuatan PIC dengan benar
  const handleSave = () => {
    form.validateFields()
      .then((values) => {
        setLoading(true);
        const picData = {
          name: values.name,
          email: values.email,
          fix_phone_no: values.fix_phone_no,
          phone_no: values.phone_no,
          position_id: values.position_id,
          no_ktp: values.no_ktp,
          no_npwp: values.no_npwp,
          username: values.username,
          is_owner: values.is_owner,
        };
        if (editingPIC) {
          const updatedPICs = localPICs.map(p =>
            (p.id === editingPIC.id || p.tempId === editingPIC.tempId)
              ? { ...p, ...picData }
              : p
          );
          setLocalPICs(updatedPICs);
          onChange(updatedPICs);
        } else {
          const newPIC = {
            ...picData,
            tempId: `temp-${Date.now()}`
          };
          const updatedPICs = [...localPICs, newPIC];
          setLocalPICs(updatedPICs);
          onChange(updatedPICs);
        }
        setVisible(false);
        form.resetFields();
        setLoading(false);
      })
      .catch(info => {
        message.error('Failed to save PIC');
      });
  };

  // Function to fetch updated PICs from server
  const fetchUpdatedPICs = async () => {
    if (!accountId) return;
    
    try {
      
      const response = await getAccountPICs(accountId);
      
      
      // Determine the correct data path based on the response structure
      let updatedData = [];
      if (response?.data?.data?.account_pic) {
        updatedData = response.data.data.account_pic;
      } else if (response?.data?.account_pic) {
        updatedData = response.data.account_pic;
      } else if (Array.isArray(response?.data)) {
        updatedData = response.data;
      }
      
      
      
      if (updatedData && updatedData.length > 0) {
        setLocalPICs(updatedData);
        onChange(updatedData);
      }
    } catch (error) {
      console.error('Error fetching updated PICs:', error);
      // No error message shown as we've already updated UI with local state
    }
  };

  const handleDelete = (pic) => {
    const updatedPICs = localPICs.filter(p =>
      p !== pic && p.tempId !== pic.tempId && p.id !== pic.id
    );
    setLocalPICs(updatedPICs);
    onChange(updatedPICs);
  };

  // Function to sync PIC to external API
  const handleSyncPIC = async (pic) => {
    // Check if PIC has uuid_be, if not, show warning but still allow sync attempt
    if (!pic.uuid_be) {
      message.warning('PIC does not have external UUID. Sync may fail if PIC is not already synced.');
    }

    if (!accountData || !accountData.uuid_be) {
      message.error('Account must be synced first before syncing PIC');
      return;
    }

    // Use uuid_be if available, otherwise use regular id
    const picId = pic.uuid_be || pic.id;
    setSyncLoading(prev => ({ ...prev, [picId]: true }));

    try {
      // Transform PIC data to external API format
      const crewData = {
        id: pic.uuid_be || pic.id, // Use uuid_be if available, otherwise use regular id
        name: pic.name,
        ktp: pic.no_ktp || '',
        npwp: pic.no_npwp || '',
        customer: {
          id: accountData.uuid_be,
          name: accountData.name
        },
        username: pic.username || '',
        email: pic.email || '',
        msisdn: pic.phone_no ? (pic.phone_no.startsWith('+') ? pic.phone_no : `+${pic.phone_no.startsWith('0') ? '62' + pic.phone_no.slice(1) : pic.phone_no}`) : ''
      };

      console.log('🔄 Creating new customer crew in external API:', crewData);

      // Make API request to external API (PUT method for creating new customer crew)
      const requestData = {
        config_id: '473b8ffa-9c2e-4384-b5dc-dd2af3c1f0f9',
        data: crewData,
        url: `/api/customer-crew/command/${pic.uuid_be || pic.id}`, // Use path only, not full URL
        method: 'PUT'
      };

      console.log('📤 Request data being sent:', JSON.stringify(requestData, null, 2));

      // Use only makeSimplifiedApiRequest like customerSyncUtils.js
      const response = await backendExtApi.makeSimplifiedApiRequest(requestData);

      if (response && response.success !== false) {
        message.success('Customer crew created in external API successfully');
        console.log('✅ Customer crew creation successful:', response);
        
        // Call parent callback if provided
        if (onPICUpdate) {
          onPICUpdate(pic, response);
        }
      } else {
        throw new Error(response?.error || 'External API returned error');
      }

    } catch (error) {
        console.error('❌ Error creating customer crew in external API:', error);
        
        let errorMessage = 'Failed to create customer crew in external API';
      if (error.response?.data?.error) {
        errorMessage = `External API Error: ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        errorMessage = `External API Error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setSyncLoading(prev => ({ ...prev, [picId]: false }));
    }
  };
  

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Position',
      dataIndex: ['position', 'name'],
      key: 'position',
      render: (_, record) => {
        // Ambil langsung dari record.position.name jika ada (sesuai response getAccountPICs)
        if (record.position && record.position.name) {
          
          
          return record.position.name;
        }
        // Fallback: cari dari positions jika hanya ada position_id
        if (record.position_id) {
          const position = positions.find(pos => pos.id === record.position_id);
          return position?.name || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      title: 'Phone',
      dataIndex: 'phone_no',
      key: 'phone_no',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
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
          {(() => {
            // Show sync button if PIC has an ID (either uuid_be or regular id) and account has uuid_be
            const hasPicId = record.uuid_be || record.id;
            const hasAccountUuid = accountData?.uuid_be;
            const shouldShowSync = hasPicId && hasAccountUuid;
            console.log('🔍 Sync button debug:', {
              recordUuidBe: record.uuid_be,
              recordId: record.id,
              hasPicId,
              accountUuidBe: accountData?.uuid_be,
              hasAccountUuid,
              shouldShowSync,
              record: record,
              accountData: accountData
            });
            return shouldShowSync;
          })() && (
            <Tooltip title="Sync to External API">
              <Button 
                icon={<SyncOutlined />} 
                onClick={() => handleSyncPIC(record)}
                loading={syncLoading[record.uuid_be]}
                size="small"
                type="primary"
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Are you sure you want to delete this PIC?"
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          Add PIC
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={localPICs}
        rowKey={record => record.id || record.tempId || Math.random()}
        pagination={false}
      />
      
      <Modal
        title={editingPIC ? 'Edit PIC' : 'Add PIC'}
        open={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={handleSave}
          >
            {editingPIC ? 'Update' : 'Ok'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="is_owner"
            label="Is Owner"
            rules={[{ required: true, message: 'Please select if the PIC is the owner' }]}
          >
            <Select placeholder="Select if owner" allowClear>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" autoComplete="name" />
          </Form.Item>
          
          <Form.Item
            name="position_id"
            label="Position"
          >
            <Select
              placeholder="Select position"
              allowClear
              options={positions.map(pos => ({
                value: pos.id,
                label: pos.name
              }))}
            />
          </Form.Item>
          
          <Form.Item
            name="fix_phone_no"
            label="Fix Line Phone"
            rules={[
              { required: false, message: 'Please enter fix line phone number' },
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
            <Input placeholder="Enter fix line phone number" autoComplete="tel" />
          </Form.Item>
          
          <Form.Item
            name="phone_no"
            label="Phone"
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
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="no_ktp"
            label="No KTP"
            rules={[
              { required: true, message: 'Please enter No KTP' },
              { type: 'string', message: 'Please enter a valid No KTP' }
            ]}
          >
            <Input placeholder="Enter No KTP" autoComplete="off" />

          </Form.Item>
          <Form.Item
            name="no_npwp"
            label="No NPWP"
            rules={[
              { required: true, message: 'Please enter No NPWP' },
              { type: 'string', message: 'Please enter a valid No NPWP' }
            ]}
          >
            <Input placeholder="Enter No NPWP" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter Username' },
              { type: 'string', message: 'Please enter a valid Username' }
            ]}
          >
            <Input placeholder="Enter Username" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

AccountPICForm.propTypes = {
  pics: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEdit: PropTypes.bool.isRequired,
  accountData: PropTypes.object,
  onPICUpdate: PropTypes.func,
};

export default AccountPICForm;