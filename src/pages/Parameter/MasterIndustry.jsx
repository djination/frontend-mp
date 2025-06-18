import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Switch, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

// Import API
import { getIndustries, createIndustry, updateIndustry, deleteIndustry } from '../../api/industryApi';

const MasterIndustry = () => {
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
    fetchIndustries();
  }, []);

  const fetchIndustries = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      };
      
      const response = await getIndustries(queryParams);
      
      if (response && response.data) {
        setData(response.data);
        
        if (response.meta) {
          setPagination({
            ...pagination,
            total: response.meta.total || response.data.length,
          });
        } else {
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
      message.error('Failed to fetch industries');
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setPagination({
      ...pagination,
      current: 1,
    });
    fetchIndustries(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchIndustries({
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
      // description: record.description,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteIndustry(id);
      message.success('Industry deleted successfully');
      fetchIndustries(form.getFieldsValue());
    } catch (error) {
      message.error('Failed to delete industry');
      console.error(error);
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (editingRecord) {
        await updateIndustry(editingRecord.id, values);
        message.success('Industry updated successfully');
      } else {
        await createIndustry(values);
        message.success('Industry created successfully');
      }
      
      setModalVisible(false);
      fetchIndustries(form.getFieldsValue());
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('Failed to save industry');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    // {
    //   title: 'Description',
    //   dataIndex: 'description',
    //   key: 'description',
    // },
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
            title="Are you sure you want to delete this industry?"
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
      <Card title="Master Industry">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="name" label="Name">
              <Input placeholder="Search by industry name" />
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
                  Add Industry
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
        title={editingRecord ? 'Edit Industry' : 'Add New Industry'}
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
            label="Name"
            rules={[{ required: true, message: 'Please enter industry name' }]}
          >
            <Input placeholder="Enter industry name" />
          </Form.Item>
          
          {/* <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter description"
            />
          </Form.Item> */}
          
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

export default MasterIndustry;