import React, { useState, useEffect } from 'react';
import { Table, Card, Descriptions, Tag, Typography, Space, Divider, Spin, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { revenueRuleApi } from '../../../../api/revenueRuleApi';

const { Title, Text } = Typography;

const RevenueRuleTableView = ({ data, accountId }) => {
  const [loading, setLoading] = useState(false);
  const [packageTiersData, setPackageTiersData] = useState([]);
  const [billingMethodsData, setBillingMethodsData] = useState([]);
  const [taxRulesData, setTaxRulesData] = useState([]);
  const [termOfPaymentData, setTermOfPaymentData] = useState(null);
  const [addOnsData, setAddOnsData] = useState([]);

  // Load all billing rules data when component mounts or accountId changes
  useEffect(() => {
    if (accountId) {
      loadBillingRulesData();
    }
  }, [accountId]);

  const loadBillingRulesData = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      // Load all billing rules data in parallel
      const [packageTiers, billingMethods, taxRules, termOfPayment, addOns] = await Promise.all([
        revenueRuleApi.packageTiers.getByAccountId(accountId).catch(() => []),
        revenueRuleApi.billingMethods.getByAccountId(accountId).catch(() => []),
        revenueRuleApi.taxRules.getByAccountId(accountId).catch(() => []),
        revenueRuleApi.termOfPayment.getByAccountId(accountId).catch(() => []),
        revenueRuleApi.addOns.getByAccountId(accountId).catch(() => [])
      ]);

      setPackageTiersData(Array.isArray(packageTiers) ? packageTiers : []);
      setBillingMethodsData(Array.isArray(billingMethods) ? billingMethods : []);
      setTaxRulesData(Array.isArray(taxRules) ? taxRules : []);
      setTermOfPaymentData(Array.isArray(termOfPayment) && termOfPayment.length > 0 ? termOfPayment[0] : null);
      setAddOnsData(Array.isArray(addOns) ? addOns : []);
    } catch (error) {
      console.error('Error loading billing rules data:', error);
      message.error('Failed to load billing rules data');
    } finally {
      setLoading(false);
    }
  };

  if (!data && !accountId) {
    return <div>No data available</div>;
  }

  const { charging_metric, billing_rules } = data || {};
  
  // Package Tiers Table Columns
  const packageTierColumns = [
    {
      title: 'Min Value',
      dataIndex: 'min_value',
      key: 'min_value',
      render: (value) => value ? value.toLocaleString() : '-',
      width: 120,
    },
    {
      title: 'Max Value',
      dataIndex: 'max_value',
      key: 'max_value',
      render: (value) => value ? value.toLocaleString() : '-',
      width: 120,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => value ? value.toLocaleString() : '-',
      width: 100,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-',
      width: 120,
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-',
      width: 120,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (value) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Active' : 'Inactive'}
        </Tag>
      ),
      width: 80,
    },
  ];

  // Billing Methods Table Columns
  const billingMethodColumns = [
    {
      title: 'Method',
      dataIndex: 'method_name',
      key: 'method_name',
      width: 150,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (value) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Active' : 'Inactive'}
        </Tag>
      ),
      width: 80,
    },
  ];

  // Tax Rules Table Columns
  const taxRulesColumns = [
    {
      title: 'Tax Type',
      dataIndex: 'tax_type',
      key: 'tax_type',
      width: 100,
    },
    {
      title: 'Rate (%)',
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (value) => value ? `${value}%` : '-',
      width: 100,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (value) => (
        <Tag color={value ? 'green' : 'red'}>
          {value ? 'Active' : 'Inactive'}
        </Tag>
      ),
      width: 80,
    },
  ];

  // Add-Ons Table Columns
  const addOnsColumns = [
    {
      title: 'Add-On Type',
      dataIndex: 'add_ons_type',
      key: 'add_ons_type',
      render: (value) => {
        const labels = {
          'facility_management': 'Facility Management',
          'service_charge': 'Service Charge',
          'consultation': 'Consultation',
          'other': 'Other'
        };
        return labels[value] || value;
      }
    },
    {
      title: 'Billing Type',
      dataIndex: 'billing_type',
      key: 'billing_type',
      render: (value) => {
        const labels = {
          'monthly': 'Monthly',
          'quarterly': 'Quarterly',
          'yearly': 'Yearly',
          'one_time': 'One Time'
        };
        return labels[value] || value;
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => value ? `Rp ${value.toLocaleString('id-ID')}` : '-'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : '-'
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      {loading && <Spin size="large" style={{ display: 'block', margin: '20px auto' }} />}
      
      {/* Charging Metric Overview */}
      <Card title="Charging Metric Overview" style={{ marginBottom: '20px' }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Type">
            <Tag color={charging_metric?.type === 'dedicated' ? 'blue' : 'green'}>
              {charging_metric?.type || 'Not Set'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green">Active</Tag>
          </Descriptions.Item>
        </Descriptions>

        {charging_metric?.type === 'dedicated' && charging_metric.dedicated?.tiers && (
          <div style={{ marginTop: '16px' }}>
            <Title level={5}>Dedicated Tiers Summary</Title>
            <div>
              {charging_metric.dedicated.tiers.map((tier, index) => (
                <Tag key={index} color={tier.type === 'package' ? 'blue' : 'orange'} style={{ margin: '4px' }}>
                  Tier {index + 1}: {tier.type}
                  {tier.type === 'non_package' && ` (${tier.amount?.toLocaleString() || 0})`}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Package Tiers Table */}
      <Card 
        title={
          <Space>
            <span>Package Tiers</span>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small"
              onClick={loadBillingRulesData}
            >
              Refresh
            </Button>
          </Space>
        } 
        style={{ marginBottom: '20px' }}
      >
        <Table
          dataSource={packageTiersData.map((tier, index) => ({ key: index, ...tier }))}
          columns={packageTierColumns}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 600 }}
          locale={{ emptyText: 'No package tiers configured' }}
        />
      </Card>

      {/* Billing Rules */}
      <Card title="Billing Rules" style={{ marginBottom: '20px' }}>
        {/* Billing Methods */}
        <div style={{ marginBottom: '16px' }}>
          <Space style={{ marginBottom: '12px' }}>
            <Title level={5} style={{ margin: 0 }}>Billing Methods</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small"
              onClick={loadBillingRulesData}
            >
              Refresh
            </Button>
          </Space>
          <Table
            dataSource={billingMethodsData.map((method, index) => ({ key: index, ...method }))}
            columns={billingMethodColumns}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 400 }}
            locale={{ emptyText: 'No billing methods configured' }}
          />
        </div>

        {/* Tax Rules */}
        <div style={{ marginBottom: '16px' }}>
          <Space style={{ marginBottom: '12px' }}>
            <Title level={5} style={{ margin: 0 }}>Tax Rules</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small"
              onClick={loadBillingRulesData}
            >
              Refresh
            </Button>
          </Space>
          <Table
            dataSource={taxRulesData.map((rule, index) => ({ key: index, ...rule }))}
            columns={taxRulesColumns}
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 400 }}
            locale={{ emptyText: 'No tax rules configured' }}
          />
        </div>

        {/* Add-Ons */}
        <div>
          <Space style={{ marginBottom: '12px' }}>
            <Title level={5} style={{ margin: 0 }}>Add-Ons</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small"
              onClick={loadBillingRulesData}
            >
              Refresh
            </Button>
          </Space>
          <Table
            columns={addOnsColumns}
            dataSource={addOnsData}
            rowKey="id"
            size="small"
            pagination={false}
            bordered
            scroll={{ x: 400 }}
            locale={{ emptyText: 'No add-ons configured' }}
          />
        </div>

        {/* Term of Payment */}
        <div>
          <Space style={{ marginBottom: '12px' }}>
            <Title level={5} style={{ margin: 0 }}>Term of Payment</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="small"
              onClick={loadBillingRulesData}
            >
              Refresh
            </Button>
          </Space>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Payment Term">
              {termOfPaymentData?.payment_term || 'Not Set'}
            </Descriptions.Item>
            <Descriptions.Item label="Due Days">
              {termOfPaymentData?.due_days || 'Not Set'} days
            </Descriptions.Item>
            <Descriptions.Item label="Late Fee Rate">
              {termOfPaymentData?.late_fee_rate || 'Not Set'}%
            </Descriptions.Item>
            <Descriptions.Item label="Grace Period">
              {termOfPaymentData?.grace_period || 'Not Set'} days
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Card>

      {/* Raw Data Debug (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card title="Debug: Raw Data" style={{ marginTop: '20px' }}>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>
            <strong>Package Tiers:</strong> {packageTiersData.length} items
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>
            <strong>Billing Methods:</strong> {billingMethodsData.length} items
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>
            <strong>Tax Rules:</strong> {taxRulesData.length} items
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>
            <strong>Term of Payment:</strong> {termOfPaymentData ? 'Configured' : 'Not configured'}
          </div>
          <div style={{ fontSize: '12px', marginBottom: '10px' }}>
            <strong>Add-Ons:</strong> {addOnsData.length} items
          </div>
          <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify({ packageTiersData, billingMethodsData, taxRulesData, termOfPaymentData, addOnsData }, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default RevenueRuleTableView;
