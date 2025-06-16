import { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Table, Space, Modal, Popconfirm, 
  Select, message 
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getPositions } from '../../../api/accountPositionApi';
import { getAccountPICById, updateAccountPIC, createAccountPIC, deleteAccountPIC } from '../../../api/accountPICApi';

import PropTypes from 'prop-types';

const AccountPICSForm = ({ 
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
    console.log("PICs prop changed:", pics);
    setLocalPICs(pics || []);
  }, [pics]);

  useEffect(() => {
    console.log("AccountPICSForm mounted");
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await getPositions();
      console.log("Positions response:", response);

      if (response && response.data) {
        // Handle both data structures (direct array or nested in data property)
        const positionsData = Array.isArray(response.data) ? 
                            response.data : 
                            (response.data.data || []);
        console.log("Processed positions data:", positionsData);
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
      console.log('Editing PIC:', pic);
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

  // Di dalam handleSave, perbaiki format data yang dikirim

  const handleSave = () => {
    form.validateFields()
      .then(async (values) => {
        try {
          setLoading(true);
          console.log('Form validated values:', values);
          
          // Pastikan data dalam format yang tepat
          // Jika nilai kosong, jangan sertakan dalam permintaan
          const picData = {
            name: values.name,
            email: values.email,
            phone_no: values.phone_no
          };
          
          // Hanya tambahkan position_id jika ada nilainya
          if (values.position_id) {
            picData.position_id = values.position_id;
          }
          
          console.log('Prepared PIC data:', picData);

          if (isEdit && accountId) {
            if (editingPIC?.id) {
              // Update existing PIC
              console.log(`Updating PIC: ${editingPIC.id} for account: ${accountId}`);
              const response = await updateAccountPIC(accountId, editingPIC.id, picData);
              console.log("Update PIC response:", response);
              message.success('PIC updated successfully');
              
              // Update local state
              const updatedPICs = localPICs.map(p => 
              p.id === editingPIC.id ? {
                ...p,
                ...picData,
                position: positions.find(pos => pos.id === picData.position_id) || p.position
              } : p
              );
              setLocalPICs(updatedPICs);
              onChange(updatedPICs);
              
              // Close modal on success - add these two lines
              setVisible(false);
              form.resetFields();
            } else {
              // Create new PIC
              console.log(`Creating new PIC for account: ${accountId}`);
              try {
                // Ensure accountId is included directly in the function call
                const finalAccountId = String(accountId); // Ensure it's a string
                
                console.log('Account ID type:', typeof finalAccountId);
                console.log('Account ID value:', finalAccountId);
                
                const response = await createAccountPIC(finalAccountId, picData);
                console.log("Create PIC response:", response);
                message.success('PIC added successfully');
                
                // Add to local state if successful
                if (response && response.data) {
                  const newPIC = {
                    ...picData,
                    id: response.data.id || Date.now(),
                    position: positions.find(pos => pos.id === picData.position_id) || null
                  };
                  
                  const updatedPICs = [...localPICs, newPIC];
                  setLocalPICs(updatedPICs);
                  onChange(updatedPICs);
                  
                  // Close modal on success
                  setVisible(false);
                  form.resetFields();
                }
              } catch (createError) {
                console.error('Detailed error creating PIC:', createError);
                
                if (createError.response?.data?.message) {
                  message.error(`Error: ${createError.response.data.message}`);
                } else if (createError.response?.data?.error) {
                  message.error(`Error: ${createError.response.data.error}`);
                } else {
                  message.error('Failed to create PIC. Please check your data and try again.');
                }
              }
            }
          } else {
            // For new account (not saved to backend yet)
            // Handle local state updates...
            // ...
            
            // Close modal for local operations
            setVisible(false);
            form.resetFields();
          }
          
        } catch (error) {
          console.error('Error in save process:', error);
        } finally {
          setLoading(false);
        }
      })
      .catch(info => {
        console.log('Form validation failed:', info);
      });
  };

  // Function to fetch updated PICs from server
  const fetchUpdatedPICs = async () => {
    if (!accountId) return;
    
    try {
      console.log("Fetching updated PICs for account:", accountId);
      const response = await getAccountPICById(accountId);
      console.log("Updated PICs response:", response);
      
      // Determine the correct data path based on the response structure
      let updatedData = [];
      if (response?.data?.data?.account_pic) {
        updatedData = response.data.data.account_pic;
      } else if (response?.data?.account_pic) {
        updatedData = response.data.account_pic;
      } else if (Array.isArray(response?.data)) {
        updatedData = response.data;
      }
      
      console.log("Processing updated PIC data:", updatedData);
      
      if (updatedData && updatedData.length > 0) {
        setLocalPICs(updatedData);
        onChange(updatedData);
      }
    } catch (error) {
      console.error('Error fetching updated PICs:', error);
      // No error message shown as we've already updated UI with local state
    }
  };

  const handleDelete = async (pic) => {
    if (isEdit && accountId && pic.id) {
      try {
        console.log(`Deleting PIC: ${pic.id} from account: ${accountId}`);
        await deleteAccountPIC(accountId, pic.id);
        message.success('PIC deleted successfully');
        
        // Update local state immediately
        const updatedPICs = localPICs.filter(p => p.id !== pic.id);
        setLocalPICs(updatedPICs);
        onChange(updatedPICs);
        
        // Refresh from server in the background
        fetchUpdatedPICs();
      } catch (error) {
        console.error('Error deleting PIC:', error);
        message.error('Failed to delete PIC');
      }
    } else {
      // For new account, just update local state
      const updatedPICs = localPICs.filter(p => 
        p !== pic && p.tempId !== pic.tempId
      );
      setLocalPICs(updatedPICs);
      onChange(updatedPICs);
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
        if (record.position?.name) return record.position.name;
        
        // If position_id exists, try to get name from positions
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
            <Input placeholder="Enter name" />
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
            name="phone_no"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

AccountPICSForm.propTypes = {
  pics: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEdit: PropTypes.bool.isRequired,
};

export default AccountPICSForm;