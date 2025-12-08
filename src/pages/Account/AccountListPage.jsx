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
import { getPackageTiersByAccount } from '../../api/packageTierApi';

// Import Mass Upload Component
import MassUploadAccount from './components/MassUploadAccount';

// Import Customer Sync Utils
import { syncCustomerToExternalApi } from '../../utils/customerSyncUtils';
import { backendExtApi } from '../../api/backendExtApi';

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
  const [syncOperationType, setSyncOperationType] = useState('POST');

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
  const handleSyncCustomer = (record, operationType = 'POST') => {
    setSelectedAccount(record);
    setSyncOperationType(operationType);
    setSyncModalVisible(true);
  };

  // PUT Customer Handler (replaces PATCH)
  const handlePUTCustomer = async (record) => {
    if (!record.uuid_be) {
      message.error('Account must be synced first before updating customer data');
      return;
    }

    setSyncLoading(true);
    try {
      // Get full account details including address information
      let accountDataToSync = record;
      try {
        const fullAccountData = await getAccountById(record.id);
        
        if (fullAccountData?.data) {
          accountDataToSync = fullAccountData.data;
        }
      } catch (detailError) {
        // Continue with list data if fetch fails
      }
      
      // Get primary address from account_address array
      const primaryAddress = accountDataToSync.account_address && accountDataToSync.account_address.length > 0 
        ? accountDataToSync.account_address.find(addr => addr.is_primary) || accountDataToSync.account_address[0]
        : null;
      
      // Prepare customer data for PUT request
      const customerData = {
        name: accountDataToSync.name || '',
        email: accountDataToSync.email || '',
        msisdn: accountDataToSync.phone_no ? (accountDataToSync.phone_no.startsWith('+') ? accountDataToSync.phone_no : `+${accountDataToSync.phone_no.startsWith('0') ? '62' + accountDataToSync.phone_no.slice(1) : accountDataToSync.phone_no}`) : '',
        address: {
          building: primaryAddress?.address1 || '',
          street: primaryAddress?.address2 || '',
          region: primaryAddress?.sub_district || '',
          city: primaryAddress?.city || '',
          state: primaryAddress?.province || '',
          country: primaryAddress?.country || 'Indonesia',
          zip_code: primaryAddress?.postalcode || ''
        },
        branch: {
          id: accountDataToSync.branch_uuid_be || '',
          code: accountDataToSync.account_no || '',
          name: accountDataToSync.name || ''
        },
        customer_type: "INDIVIDUAL",
        ktp: accountDataToSync.no_ktp || '',
        npwp: accountDataToSync.no_npwp || ''
      };

      // Validate required fields before sending
      if (!customerData.name) {
        message.error('Customer name is required');
        return;
      }
      if (!customerData.email) {
        message.error('Customer email is required');
        return;
      }
      if (!accountDataToSync.branch_uuid_be) {
        message.error('Branch UUID is required for PUT operation');
        return;
      }

      // Make PUT request to external API
      const requestData = {
        config_id: '473b8ffa-9c2e-4384-b5dc-dd2af3c1f0f9',
        data: customerData,
        url: `/api/customer/command/${record.uuid_be}`,
        method: 'PUT'
      };

      const response = await backendExtApi.makeSimplifiedApiRequest(requestData);

      if (response && response.success !== false) {
        message.success(`Successfully updated customer: ${record.name}`);
      } else {
        throw new Error(response?.error || 'External API returned error');
      }
    } catch (error) {
      let errorMessage = 'Failed to update customer';
      if (error.response?.data?.error) {
        errorMessage = `External API Error: ${error.response.data.error}`;
      } else if (error.response?.data?.message) {
        errorMessage = `External API Error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setSyncLoading(false);
    }
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

      // Skip fetching account children/branches - set empty array
      accountDataToSync.account_tree = [];

      // Get package tiers for this account (used for tier mapping)
      try {
        console.log('🔄 Fetching package tiers...');
        const packageTiersResponse = await getPackageTiersByAccount(selectedAccount.id);
        
        if (packageTiersResponse?.data && Array.isArray(packageTiersResponse.data)) {
          accountDataToSync.package_tiers = packageTiersResponse.data;
          console.log('✅ Found', packageTiersResponse.data.length, 'package tiers');
        } else {
          console.log('ℹ️ No package tiers found');
          accountDataToSync.package_tiers = [];
        }
      } catch (packageTiersError) {
        console.warn('⚠️ Could not fetch package tiers:', packageTiersError.message);
        accountDataToSync.package_tiers = [];
      }
      
      // Sync customer to external API
      console.log(`🔄 Executing ${syncOperationType} operation for account:`, selectedAccount.name);
      let result = await syncCustomerToExternalApi(
        accountDataToSync, 
        null, // configId - will be auto-detected 
        user?.id, // userId for logging
        selectedAccount.id // accountId for logging
      );
      
      // Check if this is a token error with retry requested
      const isTokenErrorRetry = result.details?.isRetryRequested === true && 
                                result.error?.includes('token error');
      
      console.log('🔍 Retry check:', {
        isRetryRequested: result.details?.isRetryRequested,
        error: result.error,
        hasTokenError: result.error?.includes('token error'),
        isTokenErrorRetry,
        hasCustomerData: !!result.customerData
      });
      
      // Handle token error with retry request
      if (isTokenErrorRetry) {
        console.log('🔄 Token error detected, retrying sync automatically...');
        message.info('Token expired. Retrying sync automatically...', 3);
        
        // Wait a bit before retry to allow token refresh
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry the sync
        try {
          const retryResult = await syncCustomerToExternalApi(
            accountDataToSync, 
            null, // configId - will be auto-detected 
            user?.id, // userId for logging
            selectedAccount.id // accountId for logging
          );
          
          // Use retry result
          if (retryResult.success) {
            message.success(`Successfully synced customer: ${selectedAccount.name} (after retry)`);
            console.log('✅ Retry sync result:', retryResult);
            result = retryResult; // Update result for further processing
          } else {
            // If retry also failed, check if we have customerData (partial success)
            if (retryResult.customerData) {
              console.warn('⚠️ Retry failed but customerData exists, showing partial success');
              result = retryResult; // Continue with partial success handling
            } else if (result.customerData) {
              // If retry failed but original result has customerData, use original
              console.warn('⚠️ Retry failed, using original result with customerData');
              // result already has customerData, keep it
            } else {
              // If retry also failed and no customerData, show error
              message.error(`Failed to sync customer after retry: ${retryResult.error || 'Unknown error'}`);
              console.error('❌ Retry sync failed:', retryResult);
              return; // Exit early
            }
          }
        } catch (retryError) {
          console.error('❌ Retry sync error:', retryError);
          // If original result has customerData, still process it as partial success
          if (result.customerData) {
            console.warn('⚠️ Retry error occurred, but original result has customerData - processing as partial success');
            // Continue with original result that has customerData
          } else {
            message.error(`Retry failed: ${retryError.message || 'Unknown error'}`);
            return; // Exit early only if no customerData
          }
        }
      }
      
      // Handle success or partial success (customerData exists even if success: false)
      // Note: If customerData exists, it means data was transformed and ready to send
      // Even if sync failed due to token error, the data structure is valid
      if (result.success || result.customerData) {
        if (result.success) {
          message.success(`Successfully synced customer: ${selectedAccount.name}`);
        } else if (result.details?.isRetryRequested) {
          // Token error with retry requested - data may have been sent before token expired
          message.warning(`Sync completed with token error. Data was prepared and may have been sent. Please verify in external system.`);
        } else {
          message.warning(`Sync completed with warnings: ${result.error || 'Unknown error - data may have been sent'}`);
        }
        console.log('✅ Sync result:', result);
        
        // Show detailed success information
        if (result.customerData) {
          // ============================================
          // REMARKED: PIC/Crew Data Sync
          // Bagian ini di-remark untuk menonaktifkan sync PIC/crew data
          // Jika diperlukan, uncomment bagian berikut:
          // - const { customer, "customer-crew": crew, ... } = result.customerData;
          // - externalData.crew?.failed > 0 di hasErrors check
          // - Bagian display crew di modal warning dan success
          // ============================================
          const { customer, /* "customer-crew": crew, */ "beneficiary-account": beneficiary, branch, tier } = result.customerData;
          
          // Check for external API errors in nested response
          const externalData = result.response?.data?.data;
          const hasErrors = externalData && (
            (externalData.customer?.failed > 0) ||
            (externalData.beneficiary?.failed > 0) ||
            (externalData.branch?.failed > 0) ||
            // (externalData.crew?.failed > 0) || // REMARKED: Crew error check
            (externalData.tier?.failed > 0)
          );

          if (hasErrors) {
            // Show warning modal with error details
            Modal.warning({
              title: 'Sync Completed with Issues',
              width: 600,
              content: (
                <div>
                  <p><strong>Sync Status:</strong> Data sent successfully but external API reported issues:</p>
                  
                  {externalData.customer?.failed > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p><strong>❌ Customer:</strong> {externalData.customer.errors.join(', ')}</p>
                    </div>
                  )}
                  
                  {externalData.beneficiary?.failed > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p><strong>❌ Beneficiary Account:</strong> {externalData.beneficiary.errors.join(', ')}</p>
                    </div>
                  )}
                  
                  {externalData.branch?.failed > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p><strong>❌ Branch:</strong> {externalData.branch.errors.join(', ')}</p>
                    </div>
                  )}
                  
                  {/* REMARKED: Crew Error Display - Uncomment jika perlu sync crew */}
                  {/* {externalData.crew?.failed > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p><strong>❌ Customer Crew:</strong> {externalData.crew.errors.join(', ')}</p>
                    </div>
                  )} */}
                  
                  {externalData.tier?.failed > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p><strong>❌ Tier:</strong> {externalData.tier.errors.join(', ')}</p>
                    </div>
                  )}

                  <hr style={{ margin: '16px 0' }} />
                  
                  <p><strong>Data Sent:</strong></p>
                  <p><strong>Customer:</strong> {customer?.name}</p>
                  <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {customer?.msisdn || 'N/A'}</p>
                  {/* REMARKED: Crew Data Display - Uncomment jika perlu sync crew */}
                  {/* <p><strong>Customer Crew:</strong> {crew?.length || 0} member(s)</p> */}
                  <p><strong>Bank Account:</strong> {beneficiary ? 'Yes' : 'No'}</p>
                  <p><strong>Bank ID:</strong> {beneficiary?.bank?.id || 'N/A'}</p>
                  <p><strong>Tier Data:</strong> {tier?.length || 0} tier(s)</p>
                  <p><strong>Branches:</strong> {Array.isArray(branch) ? branch.length : (branch ? 1 : 0)} branch(es)</p>
                </div>
              ),
            });
          } else {
            // Show success modal or partial success modal
            const isPartialSuccess = !result.success && result.customerData;
            Modal[isPartialSuccess ? 'warning' : 'success']({
              title: isPartialSuccess ? 'Sync Completed with Token Error' : 'Sync Completed Successfully',
              width: 600,
              content: (
                <div>
                  {isPartialSuccess && (
                    <div style={{ 
                      marginBottom: 16, 
                      padding: 12, 
                      backgroundColor: '#fff7e6', 
                      borderRadius: 6, 
                      border: '1px solid #ffd591' 
                    }}>
                      <p style={{ margin: 0, color: '#d48806' }}>
                        <strong>⚠️ Token Error:</strong> Sync encountered a token error, but data was prepared and may have been sent to external API. Please verify the data in the external system.
                      </p>
                      {result.error && (
                        <p style={{ margin: '8px 0 0 0', color: '#d48806', fontSize: '12px' }}>
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  )}
                  <p><strong>Customer:</strong> {customer?.name}</p>
                  <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {customer?.msisdn || 'N/A'}</p>
                  {/* REMARKED: Crew Data Display - Uncomment jika perlu sync crew */}
                  {/* <p><strong>Customer Crew:</strong> {crew?.length || 0} member(s)</p> */}
                  <p><strong>Bank Account:</strong> {beneficiary ? 'Yes' : 'No'}</p>
                  <p><strong>Tier Data:</strong> {tier?.length || 0} tier(s)</p>
                  <p><strong>Branches:</strong> {Array.isArray(branch) ? branch.length : (branch ? 1 : 0)} branch(es)</p>
                  {result.success && (
                    <p><strong>External API Response:</strong> {result.response?.message || 'Success'}</p>
                  )}
                </div>
              ),
            });
          }
        }
      } else {
        // Check if we have customerData even though success is false (partial success scenario)
        if (result.customerData) {
          console.warn('⚠️ Sync returned error but customerData exists:', result);
          message.warning(`Sync completed with issues: ${result.error || 'Unknown error'}. Data may have been sent.`);
          
          // Still show the data that was sent
          const { customer, /* "customer-crew": crew, */ "beneficiary-account": beneficiary, branch, tier } = result.customerData;
          
          Modal.warning({
            title: 'Sync Completed with Issues',
            width: 600,
            content: (
              <div>
                <p><strong>Status:</strong> {result.error || 'Unknown error'}</p>
                <p style={{ color: '#faad14', marginBottom: 16 }}>
                  <strong>⚠️ Note:</strong> Data may have been sent to external API despite the error. Please verify in the external system.
                </p>
                <hr style={{ margin: '16px 0' }} />
                <p><strong>Data Sent:</strong></p>
                <p><strong>Customer:</strong> {customer?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {customer?.msisdn || 'N/A'}</p>
                <p><strong>Bank Account:</strong> {beneficiary ? 'Yes' : 'No'}</p>
                <p><strong>Tier Data:</strong> {tier?.length || 0} tier(s)</p>
                <p><strong>Branches:</strong> {Array.isArray(branch) ? branch.length : (branch ? 1 : 0)} branch(es)</p>
              </div>
            ),
          });
        } else {
          message.error(`Failed to sync customer: ${result.error || 'Unknown error'}`);
          console.error('❌ Sync failed:', result);
        }
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
          <Tooltip title="Create Customer (POST)">
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleSyncCustomer(record, 'POST')}
              type="primary"
              ghost
              disabled={record.uuid_be && record.uuid_be !== null && record.uuid_be !== ''}
              style={{ marginRight: 4 }}
            />
          </Tooltip>
          <Tooltip title="Update Customer (PUT)">
            <Button
              icon={<EditOutlined />}
              onClick={() => handlePUTCustomer(record)}
              type="default"
              ghost
              disabled={!record.uuid_be || record.uuid_be === null || record.uuid_be === ''}
              style={{ marginRight: 4 }}
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
        title={`${syncOperationType === 'POST' ? 'Create' : 'Update'} Customer to External API`}
        open={syncModalVisible}
        onOk={confirmSyncCustomer}
        onCancel={() => setSyncModalVisible(false)}
        confirmLoading={syncLoading}
        okText={syncOperationType === 'POST' ? 'Create Now' : 'Update Now'}
        cancelText="Cancel"
      >
        <div>
          <p>Are you sure you want to {syncOperationType === 'POST' ? 'create' : 'update'} the following customer to external API?</p>
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
              {syncOperationType === 'PATCH' && selectedAccount.uuid_be && (
                <p><strong>External ID:</strong> {selectedAccount.uuid_be}</p>
              )}
            </div>
          )}
          <div style={{ marginTop: '12px', color: '#666' }}>
            <p><strong>Note:</strong> This will send customer data including PIC, address, and bank information to the configured external API.</p>
            {syncLoading && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff7e6', borderRadius: '4px', border: '1px solid #ffd591' }}>
                <p style={{ margin: 0, color: '#d48806' }}>
                  <strong>⏳ Please wait:</strong> Sync operation may take up to 2 minutes depending on server load.
                </p>
              </div>
            )}
            {!syncLoading && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                <p style={{ margin: 0, color: '#52c41a' }}>
                  <strong>⚡ Tip:</strong> This operation may take 1-2 minutes. Please be patient.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountList;