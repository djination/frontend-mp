import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Space, message, Card, 
  Select, Spin, Tooltip, Switch, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ExclamationCircleOutlined, LockOutlined, UnlockOutlined,
  EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/userApi';
import { getRoles } from '../../api/roleApi';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await getUsers(filters);
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (error) {
      message.error('Failed to fetch roles');
      console.error(error);
    }
  };

  const handleSearch = async (values) => {
    await fetchUsers(values);
  };

  const resetSearch = () => {
    searchForm.resetFields();
    fetchUsers();
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    editForm.setFieldsValue({ isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      username: record.username,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      phoneNumber: record.phoneNumber,
      position: record.position,
      roleIds: record.roles?.map(role => role.id),
      isActive: record.isActive
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setPasswordVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
        const values = await editForm.validateFields();
        console.log('Submitting form values:', values); // Debug values
        
        if (editingRecord) {
        await updateUser(editingRecord.id, values);
        message.success('User updated successfully');
        } else {
        await createUser(values);
        message.success('User created successfully');
        }
        
        setModalVisible(false);
        fetchUsers();
    } catch (error) {
        // Handle form validation errors separately from API errors
        if (error.errorFields) {
        return; // Let the form handle its own validation errors
        }
        
        // Handle API error responses
        if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for different error message formats
        if (Array.isArray(errorData.message)) {
            // Handle validation errors array
            message.error(errorData.message[0]);
        } else if (typeof errorData.message === 'string') {
            // Handle single error message
            message.error(errorData.message);
        } else {
            // Generic error
            message.error('Failed to save user. Please check your input.');
        }
        
        console.error('Server response:', errorData);
        } else {
        message.error('An error occurred. Please try again.');
        console.error('Error:', error);
        }
    }
    };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    // {
    //   title: 'Position',
    //   dataIndex: 'position',
    //   key: 'position',
    //   render: (text) => text || '-',
    // },
    {
      title: 'Roles',
      key: 'roles',
      render: (_, record) => (
        <span>
          {record.roles?.map(role => role.name).join(', ') || 'No roles assigned'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <span style={{ color: active ? 'green' : 'red' }}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
              size="small" 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => Modal.confirm({
                title: 'Are you sure you want to delete this user?',
                icon: <ExclamationCircleOutlined />,
                content: 'This action cannot be undone.',
                onOk: () => handleDelete(record.id),
              })} 
              size="small" 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card title="User Management">
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 24 }}
      >
        <Form.Item name="search" style={{ minWidth: 200 }}>
          <Input placeholder="Search by name, email or username" allowClear />
        </Form.Item>
        <Form.Item name="isActive">
          <Select 
            placeholder="Status" 
            style={{ minWidth: 120 }}
            allowClear
            options={[
              { value: true, label: 'Active' },
              { value: false, label: 'Inactive' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Search
          </Button>
        </Form.Item>
        <Form.Item>
          <Button onClick={resetSearch}>
            Reset
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Add User
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading}
      />

      <Modal
        title={editingRecord ? 'Edit User' : 'Add User'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter First name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter Last name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* <Form.Item
            name="position"
            label="Position/Title"
          >
            <Input />
          </Form.Item> */}

          <Form.Item
            name={editingRecord ? 'newPassword' : 'password'}
            label={editingRecord ? 'New Password (leave empty to keep current)' : 'Password'}
            rules={[
              { 
                required: !editingRecord, 
                message: 'Please enter password' 
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value.length >= 8) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Password must be at least 8 characters')
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={editingRecord ? 'Leave empty to keep current password' : 'Enter password'}
              iconRender={visible => 
                visible ? <EyeOutlined onClick={() => setPasswordVisible(!passwordVisible)} /> 
                       : <EyeInvisibleOutlined onClick={() => setPasswordVisible(!passwordVisible)} />
              }
              visibilityToggle={{ visible: passwordVisible }}
            />
          </Form.Item>

          <Form.Item
            name="roleIds"
            label="Roles"
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              allowClear
              style={{ width: '100%' }}
              optionFilterProp="label"
            >
              {roles.map(role => (
                <Select.Option 
                  key={role.id} 
                  value={role.id} 
                  label={role.name}
                >
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren="Active" 
              unCheckedChildren="Inactive"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagementPage;