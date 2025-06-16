//Account/components/AccountBankForm.jsx
import { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Table, Space, Modal, Popconfirm, 
  Select, message 
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getBanks } from '../../../api/bankApi';
import { getBankCategories } from '../../../api/bankCategoryApi';
import { getAccountBanks, createAccountBank, updateAccountBank, deleteAccountBank } from '../../../api/accountBankApi';

import PropTypes from 'prop-types';

const AccountBankForm = ({ 
  banks = [], 
  onChange, 
  accountId,
  isEdit
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bankList, setBankList] = useState([]);
  const [bankCategories, setBankCategories] = useState([]);
  const [localBanks, setLocalBanks] = useState(banks || []);

  // Sync localBanks with props when they change
  useEffect(() => {
    console.log("Banks prop changed:", banks);
    setLocalBanks(banks || []);
  }, [banks]);

  useEffect(() => {
    fetchBanks();
    fetchBankCategories();
    
    // Debug info
    console.log("AccountBankForm mounted", { banks, accountId, isEdit });
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await getBanks();
      console.log('Banks API response:', response);
      
      if (response && response.data) {
        // Handle both data structures (direct array or nested in data property)
        const banksData = Array.isArray(response.data) ? 
                          response.data : 
                          (response.data.data || []);
        console.log('Processed banks data:', banksData);
        setBankList(banksData);
      } else {
        setBankList([]);
      }
    } catch (error) {
      message.error('Failed to fetch banks');
      console.error('Error fetching banks:', error);
      setBankList([]);
    }
  };

  const fetchBankCategories = async () => {
    try {
      const response = await getBankCategories();
      console.log('Bank categories API response:', response);
      
      if (response && response.data) {
        // Handle both data structures (direct array or nested in data property)
        const categoriesData = Array.isArray(response.data) ? 
                               response.data : 
                               (response.data.data || []);
        console.log('Processed bank categories data:', categoriesData);
        setBankCategories(categoriesData);
      } else {
        setBankCategories([]);
      }
    } catch (error) {
      message.error('Failed to fetch bank categories');
      console.error('Error fetching bank categories:', error);
      setBankCategories([]);
    }
  };

  const showModal = (bank) => {
    setEditingBank(bank || null);
    form.resetFields();
    if (bank) {
      // Log bank data for debugging
      console.log('Editing bank:', bank);
      
      // Set form values with better handling for nested properties
      const bankId = bank.bank?.id || bank.bank_id;
      const bankCategoryId = bank.bank_category?.id || bank.bank_category_id;
      
      console.log('Setting form values:', {
        ...bank,
        bank_id: bankId,
        bank_category_id: bankCategoryId
      });
      
      form.setFieldsValue({
        ...bank,
        bank_id: bankId,
        bank_category_id: bankCategoryId
      });
    }
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields(); // Pastikan form direset saat dibatalkan
  };

  const handleSave = () => {
    form.validateFields()
      .then(async (values) => {
        try {
          setLoading(true);
          console.log('Form validated values:', values);
          
          // Pastikan data dalam format yang tepat
          const bankData = {
            bank_id: values.bank_id,
            bank_account_no: values.bank_account_no,
            bank_account_holder_name: values.bank_account_holder_name
          };
          
          // Hanya tambahkan bank_category_id jika ada nilainya
          if (values.bank_category_id) {
            bankData.bank_category_id = values.bank_category_id;
          }
          
          console.log('Prepared bank data:', bankData);

          if (isEdit && accountId) {
            if (editingBank?.id) {
              // Update existing bank
              console.log(`Updating bank: ${editingBank.id} for account: ${accountId}`);
              try {
                const response = await updateAccountBank(editingBank.id, {
                  ...bankData,
                  account_id: accountId
                });
                
                console.log("Update bank response:", response);
                message.success('Bank account updated successfully');
                
                // Update local state immediately
                const updatedBanks = localBanks.map(b => 
                  b.id === editingBank.id ? {
                    ...b,
                    ...bankData,
                    bank: bankList.find(bank => bank.id === bankData.bank_id) || b.bank,
                    bank_category: bankCategories.find(cat => cat.id === bankData.bank_category_id) || b.bank_category
                  } : b
                );
                setLocalBanks(updatedBanks);
                onChange(updatedBanks);
                
                // Close modal on success
                setVisible(false);
                form.resetFields();
              } catch (error) {
                console.error('Error updating bank account:', error);
                message.error('Failed to update bank account');
              }
            } else {
              // Create new bank
              console.log(`Creating new bank for account: ${accountId}`);
              try {
                // Ensure accountId is properly formatted
                const finalAccountId = String(accountId);
                
                console.log('Account ID type:', typeof finalAccountId);
                console.log('Account ID value:', finalAccountId);
                
                const response = await createAccountBank({
                  ...bankData,
                  account_id: finalAccountId
                });
                
                console.log("Create bank response:", response);
                message.success('Bank account added successfully');
                
                // Add to local state if successful
                if (response && response.data) {
                  const newBank = {
                    ...bankData,
                    id: response.data.id || Date.now(),
                    bank: bankList.find(b => b.id === bankData.bank_id),
                    bank_category: bankCategories.find(c => c.id === bankData.bank_category_id)
                  };
                  
                  const updatedBanks = [...localBanks, newBank];
                  setLocalBanks(updatedBanks);
                  onChange(updatedBanks);
                }
                
                // Close modal on success
                setVisible(false);
                form.resetFields();
              } catch (createError) {
                console.error('Detailed error creating bank account:', createError);
                
                if (createError.response?.data?.message) {
                  message.error(`Error: ${createError.response.data.message}`);
                } else if (createError.response?.data?.error) {
                  message.error(`Error: ${createError.response.data.error}`);
                } else {
                  message.error('Failed to create bank account. Please check your data and try again.');
                }
              }
            }
            
            // Refresh data from server in background
            fetchUpdatedBanks();
          } else {
            // For new account (not saved to backend yet)
            if (editingBank) {
              // Update existing bank in local state
              const updatedBanks = localBanks.map(b => 
                (b.id === editingBank.id) || (b.tempId === editingBank.tempId) ? {
                  ...b,
                  ...bankData,
                  bank: bankList.find(bank => bank.id === bankData.bank_id) || b.bank,
                  bank_category: bankCategories.find(cat => cat.id === bankData.bank_category_id) || b.bank_category
                } : b
              );
              setLocalBanks(updatedBanks);
              onChange(updatedBanks);
            } else {
              // Add new bank to local state
              const newBank = {
                ...bankData,
                tempId: Date.now(),
                bank: bankList.find(b => b.id === bankData.bank_id),
                bank_category: bankCategories.find(c => c.id === bankData.bank_category_id)
              };
              const updatedBanks = [...localBanks, newBank];
              setLocalBanks(updatedBanks);
              onChange(updatedBanks);
            }
            
            // Close modal for local operations
            setVisible(false);
            form.resetFields();
          }
        } catch (error) {
          console.error('Error in save process:', error);
        } finally {
          setLoading(false);
        }
      })
      .catch(info => {
        console.log('Form validation failed:', info);
      });
  };

  // Function to fetch updated banks from server
  const fetchUpdatedBanks = async () => {
    if (!accountId) return;
    
    try {
      console.log("Fetching updated banks for account:", accountId);
      const response = await getAccountBanks(accountId);
      console.log("Updated banks response:", response);
      
      // Determine the correct data path based on the response structure
      let updatedData = [];
      if (response?.data?.account_bank) {
        updatedData = response.data.account_bank;
      } else if (response?.data?.data?.account_bank) {
        updatedData = response.data.data.account_bank;
      } else if (Array.isArray(response?.data)) {
        updatedData = response.data;
      }
      
      console.log("Processing updated bank data:", updatedData);
      
      if (updatedData && updatedData.length > 0) {
        setLocalBanks(updatedData);
        onChange(updatedData);
      }
    } catch (error) {
      console.error('Error fetching updated banks:', error);
      // No error message shown as we've already updated UI with local state
    }
  };

  const handleDelete = async (bank) => {
    if (isEdit && accountId && bank.id) {
      try {
        console.log(`Deleting bank: ${bank.id} from account: ${accountId}`);
        await deleteAccountBank(bank.id);
        message.success('Bank account deleted successfully');
        
        // Update local state immediately
        const updatedBanks = localBanks.filter(b => b.id !== bank.id);
        setLocalBanks(updatedBanks);
        onChange(updatedBanks);
        
        // Refresh from server in the background
        fetchUpdatedBanks();
      } catch (error) {
        console.error('Error deleting bank account:', error);
        message.error('Failed to delete bank account');
      }
    } else {
      // For new account, just update local state
      const updatedBanks = localBanks.filter(b => 
        b !== bank && b.tempId !== bank.tempId
      );
      setLocalBanks(updatedBanks);
      onChange(updatedBanks);
    }
  };

  const columns = [
    {
      title: 'Bank',
      dataIndex: ['bank', 'name'],
      key: 'bank',
      render: (text, record) => {
        if (record.bank?.name) return record.bank.name;
        if (record.bank_name) return record.bank_name;
        
        // If bank_id exists, try to get name from bankList
        if (record.bank_id) {
          const bank = bankList.find(b => b.id === record.bank_id);
          return bank?.name || 'N/A';
        }
        
        return 'N/A';
      }
    },
    {
      title: 'Account Number',
      dataIndex: 'bank_account_no',
      key: 'bank_account_no',
    },
    {
      title: 'Account Holder',
      dataIndex: 'bank_account_holder_name',
      key: 'bank_account_holder_name',
    },
    {
      title: 'Category',
      dataIndex: ['bank_category', 'name'],
      key: 'bank_category',
      render: (text, record) => {
        if (record.bank_category?.name) return record.bank_category.name;
        if (record.category_name) return record.category_name;
        
        // If bank_category_id exists, try to get name from bankCategories
        if (record.bank_category_id) {
          const category = bankCategories.find(c => c.id === record.bank_category_id);
          return category?.name || 'N/A';
        }
        
        return 'N/A';
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this bank account?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  console.log('Rendering bank form with data:', localBanks);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          Add Bank Account
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={localBanks}
        rowKey={record => record.id || record.tempId || Math.random()}
        pagination={false}
      />
      
      <Modal
        title={editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
        open={visible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading}
            onClick={handleSave}
          >
            {editingBank ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="bank_id"
            label="Bank"
            rules={[{ required: true, message: 'Please select bank' }]}
          >
            <Select
              placeholder="Select bank"
              options={bankList.map(bank => {
                const value = bank.id;
                const label = bank.name || bank.bank_name;
                return {
                  value: value,
                  label: label
                };
              })}
            />
          </Form.Item>
          
          <Form.Item
            name="bank_account_no"
            label="Account Number"
            rules={[{ required: true, message: 'Please enter account number' }]}
          >
            <Input placeholder="Enter account number" />
          </Form.Item>
          
          <Form.Item
            name="bank_account_holder_name"
            label="Account Holder Name"
            rules={[{ required: true, message: 'Please enter account holder name' }]}
          >
            <Input placeholder="Enter account holder name" />
          </Form.Item>
          
          <Form.Item
            name="bank_category_id"
            label="Bank Category"
          >
            <Select
              placeholder="Select bank category"
              allowClear
              options={bankCategories.map(cat => ({
                value: cat.id,
                label: cat.name || cat.category_name
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

AccountBankForm.propTypes = {
  banks: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEdit: PropTypes.bool.isRequired,
};

export default AccountBankForm;