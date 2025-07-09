import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Switch, Modal, Tree, Divider
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, BranchesOutlined, TableOutlined } from '@ant-design/icons';

// Import API
import { 
  getBusinessTypes, 
  createBusinessType, 
  updateBusinessType, 
  deleteBusinessType,
  getParentBusinessTypes,
  getChildBusinessTypes,
  getBusinessTypeTree
} from '../../api/businessTypeApi';

const MasterBusinessType = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [parentTypes, setParentTypes] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'tree'

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetchBusinessTypes();
    fetchParentTypes();
    fetchTreeData();
  }, []);

  const fetchBusinessTypes = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      };
      
      const response = await getBusinessTypes(queryParams);
      
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
      message.error('Failed to fetch business types');
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParentTypes = async () => {
    try {
      const response = await getParentBusinessTypes();
      setParentTypes(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch parent business types');
      console.error(error);
    }
  };

  const fetchTreeData = async () => {
    try {
      const response = await getBusinessTypeTree();
      const formattedTreeData = formatTreeData(response?.data || []);
      setTreeData(formattedTreeData);
    } catch (error) {
      message.error('Failed to fetch business type tree');
      console.error(error);
    }
  };

  const formatTreeData = (data) => {
    return data.map(parent => ({
      title: (
        <div>
          <strong>{parent.name}</strong>
          {parent.detail && <div style={{ fontSize: '12px', color: '#666' }}>{parent.detail}</div>}
        </div>
      ),
      key: parent.id,
      children: parent.children?.map(child => ({
        title: (
          <div>
            {child.name}
            {child.is_other && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>(Other)</span>}
            {child.detail && <div style={{ fontSize: '12px', color: '#666' }}>{child.detail}</div>}
          </div>
        ),
        key: child.id,
        isLeaf: true,
      })) || []
    }));
  };

  const handleSearch = (values) => {
    setPagination({
      ...pagination,
      current: 1,
    });
    fetchBusinessTypes(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchBusinessTypes({
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
      detail: record.detail,
      parent_id: record.parent_id,
      is_other: record.is_other,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteBusinessType(id);
      message.success('Business type deleted successfully');
      fetchBusinessTypes(form.getFieldsValue());
      fetchTreeData();
    } catch (error) {
      message.error('Failed to delete business type');
      console.error(error);
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (editingRecord) {
        await updateBusinessType(editingRecord.id, values);
        message.success('Business type updated successfully');
      } else {
        await createBusinessType(values);
        message.success('Business type created successfully');
      }
      
      setModalVisible(false);
      fetchBusinessTypes(form.getFieldsValue());
      fetchTreeData();
      fetchParentTypes();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('Failed to save business type');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text, record) => (
        <div>
          <span>{text}</span>
          {record.is_other && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>(Other)</span>}
          {record.parent && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Parent: {record.parent.name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'detail',
      key: 'detail',
      render: (text) => (
        <div style={{ maxWidth: 200, wordBreak: 'break-word' }}>
          {text}
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, record) => (
        <span style={{ 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '12px',
          backgroundColor: record.parent_id ? '#f0f0f0' : '#e6f7ff',
          color: record.parent_id ? '#666' : '#1890ff'
        }}>
          {record.parent_id ? 'Child' : 'Parent'}
        </span>
      ),
      filters: [
        { text: 'Parent', value: 'parent' },
        { text: 'Child', value: 'child' },
      ],
      onFilter: (value, record) => 
        value === 'parent' ? !record.parent_id : !!record.parent_id,
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
            title="Are you sure you want to delete this business type?"
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
      <Card title="Master Business Type">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
            >
              Table View
            </Button>
            <Button 
              type={viewMode === 'tree' ? 'primary' : 'default'}
              icon={<BranchesOutlined />}
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </Button>
          </Space>
        </div>

        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="name" label="Name">
              <Input placeholder="Search by name" />
            </Form.Item>
            
            <Form.Item name="detail" label="Details">
              <Input placeholder="Search by details" />
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
                  Add Business Type
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
        
        {viewMode === 'table' ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
          />
        ) : (
          <Tree
            treeData={treeData}
            loading={loading}
            showLine
            showIcon={false}
            defaultExpandAll
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Business Type' : 'Add New Business Type'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingRecord ? 'Update' : 'Create'}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter business type name' }]}
          >
            <Input placeholder="Enter business type name" />
          </Form.Item>
          
          <Form.Item
            name="detail"
            label="Details"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter details"
            />
          </Form.Item>

          <Form.Item
            name="parent_id"
            label="Parent Type"
            help="Leave empty to create a parent type"
          >
            <Select
              placeholder="Select parent type (optional)"
              allowClear
              options={parentTypes.map(parent => ({
                value: parent.id,
                label: parent.name
              }))}
            />
          </Form.Item>

          <Form.Item
            name="is_other"
            label="Is Other Type"
            valuePropName="checked"
            initialValue={false}
            help="Enable this if this type allows custom user input"
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
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

export default MasterBusinessType;