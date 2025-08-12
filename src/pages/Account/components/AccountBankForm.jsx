import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Table, Space, Modal, Popconfirm,
  Select, message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getBanks } from '../../../api/bankApi';
import { getBankCategories } from '../../../api/bankCategoryApi';
import { getAccountBanks, getAccountBankById } from '../../../api/accountBankApi';
import PropTypes from 'prop-types';

const AccountBankForm = ({
  accountBanks = [],
  onChange,
  accountId,
  isEdit
}) => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingAccountBank, setEditingAccountBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bankList, setBankList] = useState([]);
  const [bankCategories, setBankCategories] = useState([]);
  const [localAccountBanks, setLocalAccountBanks] = useState(accountBanks || []);

  // Sync localAccountBanks with props
  useEffect(() => {
    
    setLocalAccountBanks(accountBanks || []);
  }, [accountBanks]);

  useEffect(() => {
    fetchBanks();
    fetchBankCategories();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await getBanks();
      const banksData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setBankList(banksData);
    } catch (error) {
      console.error('Error fetching banks:', error);
      message.error('Failed to fetch banks');
      setBankList([]);
    }
  };

  const fetchBankCategories = async () => {
    try {
      const response = await getBankCategories();
      const categoriesData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setBankCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching bank categories:', error);
      message.error('Failed to fetch bank categories');
      setBankCategories([]);
    }
  };

  const showModal = (accountBank) => {
    setEditingAccountBank(accountBank || null);
    form.resetFields();
    if (accountBank) {
      form.setFieldsValue({
        bank_id: accountBank.bank?.id || accountBank.bank_id,
        bank_category_id: accountBank.bank_category?.id || accountBank.bank_category_id,
        bank_account_no: accountBank.bank_account_no || '',
        bank_account_holder_firstname: accountBank.bank_account_holder_firstname || '',
        bank_account_holder_lastname: accountBank.bank_account_holder_lastname || '',
      });
    }
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    setEditingAccountBank(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate that we have necessary data
      if (!values.bank_id) {
        throw new Error('Bank is required');
      }
      if (!values.bank_category_id) {
        throw new Error('Bank category is required');
      }

      const selectedBank = bankList.find(b => b.id === values.bank_id);
      const selectedCategory = bankCategories.find(c => c.id === values.bank_category_id);

      if (!selectedBank) {
        throw new Error('Selected bank not found');
      }
      if (!selectedCategory) {
        throw new Error('Selected bank category not found');
      }

      const accountBankData = {
        account_id: accountId,
        bank_id: values.bank_id,
        bank: selectedBank,
        bank_account_no: values.bank_account_no,
        bank_category_id: values.bank_category_id,
        bank_category: selectedCategory,
        bank_account_holder_firstname: values.bank_account_holder_firstname,
        bank_account_holder_lastname: values.bank_account_holder_lastname,
      };

      let updatedAccountBanks;
      if (editingAccountBank) {
        updatedAccountBanks = localAccountBanks.map(b =>
          (b.id === editingAccountBank.id || b.tempId === editingAccountBank.tempId)
            ? { ...b, ...accountBankData }
            : b
        );
      } else {
        const newAccountBankData = {
          ...accountBankData,
          tempId: `temp-${Date.now()}`
        };
        updatedAccountBanks = [...localAccountBanks, newAccountBankData];
      }

      setLocalAccountBanks(updatedAccountBanks);
      onChange(updatedAccountBanks);
      setVisible(false);
      setEditingAccountBank(null);
      form.resetFields();
      message.success(editingAccountBank ? 'Bank account updated successfully' : 'Bank account added successfully');
    } catch (error) {
      if (error.name === 'ValidationError') {
        message.error('Validation error: ' + error.message);
      } else {
        console.error('Error saving bank account:', error);
      }
      message.error('Failed to save bank account: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  const fetchUpdatedAccountBanks = async () => {
    if (!accountId) return;

    try {
      
      const response = await getAccountBanks({ account_id: accountId });
      

      let updatedData = [];
      if (response?.data?.data?.account_bank) { 
        updatedData = response.data.data.account_bank;
      } else if (response?.data?.account_bank) {
        updatedData = response.data.account_bank;
      } else if (Array.isArray(response?.data)) {
        updatedData = response.data;
      }

      

      if (updatedData && updatedData.length > 0) {
        setLocalAccountBanks(updatedData);
        onChange(updatedData);
      }
    } catch (error) {
      console.error("Error fetching updated account banks:", error);
    }
  };

  const handleDelete = (bank) => {
    const updatedAccountBanks = localAccountBanks.filter(b =>
      b !== bank && b.tempId !== bank.tempId && b.id !== bank.id
    );
    setLocalAccountBanks(updatedAccountBanks);
    onChange(updatedAccountBanks);
  };

  const getBankName = (record) => {
    if (record.bank && record.bank.name) return record.bank.name;
    if (record.bank_id) {
      const bank = bankList.find(b => b.id === record.bank_id);
      return bank?.name || 'N/A';
    }
    return 'N/A';
  };

  const getCategoryName = (record) => {
    if (record.bank_category?.name) return record.bank_category.name;
    if (record.category_name) return record.category_name;
    if (record.bank_category_id) {
      const category = bankCategories.find(c => c.id === record.bank_category_id);
      return category?.name || 'N/A';
    }
    return 'N/A';
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: ['bank_category', 'name'],
      key: 'bank_category',
      render: (_, record) => getCategoryName(record)
    },
    {
      title: 'Bank',
      dataIndex: ['bank', 'name'],
      key: 'bank',
      render: (_, record) => getBankName(record)
    },
    {
      title: 'Account Number',
      dataIndex: 'bank_account_no',
      key: 'bank_account_no',
    },
    {
      title: 'Account Holder First Name',
      dataIndex: 'bank_account_holder_firstname',
      key: 'bank_account_holder_firstname',
    },
    {
      title: 'Account Holder Last Name',
      dataIndex: 'bank_account_holder_lastname',
      key: 'bank_account_holder_lastname',
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
        dataSource={localAccountBanks}
        rowKey={record => record.id || record.tempId || Math.random()}
        pagination={false}
      />

      <Modal
        title={editingAccountBank ? 'Edit Bank Account' : 'Add Bank Account'}
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
            {editingAccountBank ? 'Update' : 'Save'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="bank_category_id"
            label="Bank Category"
            rules={[{ required: true, message: 'Please select bank category' }]}
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

          <Form.Item
            name="bank_id"
            label="Bank"
            rules={[{ required: true, message: 'Please select bank' }]}
          >
            <Select
              placeholder="Select bank"
              options={bankList.map(bank => ({
                value: bank.id,
                label: bank.name || bank.bank_name
              }))}
            />
          </Form.Item>

          <Form.Item
            name="bank_account_no"
            label="Account Number"
            rules={[{ required: true, message: 'Please enter account number' }]}
          >
            <Input placeholder="Enter account number" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="bank_account_holder_firstname"
            label="Account Holder First Name"
            rules={[{ required: true, message: 'Please enter account holder first name' }]}
          >
            <Input placeholder="Enter account holder first name" autoComplete="name" />
          </Form.Item>

          <Form.Item
            name="bank_account_holder_lastname"
            label="Account Holder Last Name"
            rules={[{ required: true, message: 'Please enter account holder last name' }]}
          >
            <Input placeholder="Enter account holder last name" autoComplete="name" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

AccountBankForm.propTypes = {
  accountBanks: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEdit: PropTypes.bool.isRequired,
};

export default AccountBankForm;
