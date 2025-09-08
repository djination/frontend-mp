import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Space, Modal, Form, Input, DatePicker, 
  InputNumber, message, Popconfirm, Typography, Tag, Tooltip
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
    console.log('=== fetchPublishedPackageTiers called ===');
    setLoading(true);
    try {
      const response = await getPublishedPackageTiers();
      console.log('Fetched response:', response);
      
      // Handle response structure: { success: true, data: [...] }
      const data = response.data || response;
      console.log('Extracted data:', data);
      console.log('Data is array:', Array.isArray(data));
      console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
      
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
    console.log('=== Editing record ===', record);
    setEditingRecord(record);
    
    // Ensure numeric values are properly converted
    const formData = {
      min_value: Number(record.min_value),
      max_value: Number(record.max_value),
      amount: Number(record.amount),
      percentage: record.percentage ? Number(record.percentage) : undefined,
      date_range: [dayjs(record.start_date), dayjs(record.end_date)]
    };
    
    console.log('=== Form data to set ===', formData);
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
    console.log('=== Form submitted with values ===', values);
    try {
      const submitData = {
        min_value: values.min_value,
        max_value: values.max_value,
        amount: values.amount,
        percentage: values.percentage,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
      };
      
      console.log('=== Submit data ===', submitData);

      if (editingRecord) {
        console.log('=== Updating record ===', editingRecord.id);
        await updatePublishedPackageTier(editingRecord.id, submitData);
        message.success('Published package tier updated successfully');
      } else {
        console.log('=== Creating new record ===');
        await createPublishedPackageTier(submitData);
        message.success('Published package tier created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      fetchPublishedPackageTiers();
    } catch (error) {
      console.error('Error saving published package tier:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.message) {
        message.error(Array.isArray(error.response.data.message) 
          ? error.response.data.message[0]
          : error.response.data.message);
      } else {
        message.error('Failed to save published package tier');
      }
    }
  };

  const handleMassUploadSuccess = () => {
    console.log('=== handleMassUploadSuccess called ===');
    console.log('Refreshing published package tiers data...');
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
                  if (value !== null && value !== undefined && value >= 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Value must be positive!'));
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
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
                  if (value !== null && value !== undefined && value >= 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Value must be positive!'));
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
                  if (value !== null && value !== undefined && value >= 0) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Amount must be positive!'));
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
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
                  if (value === null || value === undefined || value === '') {
                    return Promise.resolve(); // Optional field
                  }
                  if (value >= 0 && value <= 100) {
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
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace('%', '')}
              placeholder="Enter percentage"
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
