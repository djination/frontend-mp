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
import { getAccountType } from '../../../api/accountTypeApi';
import { getIndustry } from '../../../api/accountIndustryApi';
import { getTypeOfBusiness } from '../../../api/accountTypeOfBusinessApi';
import { getAccounts, createAccount, updateAccount } from '../../../api/accountApi';

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
  const [banks, setBanks] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);
  const [hierarchyWarning, setHierarchyWarning] = useState(null);

  // Fetch dropdowns and initialize form
  useEffect(() => {
    if (!dataFetched) {
      fetchDropdowns();
      setDataFetched(true);
    }
    
    if (isEdit && initialValues && initialValues.id) {
      // Set form values
      form.setFieldsValue({
        ...initialValues,
        industry_id: initialValues.industry?.id,
        account_type_id: initialValues.account_type?.id,
        account_category_id: initialValues.account_category?.id,
        type_of_business_id: initialValues.type_of_business?.id,
        parent_id: initialValues.parent?.id,
      });
      
      // Set related data
      if (initialValues.account_address) setAddresses(initialValues.account_address);
      if (initialValues.account_pic) setPics(initialValues.account_pic);
      if (initialValues.account_bank) setBanks(initialValues.account_bank);
      
      // Show hierarchy warning if account has children
      if (initialValues.child && initialValues.child.length > 0) {
        setHierarchyWarning(`This account has ${initialValues.child.length} child account(s). Changing its parent may impact your account hierarchy.`);
      }
    }
    // eslint-disable-next-line
  }, [dataFetched, initialValues?.id]);

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
      const response = await getIndustry();
      if (response && response.data) {
        setIndustries(response.data);
      } else {
        setIndustries([]);
      }
    } catch (error) {
      message.error('Failed to fetch industries');
      console.error(error);
      setIndustries([]);
    }
  };

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

  const fetchTypeOfBusinesses = async () => {
    try {
      const response = await getTypeOfBusiness();
      if (response && response.data) {
        setTypeOfBusinesses(response.data);
      } else {
        setTypeOfBusinesses([]);
      }
    } catch (error) {
      message.error('Failed to fetch type of business');
      console.error(error);
      setAccountCategories([]);
    }
  };

  const fetchParentAccounts = async () => {
    try {
      const response = await getAccounts({
        page: 1,
        limit: 1000 // Get all possible parents
      });
      
      let accountData = [];
      
      if (response && response.data) {
        // Handle different API response structures
        if (Array.isArray(response.data)) {
          accountData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          accountData = response.data.data;
        }
      }
      
      // Filter out the current account to prevent self-reference
      const currentId = isEdit && initialValues ? initialValues.id : null;
      const filteredAccounts = accountData.filter(acc => 
        currentId ? acc.id !== currentId : true
      );
      
      setParentAccounts(filteredAccounts);
      
      // Build tree data for TreeSelect
      const treeData = buildTreeData(filteredAccounts);
      setParentTreeData(treeData);
      
    } catch (error) {
      console.error('Error fetching parent accounts:', error);
      message.error('Failed to fetch parent accounts');
      setParentAccounts([]);
    }
  };

  // Build TreeSelect data from accounts
  const buildTreeData = (accounts) => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return [];
    }
    
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
  
  // Check if an account is in descendants to prevent circular references
  const findInDescendants = (children, accountId) => {
    if (!children || !Array.isArray(children) || children.length === 0) {
      return false;
    }
    
    return children.some(child => 
      child.id === accountId || findInDescendants(child.child, accountId)
    );
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Prepare payload
      const payload = { 
        ...values,
        // Ensure is_active is a boolean
        is_active: values.is_active === undefined ? true : values.is_active
      };
      
      // Handle creating or updating
      if (isEdit) {
        await updateAccount(initialValues.id, payload);
        message.success('Account updated successfully');
      } else {
        await createAccount(payload);
        message.success('Account created successfully');
      }
      
      navigate('/account');
    } catch (error) {
      // Provide meaningful error messages
      if (error.response?.data?.message) {
        message.error(`Error: ${error.response.data.message}`);
      } else if (error.message?.includes('descendants')) {
        message.error('Cannot set a descendant as parent (circular reference)');
      } else {
        message.error('Failed to save account');
      }
      
      console.error('Error saving account:', error);
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
      key: 'banks',
      label: 'Bank Accounts',
      children: (
        <AccountBankForm
          banks={banks}
          onChange={setBanks}
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