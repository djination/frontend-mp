
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Card, Space, message, Popconfirm, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import {
  getAllPaymentGateways,
  createPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
} from '../../../api/masterPaymentGatewayApi';
import MasterPaymentGatewayForm from './MasterPaymentGatewayForm';


const MasterPaymentGatewayPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Pagination (optional, can be extended)
  // const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getAllPaymentGateways(params);
      console.log('Payment Gateway fetch response:', res.data);
      if (Array.isArray(res.data)) {
        setData(res.data);
      } else if (Array.isArray(res.data?.data)) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      message.error('Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (values) => {
    fetchData(values);
  };

  const handleAdd = () => {
    setEditing(null);
    setModalVisible(true);
    setTimeout(() => form.resetFields(), 0); // ensure form is mounted
  };

  const handleEdit = (record) => {
    setEditing(record);
    setModalVisible(true);
    setTimeout(() => form.setFieldsValue(record), 0); // ensure form is mounted
  };

  const handleDelete = async (id) => {
    try {
      await deletePaymentGateway(id);
      message.success('Deleted successfully');
      fetchData();
    } catch {
      message.error('Delete failed');
    }
  };

  const handleSubmitForm = async (values) => {
    try {
      if (editing) {
        await updatePaymentGateway(editing.id, values);
        message.success('Updated successfully');
      } else {
        // Add created_by for backend validation
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const created_by = user.username || 'system';
        await createPaymentGateway({ ...values, created_by });
        message.success('Created successfully');
      }
      setModalVisible(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      message.error('Failed to save data');
    }
  };

  const handleCancelForm = () => {
    setModalVisible(false);
    setEditing(null);
  };


  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Active', dataIndex: 'is_active', render: (v) => (v ? 'Yes' : 'No') },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this payment gateway?"
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
    <Card title="Master Payment Gateway">
      <Tabs
        defaultActiveKey="list"
        items={[{
          key: 'list',
          label: 'List View',
          children: (
            <>
              <Form
                form={filterForm}
                layout="inline"
                onFinish={handleSearch}
                style={{ marginBottom: 16 }}
              >
                <Form.Item name="name" label="Name">
                  <Input placeholder="Search by name" allowClear />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">Search</Button>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Payment Gateway</Button>
                </Form.Item>
              </Form>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={Array.isArray(data) ? data : []}
                loading={loading}
                bordered
              />
            </>
          ),
        }]}
      />
      <Modal
        open={modalVisible}
        title={editing ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
        onCancel={handleCancelForm}
        footer={null}
        destroyOnHidden
      >
        <MasterPaymentGatewayForm
          form={form}
          initialValues={editing || {}}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          loading={loading}
        />
      </Modal>
    </Card>
  );
};

export default MasterPaymentGatewayPage;
