import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Form, Tabs, Button, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import ChargingMetricForm from './ChargingMetricForm';
import BillingRulesForm from './BillingRulesForm';
import { 
  getAccountRevenueRulesByAccountServiceAsTree, 
  createAccountRevenueRulesFromTree 
} from '../../../../api/accountRevenueRuleApi';

const CRITICAL_PATHS = [
  ['charging_metric', 'dedicated', 'tiers'],
  ['charging_metric', 'non_dedicated', 'tiers'],
  ['billing_rules', 'billing_method', 'methods'],
];

// Ensure each path is an array
const ensureArrayPath = (obj, pathArr) => {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!current[pathArr[i]]) current[pathArr[i]] = {};
    current = current[pathArr[i]];
  }
  const last = pathArr[pathArr.length - 1];
  if (!Array.isArray(current[last])) current[last] = [];
};

// ===== REVENUE RULE JSON SCHEMA CONSTANTS =====
const CHARGING_METRIC_TYPES = {
  DEDICATED: 'dedicated',
  NON_DEDICATED: 'non_dedicated'
};

const DEDICATED_TIER_TYPES = {
  PACKAGE: 'package',
  NON_PACKAGE: 'non_package'
};

const NON_PACKAGE_TYPES = {
  MACHINE_ONLY: 'machine_only',
  SERVICE_ONLY: 'service_only'
};

const NON_DEDICATED_TYPES = {
  TRANSACTION_FEE: 'transaction_fee',
  SUBSCRIPTION: 'subscription',
  ADD_ONS: 'add_ons'
};

const TRANSACTION_FEE_TYPES = {
  FIXED_RATE: 'fixed_rate',
  PERCENTAGE: 'percentage'
};

const SUBSCRIPTION_TYPES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const ADD_ONS_TYPES = {
  SYSTEM_INTEGRATION: 'system_integration',
  INFRASTRUCTURE: 'infrastructure'
};

const BILLING_TYPES = {
  OTC: 'otc',
  MONTHLY: 'monthly'
};

const BILLING_METHOD_TYPES = {
  AUTO_DEDUCT: 'auto_deduct',
  POST_PAID: 'post_paid'
};

const POST_PAID_TYPES = {
  TRANSACTION: 'transaction',
  SUBSCRIPTION: 'subscription'
};

const POST_PAID_SCHEDULES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const TAX_RULE_TYPES = {
  INCLUDE: 'include',
  EXCLUDE: 'exclude'
};

const PAYMENT_TERMS = {
  FOURTEEN_DAYS: 14,
  THIRTY_DAYS: 30
};

// ===== SCHEMA-COMPLIANT DEFAULT STRUCTURES =====

const getDefaultChargingMetric = () => ({
  type: CHARGING_METRIC_TYPES.DEDICATED,
  dedicated: {
    tiers: [{
      type: DEDICATED_TIER_TYPES.PACKAGE,
      package: { tiers: [] },
      non_package_type: NON_PACKAGE_TYPES.MACHINE_ONLY,
      amount: 0,
      has_add_ons: false,
      add_ons_types: []
    }]
  },
  non_dedicated: { tiers: [] }
});

const getDefaultBillingRules = () => ({
  billing_method: {
    methods: [{
      type: BILLING_METHOD_TYPES.AUTO_DEDUCT,
      auto_deduct: { is_enabled: true },
      post_paid: {
        type: POST_PAID_TYPES.TRANSACTION,
        transaction: { schedule: POST_PAID_SCHEDULES.WEEKLY },
        subscription: { schedule: POST_PAID_SCHEDULES.MONTHLY },
        custom_fee: 0
      }
    }]
  },
  tax_rules: { type: TAX_RULE_TYPES.INCLUDE, rate: 11 },
  term_of_payment: { days: PAYMENT_TERMS.THIRTY_DAYS }
});

const getDefaultFormData = () => ({
  charging_metric: getDefaultChargingMetric(),
  billing_rules: getDefaultBillingRules()
});

// ===== ROBUST DATA MAPPING =====

const ensureChargingMetricStructure = (chargingMetric) => {
  if (!chargingMetric) {
    console.log('🔧 Creating new charging metric structure');
    return getDefaultChargingMetric();
  }
  
  console.log('🔍 Validating charging metric structure:', chargingMetric);
  
  const result = {
    type: chargingMetric.type || CHARGING_METRIC_TYPES.DEDICATED,
    dedicated: {
      tiers: Array.isArray(chargingMetric.dedicated?.tiers) ? chargingMetric.dedicated.tiers : []
    },
    non_dedicated: {
      tiers: Array.isArray(chargingMetric.non_dedicated?.tiers) ? chargingMetric.non_dedicated.tiers : []
    }
  };
  
  console.log('✅ Charging metric structure validated:', result);
  return result;
};

const ensureBillingRulesStructure = (billingRules) => {
  if (!billingRules) {
    console.log('🔧 Creating new billing rules structure');
    return getDefaultBillingRules();
  }
  
  console.log('🔍 Validating billing rules structure:', billingRules);
  
  const result = {
    billing_method: {
      methods: Array.isArray(billingRules.billing_method?.methods) ? billingRules.billing_method.methods : []
    },
    tax_rules: billingRules.tax_rules || getDefaultBillingRules().tax_rules,
    term_of_payment: billingRules.term_of_payment || getDefaultBillingRules().term_of_payment
  };
  
  if (result.billing_method.methods.length === 0) {
    console.log('🔧 Adding default billing method');
    result.billing_method.methods.push(getDefaultBillingRules().billing_method.methods[0]);
  }
  
  console.log('✅ Billing rules structure validated:', result);
  return result;
};

const mapApiResponseToFormData = (apiResponse) => {
  console.log('🔍 Starting robust API response mapping');
  console.log('📡 Raw API Response:', apiResponse);
  
  try {
    let extractedData = null;
    
    if (apiResponse?.data?.success && apiResponse.data.data) {
      extractedData = apiResponse.data.data.data;
      console.log('📦 Using apiResponse.data.data.data:', extractedData);
    }
    
    if (!extractedData || (!extractedData.charging_metric && !extractedData.billing_rules)) {
      console.log('⚠️ No existing data found, returning defaults');
      return getDefaultFormData();
    }
    
    const formData = {
      charging_metric: ensureChargingMetricStructure(extractedData.charging_metric),
      billing_rules: ensureBillingRulesStructure(extractedData.billing_rules)
    };
    
    console.log('✅ Successfully mapped API data:', formData);
    console.log('📊 Tiers count:', {
      dedicatedTiers: formData.charging_metric?.dedicated?.tiers?.length || 0,
      nonDedicatedTiers: formData.charging_metric?.non_dedicated?.tiers?.length || 0,
      billingMethods: formData.billing_rules?.billing_method?.methods?.length || 0
    });
    
    return formData;
    
  } catch (error) {
    console.error('❌ Error mapping API response:', error);
    return getDefaultFormData();
  }
};

// ===== MAIN MODAL COMPONENT =====

const RevenueRuleModal = ({
  visible,
  onCancel,
  accountId,
  accountService,
  onSave,
  initialRules = [],
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('charging_metric');
  const [initialData, setInitialData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const initRef = useRef(false);

  // Reset everything when modal closes
  useEffect(() => {
    if (!visible) {
      setInitialData(null);
      setDataLoaded(false);
      setActiveTab('charging_metric');
      initRef.current = false;
      form.resetFields();
    }
  }, [visible, form]);

  // Fetch and prepare data when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!visible || !accountId || !accountService || initRef.current) {
        return;
      }

      initRef.current = true;
      setLoading(true);
      setDataLoaded(false);
      
      try {
        const accountServiceId = accountService.id || accountService.service_id;
        
        if (!accountServiceId) {
          throw new Error('No account service ID available');
        }

        console.log(`🔄 Fetching revenue rules for account ${accountId}, service ${accountServiceId}`);
        
        const response = await getAccountRevenueRulesByAccountServiceAsTree(accountId, accountServiceId);
        console.log('📡 API Response:', response);
        
        const mappedData = mapApiResponseToFormData(response);
        console.log('🎯 Mapped data ready:', mappedData);
        
        setInitialData(mappedData);
        setDataLoaded(true);
        
        console.log('✅ Data fetch and mapping complete');
        
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        messageApi.error('Failed to load existing revenue rules. Using defaults.');
        
        const defaultData = getDefaultFormData();
        setInitialData(defaultData);
        setDataLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchData();
    }
  }, [visible, accountId, accountService, messageApi]);

  // Set form values when initial data is loaded
  useEffect(() => {
    if (dataLoaded && initialData) {
      console.log('🔄 Setting form values with initial data');
      console.log('📊 Data being set:', {
        dedicatedTiers: initialData.charging_metric?.dedicated?.tiers?.length || 0,
        nonDedicatedTiers: initialData.charging_metric?.non_dedicated?.tiers?.length || 0,
        billingMethods: initialData.billing_rules?.billing_method?.methods?.length || 0
      });
      
      form.setFieldsValue(initialData);
      console.log('✅ Form values set successfully');
    }
  }, [dataLoaded, initialData, form]);

  const handleSubmit = async () => {
    if (!dataLoaded) {
      messageApi.warning('Please wait for data to load');
      return;
    }

    try {
      setLoading(true);
      
      const values = await form.validateFields();
      const accountServiceId = accountService.id || accountService.service_id;
      
      if (!accountServiceId) {
        throw new Error('No account service ID available');
      }
      
      const payload = {
        account_id: accountId,
        account_service_id: accountServiceId,
        charging_metric: values.charging_metric,
        billing_rules: values.billing_rules
      };
      
      console.log('💾 Saving revenue rules:', payload);
      
      const response = await createAccountRevenueRulesFromTree(payload);
      
      if (response?.data?.success) {
        messageApi.success('Revenue rules saved successfully');
        
        if (onSave) {
          onSave(values);
        }
        
        setTimeout(() => onCancel(), 1000);
      } else {
        throw new Error(response?.data?.message || 'Failed to save rules');
      }
      
    } catch (error) {
      console.error('❌ Error saving revenue rules:', error);
      
      if (error.errorFields) {
        messageApi.error('Please fill in all required fields');
      } else {
        messageApi.error(error.message || 'Error saving revenue rules');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setInitialData(null);
    setDataLoaded(false);
    initRef.current = false;
    onCancel();
  };

  // Show loading state while fetching data
  if (visible && !dataLoaded) {
    return (
      <>
        {contextHolder}
        <Modal
          title={`Configure Revenue Rules for ${accountService?.service?.name || 'Service'}`}
          open={visible}
          onCancel={handleCancel}
          width={900}
          maskClosable={false}
          destroyOnClose={true}
          footer={null}
        >
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>
              Loading existing revenue rules...
            </p>
          </div>
        </Modal>
      </>
    );
  }

  // Show main form when data is loaded
  return (
    <>
      {contextHolder}
      <Modal
        title={`Configure Revenue Rules for ${accountService?.service?.name || 'Service'}`}
        open={visible}
        onCancel={handleCancel}
        width={900}
        maskClosable={false}
        destroyOnClose={true}
        footer={[
          <Button key="cancel" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading} 
            onClick={handleSubmit}
          >
            Save Rules
          </Button>,
        ]}
      >
        <Spin spinning={loading} tip="Saving...">
          <Form 
            form={form} 
            layout="vertical" 
            preserve={true}
            initialValues={initialData}
          >
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                console.log(`🔄 Switching tab from ${activeTab} to ${key}`);
                setActiveTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  label: 'Charging Metric',
                  key: 'charging_metric',
                  children: <ChargingMetricForm form={form} />,
                },
                {
                  label: 'Billing Rules',
                  key: 'billing_rules',
                  children: <BillingRulesForm form={form} />,
                },
              ]}
            />
          </Form>
          
        </Spin>
      </Modal>
    </>
  );
};

RevenueRuleModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  accountId: PropTypes.string,
  accountService: PropTypes.object,
  onSave: PropTypes.func,
  initialRules: PropTypes.array,
};

// Debug utility for testing
window.debugRevenueRuleData = (accountId, serviceId) => {
  console.log('🧪 Testing revenue rule data flow...');
  return {
    accountId,
    serviceId,
    testApiCall: () => getAccountRevenueRulesByAccountServiceAsTree(accountId, serviceId),
    testMapping: (response) => mapApiResponseToFormData(response)
  };
};

// Debug utility to check form state
window.checkFormState = (formInstance) => {
  if (!formInstance) {
    console.log('❌ No form instance provided');
    return;
  }
  
  const values = formInstance.getFieldsValue();
  console.log('🔍 Current form state:');
  console.log('📊 Full form values:', values);
  console.log('📊 Dedicated tiers:', values.charging_metric?.dedicated?.tiers?.length || 0);
  console.log('📊 Non-dedicated tiers:', values.charging_metric?.non_dedicated?.tiers?.length || 0);
  console.log('📊 Billing methods:', values.billing_rules?.billing_method?.methods?.length || 0);
  
  return values;
};

console.log('🔧 Debug utilities available:');
console.log('  - window.debugRevenueRuleData(accountId, serviceId)');
console.log('  - window.checkFormState(formInstance)');

export default RevenueRuleModal;