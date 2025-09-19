import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Space, Modal, Form, Input, DatePicker, 
  InputNumber, message, Popconfirm, Typography, Tag, Tooltip, notification
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  getPublishedPackageTiers, 
  createPublishedPackageTier,
  updatePublishedPackageTier,
  deletePublishedPackageTier
} from '../../api/publishedPackageTierApi';
import { getPublishedPackageTiersDebug } from '../../api/debugApi';
import MassUploadPublishedPackageTier from '../../components/MassUploadPublishedPackageTier';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PublishedPackageTierPage = () => {
  const [publishedPackageTiers, setPublishedPackageTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [massUploadVisible, setMassUploadVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPublishedPackageTiers();
  }, []);

  const fetchPublishedPackageTiers = async () => {
    setLoading(true);
    try {
      const response = await getPublishedPackageTiers();
      
      // Handle response structure: { success: true, data: [...] }
      const data = response.data || response;
      
      setPublishedPackageTiers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching published package tiers:', error);
      message.error('Failed to fetch published package tiers');
      setPublishedPackageTiers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    
    // Ensure numeric values are properly converted
    const formData = {
      min_value: Number(record.min_value),
      max_value: Number(record.max_value),
      amount: Number(record.amount),
      percentage: record.percentage ? Number(record.percentage) : undefined,
      date_range: [dayjs(record.start_date), dayjs(record.end_date)]
    };
    
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deletePublishedPackageTier(id);
      message.success('Published package tier deleted successfully');
      fetchPublishedPackageTiers();
    } catch (error) {
      console.error('Error deleting published package tier:', error);
      message.error('Failed to delete published package tier');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        min_value: values.min_value,
        max_value: values.max_value,
        amount: values.amount,
        percentage: values.percentage,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
      };

      if (editingRecord) {
        await updatePublishedPackageTier(editingRecord.id, submitData);
        message.success('Published package tier updated successfully');
      } else {
        await createPublishedPackageTier(submitData);
        message.success('Published package tier created successfully');
      }

      // Only close modal and reset form on success
      setModalVisible(false);
      form.resetFields();
      fetchPublishedPackageTiers();
    } catch (error) {
      console.error('Error saving published package tier:', error);
      console.error('Error response:', error.response?.data);
      
      // Show detailed error message for overlaps
      let errorMessage = 'Failed to save published package tier';
      
      if (error.response?.data?.error) {
        // Clean up the error message by removing GMT timezone info
        errorMessage = error.response.data.error
          .replace(/GMT\+\d{4} \([^)]+\)/g, '') // Remove timezone info
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
      } else if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message) 
          ? error.response.data.message[0]
          : error.response.data.message;
      }
      
      // Show error message - use alert as primary method since Ant Design notifications seem to have issues
      if (errorMessage.includes('overlaps with existing tier')) {
        // Primary method: Browser alert (works reliably)
        alert(`❌ OVERLAP ERROR\n\n${errorMessage}`);
        
        // Secondary: Try Ant Design notifications (for debugging)
        try {
          message.error(errorMessage, 10);
        } catch (e) {
          console.error('message.error failed:', e);
        }
        
        try {
          notification.error({
            message: 'Package Tier Overlap Error',
            description: errorMessage,
            duration: 10,
            placement: 'topRight',
          });
        } catch (e) {
          console.error('notification.error failed:', e);
        }
        
      } else {
        // Use alert for regular errors too
        alert(`❌ ERROR\n\n${errorMessage}`);
        
        // Try Ant Design as backup
        try {
          message.error(errorMessage, 6);
        } catch (e) {
          console.error('message.error failed for regular error:', e);
        }
      }
    }
  };

  const handleDebugTiers = async () => {
    try {
      const debugData = await getPublishedPackageTiersDebug();
      console.table(debugData);
      
      Modal.info({
        title: 'Existing Package Tiers',
        width: 800,
        content: (
          <div>
            <p>Current active package tiers in database:</p>
            <pre style={{ background: '#f5f5f5', padding: 10, maxHeight: 400, overflow: 'auto' }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
            <p style={{ marginTop: 10, fontSize: '12px', color: '#666' }}>
              Check the console for a table view of this data.
            </p>
          </div>
        ),
      });
    } catch (error) {
      console.error('Error fetching debug data:', error);
      message.error('Failed to fetch debug data');
    }
  };

  const handleMassUploadSuccess = () => {
    fetchPublishedPackageTiers();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const columns = [
    {
      title: 'Value Range',
      key: 'value_range',
      render: (_, record) => (
        <div>
          <div>{formatCurrency(record.min_value)} - {formatCurrency(record.max_value)}</div>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Range: {formatCurrency(record.max_value - record.min_value)}
          </Typography.Text>
        </div>
      ),
      sorter: (a, b) => a.min_value - b.min_value,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (value) => value ? `${value}%` : '-',
      sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
    },
    {
      title: 'Date Range',
      key: 'date_range',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}</div>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Duration: {dayjs(record.end_date).diff(dayjs(record.start_date), 'days')} days
          </Typography.Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const now = dayjs();
        const startDate = dayjs(record.start_date);
        const endDate = dayjs(record.end_date);
        
        let status = 'Active';
        let color = 'green';
        
        if (now.isBefore(startDate)) {
          status = 'Upcoming';
          color = 'blue';
        } else if (now.isAfter(endDate)) {
          status = 'Expired';
          color = 'red';
        }
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this published package tier?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Published Package Tiers</Title>
      
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>Package Tier Management</Title>
          <Space>
            <Button 
              type="default"
              icon={<UploadOutlined />}
              onClick={() => setMassUploadVisible(true)}
            >
              Mass Upload
            </Button>
            {/* <Button 
              type="default"
              style={{ background: '#f0f0f0' }}
              onClick={handleDebugTiers}
            >
              Debug: Show Existing Tiers
            </Button> */}
            {/* <Button 
              type="default"
              style={{ background: '#fff0f0' }}
              onClick={() => {
                // Test message API
                message.error('Test message.error - should appear as toast!', 5);
                message.success('Test message.success - should also appear!', 3);
                
                // Test notification API
                notification.error({
                  message: 'Test Notification Error',
                  description: 'This is a test error notification using notification API',
                  duration: 5,
                  placement: 'topRight',
                });
                
                notification.success({
                  message: 'Test Notification Success',
                  description: 'This is a test success notification using notification API',
                  duration: 3,
                  placement: 'topRight',
                });
                
                // Test alert as fallback
                setTimeout(() => {
                  alert('Test Alert - this should definitely show up!');
                }, 500);
              }}
            >
              Test All Notifications
            </Button> */}
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Package Tier
            </Button>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={publishedPackageTiers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Published Package Tier' : 'Add Published Package Tier'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="min_value"
            label="Minimum Value"
            rules={[
              { required: true, message: 'Please input minimum value!' },
              { 
                validator: (_, value) => {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Value must be a positive number!'));
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter minimum value"
            />
          </Form.Item>

          <Form.Item
            name="max_value"
            label="Maximum Value"
            rules={[
              { required: true, message: 'Please input maximum value!' },
              { 
                validator: (_, value) => {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Value must be a positive number!'));
                }
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('min_value') < value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Maximum value must be greater than minimum value!'));
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter maximum value"
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: 'Please input amount!' },
              { 
                validator: (_, value) => {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Amount must be a positive number!'));
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter amount"
            />
          </Form.Item>

          <Form.Item
            name="percentage"
            label="Percentage (Optional)"
            rules={[
              { 
                validator: (_, value) => {
                  // Allow empty values for optional field
                  if (value === null || value === undefined || value === '' || value === 0) {
                    return Promise.resolve();
                  }
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Percentage must be between 0 and 100!'));
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.1}
              placeholder="Enter percentage (0-100)"
            />
          </Form.Item>

          <Form.Item
            name="date_range"
            label="Date Range"
            rules={[
              { required: true, message: 'Please select date range!' }
            ]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Start Date', 'End Date']}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Mass Upload Modal */}
      <MassUploadPublishedPackageTier
        visible={massUploadVisible}
        onClose={() => setMassUploadVisible(false)}
        onSuccess={handleMassUploadSuccess}
      />
    </div>
  );
};

export default PublishedPackageTierPage;
