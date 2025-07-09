import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, Button, Card, Row, Col,
  Switch, Tabs, message, Space, TreeSelect, Divider, Alert, App
} from 'antd';
import { useNavigate } from 'react-router-dom';

// form components
import AccountAddressForm from './AccountAddressForm';
import AccountPICForm from './AccountPICForm';
import AccountBankForm from './AccountBankForm';
import AccountServiceForm from './AccountServiceForm';
import AccountDocumentForm from './AccountDocumentForm';
import TypeOfBusinessSelector from './TypeOfBusinessSelector';

// API calls
import { getAccountCategories } from '../../../api/accountCategoryApi';
import { getAccountTypes } from '../../../api/accountTypeApi';
import { getIndustries } from '../../../api/industryApi';
import { createAccount, updateAccount, generateAccountNo, getParentAccounts } from '../../../api/accountApi';
import { createAccountPIC, updateAccountPIC, deleteAccountPIC } from '../../../api/accountPICApi';
import { createAccountAddress, updateAccountAddress, deleteAccountAddress } from '../../../api/accountAddressApi';
import { createAccountBank, updateAccountBank, deleteAccountBank } from '../../../api/accountBankApi';
import { createAccountService, updateAccountService, deleteAccountService, getAccountServicesByAccount } from '../../../api/accountServiceApi';
import { getAccountDocuments, uploadAccountDocument, deleteAccountDocument } from '../../../api/accountDocumentApi';
import { createAccountRevenueRules } from '../../../api/accountRevenueRuleApi';

const buildTreeData = (accounts, selfId) => {
  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) return [];
  return accounts
    .filter(acc => acc.id !== selfId) // Hindari memilih diri sendiri sebagai parent
    .map(account => ({
      title: `${account.name} (${account.account_no})`,
      value: account.id,
      key: account.id,
      children: account.children && account.children.length > 0
        ? buildTreeData(account.children, selfId)
        : undefined,
    }));
};

const cleanPayload = (obj, allowedFields) => {
  const result = {};
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
  });
  return result;
};

const AccountForm = ({
  initialValues = {},
  isEdit = false,
  onFinish,
  ...props
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message, notification, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountCategories, setAccountCategories] = useState([]);
  const [treeParentAccounts, setTreeParentAccounts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [pics, setPics] = useState([]);
  const [accountBanks, setAccountBanks] = useState([]);
  const [accountServices, setAccountServices] = useState([]);
  const [accountDocuments, setAccountDocuments] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);
  const [hierarchyWarning, setHierarchyWarning] = useState(null);
  const [initialAddresses, setInitialAddresses] = useState([]);
  const [initialPICs, setInitialPICs] = useState([]);
  const [initialAccountBanks, setInitialAccountBanks] = useState([]);
  const [initialAccountServices, setInitialAccountServices] = useState([]);
  const [initialAccountDocuments, setInitialAccountDocuments] = useState([]);
  
  const fetchAccountDocuments = async (accountId) => {
    if (!accountId) return;
    
    try {
      const response = await getAccountDocuments(accountId);
      
      if (response?.data) {
        let documents = [];
        
        // Handle berbagai kemungkinan format data
        if (Array.isArray(response.data)) {
          documents = response.data;
        } else if (Array.isArray(response.data.data)) {
          documents = response.data.data;
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          documents = Object.values(response.data);
        }
        setAccountDocuments(documents);
        setInitialAccountDocuments(documents);
      } else {
        setAccountDocuments([]);
      }
    } catch (error) {
      message.error('Failed to fetch account documents');
      setAccountDocuments([]);
    }
  };

  useEffect(() => {
    const fetchTreeParentAccounts = async () => {
      const response = await getParentAccounts({ page: 1, limit: 1000 });
      setTreeParentAccounts(response?.data || []);
    };
    fetchTreeParentAccounts();
  }, []);

  useEffect(() => {
    if (!dataFetched) {
      fetchDropdowns();
      setDataFetched(true);
    }
    if (isEdit && initialValues && initialValues.id) {
      // Set form values including parent type of business
      const formValues = {
        ...initialValues,
        industry_id: initialValues.industry?.id,
        account_type_id: initialValues.account_type?.id,
        account_category_ids: initialValues.account_categories
          ? initialValues.account_categories.map(cat => cat.id)
          : [],
        type_of_business_id: initialValues.type_of_business?.id,
        type_of_business_detail: initialValues.type_of_business_detail,
        parent_type_of_business: initialValues.type_of_business?.parent_id,
        parent_id: initialValues.parent?.id,
      };
      
      form.setFieldsValue(formValues);
      
      if (initialValues.account_address) {
        setAddresses(initialValues.account_address);
        setInitialAddresses(initialValues.account_address);
      }
      if (initialValues.account_pic) {
        setPics(initialValues.account_pic);
        setInitialPICs(initialValues.account_pic);
      }
      if (initialValues.account_bank) {
        setAccountBanks(initialValues.account_bank);
        setInitialAccountBanks(initialValues.account_bank);
      }
      const accountId = initialValues.id;
      if (accountId) {
        fetchAccountServices(accountId);
        fetchAccountDocuments(accountId);
      }
      

      if (initialValues.child && initialValues.child.length > 0) {
        setHierarchyWarning(`This account has ${initialValues.child.length} child account(s). Changing its parent may impact your account hierarchy.`);
      }
    }
    // eslint-disable-next-line
  }, [dataFetched, initialValues?.id, form, isEdit]);

  const getDeletedItems = (initialArr, currentArr) => {
    const currentIds = currentArr.filter(x => x.id).map(x => x.id);
    return initialArr.filter(item => item.id && !currentIds.includes(item.id));
  };

  const fetchDropdowns = async () => {
    await Promise.all([
      fetchIndustries(),
      fetchAccountTypes(),
      fetchAccountCategories(),
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

  const fetchAccountServices = async (accountId) => {
    if (!accountId) {
      console.error("Cannot fetch services: accountId is undefined");
      setAccountServices([]); // Default ke array kosong
      return;
    }
    
    try {
      const response = await getAccountServicesByAccount(accountId);
      
      if (response && response.data && Array.isArray(response.data.data.data)) {
        setAccountServices(Array.isArray(response.data.data.data) ? response.data.data.data : []);
        setInitialAccountServices(Array.isArray(response.data.data.data) ? response.data.data.data : []);
      } 
    } catch (error) {
      console.error("Error fetching account services:", error);
      message.error('Failed to fetch account services');
      setAccountServices([]); // Default ke array kosong
      setInitialAccountServices([]);
    }
  };

  // Helper: Simpan Address ke Backend
  const saveAddresses = async (addressItems, accountId) => {
    for (const addr of addressItems) {
      const allowedFields = [
        'address1', 'address2', 'sub_district', 'district', 'city', 'province',
        'postalcode', 'country', 'latitude', 'longitude', 'phone_no', 'is_active', 'account_id'
      ];
      const cleanAddr = cleanPayload(
        {
          ...addr,
          account_id: accountId,
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

  //Helper: Simpan Bank Account ke Backend
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

  // Helper: Simpan Service Account ke Backend
  const saveAccountServices = async (serviceItems, accountId) => {
    if (!accountId) {
      console.error("Cannot save services: accountId is undefined");
      return;
    }
  
    for (const service of serviceItems) {
      const allowedFields = [
        'service_id', 'is_active', 'account_id'
      ];
      
      // Pastikan service_id dan account_id valid
      const serviceId = service.service_id || (service.service && service.service.id);
      if (!serviceId) {
        console.error("Invalid service record, missing service_id:", service);
        continue;
      }
      
      const cleanService = {
        service_id: serviceId,
        account_id: accountId,
        is_active: service.is_active !== undefined ? service.is_active : true
      };
      
      try {
        let response;
        if (!service.id || String(service.id).startsWith('temp-') || service.tempId) {
          
          response = await createAccountService(cleanService);
        } else {
          
          response = await updateAccountService(service.id, cleanService);
        }
        
        if (!response || response.success === false) {
          throw new Error(`Failed to update service with ID ${serviceId}`);
        }
        
      } catch (error) {
        console.error(`Error saving service ${serviceId}:`, error);
        throw new Error(`Failed to update service with ID ${serviceId}: ${error.message}`);
      }
    }    
  };

  // Helper: Simpan dokumen ke Backend
  const saveAccountDocuments = async (documentItems, accountId) => {
    if (!accountId || !Array.isArray(documentItems)) {
      console.error("Cannot save documents: invalid input");
      return;
    }
    // Handle only new documents with file uploads
    const newDocuments = documentItems.filter(doc => 
      doc.tempId && !doc.id && doc.file && doc.document_type
    );
    
    for (const doc of newDocuments) {
      try {
        const formData = new FormData();
        
        // Append file dengan nama yang benar sesuai dengan nama field yang diharapkan backend
        formData.append('file', doc.file);
        
        // Append other fields
        formData.append('account_id', accountId);
        formData.append('document_type', doc.document_type);
        
        // Format tanggal expires_at dengan benar jika ada
        if (doc.expires_at) {
          // Pastikan format tanggal sesuai yang diharapkan backend (YYYY-MM-DD)
          // Jika sudah dalam string format, gunakan langsung
          const expiryDate = typeof doc.expires_at === 'string' 
            ? doc.expires_at 
            : doc.expires_at instanceof Date 
              ? doc.expires_at.toISOString().split('T')[0]
              : doc.expires_at;
              
          formData.append('expires_at', expiryDate);
        }
        
        // Tambahkan timeout lebih lama untuk file besar
        const response = await uploadAccountDocument(formData);
      } catch (error) {
        console.error(`Error uploading document ${doc.filename}:`, error);
        // Tampilkan detail error jika ada
        if (error.response && error.response.data) {
          console.error('Server response:', error.response.data);
          message.error(`Failed to upload document: ${error.response.data.message || 'Unknown error'}`);
        } else {
          message.error(`Failed to upload document: ${doc.filename}`);
        }
      }
    }
  };

  // Helper untuk menyimpan revenue rules dari account services
  const saveAccountRevenueRules = async (accountId, services) => {
    if (!accountId || !Array.isArray(services)) return;
    
    // Cek apakah ada revenue rules yang disimpan di localStorage
    let revenueRulesByService = {};
    try {
      const savedRules = localStorage.getItem(`revenueRules_${accountId}`);
      if (savedRules) {
        revenueRulesByService = JSON.parse(savedRules);
      }
    } catch (error) {
      console.error("Error parsing saved revenue rules:", error);
    }
    
    // Tambahkan revenue rules yang sudah ada ke service yang sesuai
    for (const service of services) {
      const serviceId = service.service_id || (service.service && service.service.id);
      if (serviceId && revenueRulesByService[serviceId]) {
        service.revenue_rules = revenueRulesByService[serviceId];
      }
    }
    
    // Bersihkan localStorage setelah disimpan ke API
    localStorage.removeItem(`revenueRules_${accountId}`);
    
    return services;
  };

  // Di fungsi saveRevenueRulesToBackend, ubah format payload:
  const saveRevenueRulesToBackend = async (accountId, services) => {
    if (!accountId || !Array.isArray(services)) return;
    
    // Filter services yang memiliki revenue_rules
    const servicesToProcess = services.filter(service => 
      service.revenue_rules && Array.isArray(service.revenue_rules) && service.revenue_rules.length > 0
    );
    
    if (servicesToProcess.length === 0) return;
    
    // Tambahkan variabel untuk menghitung hasil
    let successCount = 0;
    let errorCount = 0;
    
    for (const service of servicesToProcess) {
      const serviceId = service.service_id || (service.service && service.service.id);
      if (!serviceId) continue;
      
      try {
        const accountServiceId = service.id;
        
        if (!accountServiceId) {
          console.error(`Cannot save revenue rules: missing account_service_id for service ${serviceId}`);
          errorCount++;
          continue;
        }
        
        // Validasi rules sebelum dikirim
        const validRules = service.revenue_rules
          .filter(rule => rule && rule.rule_category && rule.rule_path)
          .map(rule => ({
            rule_category: String(rule.rule_category),
            rule_path: String(rule.rule_path),
            rule_value: rule.rule_value !== undefined ? String(rule.rule_value) : ''
          }));
        
        if (validRules.length === 0) {
          console.warn(`No valid rules found for service ${serviceId}`);
          continue;
        }

        // Format payload dengan rules yang valid
        const payload = {
          account_id: accountId,
          account_service_id: accountServiceId,
          rules: validRules
        };
        
        await createAccountRevenueRules(payload);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error saving revenue rules for service ${serviceId}:`, error);
        
        // Detail log untuk error 500
        if (error.response && error.response.status === 500) {
          console.error('Server error details:', error.response.data);
          // Jika gagal karena error 500, simpan rules di localStorage untuk debugging
          try {
            localStorage.setItem(`debug_rules_${serviceId}`, 
                                JSON.stringify(service.revenue_rules));
          } catch (e) {
            console.error('Failed to save debug data:', e);
          }
        }
        
        message.error(`Failed to save revenue rules for ${service.service?.name || 'service'}`);
      }
    }
    
    // Tampilkan hasil akhir
    if (successCount > 0) {
      message.success(`Successfully saved revenue rules for ${successCount} service(s)`);
    }
    if (errorCount > 0) {
      message.warning(`Failed to save revenue rules for ${errorCount} service(s)`);
    }
  };

  // Submit utama
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let accountNo = values.account_no;
      if (!accountNo || accountNo.trim() === '') {
        const accountTypeObj = accountTypes.find(t => t.id === values.account_type_id);
        const accountTypeName = accountTypeObj?.name?.toLowerCase();
        let parentId = values.parent_id || null;

        const result = await generateAccountNo({
          account_type_name: accountTypeName ? accountTypeName.toLowerCase() : accountTypeName,
          parent_id: parentId,
        });
        accountNo = result.data.account_no;
      }

      // Clean form values to remove any extra fields that shouldn't be sent to backend
      const formValues = form.getFieldsValue();
      console.log('All form values:', formValues); // Debug log
      
      const payload = {
        account_no: accountNo,
        name: formValues.name,
        brand_name: formValues.brand_name,
        industry_id: formValues.industry_id,
        type_of_business_id: formValues.type_of_business_id,
        type_of_business_detail: formValues.type_of_business_detail,
        account_type_id: formValues.account_type_id,
        account_category_ids: formValues.account_category_ids,
        parent_id: formValues.parent_id === 'no-parent' ? null : formValues.parent_id,
        is_active: formValues.is_active === undefined ? true : formValues.is_active
      };

      // Remove undefined/null values except for parent_id and type_of_business_detail which can be explicitly null
      Object.keys(payload).forEach(key => {
        if (!['parent_id', 'type_of_business_detail'].includes(key) && 
            (payload[key] === undefined || payload[key] === '')) {
          delete payload[key];
        }
      });

      console.log('Cleaned account payload:', payload); // Debug log
      let response, accountId;
      if (isEdit) {
        console.log('Updating account with payload:', payload); // Debug log
        response = await updateAccount(initialValues.id, payload);
        accountId = initialValues.id;
      } else {
        console.log('Creating account with payload:', payload); // Debug log
        response = await createAccount(payload);
        accountId = response.data?.id || response.id;
      }

      // === Hapus data yang dihapus user ===
      if (isEdit && accountId) {
        const deletedAddresses = getDeletedItems(initialAddresses, addresses);
        for (const addr of deletedAddresses) {
          await deleteAccountAddress(addr.id);
        }
        const deletedPICs = getDeletedItems(initialPICs, pics);
        for (const pic of deletedPICs) {
          await deleteAccountPIC(pic.id);
        }
        const deletedAccountBanks = getDeletedItems(initialAccountBanks, accountBanks);
        for (const accountBank of deletedAccountBanks) {
          await deleteAccountBank(accountBank.id);
        }
        const deletedAccountServices = getDeletedItems(initialAccountServices, accountServices);
        for (const accountService of deletedAccountServices) {
          await deleteAccountService(accountService.id);
        }
        const deletedDocuments = getDeletedItems(initialAccountDocuments, accountDocuments);
        for (const doc of deletedDocuments) {
          await deleteAccountDocument(doc.id);
        }
      }

      // Simpan/Update relasi setelah accountId didapat
      if (accountId) {
        try {
          await saveAddresses(addresses, accountId);
        } catch (error) {
          message.error('Failed to save addresses');
        }
        try {
          await savePICs(pics, accountId);
        } catch (error) {
          message.error('Failed to save PICs');
        }
        try {
          await saveAccountBanks(accountBanks, accountId);
        } catch (error) {
          message.error('Failed to save bank accounts');
        }
        try {
          const servicesToSave = await saveAccountRevenueRules(accountId, accountServices);
          await saveAccountServices(servicesToSave || accountServices, accountId);
          await saveRevenueRulesToBackend(accountId, servicesToSave || accountServices);
        } catch (error) {
          message.error('Failed to save service accounts');
        }
        try {
          await saveAccountDocuments(accountDocuments, accountId);
        } catch (error) {
          message.error('Failed to save account documents');
        }
      }
      message.success(isEdit ? 'Account updated successfully' : 'Account created successfully');
      navigate('/account');
    } catch (error) {
      console.error('Account save error:', error);
      console.error('Error response:', error.response?.data);
      
      // Show specific error message if available
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to save account';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // TreeSelect data untuk Parent Account
  const parentTreeDataAccount = [
    { title: '-- No Parent --', value: 'no-parent', key: 'no-parent' },
    ...buildTreeData(treeParentAccounts, isEdit ? initialValues.id : null)
  ];

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
                rules={[{ required: false, message: 'Please enter account number' }]}
              >
                <Input placeholder="Enter account number" disabled />
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
                  allowClear
                  showSearch
                  treeDefaultExpandAll
                  placeholder="Select parent account"
                  treeData={parentTreeDataAccount}
                  filterTreeNode={(input, node) =>
                    (node.title || '').toLowerCase().includes(input.toLowerCase())
                  }
                  // Convert 'no-parent' back to null when submitting
                  onChange={value => {
                    form.setFieldsValue({ parent_id: value === 'no-parent' ? null : value });
                  }}
                  value={
                    form.getFieldValue('parent_id') === null || form.getFieldValue('parent_id') === undefined
                      ? 'no-parent'
                      : form.getFieldValue('parent_id')
                  }
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
          </Row>
          
          {/* Type of Business Selector */}
          <TypeOfBusinessSelector
            form={form}
            value={{
              parent_id: form.getFieldValue('parent_type_of_business'),
              child_id: form.getFieldValue('type_of_business_id'),
              type_of_business_detail: form.getFieldValue('type_of_business_detail')
            }}
            onChange={(values) => {
              console.log('Type of business changed:', values);
              // Update form fields when TypeOfBusinessSelector changes
              if (values.parent_id !== undefined) {
                form.setFieldValue('parent_type_of_business', values.parent_id);
              }
              if (values.type_of_business_id !== undefined) {
                form.setFieldValue('type_of_business_id', values.type_of_business_id);
              }
              if (values.type_of_business_detail !== undefined) {
                form.setFieldValue('type_of_business_detail', values.type_of_business_detail);
              }
            }}
          />
          
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
                name="account_category_ids"
                label="Account Category"
                rules={[{ required: true, message: 'Please select at least one account category' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select account categories"
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
    },
    {
      key: 'accountServices',
      label: 'Services',
      children: (
        <AccountServiceForm
          accountServices={accountServices}
          onChange={setAccountServices}
          accountId={initialValues.id}
          isEdit={isEdit}
        />
      )
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <AccountDocumentForm
          accountDocuments={accountDocuments}
          onChange={setAccountDocuments}
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