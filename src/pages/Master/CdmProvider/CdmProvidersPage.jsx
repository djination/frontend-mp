import React, { useEffect, useState } from 'react';
import {
  Table, Button, Form, Input, Select, Space, Card,
  message, Tooltip, Popconfirm, Modal, Tabs
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getCdmProviders, createCdmProvider, updateCdmProvider, deleteCdmProvider } from '../../../api/cdmProviderApi';
import CdmProviderForm from './components/CdmProviderForm';
import CdmProviderTree from './components/CdmProviderTree';

const CdmProvidersPage = () => {
  const [cdmProviders, setCdmProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCdmProvider, setEditingCdmProvider] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();
  const [treeData, setTreeData] = useState([]);

  // For filter/search
  const [filter, setFilter] = useState({
    name: '',
    description: '',
  });

  // For pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch all cdmProviders (flat list)
  const fetchCdmProviders = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params,
      };
      const response = await getCdmProviders(queryParams);
      if (response && response.data) {
        setCdmProviders(response.data);
        setPagination({
          ...pagination,
          total: response.meta?.total || response.data.length,
        });
      } else {
        setCdmProviders([]);
        setPagination({
          ...pagination,
          total: 0,
        });
      }
    } catch (error) {
      message.error('Failed to fetch cdmProviders');
      setCdmProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCdmProviderTree = async () => {
    try {
      const response = await getCdmProviderTree();
      if (response && response.data) {
        setTreeData(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch CDM provider tree');
    }
  };

  useEffect(() => {
    fetchCdmProviders();
    fetchCdmProviderTree();
  }, []);

  // Transform flat services array into tree structure for ServiceTree
  useEffect(() => {
    const buildTree = (items) => {
      const map = {};
      items.forEach(item => {
        map[item.id] = { ...item, children: [] };
      });
      const tree = [];
      items.forEach(item => {
        if (item.parentId && map[item.parentId]) {
          map[item.parentId].children.push(map[item.id]);
        } else {
          tree.push(map[item.id]);
        }
      });
      return tree;
    };
    setTreeData(buildTree(cdmProviders));
  }, [cdmProviders]);

  const handleSearch = (values) => {
    setPagination({
      ...pagination,
      current: 1,
    });
    setFilter(values);
    fetchCdmProviders(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchCdmProviders({
      ...filter,
      page: pagination.current,
      limit: pagination.pageSize,
      sort: sorter.field,
      order: sorter.order,
      ...filters,
    });
  };

  const handleAdd = () => {
    setEditingCdmProvider(null);
    setShowForm(true);
  };

  const handleEdit = (cdmProvider) => {
    setEditingCdmProvider(cdmProvider);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCdmProvider(id);
      message.success('CdmProvider deleted successfully');
      fetchCdmProviders(filter);
    } catch (error) {
      message.error('Failed to delete cdmProvider');
    }
  };

  const handleSubmitForm = async (values) => {
    let payload = { ...values };
    if ('parentId' in payload) {
      payload.parent_id = payload.parentId || null; // ubah "" jadi null
      delete payload.parentId;
    }
    try {
      if (editingCdmProvider) {
        await updateCdmProvider(editingCdmProvider.id, values);
        message.success('CdmProvider updated successfully');
      } else {
        await createCdmProvider(values);
        message.success('CdmProvider created successfully');
      }
      setShowForm(false);
      setEditingCdmProvider(null);
      fetchCdmProviders(filter);
    } catch (error) {
      message.error('Failed to save cdmProvider');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCdmProvider(null);
  };

  const columns = [
    {
      title: 'CdmProvider Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: true,
    },
    {
      title: 'Parent',
      dataIndex: ['parent', 'name'],
      key: 'parent',
      render: (_, record) => {
        if (!record.parentId) return '—';
        const parentCdmProvider = cdmProviders.find(cdmProvider => cdmProvider.id === record.parentId);
        return parentCdmProvider ? parentCdmProvider.name : '—';
      },
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
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this cdmProvider?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="CdmProvider Management">
        <Tabs defaultActiveKey="list">
          <Tabs.TabPane tab="List View" key="list">
            <Form
              form={form}
              layout="horizontal"
              onFinish={handleSearch}
              style={{ marginBottom: 20 }}
            >
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Form.Item name="name" label="CdmProvider Name">
                  <Input placeholder="Search by name" />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input placeholder="Search by description" />
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
                      Add CdmProvider
                    </Button>
                  </Space>
                </Form.Item>
              </div>
            </Form>
            <Table
              columns={columns}
              dataSource={cdmProviders}
              rowKey="id"
              loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Tree View" key="tree">
            <div className="p-4">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{ marginBottom: 16 }}
              >
                Add CDM Provider
              </Button>
              <div className="bg-white p-6 rounded-lg shadow">
                <CdmProviderTree
                  cdmProviders={treeData}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <Modal
        open={showForm}
        title={editingCdmProvider ? 'Edit CdmProvider' : 'Add New CdmProvider'}
        onCancel={handleCancelForm}
        footer={null}
        destroyOnHidden
      >
        <CdmProviderForm
          cdmProvider={editingCdmProvider}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          allCdmProviders={cdmProviders}
        />
      </Modal>
    </div>
  );
};

export default CdmProvidersPage;