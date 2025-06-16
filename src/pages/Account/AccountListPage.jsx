import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Pagination
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import API yang sudah dibuat
import { getAccounts, deleteAccount } from '../../api/accountApi';
import { getAccountCategories } from '../../api/accountCategoryApi';
import { getAccountType } from '../../api/accountTypeApi';

const AccountList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [accountCategories, setAccountCategories] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const categorySelectRef = useRef(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch initial data and lookup values
  useEffect(() => {
    fetchAccountCategories();
    fetchAccountTypes();
    fetchAccounts();
  }, []);

  const fetchAccountCategories = async () => {
    try {
      const response = await getAccountCategories();
      if (response && response.data) {
        setAccountCategories(response.data);
      } else {
        setAccountCategories([]);
      }
    } catch (error) {
      message.error('Failed to fetch account categories');
      console.error(error);
      setAccountCategories([]);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const response = await getAccountType();
      if (response && response.data) {
        setAccountTypes(response.data);
      } else {
        setAccountTypes([]);
      }
    } catch (error) {
      message.error('Failed to fetch account types');
      console.error(error);
      setAccountTypes([]);
    }
  };

  const fetchAccounts = async (params = {}) => {
    setLoading(true);
    try {
      // Add pagination parameters to the request
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...params
      };
      
      const response = await getAccounts(queryParams);
      
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
      message.error('Failed to fetch accounts');
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
    fetchAccounts(values);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    fetchAccounts({
      ...form.getFieldsValue(),
      page: pagination.current,
      limit: pagination.pageSize,
      sort: sorter.field,
      order: sorter.order,
      ...filters,
    });
  };

  const handleAdd = () => {
    navigate('/account/add');
  };

  const handleEdit = (id) => {
    navigate(`/account/edit/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
      message.success('Account deleted successfully');
      fetchAccounts(form.getFieldsValue());
    } catch (error) {
      message.error('Failed to delete account');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Account No',
      dataIndex: 'account_no',
      key: 'account_no',
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Category',
      dataIndex: ['account_category', 'name'],
      key: 'account_category',
      render: (text, record) => 
        record.account_category ? record.account_category.name : 'N/A',
      filters: accountCategories.map(cat => ({
        text: cat.name,
        value: cat.id,
      })),
    },
    {
      title: 'Type',
      dataIndex: ['account_type', 'name'],
      key: 'account_type',
      render: (text, record) => 
        record.account_type ? record.account_type.name : 'N/A',
      filters: accountTypes.map(type => ({
        text: type.name,
        value: type.id,
      })),
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
              onClick={() => handleEdit(record.id)} 
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this account?"
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
      <Card title="Account Management">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="account_no" label="Account No">
              <Input placeholder="Search by account number" />
            </Form.Item>
            
            <Form.Item name="name" label="Name">
              <Input placeholder="Search by name" />
            </Form.Item>
            
            <Form.Item name="account_category_id" label="Category">
              <Select 
                ref={categorySelectRef}
                placeholder="Select category"
                allowClear
                style={{ width: 200 }}
                options={accountCategories?.map(cat => ({
                  value: cat.id,
                  label: cat.name
                })) || []}
              />
            </Form.Item>
            
            <Form.Item name="account_type_id" label="Type">
              <Select 
                placeholder="Select type"
                allowClear
                style={{ width: 200 }}
                options={accountTypes?.map(type => ({
                  value: type.id,
                  label: type.name
                })) || []}
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
                  Add Account
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
    </div>
  );
};

export default AccountList;