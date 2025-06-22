import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Switch, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

// Import API untuk document type
import { getDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType } from '../../api/documentTypeApi';

const MasterDocumentType = () => {
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
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async (params = {}) => {
    setLoading(true);
    try {
        // Add pagination parameters to the request
        const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
        };
        
        const response = await getDocumentTypes(queryParams);
        
        // Pastikan data selalu array
        let documentData = [];
        
        // Periksa respons API, beberapa format umum
        if (response && response.data) {
        if (Array.isArray(response.data)) {
            documentData = response.data;
        } else if (Array.isArray(response.data.data)) {
            // Format umum: { data: [...] }
            documentData = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
            // Format lain: { items: [...] }
            documentData = response.data.items;
        } else if (typeof response.data === 'object') {
            // Jika data adalah object tapi bukan array, ambil nilai-nilainya
            console.warn('API returned object instead of array, attempting to convert', response.data);
            documentData = Object.values(response.data);
        }
        }
        
        // Set data ke state (selalu array)
        setData(documentData);
        
        // Update pagination info if available from backend
        if (response && response.meta) {
        setPagination({
            ...pagination,
            total: response.meta.total || documentData.length,
        });
        } else {
        // If backend doesn't provide meta info, just use the data length
        setPagination({
            ...pagination,
            total: documentData.length,
        });
        }
        
    } catch (error) {
        message.error('Failed to fetch document types');
        console.error('Error fetching document types:', error);
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
    fetchDocumentTypes(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchDocumentTypes({
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
      code: record.code,
      name: record.name,
      description: record.description,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocumentType(id);
      message.success('Document type deleted successfully');
      fetchDocumentTypes(form.getFieldsValue());
    } catch (error) {
      message.error('Failed to delete document type');
      console.error(error);
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (editingRecord) {
        // Update existing document type
        await updateDocumentType(editingRecord.id, values);
        message.success('Document type updated successfully');
      } else {
        // Create new document type
        await createDocumentType(values);
        message.success('Document type created successfully');
      }
      
      setModalVisible(false);
      fetchDocumentTypes(form.getFieldsValue());
    } catch (error) {
      if (error.errorFields) {
        // Form validation error, handled by form itself
        return;
      }
      message.error('Failed to save document type');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
            title="Are you sure you want to delete this document type?"
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
      <Card title="Document Types">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="code" label="Code">
              <Input placeholder="Search by code" />
            </Form.Item>
            
            <Form.Item name="name" label="Name">
              <Input placeholder="Search by name" />
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
                  Add Document Type
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
        
        <Table
            columns={columns}
            dataSource={Array.isArray(data) ? data : []}
            rowKey={(record) => record.id || Math.random().toString(36).substr(2, 9)}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Document Type' : 'Add New Document Type'}
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
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Please enter document type code' },
              { max: 50, message: 'Code cannot exceed 50 characters' }
            ]}
          >
            <Input placeholder="Enter code (e.g., KTP, NPWP)" disabled={!!editingRecord} />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter document type name' },
              { max: 100, message: 'Name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="Enter name (e.g., Kartu Tanda Penduduk)" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              placeholder="Enter description" 
              rows={3}
              maxLength={500}
              showCount
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

export default MasterDocumentType;