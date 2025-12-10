import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  message, 
  Modal, 
  Descriptions,
  Alert,
  Tooltip
} from 'antd';
import { 
  SyncOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { getAccounts } from '../../../api/accountApi';
import { getAccountServicesByAccount } from '../../../api/accountServiceApi';
import { hasAutoDeductBilling, syncCustomerToExternalApi, getAvailableBackendConfigs } from '../../../utils/customerSyncUtils';
import backendExtApi from '../../../api/backendExtApi';

const AutoDeductMonitor = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState({});
  const [backendConfigs, setBackendConfigs] = useState([]);
  const [syncHistory, setSyncHistory] = useState({});

  useEffect(() => {
    fetchAutoDeductAccounts();
    fetchBackendConfigs();
  }, []);

  const fetchAutoDeductAccounts = async () => {
    setLoading(true);
    try {
      const response = await getAccounts();
      if (response?.success && response?.data) {
        // Filter accounts yang memiliki Auto Deduct billing
        const allAccounts = response.data;
        const autoDeductAccounts = [];

        for (const account of allAccounts) {
          try {
            // Fetch services for each account to check billing methods
            const servicesResponse = await getAccountServicesByAccount(account.id);
            const services = servicesResponse?.data || [];
            
            // Check if account has auto deduct billing
            const accountWithServices = {
              ...account,
              services: services,
              packageTiers: services.flatMap(service => 
                service.revenue_rules?.filter(rule => 
                  rule.rule_category === 'package_tier' || 
                  rule.rule_path?.includes('package_tier')
                ) || []
              ),
              addOns: services.flatMap(service => 
                service.revenue_rules?.filter(rule => 
                  rule.rule_category === 'add_on' || 
                  rule.rule_path?.includes('add_on')
                ) || []
              )
            };

            if (hasAutoDeductBilling(accountWithServices)) {
              autoDeductAccounts.push(accountWithServices);
            }
          } catch (error) {
            console.error(`Error checking services for account ${account.id}:`, error);
          }
        }

        setAccounts(autoDeductAccounts);
      }
    } catch (error) {
      message.error('Failed to fetch accounts');
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackendConfigs = async () => {
    try {
      const configs = await getAvailableBackendConfigs();
      setBackendConfigs(configs);
    } catch (error) {
      console.error('Error fetching backend configs:', error);
    }
  };

  const handleSyncAccount = async (account) => {
    setSyncing(prev => ({ ...prev, [account.id]: true }));
    
    try {
      const result = await syncCustomerToExternalApi(account);
      
      // Update sync history
      setSyncHistory(prev => ({
        ...prev,
        [account.id]: {
          timestamp: new Date().toISOString(),
          success: result.success,
          error: result.error,
          response: result.response
        }
      }));

      if (result.success) {
        message.success(`Customer ${account.name} synchronized successfully`);
      } else {
        message.error(`Sync failed for ${account.name}: ${result.error}`);
      }
    } catch (error) {
      message.error(`Sync error for ${account.name}: ${error.message}`);
      setSyncHistory(prev => ({
        ...prev,
        [account.id]: {
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        }
      }));
    } finally {
      setSyncing(prev => ({ ...prev, [account.id]: false }));
    }
  };

  const showSyncHistory = (account) => {
    const history = syncHistory[account.id];
    
    Modal.info({
      title: `Sync History - ${account.name}`,
      width: 600,
      content: (
        <div>
          {history ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Last Sync">
                {new Date(history.timestamp).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={history.success ? 'green' : 'red'}>
                  {history.success ? 'Success' : 'Failed'}
                </Tag>
              </Descriptions.Item>
              {history.error && (
                <Descriptions.Item label="Error">
                  {history.error}
                </Descriptions.Item>
              )}
              {history.response && (
                <Descriptions.Item label="Response">
                  <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px' }}>
                    {JSON.stringify(history.response, null, 2)}
                  </pre>
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Alert message="No sync history found for this account" type="info" />
          )}
        </div>
      ),
    });
  };

  const columns = [
    {
      title: 'Account Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.account_no}</div>
        </div>
      ),
    },
    {
      title: 'Auto Deduct Services',
      key: 'autoDeductServices',
      render: (_, record) => {
        const autoDeductCount = record.packageTiers?.filter(tier => 
          tier.billing_method_type === 'Auto Deduct'
        ).length + record.addOns?.filter(addon => 
          addon.billing_method_type === 'Auto Deduct'
        ).length;
        
        return (
          <Tag color="red">
            {autoDeductCount} Service(s)
          </Tag>
        );
      },
    },
    {
      title: 'Last Sync',
      key: 'lastSync',
      render: (_, record) => {
        const history = syncHistory[record.id];
        if (!history) {
          return <Tag color="default">Not synced</Tag>;
        }
        
        return (
          <div>
            <Tag color={history.success ? 'green' : 'red'}>
              {history.success ? 'Success' : 'Failed'}
            </Tag>
            <div className="text-xs text-gray-500">
              {new Date(history.timestamp).toLocaleString()}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sync to External API">
            <Button
              type="primary"
              icon={<SyncOutlined />}
              size="small"
              loading={syncing[record.id]}
              onClick={() => handleSyncAccount(record)}
            >
              Sync
            </Button>
          </Tooltip>
          <Tooltip title="View Sync History">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => showSyncHistory(record)}
            >
              History
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card 
        title="Auto Deduct Account Monitor" 
        extra={
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={fetchAutoDeductAccounts}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        {backendConfigs.length === 0 && (
          <Alert
            message="No Backend Configuration"
            description="No active backend external API configuration found. Please configure external API first."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} accounts with Auto Deduct billing`,
          }}
        />
      </Card>
    </div>
  );
};

export default AutoDeductMonitor;
