import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Tabs, Button, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import ChargingMetricForm from './ChargingMetricForm';
import BillingRulesForm from './BillingRulesForm';
import AddOnsForm from './AddOnsForm';
import RevenueRuleTableView from './RevenueRuleTableView';
import { 
  getAccountRevenueRulesByAccountServiceAsTree, 
  createAccountRevenueRulesFromTree 
} from '../../../../api/accountRevenueRuleApi';
import { getPackageTiersByAccount, createBulkPackageTiers } from '../../../../api/packageTierApi';
import { revenueRuleApi } from '../../../../api/revenueRuleApi';
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
      post_paid: { custom_fee: 0 }
    }]
  },
  tax_rules: { type: TAX_RULE_TYPES.INCLUDE, rate: 11 },
  term_of_payment: { days: PAYMENT_TERMS.THIRTY_DAYS }
});

const getDefaultFormData = () => ({
  charging_metric: getDefaultChargingMetric(),
  billing_rules: getDefaultBillingRules(),
  add_ons: []
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

const mapApiResponseToFormData = (apiResponse, packageTiers = [], addOnsData = [], billingMethodsData = []) => {
  console.log('🗺️ Starting mapApiResponseToFormData with:', { apiResponse, packageTiers, addOnsData, billingMethodsData });
  
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
      billing_rules: ensureBillingRulesStructure(extractedData.billing_rules),
      add_ons: Array.isArray(extractedData.add_ons) ? extractedData.add_ons : []
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
                  ...(dbTier.id && { id: dbTier.id, _isExisting: true }), // Add ID and existing flag if available
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
    
    // Integrate add-ons data if available
    if (addOnsData && addOnsData.length > 0) {
      console.log('🔄 Integrating add-ons data:', addOnsData);
      
      // Convert add-ons from database format to form format
      const formattedAddOns = addOnsData.map((dbAddOn, index) => {
        console.log(`Converting dbAddOn ${index}:`, dbAddOn);
        
        try {
          const converted = {
            id: dbAddOn.id, // Include ID for existing records
            _isExisting: true, // Flag to indicate this is existing data
            type: dbAddOn.add_ons_type,
            is_active: dbAddOn.is_active || true
          };
          
          // Add type-specific data
          if (dbAddOn.add_ons_type === 'system_integration') {
            console.log('🔍 Raw dbAddOn for system_integration:', dbAddOn);
            console.log('🔍 billing_method_type:', dbAddOn.billing_method_type);
            console.log('🔍 custom_fee:', dbAddOn.custom_fee);
            
            converted.system_integration = {
              api_type: dbAddOn.api_type,
              complexity: dbAddOn.complexity_level,
              base_fee: dbAddOn.base_fee,
              requires_custom_development: dbAddOn.requires_custom_development || false,
              custom_development_fee: dbAddOn.custom_development_fee || 0,
              // Add billing method with proper structure based on type
              billing_method: {
                type: dbAddOn.billing_method_type || 'auto_deduct',
                ...(dbAddOn.billing_method_type === 'post_paid' 
                  ? { post_paid: { custom_fee: parseFloat(dbAddOn.custom_fee) || 0 } }
                  : { auto_deduct: { is_enabled: true } }
                )
              }
            };
            
            console.log('🔍 Converted billing_method:', converted.system_integration.billing_method);
          } else if (dbAddOn.add_ons_type === 'infrastructure') {
            console.log('🔍 Raw dbAddOn for infrastructure:', dbAddOn);
            console.log('🔍 billing_method_type:', dbAddOn.billing_method_type);
            console.log('🔍 custom_fee:', dbAddOn.custom_fee);
            
            converted.infrastructure = {
              type: dbAddOn.infrastructure_type,
              size: dbAddOn.resource_size,
              monthly_fee: dbAddOn.monthly_fee,
              setup_fee: dbAddOn.setup_fee || 0,
              is_scalable: dbAddOn.is_scalable || false,
              // Add billing method with proper structure based on type
              billing_method: {
                type: dbAddOn.billing_method_type || 'auto_deduct',
                ...(dbAddOn.billing_method_type === 'post_paid' 
                  ? { post_paid: { custom_fee: parseFloat(dbAddOn.custom_fee) || 0 } }
                  : { auto_deduct: { is_enabled: true } }
                )
              }
            };
            
            console.log('🔍 Converted billing_method:', converted.infrastructure.billing_method);
          }
          
          console.log(`✅ Converted add-on ${index}:`, converted);
          return converted;
        } catch (conversionError) {
          console.error(`❌ Error converting add-on ${index}:`, conversionError);
          return {
            type: 'system_integration',
            is_active: true,
            system_integration: {
              api_type: 'restful',
              complexity: 'simple',
              base_fee: 0,
              requires_custom_development: false,
              billing_method: {
                type: 'auto_deduct',
                auto_deduct: { is_enabled: true },
                post_paid: { custom_fee: 0 }
              }
            }
          };
        }
      });
      
      console.log('🔧 Converted add-ons data:', formattedAddOns);
      formData.add_ons = formattedAddOns;
    } else {
      console.log('ℹ️ No add-ons to integrate or empty array');
      formData.add_ons = [];
    }
    
    // Integrate billing methods data back to charging metric tiers
    if (billingMethodsData && billingMethodsData.length > 0) {
      console.log('🔄 Integrating billing methods data:', billingMethodsData);
      
      // Map billing methods by source for easier lookup
      const billingMethodsBySource = {};
      billingMethodsData.forEach((method) => {
        try {
          const methodConfig = typeof method.description === 'string' 
            ? JSON.parse(method.description) 
            : method.description;
          
          if (methodConfig.source === 'charging_metric') {
            // Store by tier index or other identifier
            const key = methodConfig.tier_index || 0;
            billingMethodsBySource[key] = {
              ...(method.id && { id: method.id, _isExisting: true }), // Add ID and existing flag if available
              type: method.method,
              config: methodConfig
            };
          }
        } catch (parseError) {
          console.warn('Failed to parse billing method description:', method.description);
        }
      });
      
      console.log('💳 Billing methods by source:', billingMethodsBySource);
      
      // Restore billing methods to dedicated tiers
      if (formData.charging_metric.type === 'dedicated' && 
          formData.charging_metric.dedicated?.tiers) {
        formData.charging_metric.dedicated.tiers = formData.charging_metric.dedicated.tiers.map((tier, index) => {
          if (billingMethodsBySource[index]) {
            const methodData = billingMethodsBySource[index];
            return {
              ...tier,
              ...(methodData.id && { billing_method_id: methodData.id, _billingMethodExists: true }), // Add billing method ID if available
              method_type: methodData.type,
              custom_fee: methodData.config.custom_fee || 0
            };
          }
          return tier;
        });
      }
      
      // Restore billing methods to non-dedicated tiers  
      if (formData.charging_metric.type === 'non_dedicated' && 
          formData.charging_metric.non_dedicated?.tiers) {
        formData.charging_metric.non_dedicated.tiers = formData.charging_metric.non_dedicated.tiers.map((tier, index) => {
          if (billingMethodsBySource[index]) {
            const methodData = billingMethodsBySource[index];
            return {
              ...tier,
              ...(methodData.id && { billing_method_id: methodData.id, _billingMethodExists: true }), // Add billing method ID if available
              method_type: methodData.type,
              custom_fee: methodData.config.custom_fee || 0
            };
          }
          return tier;
        });
      }
      
      console.log('✅ Billing methods restored to charging metric tiers');
    } else {
      console.log('ℹ️ No billing methods to integrate or empty array');
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
  const [tableViewData, setTableViewData] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const initRef = useRef(false);

  // Reset everything when modal closes
  useEffect(() => {
    if (!visible) {
      setInitialData(null);
      setDataLoaded(false);
      setTableViewData(null);
      setActiveTab('charging_metric');
      initRef.current = false;
      form.resetFields();
    }
  }, [visible, form]);

  // Update table view data when form values change
  useEffect(() => {
    if (dataLoaded && activeTab === 'table_view') {
      const currentFormData = form.getFieldsValue();
      setTableViewData(currentFormData);
    }
  }, [activeTab, dataLoaded, form]);

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

        // Fetch revenue rules, package tiers, add-ons, and billing methods
        const [revenueRulesResponse, packageTiersResponse, addOnsResponse, billingMethodsResponse] = await Promise.allSettled([
          getAccountRevenueRulesByAccountServiceAsTree(accountId, accountServiceId),
          getPackageTiersByAccount(accountId),
          revenueRuleApi.addOns.getByAccountId(accountId),
          revenueRuleApi.billingMethods.getByAccountId(accountId)
        ]);
        
        console.log('📥 API Responses:', { 
          revenueRules: revenueRulesResponse,
          packageTiers: packageTiersResponse,
          addOns: addOnsResponse,
          billingMethods: billingMethodsResponse 
        });
        
        let revenueRulesData = null;
        let packageTiersData = [];
        let addOnsData = [];
        let billingMethodsData = [];
        
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
        
        // Handle Add-Ons response
        if (addOnsResponse.status === 'fulfilled') {
          const addOnsApiResponse = addOnsResponse.value || {};
          console.log('🔧 Add-Ons API response:', addOnsApiResponse);
          
          // Extract the actual data array from the API response
          if (addOnsApiResponse.success && addOnsApiResponse.data) {
            addOnsData = addOnsApiResponse.data;
          } else {
            addOnsData = [];
          }
          
          console.log('🔧 Add-Ons data extracted:', addOnsData);
          console.log('🔧 Add-Ons type:', typeof addOnsData);
          console.log('🔧 Add-Ons length:', addOnsData.length);
          
          // Don't add dummy data if real data exists
          if (!addOnsData || addOnsData.length === 0) {
            console.log('🧪 No real add-ons data, using empty array');
            addOnsData = [];
          } else {
            console.log('✅ Using real add-ons data');
          }
        } else {
          console.warn('❌ Failed to fetch add-ons:', addOnsResponse.reason);
          addOnsData = [];
        }
        
        // Handle Billing Methods response
        if (billingMethodsResponse.status === 'fulfilled') {
          const billingMethodsApiResponse = billingMethodsResponse.value || {};
          console.log('💳 Billing Methods API response:', billingMethodsApiResponse);
          
          // Extract the actual data array from the API response
          if (billingMethodsApiResponse.success && billingMethodsApiResponse.data) {
            billingMethodsData = billingMethodsApiResponse.data;
          } else {
            billingMethodsData = [];
          }
          
          console.log('💳 Billing Methods data extracted:', billingMethodsData);
          console.log('💳 Billing Methods type:', typeof billingMethodsData);
          console.log('💳 Billing Methods length:', billingMethodsData.length);
        } else {
          console.warn('❌ Failed to fetch billing methods:', billingMethodsResponse.reason);
          billingMethodsData = [];
        }
        
        const mappedData = mapApiResponseToFormData(revenueRulesData, packageTiersData, addOnsData, billingMethodsData);
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
      console.log('🎯 Add-ons structure:', initialData.add_ons);
      form.setFieldsValue(initialData);
      
      // Debug: Check what was actually set
      setTimeout(() => {
        const currentValues = form.getFieldsValue();
        console.log('📋 Current form values after setting:', currentValues);
        console.log('📋 Add-ons in form:', currentValues.add_ons);
        
        // Specifically check billing method types
        if (currentValues.add_ons) {
          currentValues.add_ons.forEach((addon, index) => {
            console.log(`📋 Add-on ${index} type:`, addon.type);
            if (addon.system_integration?.billing_method) {
              console.log(`📋 Add-on ${index} system_integration billing_method:`, addon.system_integration.billing_method);
            }
            if (addon.infrastructure?.billing_method) {
              console.log(`📋 Add-on ${index} infrastructure billing_method:`, addon.infrastructure.billing_method);
            }
          });
        }
      }, 500); // Increased delay to 500ms
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
      console.log('📋 Form values received:', values);
      console.log('📋 Add-ons from form:', values.add_ons);
      console.log('📋 Add-ons detailed structure:', JSON.stringify(values.add_ons, null, 2));
      
      const accountServiceId = accountService.id || accountService.service_id;
      const serviceId = accountService.service_id || accountService.service?.id;
      console.log('🔑 Account info:', { accountId, accountServiceId, serviceId });
      console.log('🔑 AccountService object:', accountService);
      
      if (!accountServiceId) {
        throw new Error('No account service ID available');
      }
      
      if (!serviceId) {
        console.warn('⚠️ No service ID available - billing methods will not be linked to a service');
      }
      
      // Validate UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(accountId)) {
        console.error('❌ Invalid accountId UUID:', accountId);
        throw new Error('Invalid account ID format');
      }
      if (!uuidRegex.test(accountServiceId)) {
        console.error('❌ Invalid accountServiceId UUID:', accountServiceId);
        throw new Error('Invalid account service ID format');
      }
      
      // Extract package tiers for separate table storage
      const packageTiers = [];
      if (values.charging_metric?.type === 'dedicated' && values.charging_metric.dedicated?.tiers) {
        console.log('🔍 Extracting package tiers from:', values.charging_metric.dedicated.tiers);
        
        values.charging_metric.dedicated.tiers.forEach((tier, tierIndex) => {
          console.log(`🔍 Processing tier ${tierIndex}:`, tier);
          
          if (tier.type === 'package' && tier.package?.tiers) {
            console.log(`🔍 Found package tiers in tier ${tierIndex}:`, tier.package.tiers);
            
            tier.package.tiers.forEach((pkgTier, pkgIndex) => {
              console.log(`🔍 Processing package tier ${pkgIndex}:`, pkgTier);
              
              if (pkgTier.min !== undefined && pkgTier.max !== undefined && pkgTier.amount !== undefined && pkgTier.start_date && pkgTier.end_date) {
                const extractedTier = {
                  ...(pkgTier.id && { id: pkgTier.id }), // Include ID if exists for updates
                  min_value: pkgTier.min,
                  max_value: pkgTier.max,
                  amount: pkgTier.amount,
                  start_date: dayjs(pkgTier.start_date).format('YYYY-MM-DD'),
                  end_date: dayjs(pkgTier.end_date).format('YYYY-MM-DD'),
                };
                
                console.log(`✅ Adding package tier ${pkgIndex}:`, extractedTier);
                packageTiers.push(extractedTier);
              } else {
                console.log(`❌ Skipping incomplete package tier ${pkgIndex}:`, {
                  min: pkgTier.min,
                  max: pkgTier.max,
                  amount: pkgTier.amount,
                  start_date: pkgTier.start_date,
                  end_date: pkgTier.end_date
                });
              }
            });
          }
        });
      }
      
      console.log('📦 Final extracted package tiers:', packageTiers);

      // Extract Add-Ons for separate table storage
      const addOnsData = [];
      
      // Extract Billing Methods for separate table storage
      const billingMethodsData = [];
      
      // Extract from new separate add_ons form field
      if (values.add_ons && Array.isArray(values.add_ons)) {
        values.add_ons.forEach((addOn) => {
          // Only check if addOn has type - default is_active to true
          if (addOn.type) {
            const baseAddOn = {
              ...(addOn.id && { id: addOn.id }), // Include ID if exists for updates
              add_ons_type: addOn.type,
              is_active: addOn.is_active !== false, // Default to true unless explicitly set to false
            };
            
            // Add type-specific data
            if (addOn.type === 'system_integration' && addOn.system_integration) {
              Object.assign(baseAddOn, {
                api_type: addOn.system_integration.api_type,
                complexity_level: addOn.system_integration.complexity,
                base_fee: addOn.system_integration.base_fee,
                requires_custom_development: addOn.system_integration.requires_custom_development || false,
                custom_development_fee: addOn.system_integration.custom_development_fee || 0,
                billing_method_type: addOn.system_integration.billing_method?.type || 'auto_deduct',
                custom_fee: addOn.system_integration.billing_method?.post_paid?.custom_fee || 0,
                billing_type: 'otc',
                amount: addOn.system_integration.base_fee || 0
              });
            } else if (addOn.type === 'infrastructure' && addOn.infrastructure) {
              Object.assign(baseAddOn, {
                infrastructure_type: addOn.infrastructure.type,
                resource_size: addOn.infrastructure.size,
                monthly_fee: addOn.infrastructure.monthly_fee,
                setup_fee: addOn.infrastructure.setup_fee || 0,
                is_scalable: addOn.infrastructure.is_scalable || false,
                billing_method_type: addOn.infrastructure.billing_method?.type || 'auto_deduct',
                custom_fee: addOn.infrastructure.billing_method?.post_paid?.custom_fee || 0,
                billing_type: 'monthly',
                amount: addOn.infrastructure.monthly_fee || 0
              });
            }
            
            addOnsData.push(baseAddOn);
            
            // Extract billing method from Add-Ons
            const billingMethod = addOn.type === 'system_integration' 
              ? addOn.system_integration?.billing_method 
              : addOn.infrastructure?.billing_method;
              
            if (billingMethod?.type) {
              billingMethodsData.push({
                method: billingMethod.type,
                description: JSON.stringify({
                  type: billingMethod.type,
                  custom_fee: billingMethod.post_paid?.custom_fee || null,
                  source: 'addon',
                  addon_type: addOn.type
                }),
                is_active: true
              });
            }
          }
        });
      }
      
      // Legacy: Check both dedicated and non-dedicated charging metric tiers for Add-Ons (backward compatibility)
      if (values.charging_metric?.type === 'dedicated' && values.charging_metric.dedicated?.tiers) {
        values.charging_metric.dedicated.tiers.forEach((tier) => {
          if (tier.add_ons_types && Array.isArray(tier.add_ons_types)) {
            tier.add_ons_types.forEach((addOn) => {
              if (addOn.type && addOn.amount) {
                addOnsData.push({
                  add_ons_type: addOn.type,
                  billing_type: addOn.billing_type || 'otc',
                  amount: addOn.amount,
                  description: addOn.description || null,
                  start_date: addOn.start_date ? dayjs(addOn.start_date).format('YYYY-MM-DD') : null,
                  end_date: addOn.end_date ? dayjs(addOn.end_date).format('YYYY-MM-DD') : null,
                  is_active: addOn.is_active !== undefined ? addOn.is_active : true
                });
                
                // Extract billing method from Add-Ons
                if (addOn.method_type) {
                  billingMethodsData.push({
                    method: addOn.method_type,
                    description: JSON.stringify({
                      type: addOn.method_type,
                      custom_fee: addOn.custom_fee || null,
                      source: 'addon'
                    }),
                    is_active: true
                  });
                }
              }
            });
          }
        });
      }
      
      if (values.charging_metric?.type === 'non_dedicated' && values.charging_metric.non_dedicated?.tiers) {
        values.charging_metric.non_dedicated.tiers.forEach((tier) => {
          if (tier.add_ons_types && Array.isArray(tier.add_ons_types)) {
            tier.add_ons_types.forEach((addOn) => {
              if (addOn.type && addOn.amount) {
                addOnsData.push({
                  add_ons_type: addOn.type,
                  billing_type: addOn.billing_type || 'otc',
                  amount: addOn.amount,
                  description: addOn.description || null,
                  start_date: addOn.start_date ? dayjs(addOn.start_date).format('YYYY-MM-DD') : null,
                  end_date: addOn.end_date ? dayjs(addOn.end_date).format('YYYY-MM-DD') : null,
                  is_active: addOn.is_active !== undefined ? addOn.is_active : true
                });
                
                // Extract billing method from Add-Ons
                if (addOn.method_type) {
                  billingMethodsData.push({
                    method: addOn.method_type,
                    description: JSON.stringify({
                      type: addOn.method_type,
                      custom_fee: addOn.custom_fee || null,
                      source: 'addon'
                    }),
                    is_active: true
                  });
                }
              }
            });
          }
        });
      }

      // Extract billing methods from dedicated tiers
      if (values.charging_metric?.type === 'dedicated' && values.charging_metric.dedicated?.tiers) {
        values.charging_metric.dedicated.tiers.forEach((tier, tierIndex) => {
          if (tier.method_type) {
            billingMethodsData.push({
              ...(tier.billing_method_id && { id: tier.billing_method_id }), // Include ID if exists for updates
              method: tier.method_type,
              description: JSON.stringify({
                type: tier.method_type,
                custom_fee: tier.custom_fee || null,
                source: 'charging_metric',
                tier_index: tierIndex,
                tier_type: 'dedicated'
              }),
              is_active: true
            });
          }
        });
      }
      
      // Extract billing methods from non-dedicated tiers  
      if (values.charging_metric?.type === 'non_dedicated' && values.charging_metric.non_dedicated?.tiers) {
        values.charging_metric.non_dedicated.tiers.forEach((tier, tierIndex) => {
          if (tier.method_type) {
            billingMethodsData.push({
              ...(tier.billing_method_id && { id: tier.billing_method_id }), // Include ID if exists for updates
              method: tier.method_type,
              description: JSON.stringify({
                type: tier.method_type,
                custom_fee: tier.custom_fee || null,
                source: 'charging_metric',
                tier_index: tierIndex,
                tier_type: 'non_dedicated'
              }),
              is_active: true
            });
          }
        });
      }
      
      // Extract billing methods from billing rules (legacy support)
      if (values.billing_rules?.billing_method?.methods?.length > 0) {
        values.billing_rules.billing_method.methods.forEach((method) => {
          if (method.type) {
            billingMethodsData.push({
              method: method.type, // Map to 'method' field expected by DTO
              description: JSON.stringify(method), // Store entire config as JSON string
              is_active: method.is_active !== undefined ? method.is_active : true
            });
          }
        });
      }

      // Extract Tax Rules for separate table storage
      const taxRulesData = [];
      if (values.billing_rules?.tax_rules?.rules?.length > 0) {
        values.billing_rules.tax_rules.rules.forEach((rule) => {
          if (rule.type && rule.tax_rate !== undefined) {
            taxRulesData.push({
              type: rule.type, // Map to 'type' field expected by DTO
              rate: rule.tax_rate, // Map to 'rate' field expected by DTO
              description: rule.description || null,
              is_active: rule.is_active !== undefined ? rule.is_active : true
            });
          }
        });
      }

      // Extract Term of Payment for separate table storage
      let termOfPaymentData = null;
      if (values.billing_rules?.term_of_payment) {
        const top = values.billing_rules.term_of_payment;
        if (top.payment_term || top.due_days) {
          termOfPaymentData = {
            payment_term: top.payment_term || null,
            due_days: top.due_days || null,
            late_fee_rate: top.late_fee_rate || null,
            grace_period: top.grace_period || null,
            is_active: top.is_active !== undefined ? top.is_active : true
          };
        }
      }

      // Remove package tiers from charging_metric before saving to revenue rules
      const chargingMetricForRules = { ...values.charging_metric };
      if (chargingMetricForRules.type === 'dedicated' && chargingMetricForRules.dedicated?.tiers) {
        chargingMetricForRules.dedicated.tiers = chargingMetricForRules.dedicated.tiers.map(tier => {
          // Clean tier object - remove form-specific fields
          const cleanTier = {
            type: tier.type,
            amount: tier.amount || 0
          };
          
          if (tier.type === 'package') {
            cleanTier.package = { tiers: [] }; // Empty tiers since we store in separate table
          } else {
            cleanTier.non_package_type = tier.non_package_type;
          }
          
          return cleanTier;
        });
      }
      
      if (chargingMetricForRules.type === 'non_dedicated' && chargingMetricForRules.non_dedicated?.tiers) {
        chargingMetricForRules.non_dedicated.tiers = chargingMetricForRules.non_dedicated.tiers.map(tier => {
          // Clean tier object - remove form-specific fields
          const cleanTier = {
            type: tier.type,
            amount: tier.amount || 0
          };
          
          // Add type-specific fields
          if (tier.type === 'transaction_fee') {
            cleanTier.transaction_fee = tier.transaction_fee;
          } else if (tier.type === 'subscription') {
            cleanTier.subscription = tier.subscription;
          }
          
          return cleanTier;
        });
      }

      // Clean billing rules - only keep valid structure or use defaults
      const billingRulesForJSON = values.billing_rules && Object.keys(values.billing_rules).length > 0 
        ? {
            // Only keep non-billing_method, non-tax_rules, non-term_of_payment fields
            ...Object.fromEntries(
              Object.entries(values.billing_rules).filter(([key]) => 
                !['billing_method', 'tax_rules', 'term_of_payment'].includes(key)
              )
            )
          }
        : null; // Send null instead of empty object
      
      const payload = {
        account_id: accountId,
        account_service_id: accountServiceId,
        charging_metric: chargingMetricForRules,
        billing_rules: billingRulesForJSON
      };
      
      console.log('📤 Final payload to send:', JSON.stringify(payload, null, 2));
      console.log('📤 Add-Ons data extracted:', addOnsData);
      console.log('📤 Package tiers extracted:', packageTiers);
      console.log('📤 Billing methods extracted:', billingMethodsData);
      
      // Validate payload structure
      if (!payload.account_id || !payload.account_service_id) {
        throw new Error('Missing required account_id or account_service_id');
      }
      
      // Save revenue rules first
      const response = await createAccountRevenueRulesFromTree(payload);
      
      if (response?.data?.success) {
        const savePromises = [];
        let savedBillingMethods = [];

        // Save Billing Methods FIRST if any - we need their IDs for FK relationships
        if (billingMethodsData.length > 0) {
          try {
            const billingMethodsResponse = await revenueRuleApi.billingMethods.createBulk(accountId, billingMethodsData);
            if (billingMethodsResponse?.data) {
              savedBillingMethods = Array.isArray(billingMethodsResponse.data) ? billingMethodsResponse.data : [billingMethodsResponse.data];
              console.log('✅ Billing Methods saved with IDs:', savedBillingMethods.map(bm => ({ id: bm.id, method: bm.method })));
            }
          } catch (error) {
            console.error('❌ Failed to save billing methods:', error);
            throw new Error('Failed to save billing methods: ' + (error.message || 'Unknown error'));
          }
        }

        // Now add billing_method_id to Add-Ons and Package Tiers based on saved billing methods
        if (addOnsData.length > 0 && savedBillingMethods.length > 0) {
          addOnsData.forEach(addOn => {
            // Try to match billing method based on the add-on type and method type
            const matchingBillingMethod = savedBillingMethods.find(bm => 
              bm.method === addOn.billing_method_type || 
              (bm.description && bm.description.includes(addOn.add_ons_type))
            );
            if (matchingBillingMethod) {
              addOn.billing_method_id = matchingBillingMethod.id;
              console.log(`🔗 Linked Add-On ${addOn.add_ons_type} to Billing Method ${matchingBillingMethod.id} (${matchingBillingMethod.method})`);
            }
          });
        }

        if (packageTiers.length > 0 && savedBillingMethods.length > 0) {
          packageTiers.forEach(tier => {
            // For package tiers, link to first available billing method or based on some logic
            if (savedBillingMethods.length > 0) {
              tier.billing_method_id = savedBillingMethods[0].id; // Default to first billing method
              console.log(`🔗 Linked Package Tier to Billing Method ${savedBillingMethods[0].id}`);
            }
          });
        }

        // Save package tiers if any
        if (packageTiers.length > 0) {
          savePromises.push(
            createBulkPackageTiers(accountId, packageTiers)
              .catch(error => ({ error, type: 'packageTiers' }))
          );
        }

        // Save Add-Ons if any
        if (addOnsData.length > 0) {
          savePromises.push(
            revenueRuleApi.addOns.createBulk(accountId, addOnsData)
              .catch(error => ({ error, type: 'addOns' }))
          );
        }

        // Save Tax Rules if any
        if (taxRulesData.length > 0) {
          savePromises.push(
            revenueRuleApi.taxRules.createBulk(accountId, taxRulesData)
              .catch(error => ({ error, type: 'taxRules' }))
          );
        }

        // Save Term of Payment if any
        if (termOfPaymentData) {
          savePromises.push(
            revenueRuleApi.termOfPayment.create(accountId, termOfPaymentData)
              .catch(error => ({ error, type: 'termOfPayment' }))
          );
        }

        if (savePromises.length > 0) {
          const results = await Promise.all(savePromises);
          const errors = results.filter(result => result && result.error);
          
          if (errors.length === 0) {
            messageApi.success('All revenue rules and billing components saved successfully');
          } else {
            console.error('Some components failed to save:', errors);
            messageApi.warning(`Revenue rules saved, but some components failed: ${errors.map(e => e.type).join(', ')}`);
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
          // <Button 
          //   key="debug" 
          //   onClick={() => {
          //     const currentValues = form.getFieldsValue();
          //     console.log('🐛 DEBUG - Current form values:', currentValues);
          //     console.log('🐛 DEBUG - Initial data:', initialData);
          //     console.log('🐛 DEBUG - Data loaded:', dataLoaded);
          //     console.log('🐛 DEBUG - Table view data:', tableViewData);
          //   }}
          // >
          //   Debug
          // </Button>,
          activeTab === 'table_view' && (
            <Button 
              key="refresh"
              onClick={() => {
                const currentFormData = form.getFieldsValue();
                setTableViewData({ ...currentFormData });
                message.success('Table view refreshed!');
              }}
            >
              Refresh Table
            </Button>
          ),
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
        ].filter(Boolean)}
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
                // Update table view data when switching to table view
                if (key === 'table_view') {
                  const currentFormData = form.getFieldsValue();
                  setTableViewData(currentFormData);
                }
              }}
              destroyOnHidden={false}
              items={[
                {
                  label: 'Charging Metric',
                  key: 'charging_metric',
                  children: <ChargingMetricForm form={form} />,
                },
                {
                  label: 'Add-Ons',
                  key: 'add_ons',
                  children: <AddOnsForm form={form} />,
                },
                {
                  label: 'Billing Rules',
                  key: 'billing_rules',
                  children: <BillingRulesForm form={form} />,
                },
                // {
                //   label: 'Table View',
                //   key: 'table_view',
                //   children: <RevenueRuleTableView data={tableViewData || form.getFieldsValue()} accountId={accountId} />,
                // },
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