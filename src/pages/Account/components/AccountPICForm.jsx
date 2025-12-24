import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Table, Space, Modal, Popconfirm, 
  Select, message, Tooltip, Switch 
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { getPositions } from '../../../api/positionApi';
import { getAccountPICById, getAccountPICs, updateAccountPIC } from '../../../api/accountPICApi';
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
          role: values.role,
          is_owner: values.is_owner,
          role_access: values.role_access,
          role_access_mobile: values.role_access_mobile,
          web_portal: values.web_portal,
          mobile: values.mobile,
        };
        
        // Include password: required for new PIC, optional for edit (only if provided)
        if (!editingPIC) {
          // Creating new PIC - password is required, so it will always be present
          picData.password = values.password;
        } else if (values.password && values.password.trim() !== '') {
          // Editing existing PIC - only include password if user wants to change it
          picData.password = values.password;
        }
        
        // Preserve is_active when editing (default to true for new PICs)
        if (editingPIC) {
          // Keep existing is_active value when editing
          picData.is_active = editingPIC.is_active !== undefined ? editingPIC.is_active : true;
        } else {
          // New PICs default to active
          picData.is_active = true;
        }
        
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
        console.error('❌ Form validation failed:', info);
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
    if (!accountData || !accountData.uuid_be) {
      message.error('Account must be synced first before syncing PIC');
      return;
    }

    if (!accountData.branch_uuid_be) {
      message.error('Account branch must be synced first before syncing PIC' + accountData.branch_uuid_be);
      return;
    }

    // Check if PIC has local ID (required for saving uuid_be)
    if (!pic.id && !pic.tempId) {
      message.error('PIC must be saved first before syncing');
      return;
    }

    // Use uuid_be if available, otherwise use regular id for loading state
    const picId = pic.uuid_be || pic.id || pic.tempId;
    setSyncLoading(prev => ({ ...prev, [picId]: true }));

    try {
      // Format phone number to +62 format
      const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        if (phone.startsWith('+')) return phone;
        if (phone.startsWith('0')) {
          return `+62${phone.slice(1)}`;
        }
        return `+62${phone}`;
      };

      // Transform PIC data to new external API format
      const userData = {
        email: pic.email || '',
        phone_number: formatPhoneNumber(pic.phone_no),
        username: pic.username || '',
        password: pic.password || '',
        role: pic.role || 'LOCATION_PARTNER', // Default role, can be updated if needed
        customer_id: accountData.uuid_be,
        branch_id: accountData.branch_uuid_be,
        role_access: pic.role_access || 'ADMIN',
        role_access_mobile: pic.role_access_mobile || 'CUSTOMER',
        web_portal: pic.web_portal !== undefined ? pic.web_portal : false,
        mobile: pic.mobile !== undefined ? pic.mobile : false,
        name: pic.name || ''
      };

      // Add ID for update operation (PATCH) if PIC already has uuid_be
      const isUpdate = !!pic.uuid_be;
      if (isUpdate) {
        userData.id = pic.uuid_be;
      }

      // Get config_id for user/command API
      let configId = null;
      try {
        const activeConfigs = await backendExtApi.getActiveConfigs();
        // Handle different response structures
        let configsData = [];
        if (activeConfigs && activeConfigs.success && activeConfigs.data) {
          if (activeConfigs.data.data && Array.isArray(activeConfigs.data.data)) {
            configsData = activeConfigs.data.data;
          } else if (Array.isArray(activeConfigs.data)) {
            configsData = activeConfigs.data;
          }
        } else if (activeConfigs && Array.isArray(activeConfigs)) {
          configsData = activeConfigs;
        }
        
        // Find User Command API config (prefer user/customerportal, fallback to customer config)
        const userConfig = configsData.find(config => 
          config.name.toLowerCase().includes('user') || 
          config.url?.includes('/user/command') ||
          config.url?.includes('customerportal')
        );
        
        // Fallback to customer config if user config not found
        const customerConfig = configsData.find(config => 
          config.name.toLowerCase().includes('customer') || 
          config.url?.includes('/customer/command')
        );
        
        configId = userConfig?.id || customerConfig?.id || '473b8ffa-9c2e-4384-b5dc-dd2af3c1f0f9'; // Fallback to hardcoded config
      } catch (configError) {
        console.warn('⚠️ Failed to get config_id, using fallback:', configError);
        configId = '473b8ffa-9c2e-4384-b5dc-dd2af3c1f0f9'; // Fallback to hardcoded config
      }

      // Make API request to sync user
      const response = await backendExtApi.makeApiRequest({
        config_id: configId,
        method: isUpdate ? 'PATCH' : 'POST',
        url: 'https://stg.merahputih-id.tech:5002/api/customerportal/user/command',
        data: userData
      });

      // Check if external API returned an error
      if (response?.data?.error || (response?.data?.success === false)) {
        const errorData = response.data?.error || response.data;
        let errorMessage = 'Failed to sync PIC to external API';
        
        // Extract error message from different possible structures
        if (errorData?.data?.message) {
          errorMessage = errorData.data.message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        
        console.error('❌ External API error:', errorMessage, errorData);
        console.error('❌ Branch ID used:', accountData.branch_uuid_be);
        console.error('❌ Customer ID used:', accountData.uuid_be);
        
        // Provide more helpful error message for specific errors
        if (errorMessage.toLowerCase().includes('branch') || errorMessage.toLowerCase().includes('branch id')) {
          message.error({
            content: `Sync failed: ${errorMessage}. Please ensure the account branch is synced to external API first. Branch ID: ${accountData.branch_uuid_be}`,
            duration: 8
          });
        } else {
          message.error(`Sync failed: ${errorMessage}`);
        }
        return; // Exit early, don't process as success
      }

      // Extract ID from response (for POST operation)
      let externalId = null;
      if (!isUpdate && response) {
        // Try different response structures to get the ID
        if (response.data?.id) {
          externalId = response.data.id;
        } else if (response.data?.data?.id) {
          externalId = response.data.data.id;
        } else if (response.id) {
          externalId = response.id;
        } else if (response.data) {
          // If response.data is a string (UUID), use it directly
          externalId = typeof response.data === 'string' ? response.data : null;
        }
      }

      // If we got a new ID from POST, save it to database
      if (externalId && pic.id) {
        try {
          await updateAccountPIC(pic.id, { uuid_be: externalId });
          
          // Update local state with new uuid_be
          const updatedPICs = localPICs.map(p =>
            (p.id === pic.id || p.tempId === pic.tempId)
              ? { ...p, uuid_be: externalId }
              : p
          );
          setLocalPICs(updatedPICs);
          onChange(updatedPICs);
        } catch (updateError) {
          console.error('❌ Error saving external ID to database:', updateError);
          message.warning('PIC synced but failed to save external ID. Please refresh the page.');
        }
      }

      message.success(isUpdate ? 'PIC updated successfully' : 'PIC synced successfully');
      
      // Refresh PICs list if onPICUpdate callback is provided
      if (onPICUpdate) {
        await fetchUpdatedPICs();
        onPICUpdate();
      }
    } catch (error) {
      console.error('❌ Error syncing PIC to external API:', error);
      console.error('❌ Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      // Extract error message from different possible structures
      let errorMessage = 'Failed to sync PIC to external API';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          if (Array.isArray(error.response.data.error)) {
            errorMessage = error.response.data.error.join(', ');
          } else if (typeof error.response.data.error === 'string') {
            errorMessage = error.response.data.error;
          }
        } else if (error.response.data.success === false && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
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
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
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
            // Show sync button if PIC has an ID (either uuid_be or regular id)
            const hasPicId = !!(record.uuid_be || record.id);
            const hasAccountUuid = !!(accountData?.uuid_be);
            const hasBranchUuid = !!(accountData?.branch_uuid_be);
            const canSync = hasPicId && hasAccountUuid && hasBranchUuid;
            const picId = record.uuid_be || record.id;
            
            if (!hasPicId) {
              return null; // Don't show sync button if PIC has no ID
            }
            
            // Determine tooltip message based on what's missing
            let tooltipMessage = "Sync to External API";
            if (!canSync) {
              if (!hasAccountUuid) {
                tooltipMessage = "Account must be synced first before syncing PIC";
              } else if (!hasBranchUuid) {
                tooltipMessage = "Account branch must be synced first before syncing PIC";
              } else {
                tooltipMessage = "Cannot sync PIC (missing required data)";
              }
            }
            
            return (
              <Tooltip 
                key="sync" 
                title={tooltipMessage}
              >
                <Button 
                  icon={<SyncOutlined />} 
                  onClick={() => handleSyncPIC(record)}
                  loading={syncLoading[picId]}
                  size="small"
                  type="primary"
                  disabled={!canSync}
                />
              </Tooltip>
            );
          })()}
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
        <Form form={form} layout="vertical" initialValues={{ 
          role: 'LOCATION_PARTNER',
          is_owner: true,
          web_portal: false,
          mobile: false,
          role_access: 'ADMIN',
          role_access_mobile: 'CUSTOMER'
        }}>
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
            <Input id="pic_name" placeholder="Enter name" autoComplete="name" />
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
            <Input id="pic_fix_phone_no" placeholder="Enter fix line phone number" autoComplete="tel" />
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
            <Input id="pic_phone_no" placeholder="Enter phone number" autoComplete="tel" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: false, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input id="pic_email" placeholder="Enter email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="no_ktp"
            label="No KTP"
            rules={[
              { required: true, message: 'Please enter No KTP' },
              { type: 'string', message: 'Please enter a valid No KTP' }
            ]}
          >
            <Input id="pic_no_ktp" placeholder="Enter No KTP" autoComplete="off" />

          </Form.Item>
          <Form.Item
            name="no_npwp"
            label="No NPWP"
            rules={[
              { required: true, message: 'Please enter No NPWP' },
              { type: 'string', message: 'Please enter a valid No NPWP' }
            ]}
          >
            <Input id="pic_no_npwp" placeholder="Enter No NPWP" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter Username' },
              { type: 'string', message: 'Please enter a valid Username' }
            ]}
          >
            <Input id="pic_username" placeholder="Enter Username" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: !editingPIC, message: 'Please enter Password' },
              { type: 'string', message: 'Please enter a valid Password' }
            ]}
          >
            <Input.Password 
              id="pic_password"
              placeholder={editingPIC ? "Leave blank to keep current password" : "Enter Password"} 
              autoComplete="off" 
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[
              { required: true, message: 'Please select role' }
            ]}
          >
            <Select id="pic_role" placeholder="Select role">
              <Select.Option value="LOCATION_PARTNER">LOCATION_PARTNER</Select.Option>
              <Select.Option value="NETWORK_PARTNER">NETWORK_OWNER</Select.Option>
              <Select.Option value="DEDICATED">DEDICATED</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="role_access"
            label="Role Access"
            rules={[
              { required: true, message: 'Please select role access' }
            ]}
          >
            <Select id="pic_role_access" placeholder="Select role access">
              <Select.Option value="ADMIN">ADMIN</Select.Option>
              <Select.Option value="SUPER_ADMIN">SUPER_ADMIN</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="role_access_mobile"
            label="Mobile Role Access"
            rules={[
              { required: true, message: 'Please select mobile role access' }
            ]}
          >
            <Select id="pic_role_access_mobile" placeholder="Select mobile role access">
              <Select.Option value="CUSTOMER">CUSTOMER</Select.Option>
              <Select.Option value="MESIN">MESIN</Select.Option>
              <Select.Option value="NON_MESIN">NON_MESIN</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="web_portal"
            label="Web Portal Access"
            valuePropName="checked"
            rules={[
              { required: true, message: 'Please select web portal access' }
            ]}
          >
            <Switch id="pic_web_portal" />
          </Form.Item>

          <Form.Item
            name="mobile"
            label="Mobile Access"
            valuePropName="checked"
            rules={[
              { required: true, message: 'Please select mobile access' }
            ]}
          >
            <Switch id="pic_mobile" />
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