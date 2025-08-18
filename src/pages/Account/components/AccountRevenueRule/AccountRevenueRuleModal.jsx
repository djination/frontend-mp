import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Tabs, Button, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import ChargingMetricForm from './ChargingMetricForm';
import BillingRulesForm from './BillingRulesForm';
import { 
  getAccountRevenueRulesByAccountServiceAsTree, 
  createAccountRevenueRulesFromTree 
} from '../../../../api/accountRevenueRuleApi';
import { createBulkPackageTiers, getPackageTiersByAccount } from '../../../../api/packageTierApi';
import dayjs from 'dayjs';

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
    return getDefaultChargingMetric();
  }
  
  
  const result = {
    type: chargingMetric.type || CHARGING_METRIC_TYPES.DEDICATED,
    dedicated: {
      tiers: Array.isArray(chargingMetric.dedicated?.tiers) ? chargingMetric.dedicated.tiers : []
    },
    non_dedicated: {
      tiers: Array.isArray(chargingMetric.non_dedicated?.tiers) ? chargingMetric.non_dedicated.tiers : []
    }
  };
  
  return result;
};

const ensureBillingRulesStructure = (billingRules) => {
  if (!billingRules) {
    return getDefaultBillingRules();
  }
  
  
  const result = {
    billing_method: {
      methods: Array.isArray(billingRules.billing_method?.methods) ? billingRules.billing_method.methods : []
    },
    tax_rules: billingRules.tax_rules || getDefaultBillingRules().tax_rules,
    term_of_payment: billingRules.term_of_payment || getDefaultBillingRules().term_of_payment
  };
  
  if (result.billing_method.methods.length === 0) {
    result.billing_method.methods.push(getDefaultBillingRules().billing_method.methods[0]);
  }
  
  return result;
};

const mapApiResponseToFormData = (apiResponse, packageTiers = []) => {
  console.log('🗺️ Starting mapApiResponseToFormData with:', { apiResponse, packageTiers });
  
  try {
    let extractedData = null;
    
    if (apiResponse?.data?.success && apiResponse.data.data) {
      extractedData = apiResponse.data.data.data;
    }
    
    if (!extractedData || (!extractedData.charging_metric && !extractedData.billing_rules)) {
      console.log('📋 Using default form data - no extracted data');
      return getDefaultFormData();
    }
    
    const formData = {
      charging_metric: ensureChargingMetricStructure(extractedData.charging_metric),
      billing_rules: ensureBillingRulesStructure(extractedData.billing_rules)
    };
    
    console.log('📋 Base form data created:', formData);
    
    // Integrate package tiers data if available
    if (packageTiers && packageTiers.length > 0) {
      console.log('🔄 Integrating package tiers:', packageTiers);
      console.log('🔍 Current charging metric:', formData.charging_metric);
      
      if (formData.charging_metric.type === 'dedicated' && 
          formData.charging_metric.dedicated?.tiers) {
        
        formData.charging_metric.dedicated.tiers = formData.charging_metric.dedicated.tiers.map((tier, tierIndex) => {
          console.log(`🎯 Processing tier ${tierIndex}:`, tier);
          
          if (tier.type === 'package') {
            // Convert package tiers from database to form format
            const packageTierData = packageTiers.map((dbTier, index) => {
              console.log(`Converting dbTier ${index}:`, dbTier);
              
              try {
                const converted = {
                  min: Number(dbTier.min_value) || 0,
                  max: Number(dbTier.max_value) || 0,
                  amount: Number(dbTier.amount) || 0,
                  start_date: dayjs(dbTier.start_date),
                  end_date: dayjs(dbTier.end_date)
                };
                console.log(`✅ Converted tier ${index}:`, converted);
                console.log(`✅ start_date dayjs object:`, converted.start_date.format('YYYY-MM-DD'));
                console.log(`✅ end_date dayjs object:`, converted.end_date.format('YYYY-MM-DD'));
                return converted;
              } catch (conversionError) {
                console.error(`❌ Error converting tier ${index}:`, conversionError);
                return {
                  min: 0,
                  max: 0,
                  amount: 0,
                  start_date: dayjs(),
                  end_date: dayjs().add(1, 'year')
                };
              }
            });
            
            console.log('📦 Converted package tier data:', packageTierData);
            
            return {
              ...tier,
              package: {
                tiers: packageTierData
              }
            };
          }
          return tier;
        });
        
        console.log('✅ Final charging metric after integration:', formData.charging_metric);
      }
    } else {
      console.log('ℹ️ No package tiers to integrate or empty array');
    }
    
    console.log('🏁 Final form data:', formData);
    return formData;
    
  } catch (error) {
    console.error('❌ Error mapping API response:', error);
    console.error('❌ Error stack:', error.stack);
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
      console.log('🔄 useEffect fetchData triggered:', { visible, accountId, accountService, initRefCurrent: initRef.current });
      
      if (!visible || !accountId || !accountService || initRef.current) {
        console.log('⏭️ Skipping fetchData:', { visible, accountId, accountService, initRefCurrent: initRef.current });
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

        console.log('🚀 Fetching data for:', { accountId, accountServiceId });

        // Fetch both revenue rules and package tiers
        const [revenueRulesResponse, packageTiersResponse] = await Promise.allSettled([
          getAccountRevenueRulesByAccountServiceAsTree(accountId, accountServiceId),
          getPackageTiersByAccount(accountId)
        ]);
        
        console.log('📥 API Responses:', { 
          revenueRules: revenueRulesResponse,
          packageTiers: packageTiersResponse 
        });
        
        let revenueRulesData = null;
        let packageTiersData = [];
        
        if (revenueRulesResponse.status === 'fulfilled') {
          revenueRulesData = revenueRulesResponse.value;
          console.log('✅ Revenue rules response:', revenueRulesData);
        } else {
          console.warn('❌ Failed to fetch revenue rules:', revenueRulesResponse.reason);
        }
        
        if (packageTiersResponse.status === 'fulfilled') {
          const packageTiersApiResponse = packageTiersResponse.value || {};
          console.log('📦 Package tiers API response:', packageTiersApiResponse);
          
          // Extract the actual data array from the API response
          if (packageTiersApiResponse.success && packageTiersApiResponse.data) {
            packageTiersData = packageTiersApiResponse.data;
          } else {
            packageTiersData = [];
          }
          
          console.log('📦 Package tiers data extracted:', packageTiersData);
          console.log('📦 Package tiers type:', typeof packageTiersData);
          console.log('📦 Package tiers length:', packageTiersData.length);
          
          // Don't add dummy data if real data exists
          if (!packageTiersData || packageTiersData.length === 0) {
            console.log('🧪 No real data, adding dummy package tier data for testing');
            packageTiersData = [
              {
                min_value: 10000,
                max_value: 1000000,
                amount: 5000,
                start_date: '2025-01-01',
                end_date: '2025-12-31'
              },
              {
                min_value: 1000001,
                max_value: 10000000,
                amount: 10000,
                start_date: '2025-01-01',
                end_date: '2025-12-31'
              }
            ];
          } else {
            console.log('✅ Using real package tier data');
          }
        } else {
          console.warn('❌ Failed to fetch package tiers:', packageTiersResponse.reason);
          // Even if API fails, add dummy data for testing
          console.log('🧪 Adding dummy package tier data due to API failure');
          packageTiersData = [
            {
              min_value: 10000,
              max_value: 1000000,
              amount: 5000,
              start_date: '2025-01-01',
              end_date: '2025-12-31'
            }
          ];
        }
        
        const mappedData = mapApiResponseToFormData(revenueRulesData, packageTiersData);
        console.log('📋 Mapped form data:', mappedData);
        
        setInitialData(mappedData);
        setDataLoaded(true);
        
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        messageApi.error('Failed to load existing revenue rules. Using defaults.');
        
        // Add dummy data even on error for testing
        const defaultData = getDefaultFormData();
        // Force add package tiers to default data
        if (defaultData.charging_metric.type === 'dedicated' && 
            defaultData.charging_metric.dedicated?.tiers?.length > 0) {
          defaultData.charging_metric.dedicated.tiers[0].package = {
            tiers: [
              {
                min: 10000,
                max: 1000000,
                amount: 5000,
                start_date: dayjs('2025-01-01'),
                end_date: dayjs('2025-12-31')
              }
            ]
          };
        }
        console.log('🧪 Using default data with dummy package tiers:', defaultData);
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
      console.log('🎯 Setting form values:', initialData);
      form.setFieldsValue(initialData);
      
      // Debug: Check what was actually set
      setTimeout(() => {
        const currentValues = form.getFieldsValue();
        console.log('📋 Current form values after setting:', currentValues);
      }, 100);
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
      
      // Extract package tiers for separate table storage
      const packageTiers = [];
      if (values.charging_metric?.type === 'dedicated' && values.charging_metric.dedicated?.tiers) {
        values.charging_metric.dedicated.tiers.forEach((tier) => {
          if (tier.type === 'package' && tier.package?.tiers) {
            tier.package.tiers.forEach((pkgTier) => {
              if (pkgTier.min && pkgTier.max && pkgTier.amount && pkgTier.start_date && pkgTier.end_date) {
                packageTiers.push({
                  min_value: pkgTier.min,
                  max_value: pkgTier.max,
                  amount: pkgTier.amount,
                  start_date: dayjs(pkgTier.start_date).format('YYYY-MM-DD'),
                  end_date: dayjs(pkgTier.end_date).format('YYYY-MM-DD'),
                });
              }
            });
          }
        });
      }

      // Remove package tiers from charging_metric before saving to revenue rules
      const chargingMetricForRules = { ...values.charging_metric };
      if (chargingMetricForRules.type === 'dedicated' && chargingMetricForRules.dedicated?.tiers) {
        chargingMetricForRules.dedicated.tiers = chargingMetricForRules.dedicated.tiers.map(tier => {
          if (tier.type === 'package') {
            return {
              ...tier,
              package: { tiers: [] } // Empty tiers since we store in separate table
            };
          }
          return tier;
        });
      }
      
      const payload = {
        account_id: accountId,
        account_service_id: accountServiceId,
        charging_metric: chargingMetricForRules,
        billing_rules: values.billing_rules
      };
      
      // Save revenue rules first
      const response = await createAccountRevenueRulesFromTree(payload);
      
      if (response?.data?.success) {
        // Save package tiers if any
        if (packageTiers.length > 0) {
          try {
            await createBulkPackageTiers(accountId, packageTiers);
            messageApi.success('Revenue rules and package tiers saved successfully');
          } catch (tierError) {
            console.error('Error saving package tiers:', tierError);
            messageApi.warning('Revenue rules saved, but some package tiers failed to save');
          }
        } else {
          messageApi.success('Revenue rules saved successfully');
        }
        
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
          destroyOnHidden={true}
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
          destroyOnHidden={true}
        footer={[
          <Button 
            key="debug" 
            onClick={() => {
              const currentValues = form.getFieldsValue();
              console.log('🐛 DEBUG - Current form values:', currentValues);
              console.log('🐛 DEBUG - Initial data:', initialData);
              console.log('🐛 DEBUG - Data loaded:', dataLoaded);
            }}
          >
            Debug
          </Button>,
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
                setActiveTab(key);
              }}
              destroyOnHidden={false}
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



export default RevenueRuleModal;