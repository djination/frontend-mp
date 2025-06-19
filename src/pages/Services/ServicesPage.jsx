import React, { useEffect, useState } from 'react';
import {
  Table, Button, Form, Input, Select, Space, Card,
  message, Tooltip, Popconfirm, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { getServices, createService, updateService, deleteService } from '../../api/serviceApi';
import ServiceForm from './components/ServiceForm';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form] = Form.useForm();

  // For filter/search
  const [filter, setFilter] = useState({
    name: '',
    type: '',
  });

  // For pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch all services (flat list)
  const fetchServices = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params,
      };
      const response = await getServices(queryParams);
      if (response && response.data) {
        setServices(response.data);
        setPagination({
          ...pagination,
          total: response.meta?.total || response.data.length,
        });
      } else {
        setServices([]);
        setPagination({
          ...pagination,
          total: 0,
        });
      }
    } catch (error) {
      message.error('Failed to fetch services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (values) => {
    setPagination({
      ...pagination,
      current: 1,
    });
    setFilter(values);
    fetchServices(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchServices({
      ...filter,
      page: pagination.current,
      limit: pagination.pageSize,
      sort: sorter.field,
      order: sorter.order,
      ...filters,
    });
  };

  const handleAdd = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteService(id);
      message.success('Service deleted successfully');
      fetchServices(filter);
    } catch (error) {
      message.error('Failed to delete service');
    }
  };

  const handleSubmitForm = async (values) => {
    let payload = { ...values };
    if ('parentId' in payload) {
      payload.parent_id = payload.parentId || null; // ubah "" jadi null
      delete payload.parentId;
    }
    try {
      if (editingService) {
        await updateService(editingService.id, values);
        message.success('Service updated successfully');
      } else {
        await createService(values);
        message.success('Service created successfully');
      }
      setShowForm(false);
      setEditingService(null);
      fetchServices(filter);
    } catch (error) {
      message.error('Failed to save service');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingService(null);
  };

  const columns = [
    {
      title: 'Service Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: true,
    },
    {
      title: 'Parent',
      dataIndex: ['parent', 'name'],
      key: 'parent',
      render: (_, record) => {
        if (!record.parentId) return '—';
        const parentService = services.find(service => service.id === record.parentId);
        return parentService ? parentService.name : '—';
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
            title="Are you sure you want to delete this service?"
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
      <Card title="Service Management">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="name" label="Service Name">
              <Input placeholder="Search by name" />
            </Form.Item>
            <Form.Item name="type" label="Type">
              <Input placeholder="Search by type" />
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
                  Add Service
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        open={showForm}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        onCancel={handleCancelForm}
        footer={null}
        destroyOnHidden
      >
        <ServiceForm
          service={editingService}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          allServices={services}
        />
      </Modal>
    </div>
  );
};

export default ServicesPage;