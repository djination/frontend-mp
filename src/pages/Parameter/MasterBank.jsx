import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Switch, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

// Import API yang sudah dibuat
import { getBanks, createBank, updateBank, deleteBank } from '../../api/bankApi';

const MasterBank = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async (params = {}) => {
    setLoading(true);
    try {
      // Add pagination parameters to the request
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      };
      
      const response = await getBanks(queryParams);
      
      if (response && response.data) {
        setData(response.data);
        
        // Update pagination info if available from backend
        if (response.meta) {
          setPagination({
            ...pagination,
            total: response.meta.total || response.data.length,
          });
        } else {
          // If backend doesn't provide meta info, just use the data length
          setPagination({
            ...pagination,
            total: response.data.length,
          });
        }
      } else {
        setData([]);
        setPagination({
          ...pagination,
          total: 0,
        });
      }
    } catch (error) {
      message.error('Failed to fetch banks');
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    // Reset pagination to page 1 when searching
    setPagination({
      ...pagination,
      current: 1,
    });
    fetchBanks(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchBanks({
      ...form.getFieldsValue(),
      page: pagination.current,
      limit: pagination.pageSize,
      sort: sorter.field,
      order: sorter.order,
      ...filters,
    });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteBank(id);
      message.success('Bank deleted successfully');
      fetchBanks(form.getFieldsValue());
    } catch (error) {
      message.error('Failed to delete bank');
      console.error(error);
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (editingRecord) {
        // Update existing bank
        await updateBank(editingRecord.id, values);
        message.success('Bank updated successfully');
      } else {
        // Create new bank
        await createBank(values);
        message.success('Bank created successfully');
      }
      
      setModalVisible(false);
      fetchBanks(form.getFieldsValue());
    } catch (error) {
      if (error.errorFields) {
        // Form validation error, handled by form itself
        return;
      }
      message.error('Failed to save bank');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Bank Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <span style={{ color: active ? 'green' : 'red' }}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this bank?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="Master Bank">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="name" label="Bank Name">
              <Input placeholder="Search by bank name" />
            </Form.Item>
            
            <Form.Item name="is_active" label="Status">
              <Select 
                placeholder="Select status"
                allowClear
                style={{ width: 200 }}
                options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' },
                ]}
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  htmlType="submit"
                >
                  Search
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Bank
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Bank' : 'Add New Bank'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingRecord ? 'Update' : 'Create'}
        confirmLoading={loading}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Bank Name"
            rules={[{ required: true, message: 'Please enter bank name' }]}
          >
            <Input placeholder="Enter bank name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter description"
            />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MasterBank;