import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  SyncOutlined,
  EyeOutlined
} from '@ant-design/icons';
import backendExtApi from '../../../api/backendExtApi';

const { Option } = Select;
const { TextArea } = Input;

const BackendExtConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form] = Form.useForm();
  const [testingConnection, setTestingConnection] = useState({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching backend ext configurations...');
      const response = await backendExtApi.getConfigs();
      console.log('📥 API Response:', response);
      
      // Handle nested response structure: response.data.data
      let configsData = [];
      
      if (response && response.success && response.data && response.data.data && Array.isArray(response.data.data)) {
        // Nested structure: response.data.data
        configsData = response.data.data;
        console.log('✅ Configurations loaded from response.data.data:', configsData);
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        // Direct data array: response.data
        configsData = response.data;
        console.log('✅ Configurations loaded from response.data:', configsData);
      } else if (response && Array.isArray(response)) {
        // Direct array response
        configsData = response;
        console.log('✅ Direct array response:', configsData);
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        configsData = [];
      }
      
      setConfigs(configsData);
      console.log('📊 Total configurations set:', configsData.length);
    } catch (error) {
      console.error('❌ Error fetching configurations:', error);
      message.error(`Failed to fetch configurations: ${error.message || 'Unknown error'}`);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingConfig) {
        await backendExtApi.updateConfig(editingConfig.id, values);
        message.success('Configuration updated successfully');
      } else {
        await backendExtApi.createConfig(values);
        message.success('Configuration created successfully');
      }
      
      setModalVisible(false);
      setEditingConfig(null);
      form.resetFields();
      fetchConfigs();
    } catch (error) {
      message.error('Failed to save configuration');
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await backendExtApi.deleteConfig(id);
      message.success('Configuration deleted successfully');
      fetchConfigs();
    } catch (error) {
      message.error('Failed to delete configuration');
    }
  };

  const handleTestConnection = async (config) => {
    setTestingConnection(prev => ({ ...prev, [config.id]: true }));
    
    try {
      console.log('🔄 Testing connection for config:', config.name);
      const response = await backendExtApi.testConnection(config);
      console.log('📥 Test connection response:', response);
      
      if (response && response.success) {
        message.success(`Connection test successful for ${config.name}`);
        if (response.data) {
          console.log('✅ Test result:', response.data);
        }
      } else {
        const errorMsg = response?.message || 'Unknown error';
        message.error(`Connection test failed for ${config.name}: ${errorMsg}`);
        console.error('❌ Test failed:', response);
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      message.error(`Connection test error for ${config.name}: ${errorMessage}`);
    } finally {
      setTestingConnection(prev => ({ ...prev, [config.id]: false }));
    }
  };

  const showCacheStatus = async () => {
    try {
      console.log('🔄 Fetching cache status...');
      const response = await backendExtApi.getCacheStatus();
      console.log('📥 Cache status response:', response);
      
      if (response && response.success) {
        const cacheData = response.data || [];
        console.log('✅ Cache data:', cacheData);
        
        if (Array.isArray(cacheData) && cacheData.length > 0) {
          Modal.info({
            title: 'Token Cache Status',
            width: 800,
            content: (
              <Table
                dataSource={cacheData}
                columns={[
                  {
                    title: 'Config ID',
                    dataIndex: 'configId',
                    key: 'configId',
                  },
                  {
                    title: 'Scope',
                    dataIndex: 'scope',
                    key: 'scope',
                  },
                  {
                    title: 'Expires At',
                    dataIndex: 'expiresAt',
                    key: 'expiresAt',
                    render: (timestamp) => new Date(timestamp).toLocaleString(),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'isExpired',
                    key: 'isExpired',
                    render: (isExpired) => (
                      <Tag color={isExpired ? 'red' : 'green'}>
                        {isExpired ? 'Expired' : 'Valid'}
                      </Tag>
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />
            ),
          });
        } else {
          Modal.info({
            title: 'Token Cache Status',
            content: 'No cached tokens found.',
          });
        }
      } else {
        const errorMsg = response?.message || 'Unknown error';
        message.error(`Failed to fetch cache status: ${errorMsg}`);
        console.error('❌ Cache status error:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching cache status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      message.error(`Failed to fetch cache status: ${errorMessage}`);
    }
  };

  const clearAllCache = async () => {
    try {
      console.log('🔄 Clearing all cache...');
      const response = await backendExtApi.clearAllCache();
      console.log('📥 Clear cache response:', response);
      
      if (response && response.success) {
        message.success('All token cache cleared successfully');
        console.log('✅ Cache cleared successfully');
      } else {
        const errorMsg = response?.message || 'Unknown error';
        message.error(`Failed to clear cache: ${errorMsg}`);
        console.error('❌ Clear cache error:', response);
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      message.error(`Failed to clear cache: ${errorMessage}`);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Base URL',
      dataIndex: 'base_url',
      key: 'base_url',
      render: (url) => (
        <Tooltip title={url}>
          <span className="text-blue-600">{url.length > 40 ? `${url.substring(0, 40)}...` : url}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Method & Endpoint',
      key: 'methodUrl',
      render: (_, record) => (
        <div>
          <Tag color="blue">{record.method || 'GET'}</Tag>
          <span className="text-sm">{record.url || 'Not configured'}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Test Connection">
            <Button
              icon={<ApiOutlined />}
              size="small"
              loading={testingConnection[record.id]}
              onClick={() => handleTestConnection(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this configuration?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="Delete">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title="Backend External API Configuration"
        extra={
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={showCacheStatus}
            >
              Cache Status
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={clearAllCache}
            >
              Clear Cache
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingConfig(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add Configuration
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={Array.isArray(configs) ? configs : []}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} configurations`,
          }}
        />
      </Card>

      <Modal
        title={editingConfig ? 'Edit Configuration' : 'Add Configuration'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingConfig(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            method: 'POST',
            is_active: true,
            token_expires_in: 3600,
          }}
        >
          <Form.Item
            name="name"
            label="Configuration Name"
            rules={[{ required: true, message: 'Please enter configuration name' }]}
          >
            <Input placeholder="e.g. Customer Command API" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={2} placeholder="Optional description" />
          </Form.Item>

          <Form.Item
            name="base_url"
            label="Base URL"
            rules={[{ required: true, message: 'Please enter base URL' }]}
          >
            <Input placeholder="https://api.example.com" />
          </Form.Item>

          <Form.Item
            name="token_url"
            label="Token URL (OAuth)"
            rules={[{ required: true, message: 'Please enter token URL' }]}
          >
            <Input placeholder="https://auth.example.com/oauth/token" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="method"
              label="HTTP Method"
              style={{ width: 120 }}
            >
              <Select>
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="PATCH">PATCH</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="url"
              label="API Endpoint"
              style={{ flex: 1 }}
            >
              <Input placeholder="/api/customer/command" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="client_id"
              label="Client ID"
              rules={[{ required: true, message: 'Please enter client ID' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="OAuth Client ID" />
            </Form.Item>

            <Form.Item
              name="client_secret"
              label="Client Secret"
              rules={[{ required: true, message: 'Please enter client secret' }]}
              style={{ flex: 1 }}
            >
              <Input.Password placeholder="OAuth Client Secret" />
            </Form.Item>
          </Space>

          <Form.Item
            name="default_scope"
            label="Default Scope"
          >
            <Input placeholder="admin.internal.read admin.internal.create" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="token_expires_in"
              label="Token Expires (seconds)"
              style={{ width: 200 }}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Status"
              valuePropName="checked"
              style={{ width: 100 }}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Space>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingConfig ? 'Update' : 'Create'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BackendExtConfigPage;
