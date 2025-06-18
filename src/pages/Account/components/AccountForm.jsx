import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, Button, Card, Row, Col,
  Switch, Tabs, message, Space, TreeSelect, Divider, Alert
} from 'antd';
import { useNavigate } from 'react-router-dom';
import AccountAddressForm from './AccountAddressForm';
import AccountPICForm from './AccountPICForm';
import AccountBankForm from './AccountBankForm';
import { getAccountCategories } from '../../../api/accountCategoryApi';
import { getAccountTypes } from '../../../api/accountTypeApi';
import { getIndustries } from '../../../api/industryApi';
import { getBusinessTypes } from '../../../api/businessTypeApi';
import { getAccounts, createAccount, updateAccount } from '../../../api/accountApi';
import { createAccountPIC, updateAccountPIC, deleteAccountPIC } from '../../../api/accountPICApi';
import { createAccountAddress, updateAccountAddress, deleteAccountAddress } from '../../../api/accountAddressApi';
import { createAccountBank, updateAccountBank, deleteAccountBank } from '../../../api/accountBankApi';

const AccountForm = ({
  initialValues = {},
  isEdit = false
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountCategories, setAccountCategories] = useState([]);
  const [typeOfBusinesses, setTypeOfBusinesses] = useState([]);
  const [parentAccounts, setParentAccounts] = useState([]);
  const [parentTreeData, setParentTreeData] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [pics, setPics] = useState([]);
  const [accountBanks, setAccountBanks] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);
  const [hierarchyWarning, setHierarchyWarning] = useState(null);

  const [initialAddresses, setInitialAddresses] = useState([]);
  const [initialPICs, setInitialPICs] = useState([]);
  const [initialAccountBanks, setInitialAccountBanks] = useState([]);

  // Fetch dropdowns and initialize form
  useEffect(() => {
    if (!dataFetched) {
      fetchDropdowns();
      console.log('Fetching initial data for AccountForm', isEdit, initialValues?.id);
      setDataFetched(true);
    }
    if (isEdit && initialValues && initialValues.id) {
      form.setFieldsValue({
        ...initialValues,
        industry_id: initialValues.industry?.id,
        account_type_id: initialValues.account_type?.id,
        account_category_id: initialValues.account_category?.id,
        type_of_business_id: initialValues.type_of_business?.id,
        parent_id: initialValues.parent?.id,
      });
      if (initialValues.account_address) {
        console.log('Initial account addresses:', initialValues.account_address);
        setAddresses(initialValues.account_address);
        setInitialAddresses(initialValues.account_address);
      }
      if (initialValues.account_pic) {
        console.log('Initial account pics:', initialValues.account_pic);
        setPics(initialValues.account_pic);
        setInitialPICs(initialValues.account_pic);
      }
      if (initialValues.account_bank) {
        console.log('Initial account banks:', initialValues.account_bank);
        setAccountBanks(initialValues.account_bank);
        setInitialAccountBanks(initialValues.account_bank);
      }
      if (initialValues.child && initialValues.child.length > 0) {
        setHierarchyWarning(`This account has ${initialValues.child.length} child account(s). Changing its parent may impact your account hierarchy.`);
      }
    }
    // eslint-disable-next-line
  }, [dataFetched, initialValues?.id]);

  const getDeletedItems = (initialArr, currentArr) => {
    const currentIds = currentArr.filter(x => x.id).map(x => x.id);
    return initialArr.filter(item => item.id && !currentIds.includes(item.id));
  };

  const fetchDropdowns = async () => {
    await Promise.all([
      fetchIndustries(),
      fetchAccountTypes(),
      fetchAccountCategories(),
      fetchTypeOfBusinesses(),
      fetchParentAccounts()
    ]);
  };

  const fetchIndustries = async () => {
    try {
      const response = await getIndustries();
      setIndustries(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch industries');
      setIndustries([]);
    }
  };

  const fetchAccountCategories = async () => {
    try {
      const response = await getAccountCategories();
      setAccountCategories(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch account categories');
      setAccountCategories([]);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const response = await getAccountTypes();
      setAccountTypes(response?.data || []);
    } catch (error) {
      message.error('Failed to fetch account types');
      setAccountTypes([]);
    }
  };

  const fetchTypeOfBusinesses = async () => {
    try {
      const response = await getBusinessTypes();
      const formattedBusinessTypes = response?.data?.map(type => ({
        ...type,
        name: type.detail ? `${type.name} - ${type.detail}` : type.name
      })) || [];
      setTypeOfBusinesses(formattedBusinessTypes);
    } catch (error) {
      message.error('Failed to fetch type of business');
      setTypeOfBusinesses([]);
    }
  };

  const fetchParentAccounts = async () => {
    try {
      const response = await getAccounts({ page: 1, limit: 1000 });
      let accountData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          accountData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          accountData = response.data.data;
        }
      }
      const currentId = isEdit && initialValues ? initialValues.id : null;
      const filteredAccounts = accountData.filter(acc =>
        currentId ? acc.id !== currentId : true
      );
      setParentAccounts(filteredAccounts);
      setParentTreeData(buildTreeData(filteredAccounts));
    } catch (error) {
      message.error('Failed to fetch parent accounts');
      setParentAccounts([]);
    }
  };

  const buildTreeData = (accounts) => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) return [];
    return accounts.map(account => {
      const children = account.child && account.child.length > 0
        ? buildTreeData(account.child)
        : undefined;
      return {
        title: account.name,
        value: account.id,
        key: account.id,
        children: children,
        disabled: isEdit && initialValues?.id && findInDescendants(account.child, initialValues.id)
      };
    });
  };

  const findInDescendants = (children, accountId) => {
    if (!children || !Array.isArray(children) || children.length === 0) return false;
    return children.some(child =>
      child.id === accountId || findInDescendants(child.child, accountId)
    );
  };

  const cleanPayload = (obj, allowedFields) => {
    const result = {};
    allowedFields.forEach(field => {
      if (obj[field] !== undefined) result[field] = obj[field];
    });
    return result;
  };

  // Helper: Simpan Address ke Backend
  const saveAddresses = async (addressItems, accountId) => {
    for (const addr of addressItems) {
      const allowedFields = [
        'address1', 'address2', 'sub_district', 'district', 'city', 'province',
        'postalcode', 'country', 'latitude', 'longitude', 'phone_no', 'is_active', 'account_id'
      ];
      // mapping postalcode ke postal_code jika perlu
      const cleanAddr = cleanPayload(
        {
          ...addr,
          account_id: accountId,
          // postal_code: addr.postal_code || addr.postalcode || ''
        },
        allowedFields
      );
      let response;
      if (!addr.id || String(addr.id).startsWith('temp-') || addr.tempId) {
        response = await createAccountAddress(cleanAddr);
      } else {
        response = await updateAccountAddress(addr.id, cleanAddr);
      }
      if (!response || response.success === false) {
        throw new Error(`Failed to update address with ID ${addr.id}`);
      }
    }
  };

  // Helper: Simpan PIC ke Backend
  const savePICs = async (picItems, accountId) => {
    for (const pic of picItems) {
      // Hanya kirim field yang diizinkan DTO
      const allowedFields = [
        'name', 'phone_no', 'email', 'is_active', 'position_id', 'account_id'
      ];
      const cleanPic = cleanPayload(
        {
          ...pic,
          account_id: accountId,
          position_id: pic.position_id || (pic.position && pic.position.id)
        },
        allowedFields
      );
      let response;
      if (!pic.id || String(pic.id).startsWith('temp-') || pic.tempId) {
        response = await createAccountPIC(cleanPic);
      } else {
        response = await updateAccountPIC(pic.id, cleanPic);
      }
      if (!response || response.success === false) {
        throw new Error(`Failed to update PIC with ID ${pic.id}`);
      }
    }
  };

  const saveAccountBanks = async (bankItems, accountId) => {
    for (const bank of bankItems) {
      const allowedFields = [
        'bank_id', 'bank_account_no', 'bank_account_holder_name', 'bank_category_id', 'is_active', 'account_id'
      ];
      const cleanBank = cleanPayload(
        {
          ...bank,
          account_id: accountId,
          bank_id: bank.bank_id || (bank.bank && bank.bank.id),
          bank_category_id: bank.bank_category_id || (bank.bank_category && bank.bank_category.id)
        },
        allowedFields
      );
      let response;
      if (!bank.id || String(bank.id).startsWith('temp-') || bank.tempId) {
        response = await createAccountBank(cleanBank);
      } else {
        response = await updateAccountBank(bank.id, cleanBank);
      }
      if (!response || response.success === false) {
        throw new Error(`Failed to update bank account with ID ${bank.id}`);
      }
    }
  };

  // Submit utama
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        is_active: values.is_active === undefined ? true : values.is_active
      };
      let response, accountId;
      if (isEdit) {
        response = await updateAccount(initialValues.id, payload);
        accountId = initialValues.id;
      } else {
        response = await createAccount(payload);
        accountId = response.data?.id || response.id;
      }

      // === Hapus data yang dihapus user ===
      if (isEdit && accountId) {
        // Address
        const deletedAddresses = getDeletedItems(initialAddresses, addresses);
        for (const addr of deletedAddresses) {
          await deleteAccountAddress(addr.id);
        }
        // PIC
        const deletedPICs = getDeletedItems(initialPICs, pics);
        for (const pic of deletedPICs) {
          await deleteAccountPIC(pic.id);
        }
        // Bank
        const deletedAccountBanks = getDeletedItems(initialAccountBanks, accountBanks);
        for (const accountBank of deletedAccountBanks) {
          await deleteAccountBank(accountBank.id);
        }
      }

      // Simpan/Update relasi setelah accountId didapat
      if (accountId) {
        try {
          await saveAddresses(addresses, accountId);
          console.log('Addresses saved successfully');
        } catch (error) {
          console.error('Error saving addresses:', error);
          message.error('Failed to save addresses');
        }
        
        try {
          await savePICs(pics, accountId);
          console.log('PICs saved successfully');
        } catch (error) {
          console.error('Error saving PICs:', error);
          message.error('Failed to save PICs');
        }
        
        try {
          await saveAccountBanks(accountBanks, accountId);
          console.log('Bank accounts saved successfully');
        } catch (error) {
          console.error('Error saving bank accounts:', error);
          message.error('Failed to save bank accounts');
        }
      }
      message.success(isEdit ? 'Account updated successfully' : 'Account created successfully');
      navigate('/account');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic Information',
      children: (
        <>
          {hierarchyWarning && (
            <Alert
              message="Hierarchy Warning"
              description={hierarchyWarning}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="account_no"
                label="Account Number"
                rules={[{ required: true, message: 'Please enter account number' }]}
              >
                <Input placeholder="Enter account number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Account Name"
                rules={[{ required: true, message: 'Please enter account name' }]}
              >
                <Input placeholder="Enter account name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand_name"
                label="Brand Name"
              >
                <Input placeholder="Enter brand name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="parent_id"
                label="Parent Account"
              >
                <TreeSelect
                  showSearch
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  placeholder="Select parent account"
                  allowClear
                  treeDefaultExpandAll
                  treeData={parentTreeData}
                  treeNodeFilterProp="title"
                  onChange={(value) => {
                    if (isEdit && initialValues?.child?.length > 0) {
                      setHierarchyWarning(value
                        ? `This account has ${initialValues.child.length} child account(s). Changing its parent will update the entire hierarchy.`
                        : null
                      );
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Classification</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="industry_id"
                label="Industry"
              >
                <Select
                  placeholder="Select industry"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={industries.map(ind => ({
                    value: ind.id,
                    label: ind.name
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type_of_business_id"
                label="Type of Business"
              >
                <Select
                  placeholder="Select type of business"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={typeOfBusinesses.map(tob => ({
                    value: tob.id,
                    label: tob.name
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="account_type_id"
                label="Account Type"
              >
                <Select
                  placeholder="Select account type"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={accountTypes.map(type => ({
                    value: type.id,
                    label: type.name
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="account_category_id"
                label="Account Category"
              >
                <Select
                  placeholder="Select account category"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={accountCategories.map(cat => ({
                    value: cat.id,
                    label: cat.name
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </>
      )
    },
    {
      key: 'addresses',
      label: 'Addresses',
      children: (
        <AccountAddressForm
          addresses={addresses}
          onChange={setAddresses}
          accountId={initialValues.id}
          isEdit={isEdit}
        />
      )
    },
    {
      key: 'pics',
      label: 'PIC',
      children: (
        <AccountPICForm
          pics={pics}
          onChange={setPics}
          accountId={initialValues.id}
          isEdit={isEdit}
        />
      )
    },
    {
      key: 'accountBanks',
      label: 'Bank Accounts',
      children: (
        <AccountBankForm
          accountBanks={accountBanks}
          onChange={setAccountBanks}
          accountId={initialValues.id}
          isEdit={isEdit}
        />
      )
    }
  ];

  return (
    <Card title={isEdit ? 'Edit Account' : 'Add New Account'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ is_active: true }}
      >
        <Tabs defaultActiveKey="basic" items={tabItems} />
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/account')}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? 'Update Account' : 'Create Account'}
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default AccountForm;