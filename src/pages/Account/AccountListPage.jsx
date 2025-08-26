import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Pagination, Modal
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UploadOutlined, ApiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import API yang sudah dibuat
import { getAccounts, deleteAccount, getAccountById } from '../../api/accountApi';
import { getAccountCategories } from '../../api/accountCategoryApi';
import { getAccountTypes } from '../../api/accountTypeApi';

// Import Mass Upload Component
import MassUploadAccount from './components/MassUploadAccount';

// Import Customer Sync Utils
import { syncCustomerToExternalApi } from '../../utils/customerSyncUtils';

// Import Auth Context
import { useAuth } from '../../components/AuthContext';

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
  const { user } = useAuth(); // Get current user for logging

  // Mass Upload State
  const [massUploadVisible, setMassUploadVisible] = useState(false);

  // Sync State
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

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
      console.error('Failed to fetch accounts:', error);
      
      // Don't show error message for timeout during sync operations
      if (!error.code || error.code !== 'ECONNABORTED') {
        message.error('Failed to fetch accounts');
      }
      
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

  // Sync Customer Handler
  const handleSyncCustomer = (record) => {
    setSelectedAccount(record);
    setSyncModalVisible(true);
  };

  const confirmSyncCustomer = async () => {
    if (!selectedAccount) return;

    setSyncLoading(true);
    try {
      console.log('🔄 Starting sync for account:', selectedAccount.name);
      
      // Try to get full account details including related data and children
      let accountDataToSync = selectedAccount;
      try {
        const fullAccountData = await getAccountById(selectedAccount.id);
        console.log('📥 Full account data:', fullAccountData);
        
        // Use full data if available and has more details
        if (fullAccountData?.data) {
          accountDataToSync = fullAccountData.data;
        }
      } catch (detailError) {
        console.warn('⚠️ Could not fetch full account details, using list data:', detailError.message);
        // Continue with selectedAccount data
      }

      // Get account children/branches for the account tree
      try {
        console.log('🔄 Fetching account children/branches...');
        const childrenResponse = await getAccounts({ 
          parent_id: selectedAccount.id,
          limit: 1000  // Get all children
        });
        
        if (childrenResponse?.data && Array.isArray(childrenResponse.data)) {
          // Add children to account tree
          accountDataToSync.account_tree = childrenResponse.data;
          console.log('✅ Found', childrenResponse.data.length, 'child accounts/branches');
        } else {
          console.log('ℹ️ No child accounts found');
          accountDataToSync.account_tree = [];
        }
      } catch (childrenError) {
        console.warn('⚠️ Could not fetch children accounts:', childrenError.message);
        accountDataToSync.account_tree = [];
      }
      
      // Sync customer to external API
      const result = await syncCustomerToExternalApi(
        accountDataToSync, 
        null, // configId - will be auto-detected 
        user?.id, // userId for logging
        selectedAccount.id // accountId for logging
      );
      
      if (result.success) {
        message.success(`Successfully synced customer: ${selectedAccount.name}`);
        console.log('✅ Sync result:', result);
        
        // Show detailed success information
        if (result.customerData) {
          const { customer, "customer-crew": crew, "beneficiary-account": beneficiary, branch } = result.customerData;
          Modal.success({
            title: 'Sync Completed Successfully',
            content: (
              <div>
                <p><strong>Customer:</strong> {customer?.name}</p>
                <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {customer?.msisdn || 'N/A'}</p>
                <p><strong>Customer Crew:</strong> {crew?.length || 0} member(s)</p>
                <p><strong>Bank Account:</strong> {beneficiary ? 'Yes' : 'No'}</p>
                <p><strong>Branches:</strong> {Array.isArray(branch) ? branch.length : (branch ? 1 : 0)} branch(es)</p>
                <p><strong>External API Response:</strong> {result.response?.message || 'Success'}</p>
              </div>
            ),
          });
        }
      } else {
        message.error(`Failed to sync customer: ${result.error || 'Unknown error'}`);
        console.error('❌ Sync failed:', result);
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      message.error(`Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncLoading(false);
      setSyncModalVisible(false);
      setSelectedAccount(null);
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
          <Tooltip title="Sync to External API">
            <Button
              icon={<ApiOutlined />}
              onClick={() => handleSyncCustomer(record)}
              type="primary"
              ghost
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

      {/* Sync Customer Modal */}
      <Modal
        title="Sync Customer to External API"
        open={syncModalVisible}
        onOk={confirmSyncCustomer}
        onCancel={() => setSyncModalVisible(false)}
        confirmLoading={syncLoading}
        okText="Sync Now"
        cancelText="Cancel"
      >
        <div>
          <p>Are you sure you want to sync the following customer to external API?</p>
          {selectedAccount && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              marginTop: '12px'
            }}>
              <p><strong>Account:</strong> {selectedAccount.name}</p>
              <p><strong>Account No:</strong> {selectedAccount.account_no}</p>
              <p><strong>Type:</strong> {selectedAccount.account_type?.name || 'N/A'}</p>
              <p><strong>Categories:</strong> {
                selectedAccount.account_categories 
                  ? selectedAccount.account_categories.map(cat => cat.name).join(', ')
                  : selectedAccount.account_category?.name || 'N/A'
              }</p>
            </div>
          )}
          <div style={{ marginTop: '12px', color: '#666' }}>
            <p><strong>Note:</strong> This will send customer data including PIC, address, and bank information to the configured external API.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountList;