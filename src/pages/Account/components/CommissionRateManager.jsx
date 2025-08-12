import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Row, Col, Divider, Space, Table, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  createCommissionRate, 
  getCommissionRates, 
  updateCommissionRate, 
  deleteCommissionRate 
} from '../../../api/accountCommissionApi';

const CommissionRateManager = ({ accountId, accountCategories, selectedAccountCategories, onCommissionRatesChange, initialCommissionRates }) => {
  const [formValues, setFormValues] = useState({
    commission_type: '',
    commission_rate: '',
    rate_type: 'percentage',
    territory: '',
    exclusive: false,
    notes: ''
  });
  const [commissionRates, setCommissionRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);

  // Helper functions for form management
  const getFieldValue = (fieldName) => {
    return formValues[fieldName];
  };

  const setFieldValue = (fieldName, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const resetFields = () => {
    setFormValues({
      commission_type: '',
      commission_rate: '',
      rate_type: 'percentage',
      territory: '',
      exclusive: false,
      notes: ''
    });
  };

  const setFieldsValue = (values) => {
    setFormValues(prev => ({
      ...prev,
      ...values
    }));
  };
  useEffect(() => {
    // Notify parent component about commission rates change
    if (onCommissionRatesChange) {
      onCommissionRatesChange(commissionRates);
    }
  }, [commissionRates, onCommissionRatesChange]);

  // Helper functions
  const isReferralCategory = (categoryIds, categories) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return false;
    const referralCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('referral') || cat.name.toLowerCase().includes('referal')
    );
    return referralCategory && categoryIds.includes(referralCategory.id);
  };

  const isLocationPartnerCategory = (categoryIds, categories) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return false;
    const locationPartnerCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('location partner') || 
      cat.name.toLowerCase().includes('location_partner') ||
      cat.name.toLowerCase().includes('locationpartner')
    );
    return locationPartnerCategory && categoryIds.includes(locationPartnerCategory.id);
  };

  useEffect(() => {
    // If we have initial commission rates from parent, use those first
    if (initialCommissionRates && initialCommissionRates.length > 0 && commissionRates.length === 0) {
      setCommissionRates(initialCommissionRates);
      return;
    }
    
    // Only fetch commission rates if we don't have any in local state
    // This prevents overriding local changes when navigating between tabs
    if (accountId && commissionRates.length === 0) {
      fetchCommissionRates();
    } else if (accountId && commissionRates.length > 0) {
    }
  }, [accountId, initialCommissionRates]); // Add initialCommissionRates to dependencies

  const fetchCommissionRates = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await getCommissionRates(accountId);
      
      // Handle different response structures
      let commissionData = [];
      if (response && Array.isArray(response)) {
        commissionData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        commissionData = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        commissionData = response.data;
      }
      setCommissionRates(commissionData);
    } catch (error) {
      console.error('Error fetching commission rates:', error);
      message.error('Failed to fetch commission rates');
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshFromBackend = async () => {
    setCommissionRates([]); // Clear local state first
    await fetchCommissionRates();
  };

  const handleAddCommissionClick = async () => {
    try {
      // Manual validation since we're not using Form validation
      const commissionType = getFieldValue('commission_type');
      const commissionRate = getFieldValue('commission_rate');
      
      if (!commissionType) {
        message.error('Please select commission type');
        return;
      }
      
      if (!commissionRate || commissionRate === '') {
        message.error('Please enter commission rate');
        return;
      }
      
      const values = {
        commission_type: commissionType,
        commission_rate: commissionRate,
        rate_type: getFieldValue('rate_type'),
        territory: getFieldValue('territory'),
        exclusive: getFieldValue('exclusive'),
        notes: getFieldValue('notes'),
      };
      
      // Call the submit handler
      await handleSubmitCommission(values);
    } catch (error) {
      console.error('Error in handleAddCommissionClick:', error);
      message.error('Failed to add commission rate');
    }
  };

  const handleSubmitCommission = async (values) => {
    try {
      setLoading(true);
      
      const commissionData = {
        commission_type: values.commission_type,
        commission_rate: parseFloat(values.commission_rate),
        rate_type: values.rate_type || 'percentage',
        territory: values.territory || '',
        exclusive: values.exclusive !== undefined ? values.exclusive : false,
        notes: values.notes || '',
        id: editingCommission?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`, // More unique ID
      };

      // Update local state first
      let newCommissionRates;
      if (editingCommission) {
        newCommissionRates = commissionRates.map(rate => 
          rate.id === editingCommission.id ? { ...rate, ...commissionData } : rate
        );
        message.success('Commission rate updated successfully');
      } else {
        newCommissionRates = [...commissionRates, commissionData];
        message.success('Commission rate added successfully');
      }

      // Update local state
      setCommissionRates(newCommissionRates);
      
      // Reset form and editing state
      resetFields();
      setEditingCommission(null);
      
    } catch (error) {
      console.error('=== ERROR in handleSubmitCommission ===');
      console.error('Error object:', error);
      
      const errorMessage = error.message || 'Failed to save commission rate';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommission = (record) => {
    setEditingCommission(record);
    
    // Set form values using our custom helper functions
    setFieldsValue({
      commission_type: record.commission_type,
      commission_rate: record.commission_rate,
      rate_type: record.rate_type || 'percentage',
      notes: record.notes || '',
      territory: record.territory || '',
      exclusive: record.exclusive || false,
    });
  };

  const handleDeleteCommission = async (id) => {
    try {
      setLoading(true);
      
      // Check if this is a temp ID (newly added, not saved to backend yet)
      const isTemp = typeof id === 'string' && id.startsWith('temp_');
      
      if (!isTemp) {
        // Delete from backend first if it's not a temporary record
        await deleteCommissionRate(id);
        console.log('Successfully deleted from backend');
      } else {
        console.log('Skipping backend delete - this is a temporary record');
      }
      
      // Then remove from local state
      const originalLength = commissionRates.length;
      const newCommissionRates = commissionRates.filter(rate => {
        const shouldKeep = rate.id !== id && rate.id != id; // Use both strict and loose comparison
        return shouldKeep;
      });
      
      if (newCommissionRates.length === originalLength) {
        message.warning('Commission rate not found');
        return;
      }
      
      setCommissionRates(newCommissionRates);
      
      // Notify parent component
      if (onCommissionRatesChange) {
        onCommissionRatesChange(newCommissionRates);
      }
      
      message.success('Commission rate deleted successfully');
    } catch (error) {
      console.error('=== ERROR DELETING COMMISSION ===');
      console.error('Error deleting commission rate:', error);
      if (error.response?.status === 404) {
        message.error('Commission rate not found in database');
      } else {
        message.error('Failed to delete commission rate');
      }
    } finally {
      setLoading(false);
    }
  };

  const commissionColumns = [
    {
      title: 'Commission Type',
      dataIndex: 'commission_type',
      key: 'commission_type',
      render: (text) => text === 'referral' ? 'Referral' : 'Location Partner',
    },
    {
      title: 'Rate (%)',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
    },
    {
      title: 'Rate Type',
      dataIndex: 'rate_type',
      key: 'rate_type',
    },
    {
      title: 'Territory',
      dataIndex: 'territory',
      key: 'territory',
    },
    {
      title: 'Exclusive',
      dataIndex: 'exclusive',
      key: 'exclusive',
      render: (exclusive) => exclusive ? 'Yes' : 'No',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditCommission(record)}
          />
          <Popconfirm
            title="Are you sure to delete this commission rate?"
            onConfirm={() => handleDeleteCommission(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isReferralCategory(selectedAccountCategories, accountCategories) && 
      !isLocationPartnerCategory(selectedAccountCategories, accountCategories)) {
    return null;
  }

  // If no accountId, show message to save account first
  if (!accountId) {
    return (
      <Card title="Commission Rate Management">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
          <p>Please save the account first before managing commission rates.</p>
          <p>Commission rates can only be added to existing accounts.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Commission Rate Management">
      <div>
        <Row gutter={16}>
          <Col span={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Commission Type <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <Select 
                placeholder="Select commission type"
                value={getFieldValue('commission_type')}
                onChange={(value) => {
                  setFieldValue('commission_type', value);
                  console.log('Commission type changed:', value);
                }}
                style={{ width: '100%' }}
              >
                {isReferralCategory(selectedAccountCategories, accountCategories) && (
                  <Select.Option value="referral">Referral</Select.Option>
                )}
                {isLocationPartnerCategory(selectedAccountCategories, accountCategories) && (
                  <Select.Option value="location_partner">Location Partner</Select.Option>
                )}
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Commission Rate (%) <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <Input 
                type="number" 
                placeholder="Enter commission rate" 
                min="0" 
                max="100" 
                step="0.01"
                addonAfter="%" 
                value={getFieldValue('commission_rate')}
                onChange={(e) => {
                  setFieldValue('commission_rate', e.target.value);
                }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Rate Type
              </label>
              <Select 
                placeholder="Select rate type"
                value={getFieldValue('rate_type') || 'percentage'}
                onChange={(value) => {
                  setFieldValue('rate_type', value);
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value="percentage">Percentage</Select.Option>
                <Select.Option value="fixed_amount">Fixed Amount</Select.Option>
                <Select.Option value="tiered">Tiered</Select.Option>
                <Select.Option value="revenue_share">Revenue Share</Select.Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Territory/Area
              </label>
              <Input 
                placeholder="Enter territory or area coverage"
                value={getFieldValue('territory')}
                onChange={(e) => {
                  setFieldValue('territory', e.target.value);
                }}
              />
            </div>
          </Col>
          <Col span={12}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Exclusive
              </label>
              <Select 
                placeholder="Select exclusivity"
                value={getFieldValue('exclusive') !== undefined ? getFieldValue('exclusive') : false}
                onChange={(value) => {
                  setFieldValue('exclusive', value);
                }}
                style={{ width: '100%' }}
              >
                <Select.Option value={true}>Exclusive</Select.Option>
                <Select.Option value={false}>Non-Exclusive</Select.Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={24}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Notes
              </label>
              <Input.TextArea 
                rows={3} 
                placeholder="Enter commission calculation notes or special terms"
                value={getFieldValue('notes')}
                onChange={(e) => {
                  setFieldValue('notes', e.target.value);
                }}
              />
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '16px' }}>
          <Space>
            <Button 
              type="primary" 
              loading={loading} 
              icon={<PlusOutlined />}
              onClick={handleAddCommissionClick}
            >
              {editingCommission ? 'Update' : 'Add'} Commission Rate
            </Button>
            {editingCommission && (
              <Button onClick={() => {
                setEditingCommission(null);
                resetFields();
              }}>
                Cancel
              </Button>
            )}
            <Button 
              icon={<ReloadOutlined />}
              onClick={forceRefreshFromBackend}
              title="Refresh from database"
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      <Divider />

      <Table
        columns={commissionColumns}
        dataSource={commissionRates}
        rowKey={(record) => {
          return record.id;
        }}
        loading={loading}
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default CommissionRateManager;
