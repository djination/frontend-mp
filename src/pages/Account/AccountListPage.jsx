import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Pagination
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import API yang sudah dibuat
import { getAccounts, deleteAccount } from '../../api/accountApi';
import { getAccountCategories } from '../../api/accountCategoryApi';
import { getAccountTypes } from '../../api/accountTypeApi';

// Import Mass Upload Component
import MassUploadAccount from './components/MassUploadAccount';

// Helper untuk flatten tree account
const flattenAccounts = (accounts) => {
  let result = [];
  accounts.forEach(acc => {
    result.push(acc);
    if (acc.children && acc.children.length > 0) {
      result = result.concat(flattenAccounts(acc.children));
    }
  });
  return result;
};

const AccountList = () => {
  const [loading, setLoading] = useState(false);
  const [account, setAccounts] = useState([]);
  const [accountCategories, setAccountCategories] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const categorySelectRef = useRef(null);

  // Mass Upload State
  const [massUploadVisible, setMassUploadVisible] = useState(false);

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
      const response = await getAccountTypes();
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
      // Clean up params: remove undefined or empty string values
      const cleanedParams = Object.fromEntries(
        Object.entries({
          page: params.page || 1,
          limit: params.limit || pagination.pageSize,
          ...params
        }).filter(([_, v]) => v !== undefined && v !== '')
      );
      const response = await getAccounts(cleanedParams);

      if (response && response.data) {
        setAccounts(response.data);

        // Update pagination info if available from backend
        if (response.meta) {
          setPagination(prev => ({
            ...prev,
            total: response.meta.total || response.data.length,
            current: cleanedParams.page || 1,
            pageSize: cleanedParams.limit || 10,
          }));
        } else {
          setPagination(prev => ({
            ...prev,
            total: response.data.length,
            current: cleanedParams.page || 1,
            pageSize: cleanedParams.limit || 10,
          }));
        }
      } else {
        setAccounts([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
        }));
      }
    } catch (error) {
      message.error('Failed to fetch accounts');
      console.error(error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    // Clean up search values
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== undefined && v !== '')
    );
    
    // Jika semua field kosong, fetch ulang semua data (refresh)
    if (Object.keys(cleanedValues).length === 0) {
      fetchAccounts({ page: 1, limit: pagination.pageSize }); // atau limit besar jika tree
      return;
    }

    // Fetch all accounts (tree) dari backend
    getAccounts({ page: 1, limit: 1000 }).then(response => {
      if (response && response.data) {
        // Flatten tree
        const flat = flattenAccounts(response.data);

        // Filter sesuai search
        const filtered = flat.filter(acc => {
          let match = true;
          if (cleanedValues.account_no) {
            match = match && acc.account_no?.toLowerCase().includes(cleanedValues.account_no.toLowerCase());
          }
          if (cleanedValues.name) {
            match = match && acc.name?.toLowerCase().includes(cleanedValues.name.toLowerCase());
          }
          if (cleanedValues.account_category_id) {
            match = match && acc.account_category?.id === cleanedValues.account_category_id;
          }
          if (cleanedValues.account_type_id) {
            match = match && acc.account_type?.id === cleanedValues.account_type_id;
          }
          return match;
        });

        setAccounts(filtered);
        setPagination(prev => ({
          ...prev,
          total: filtered.length,
          current: 1,
        }));
      } else {
        setAccounts([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          current: 1,
        }));
      }
    });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    // sorter: { column, order, field, columnKey }
    let sortField = sorter.field;
    let sortOrder = sorter.order;

    // Ant Design order: 'ascend' | 'descend' | undefined
    // Backend biasanya: 'asc' | 'desc'
    if (sortOrder === 'ascend') sortOrder = 'asc';
    if (sortOrder === 'descend') sortOrder = 'desc';

    fetchAccounts({
      page: pagination.current,
      limit: pagination.pageSize,
      sort: sortField,
      order: sortOrder,
      // ...tambahkan filter jika perlu
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

  // Mass Upload Success Handler
  const handleMassUploadSuccess = () => {
    // Refresh the account list after successful mass upload
    fetchAccounts();
    message.success('Accounts list refreshed');
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
      key: 'account_categories',
      render: (_, record) => {
        // Perbaikan: tampilkan semua kategori
        if (record.account_categories && record.account_categories.length > 0) {
          return record.account_categories.map(cat => cat.name).join(', ');
        }
        // Fallback untuk backward compatibility
        return record.account_category ? record.account_category.name : 'N/A';
      },
      filters: accountCategories.map(cat => ({
        text: cat.name,
        value: cat.id,
      })),
      onFilter: (value, record) => {
        // Perbaikan: filter untuk multi category
        if (record.account_categories && record.account_categories.length > 0) {
          return record.account_categories.some(cat => cat.id === value);
        }
        // Fallback untuk backward compatibility
        return record.account_category && record.account_category.id === value;
      },
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
      onFilter: (value, record) =>
        record.account_type && record.account_type.id === value,
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
      onFilter: (value, record) => record.is_active === value,
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
            
            <Form.Item name="account_category_ids" label="Categories">
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
                  Add Account
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
        
        <Table
          columns={columns}
          dataSource={account}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Mass Upload Modal */}
      <MassUploadAccount
        visible={massUploadVisible}
        onClose={() => setMassUploadVisible(false)}
        onSuccess={handleMassUploadSuccess}
      />
    </div>
  );
};

export default AccountList;