import React, { useState } from 'react';
import { Button, Card, message, Space, Typography, Input, Form, Modal } from 'antd';
import { 
  getMachines, createMachine, updateMachine, deleteMachine,
  getBranches, updateBranch,
  getServiceLocations, createServiceLocation, updateServiceLocation,
  getVendors, createVendor, updateVendor
} from '../../api/machineApi';

const { Title, Text } = Typography;
const { TextArea } = Input;

const APITestPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [form] = Form.useForm();
  const [testModal, setTestModal] = useState({ visible: false, type: '', operation: '' });

  const executeTest = async (testFn, testName) => {
    setLoading(true);
    try {
      const result = await testFn();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result, error: null }
      }));
      message.success(`${testName} successful`);
    } catch (error) {
      console.error(`${testName} failed:`, error);
      setResults(prev => ({
        ...prev,
        [testName]: { success: false, data: null, error: error.message }
      }));
      message.error(`${testName} failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testApiEndpoints = [
    {
      group: 'Machine API',
      tests: [
        { name: 'Get Machines', fn: () => getMachines(1, 5) },
        { name: 'Create Machine (Test)', fn: () => createMachine({ name: 'Test Machine', type: 'ATM', status: 'active' }) },
      ]
    },
    {
      group: 'Branch API', 
      tests: [
        { name: 'Get Branches', fn: () => getBranches() },
      ]
    },
    {
      group: 'Service Location API',
      tests: [
        { name: 'Get Service Locations', fn: () => getServiceLocations(1, 5) },
        { name: 'Create Service Location (Test)', fn: () => createServiceLocation({ name: 'Test Location', address: 'Test Address' }) },
      ]
    },
    {
      group: 'Vendor API',
      tests: [
        { name: 'Get Vendors', fn: () => getVendors() },
        { name: 'Create Vendor (Test)', fn: () => createVendor({ name: 'Test Vendor', type: 'ATM' }) },
      ]
    }
  ];

  const renderResult = (testName) => {
    const result = results[testName];
    if (!result) return null;

    return (
      <div style={{ marginTop: 8, padding: 8, backgroundColor: result.success ? '#f6ffed' : '#fff2f0', borderRadius: 4 }}>
        <Text type={result.success ? 'success' : 'danger'}>
          {result.success ? '✅ Success' : '❌ Failed'}
        </Text>
        {result.error && (
          <div style={{ marginTop: 4 }}>
            <Text type="danger" style={{ fontSize: '12px' }}>{result.error}</Text>
          </div>
        )}
        {result.data && (
          <div style={{ marginTop: 4 }}>
            <Text style={{ fontSize: '12px' }}>
              Data: {JSON.stringify(result.data).length > 100 
                ? `${JSON.stringify(result.data).slice(0, 100)}...` 
                : JSON.stringify(result.data)}
            </Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Master Data API Test Page</Title>
      <Text type="secondary">
        Test all master data API endpoints with proper authentication
      </Text>

      <div style={{ marginTop: 24 }}>
        {testApiEndpoints.map((group, groupIndex) => (
          <Card key={groupIndex} title={group.group} style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {group.tests.map((test, testIndex) => (
                <div key={testIndex}>
                  <Space>
                    <Button 
                      onClick={() => executeTest(test.fn, test.name)}
                      loading={loading}
                      type="primary"
                      size="small"
                    >
                      Test {test.name}
                    </Button>
                    <Text>{test.name}</Text>
                  </Space>
                  {renderResult(test.name)}
                </div>
              ))}
            </Space>
          </Card>
        ))}
      </div>

      <Card title="Quick Actions" style={{ marginTop: 16 }}>
        <Space wrap>
          <Button 
            onClick={() => {
              Object.keys(results).forEach(testName => {
                setResults(prev => {
                  const newResults = { ...prev };
                  delete newResults[testName];
                  return newResults;
                });
              });
              message.info('Results cleared');
            }}
          >
            Clear Results
          </Button>
          <Button 
            type="primary"
            onClick={async () => {
              for (const group of testApiEndpoints) {
                for (const test of group.tests) {
                  if (!test.name.includes('Create')) { // Skip create operations in batch test
                    await executeTest(test.fn, test.name);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
                  }
                }
              }
            }}
            loading={loading}
          >
            Run All GET Tests
          </Button>
        </Space>
      </Card>

      <Card title="Results Summary" style={{ marginTop: 16 }}>
        <div>
          <Text>Total tests run: {Object.keys(results).length}</Text><br />
          <Text type="success">Successful: {Object.values(results).filter(r => r.success).length}</Text><br />
          <Text type="danger">Failed: {Object.values(results).filter(r => !r.success).length}</Text>
        </div>
      </Card>
    </div>
  );
};

export default APITestPage;