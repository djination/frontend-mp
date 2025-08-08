import { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Table, Space, Modal, Popconfirm, 
  Select, message 
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getPositions } from '../../../api/positionApi';
import { getAccountPICById, getAccountPICs } from '../../../api/accountPICApi';

import PropTypes from 'prop-types';

const AccountPICForm = ({ 
  pics = [], 
  onChange, 
  accountId,
  isEdit
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingPIC, setEditingPIC] = useState(null);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  const [localPICs, setLocalPICs] = useState(pics || []);

  // Sync localPICs with props when they change
  useEffect(() => {
    
    setLocalPICs(pics || []);
  }, [pics]);

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
          phone_no: values.phone_no,
          position_id: values.position_id,
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
            {editingPIC ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
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
              { required: true, message: 'Please enter fix line phone number' },
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
};

export default AccountPICForm;