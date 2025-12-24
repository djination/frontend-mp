import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Divider, Input, notification, Table, Tag, Descriptions, Alert } from 'antd';
import { 
  PlayCircleOutlined, 
  SettingOutlined, 
  ApiOutlined, 
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import machineApiSetup from '../../api/machineApiSetup.js';
import machineApiWithBackendExt from '../../api/machineApiWithBackendExt.js';

const { Title, Text, Paragraph } = Typography;

const BackendExtTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [setupResult, setSetupResult] = useState(null);
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const result = await machineApiSetup.listConfigurations();
      if (result.success) {
        setConfigurations(result.configurations);
        
        // Auto-select machine config if found
        const machineConfig = result.configurations.find(config => 
          config.name.toLowerCase().includes('machine') && config.is_active
        );
        if (machineConfig) {
          setSelectedConfigId(machineConfig.id);
          machineApiWithBackendExt.setConfigId(machineConfig.id);
        }
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
      notification.error({
        message: 'Failed to load configurations',
        description: error.message
      });
    }
  };

  const handleFullSetup = async () => {
    setLoading(true);
    try {
      const result = await machineApiSetup.fullSetupAndTest();
      setSetupResult(result);
      
      if (result.success) {
        notification.success({
          message: 'Setup Successful!',
          description: `Machine API configuration created with ID: ${result.configId}`
        });
        
        // Update the config ID in the API instance
        machineApiWithBackendExt.setConfigId(result.configId);
        setSelectedConfigId(result.configId);
        
        // Reload configurations
        await loadConfigurations();
      } else {
        notification.error({
          message: 'Setup Failed',
          description: result.error
        });
      }
    } catch (error) {
      notification.error({
        message: 'Setup Error',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigIdChange = (value) => {
    setSelectedConfigId(value);
    machineApiWithBackendExt.setConfigId(value);
  };

  const testMachineOperations = async () => {
    if (!selectedConfigId) {
      notification.warning({
        message: 'No Configuration Selected',
        description: 'Please select a configuration first'
      });
      return;
    }

    setLoading(true);
    const results = {};

    try {
      // Test 1: Get Machines
      const machinesResult = await machineApiWithBackendExt.getMachines(1, 5);
      results.getMachines = {
        success: true,
        data: machinesResult,
        count: machinesResult.data?.length || 0
      };

      // Test 2: Get Vendors
      const vendorsResult = await machineApiWithBackendExt.getVendors();
      results.getVendors = {
        success: true,
        data: vendorsResult,
        count: vendorsResult.data?.length || 0
      };

      // Test 3: Get Branches
      const branchesResult = await machineApiWithBackendExt.getBranches();
      results.getBranches = {
        success: true,
        data: branchesResult,
        count: branchesResult.data?.length || 0
      };

      // Test 4: Connection Test
      const connectionResult = await machineApiWithBackendExt.testConnection();
      results.testConnection = connectionResult;

      setTestResults(results);
      
      notification.success({
        message: 'Machine API Tests Completed',
        description: 'All operations tested successfully via backend-ext'
      });

    } catch (error) {
      console.error('Test failed:', error);
      notification.error({
        message: 'Test Failed',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const configColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Base URL',
      dataIndex: 'base_url',
      key: 'base_url',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          size="small" 
          type={selectedConfigId === record.id ? 'primary' : 'default'}
          onClick={() => handleConfigIdChange(record.id)}
        >
          {selectedConfigId === record.id ? 'Selected' : 'Select'}
        </Button>
      )
    }
  ];

  const testColumns = [
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (success) => (
        <Tag icon={success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />} 
             color={success ? 'success' : 'error'}>
          {success ? 'Success' : 'Failed'}
        </Tag>
      )
    },
    {
      title: 'Data Count',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Text>{count} items</Text>
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details) => <Text type="secondary">{details}</Text>
    }
  ];

  const getTestTableData = () => {
    return [
      {
        key: '1',
        operation: 'Get Machines',
        status: testResults.getMachines?.success || false,
        count: testResults.getMachines?.count || 0,
        details: testResults.getMachines?.success ? 'Retrieved machines successfully' : 'Failed to retrieve machines'
      },
      {
        key: '2',
        operation: 'Get Vendors',
        status: testResults.getVendors?.success || false,
        count: testResults.getVendors?.count || 0,
        details: testResults.getVendors?.success ? 'Retrieved vendors successfully' : 'Failed to retrieve vendors'
      },
      {
        key: '3',
        operation: 'Get Branches',
        status: testResults.getBranches?.success || false,
        count: testResults.getBranches?.count || 0,
        details: testResults.getBranches?.success ? 'Retrieved branches successfully' : 'Failed to retrieve branches'
      },
      {
        key: '4',
        operation: 'Connection Test',
        status: testResults.testConnection?.success || false,
        count: '-',
        details: testResults.testConnection?.message || 'Connection test pending'
      }
    ];
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <ApiOutlined /> Backend-Ext Integration Test
      </Title>
      
      <Paragraph>
        This page demonstrates the integration between Machine API and Backend-Ext system.
        Backend-Ext provides centralized configuration management, OAuth token handling, 
        and automatic API request logging.
      </Paragraph>

      {/* Navigation Alert */}
      <Alert
        message="Configuration Management"
        description={
          <span>
            Need to manage backend-ext configurations manually? Visit the{' '}
            <Link to="/master/backend-config">
              <Button type="link" icon={<LinkOutlined />} size="small">
                Backend-Ext Configuration Page
              </Button>
            </Link>
            {' '}for CRUD operations, cache management, and detailed configuration settings.
          </span>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Divider />

      {/* Setup Section */}
      <Card 
        title={<><SettingOutlined /> Initial Setup</>}
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            Create and configure the Machine API backend-ext configuration.
            This will set up OAuth credentials, base URLs, and default endpoints.
          </Paragraph>
          
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            loading={loading}
            onClick={handleFullSetup}
            size="large"
          >
            Run Full Setup & Test
          </Button>

          {setupResult && (
            <Card size="small" style={{ marginTop: '16px' }}>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Status">
                  <Tag color={setupResult.success ? 'success' : 'error'}>
                    {setupResult.success ? 'Success' : 'Failed'}
                  </Tag>
                </Descriptions.Item>
                {setupResult.configId && (
                  <Descriptions.Item label="Config ID">
                    <Text code>{setupResult.configId}</Text>
                  </Descriptions.Item>
                )}
                {setupResult.error && (
                  <Descriptions.Item label="Error">
                    <Text type="danger">{setupResult.error}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Space>
      </Card>

      {/* Configuration List */}
      <Card 
        title={<><DatabaseOutlined /> Available Configurations</>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadConfigurations}>
            Refresh
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table 
          columns={configColumns}
          dataSource={configurations}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Selected Configuration */}
      <Card 
        title="Selected Configuration"
        style={{ marginBottom: '24px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Current Config ID:</Text>
          <Input 
            value={selectedConfigId}
            onChange={(e) => handleConfigIdChange(e.target.value)}
            placeholder="Enter configuration ID"
            style={{ width: '400px' }}
          />
          
          {selectedConfigId && (
            <Button 
              type="primary"
              icon={<ApiOutlined />}
              onClick={testMachineOperations}
              loading={loading}
            >
              Test Machine Operations
            </Button>
          )}
        </Space>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card 
          title={<><CheckCircleOutlined /> Test Results</>}
          style={{ marginBottom: '24px' }}
        >
          <Table 
            columns={testColumns}
            dataSource={getTestTableData()}
            pagination={false}
            size="small"
          />
          
          {/* Detailed Results */}
          <Divider orientation="left">Detailed Results</Divider>
          
          {Object.entries(testResults).map(([key, result]) => (
            <Card key={key} size="small" style={{ marginBottom: '8px' }}>
              <Text strong>{key}: </Text>
              <Tag color={result.success ? 'success' : 'error'}>
                {result.success ? 'Success' : 'Failed'}
              </Tag>
              {result.count !== undefined && (
                <Text type="secondary"> ({result.count} items)</Text>
              )}
              <br />
              <Text code style={{ fontSize: '12px' }}>
                {JSON.stringify(result, null, 2).substring(0, 200)}...
              </Text>
            </Card>
          ))}
        </Card>
      )}

      {/* Instructions */}
      <Card 
        title="Usage Instructions"
        type="inner"
      >
        <ol>
          <li><strong>Setup:</strong> Click "Run Full Setup & Test" to create the initial configuration</li>
          <li><strong>Select Config:</strong> Choose a configuration from the table or enter a Config ID manually</li>
          <li><strong>Test Operations:</strong> Click "Test Machine Operations" to verify all API calls work</li>
          <li><strong>View Logs:</strong> Check the backend-ext logs table to see all API requests recorded</li>
          <li><strong>Integration:</strong> Use machineApiWithBackendExt in your components instead of the old machineApi</li>
        </ol>
        
        <Divider />
        
        <Title level={4}>Benefits of Backend-Ext Integration:</Title>
        <ul>
          <li>🔐 <strong>Centralized OAuth Management:</strong> Token generation and caching handled automatically</li>
          <li>📊 <strong>Automatic Logging:</strong> Every API request recorded in m_backend_ext_logs table</li>
          <li>⚙️ <strong>Configuration Management:</strong> Easy to update endpoints and credentials</li>
          <li>🔄 <strong>Token Refresh:</strong> Automatic token renewal when expired</li>
          <li>🛡️ <strong>Error Handling:</strong> Consistent error handling and retry logic</li>
          <li>📈 <strong>Audit Trail:</strong> Complete history of all external API interactions</li>
        </ul>
      </Card>
    </div>
  );
};

export default BackendExtTestPage;