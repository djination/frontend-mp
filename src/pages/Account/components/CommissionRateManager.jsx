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
  const [commissionForm] = Form.useForm();
  const [commissionRates, setCommissionRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCommission, setEditingCommission] = useState(null);

  // Debug log untuk melihat perubahan state
  useEffect(() => {
    console.log('Commission rates state updated:', commissionRates);
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
    console.log('useEffect - accountId:', accountId); // Debug log
    console.log('useEffect - current commissionRates length:', commissionRates.length); // Debug log
    console.log('useEffect - initialCommissionRates:', initialCommissionRates); // Debug log
    
    // If we have initial commission rates from parent, use those first
    if (initialCommissionRates && initialCommissionRates.length > 0 && commissionRates.length === 0) {
      console.log('Setting initial commission rates from parent');
      setCommissionRates(initialCommissionRates);
      return;
    }
    
    // Only fetch commission rates if we don't have any in local state
    // This prevents overriding local changes when navigating between tabs
    if (accountId && commissionRates.length === 0) {
      console.log('Fetching commission rates from backend...');
      fetchCommissionRates();
    } else if (accountId && commissionRates.length > 0) {
      console.log('Skipping fetch - commission rates already exist in local state');
    }
  }, [accountId, initialCommissionRates]); // Add initialCommissionRates to dependencies

  const fetchCommissionRates = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await getCommissionRates(accountId);
      console.log('Commission rates response:', response); // Debug log
      
      // Handle different response structures
      let commissionData = [];
      if (response && Array.isArray(response)) {
        commissionData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        commissionData = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        commissionData = response.data;
      }
      
      console.log('Setting commission rates:', commissionData); // Debug log
      setCommissionRates(commissionData);
    } catch (error) {
      console.error('Error fetching commission rates:', error);
      message.error('Failed to fetch commission rates');
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshFromBackend = async () => {
    console.log('Force refreshing commission rates from backend...');
    setCommissionRates([]); // Clear local state first
    await fetchCommissionRates();
  };

  const handleAddCommissionClick = async () => {
    console.log('=== START handleAddCommissionClick ===');
    try {
      // Validate form first
      const values = await commissionForm.validateFields();
      console.log('Form validation passed, values:', values);
      
      // Call the submit handler
      await handleSubmitCommission(values);
    } catch (error) {
      console.error('Error in handleAddCommissionClick:', error);
      if (error.errorFields) {
        // Form validation errors
        console.log('Form validation errors:', error.errorFields);
        message.error('Please fix the form errors');
      } else {
        message.error('Failed to add commission rate');
      }
    }
  };

  const handleSubmitCommission = async (values) => {
    console.log('=== START handleSubmitCommission ===');
    console.log('Form values received:', values);
    console.log('EditingCommission:', editingCommission);
    
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
      console.log('Processed commission data:', commissionData);
      console.log('Commission data ID type:', typeof commissionData.id);

      // Update local state first
      let newCommissionRates;
      if (editingCommission) {
        console.log('Updating existing commission rate in local state');
        newCommissionRates = commissionRates.map(rate => 
          rate.id === editingCommission.id ? { ...rate, ...commissionData } : rate
        );
        message.success('Commission rate updated successfully');
      } else {
        console.log('Adding new commission rate to local state');
        newCommissionRates = [...commissionRates, commissionData];
        message.success('Commission rate added successfully');
      }

      // Update local state
      setCommissionRates(newCommissionRates);
      
      // Reset form and editing state
      console.log('Resetting form and state...');
      commissionForm.resetFields();
      setEditingCommission(null);
      
      console.log('=== END handleSubmitCommission (SUCCESS) ===');
      
    } catch (error) {
      console.error('=== ERROR in handleSubmitCommission ===');
      console.error('Error object:', error);
      
      const errorMessage = error.message || 'Failed to save commission rate';
      message.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  };

  const handleEditCommission = (record) => {
    console.log('Editing commission record:', record);
    setEditingCommission(record);
    
    // Set form values using setFieldValue method to ensure UI updates
    commissionForm.setFieldValue('commission_type', record.commission_type);
    commissionForm.setFieldValue('commission_rate', record.commission_rate);
    commissionForm.setFieldValue('rate_type', record.rate_type || 'percentage');
    commissionForm.setFieldValue('notes', record.notes || '');
    commissionForm.setFieldValue('territory', record.territory || '');
    commissionForm.setFieldValue('exclusive', record.exclusive || false);
    
    // Force re-render by updating form fields
    setTimeout(() => {
      commissionForm.setFieldsValue({
        commission_type: record.commission_type,
        commission_rate: record.commission_rate,
        rate_type: record.rate_type || 'percentage',
        notes: record.notes || '',
        territory: record.territory || '',
        exclusive: record.exclusive || false,
      });
    }, 100);
  };

  const handleDeleteCommission = async (id) => {
    console.log('=== START DELETE COMMISSION ===');
    console.log('Deleting commission with ID:', id);
    console.log('Current commission rates:', commissionRates);
    console.log('Commission rates IDs:', commissionRates.map(r => ({ id: r.id, type: typeof r.id })));
    
    try {
      setLoading(true);
      
      // Check if this is a temp ID (newly added, not saved to backend yet)
      const isTemp = typeof id === 'string' && id.startsWith('temp_');
      
      if (!isTemp) {
        // Delete from backend first if it's not a temporary record
        console.log('Deleting from backend, ID:', id);
        await deleteCommissionRate(id);
        console.log('Successfully deleted from backend');
      } else {
        console.log('Skipping backend delete - this is a temporary record');
      }
      
      // Then remove from local state
      const originalLength = commissionRates.length;
      const newCommissionRates = commissionRates.filter(rate => {
        const shouldKeep = rate.id !== id && rate.id != id; // Use both strict and loose comparison
        console.log(`Rate ID: ${rate.id} (${typeof rate.id}), Delete ID: ${id} (${typeof id}), Keep: ${shouldKeep}`);
        return shouldKeep;
      });
      
      console.log('Original length:', originalLength);
      console.log('New length:', newCommissionRates.length);
      console.log('Commission rates after deletion:', newCommissionRates);
      
      if (newCommissionRates.length === originalLength) {
        console.log('WARNING: No commission rate was deleted - ID not found!');
        message.warning('Commission rate not found');
        return;
      }
      
      setCommissionRates(newCommissionRates);
      
      // Notify parent component
      if (onCommissionRatesChange) {
        onCommissionRatesChange(newCommissionRates);
      }
      
      message.success('Commission rate deleted successfully');
      console.log('=== DELETE COMMISSION SUCCESS ===');
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
      <Form form={commissionForm} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="commission_type"
              label="Commission Type"
              rules={[{ required: true, message: 'Please select commission type' }]}
            >
              <Select 
                placeholder="Select commission type"
                onChange={(value) => {
                  console.log('Commission type changed:', value);
                }}
              >
                {isReferralCategory(selectedAccountCategories, accountCategories) && (
                  <Select.Option value="referral">Referral</Select.Option>
                )}
                {isLocationPartnerCategory(selectedAccountCategories, accountCategories) && (
                  <Select.Option value="location_partner">Location Partner</Select.Option>
                )}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="commission_rate"
              label="Commission Rate (%)"
              rules={[{ required: true, message: 'Please enter commission rate' }]}
            >
              <Input 
                type="number" 
                placeholder="Enter commission rate" 
                min="0" 
                max="100" 
                step="0.01"
                addonAfter="%" 
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="rate_type"
              label="Rate Type"
            >
              <Select 
                placeholder="Select rate type"
                defaultValue="percentage"
              >
                <Select.Option value="percentage">Percentage</Select.Option>
                <Select.Option value="fixed_amount">Fixed Amount</Select.Option>
                <Select.Option value="tiered">Tiered</Select.Option>
                <Select.Option value="revenue_share">Revenue Share</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="territory"
              label="Territory/Area"
            >
              <Input 
                placeholder="Enter territory or area coverage"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="exclusive"
              label="Exclusive"
            >
              <Select 
                placeholder="Select exclusivity"
                defaultValue={false}
              >
                <Select.Option value={true}>Exclusive</Select.Option>
                <Select.Option value={false}>Non-Exclusive</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="notes"
              label="Notes"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Enter commission calculation notes or special terms"
              />
            </Form.Item>
          </Col>
        </Row>

        <div>
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
                commissionForm.resetFields();
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
      </Form>

      <Divider />

      <Table
        columns={commissionColumns}
        dataSource={commissionRates}
        rowKey={(record) => {
          console.log('Table rowKey for record:', record.id, typeof record.id);
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
