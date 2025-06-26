import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Tabs, Button, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import ChargingMetricForm from './ChargingMetricForm';
import BillingRulesForm from './BillingRulesForm';
import { getAccountRevenueRulesByAccountServiceAsTree, createAccountRevenueRulesFromTree } from '../../../../api/accountRevenueRuleApi';

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

// Comprehensive data mapping utility
const mapApiResponseToFormData = (apiData) => {
  // Initialize default structure
  const defaultFormData = {
    charging_metric: {
      type: 'dedicated',
      dedicated: { tiers: [] },
      non_dedicated: { tiers: [] }
    },
    billing_rules: {
      billing_method: { methods: [] },
      tax_rules: {},
      term_of_payment: {}
    }
  };

  // Extract the actual data from the nested response structure
  let actualData = apiData;
  if (apiData && apiData.success && apiData.data) {
    actualData = apiData.data;
  } else if (apiData && apiData.data) {
    actualData = apiData.data;
  }

  // If no data from API, return default structure
  if (!actualData || (actualData.data.charging_metric === null && actualData.data.billing_rules === null)) {
    return defaultFormData;
  }

  const formData = { ...defaultFormData };

  // Map charging_metric
  if (actualData.data.charging_metric) {
    formData.charging_metric = {
      type: actualData.data.charging_metric.type || 'dedicated',
      dedicated: { tiers: [] },
      non_dedicated: { tiers: [] }
    };

    // Map dedicated tiers
    if (actualData.data.charging_metric.dedicated && Array.isArray(actualData.data.charging_metric.dedicated.tiers)) {
      formData.charging_metric.dedicated.tiers = actualData.data.charging_metric.dedicated.tiers.map((tier, index) => {
        return {
          type: tier.type || 'package',
          package: tier.package || { tiers: [] },
          non_package_type: tier.non_package_type || 'machine_only',
          amount: tier.amount || 0,
          has_add_ons: tier.has_add_ons || false,
          add_ons_types: Array.isArray(tier.add_ons_types) ? tier.add_ons_types.map((addon, addonIndex) => {
            return {
              type: addon.type || 'system_integration',
              billing_type: addon.billing_type || 'otc',
              amount: addon.amount || 0
            };
          }) : []
        };
      });
    }

    // Map non_dedicated tiers
    if (actualData.data.charging_metric.non_dedicated && Array.isArray(actualData.data.charging_metric.non_dedicated.tiers)) {
      formData.charging_metric.non_dedicated.tiers = actualData.data.charging_metric.non_dedicated.tiers.map((tier, index) => {
        return {
          type: tier.type || 'transaction_fee',
          transaction_fee_type: tier.transaction_fee_type || 'fixed_rate',
          fixed_rate_value: tier.fixed_rate_value || 0,
          percentage_value: tier.percentage_value || 0,
          subscription_type: tier.subscription_type || 'monthly',
          subscription_amount: tier.subscription_amount || 0,
          yearly_discount: tier.yearly_discount || 0,
          add_ons_types: Array.isArray(tier.add_ons_types) ? tier.add_ons_types.map((addon, addonIndex) => {
            return {
              type: addon.type || 'system_integration',
              billing_type: addon.billing_type || 'otc',
              amount: addon.amount || 0
            };
          }) : []
        };
      });
    }
  }

  // Map billing_rules
  if (actualData.data.billing_rules) {
    formData.billing_rules = {
      billing_method: { methods: [] },
      tax_rules: {},
      term_of_payment: {}
    };

    // Map billing methods
    if (actualData.data.billing_rules.billing_method && Array.isArray(actualData.data.billing_rules.billing_method.methods)) {
      formData.billing_rules.billing_method.methods = actualData.data.billing_rules.billing_method.methods.map((method, index) => {
        return {
          type: method.type || 'auto_deduct',
          auto_deduct: method.auto_deduct || { is_enabled: true },
          post_paid: method.post_paid || {
            type: 'transaction',
            transaction: { schedule: 'weekly' },
            subscription: { schedule: 'monthly' },
            custom_fee: 0
          }
        };
      });
    }

    // Map tax rules
    if (actualData.data.billing_rules.tax_rules) {
      formData.billing_rules.tax_rules = {
        type: actualData.data.billing_rules.tax_rules.type || 'include',
        rate: actualData.data.billing_rules.tax_rules.rate || 11
      };
    }

    // Map term of payment
    if (actualData.data.billing_rules.term_of_payment) {  
      formData.billing_rules.term_of_payment = {
        days: actualData.data.billing_rules.term_of_payment.days || 30
      };
    }
  }

  // Ensure critical array paths exist
  CRITICAL_PATHS.forEach(path => ensureArrayPath(formData, path));

  // Validate the mapped structure
  validateFormDataStructure(formData);
  
  return formData;
};

// Validation function to ensure proper structure
const validateFormDataStructure = (formData) => {
  const errors = [];
  
  // Validate charging_metric structure
  if (!formData.charging_metric) {
    errors.push('Missing charging_metric');
  } else {
    if (!formData.charging_metric.type) {
      errors.push('Missing charging_metric.type');
    }
    if (!formData.charging_metric.dedicated) {
      errors.push('Missing charging_metric.dedicated');
    } else if (!Array.isArray(formData.charging_metric.dedicated.tiers)) {
      errors.push('charging_metric.dedicated.tiers is not an array');
    }
    if (!formData.charging_metric.non_dedicated) {
      errors.push('Missing charging_metric.non_dedicated');
    } else if (!Array.isArray(formData.charging_metric.non_dedicated.tiers)) {
      errors.push('charging_metric.non_dedicated.tiers is not an array');
    }
  }
  
  // Validate billing_rules structure
  if (!formData.billing_rules) {
    errors.push('Missing billing_rules');
  } else {
    if (!formData.billing_rules.billing_method) {
      errors.push('Missing billing_rules.billing_method');
    } else if (!Array.isArray(formData.billing_rules.billing_method.methods)) {
      errors.push('billing_rules.billing_method.methods is not an array');
    }
    if (!formData.billing_rules.tax_rules) {
      errors.push('Missing billing_rules.tax_rules');
    }
    if (!formData.billing_rules.term_of_payment) {
      errors.push('Missing billing_rules.term_of_payment');
    }
  }
  
  if (errors.length > 0) {
    console.error('Form data structure validation errors:', errors);
    console.error('Form data:', formData);
  } else {
    console.log('✅ Form data structure validation passed');
  }
  
  return errors.length === 0;
};

// Main component
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
  const [messageApi, contextHolder] = message.useMessage();
  const [fetchedData, setFetchedData] = useState(null);

  // Robust form initialization function
  const initializeFormWithData = useCallback((formData) => {
    // Ensure the form is ready
    if (!form) {
      console.warn('Form not ready, skipping initialization');
      return;
    }
    
    // Reset form first
    form.resetFields();
    
    // Set form values with proper timing
    setTimeout(() => {
      try {
        form.setFieldsValue(formData);        
        // Verify the values were set correctly
        const currentValues = form.getFieldsValue();        
        // Check if critical structures exist
        const hasChargingMetric = currentValues.charging_metric && 
          (currentValues.charging_metric.dedicated?.tiers?.length > 0 || 
           currentValues.charging_metric.non_dedicated?.tiers?.length > 0);
        
        const hasBillingRules = currentValues.billing_rules && 
          currentValues.billing_rules.billing_method?.methods?.length > 0;
        
        if (!hasChargingMetric || !hasBillingRules) {
          console.warn('Form initialization incomplete, retrying...');
          setTimeout(() => {
            form.setFieldsValue(formData);
          }, 200);
        }
      } catch (error) {
        console.error('Error initializing form:', error);
      }
    }, 100);
  }, [form]);

  // Fetch rules when modal opens
  useEffect(() => {
    if (!visible) return;
    
    const fetchRules = async () => {
      if (!accountId || !accountService) return;
      
      setLoading(true);
      try {
        // Check if we have an account service relationship ID or just a service ID
        const accountServiceId = accountService.id;
        const serviceId = accountService.service_id;
        
        let response;
        
        if (accountServiceId) {
          // We have an account service relationship ID, use it directly
          response = await getAccountRevenueRulesByAccountServiceAsTree(accountId, accountServiceId);
        } else if (serviceId) {
          // We only have a service ID, the backend should handle creating the relationship
          response = await getAccountRevenueRulesByAccountServiceAsTree(accountId, serviceId);
        } else {
          console.error('No account service ID or service ID available');
          message.error('Service information not available');
          return;
        }
        
        if (response?.data?.success) {
          // Extract the actual data from the nested response
          const treeData = response.data;
          
          // Store the fetched data
          setFetchedData(treeData);
          
          // Map API response to form data using the utility function
          const formValues = mapApiResponseToFormData(treeData);
          
          // Use the robust initialization function
          initializeFormWithData(formValues);
        }
      } catch (error) {
        console.error('Error fetching revenue rules:', error);
        message.error('Failed to load revenue rules');
        
        // Initialize with default structure on error using the mapping utility
        const defaultValues = mapApiResponseToFormData(null);
        initializeFormWithData(defaultValues);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [visible, accountId, accountService, initializeFormWithData]);

  // Monitor form values to prevent reset
  useEffect(() => {
    if (visible) {
      const checkFormValues = () => {
        const currentValues = form.getFieldsValue();
        
        // If form values are empty but we should have data, restore them
        if (currentValues.charging_metric && 
            (!currentValues.charging_metric.dedicated?.tiers?.length && 
             !currentValues.charging_metric.non_dedicated?.tiers?.length)) {
          console.warn('Form values appear to be reset, checking if we need to restore...');
        }
      };
      
      // Check form values after a delay to see if they were reset
      const timer = setTimeout(checkFormValues, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, form]);

  // Apply fetched data when available and form is ready
  useEffect(() => {
    if (fetchedData && visible) {
      // Use the mapping utility to ensure proper structure
      const formValues = mapApiResponseToFormData(fetchedData);
      
      // Use the robust initialization function
      initializeFormWithData(formValues);
    }
  }, [fetchedData, visible, initializeFormWithData]);
  
  // Fix array structure if needed
  const fixFormArrayFields = (silent = false) => {
    const currentValues = form.getFieldsValue();
    
    // Ensure charging_metric structure
    if (!currentValues.charging_metric) {
      currentValues.charging_metric = { type: 'dedicated' };
    }
    
    // Ensure dedicated section
    if (!currentValues.charging_metric.dedicated) {
      currentValues.charging_metric.dedicated = {};
    }
    
    // Ensure non_dedicated section
    if (!currentValues.charging_metric.non_dedicated) {
      currentValues.charging_metric.non_dedicated = {};
    }
    
    // Ensure billing_rules structure
    if (!currentValues.billing_rules) {
      currentValues.billing_rules = {};
    }
    
    // Ensure billing_method structure
    if (!currentValues.billing_rules.billing_method) {
      currentValues.billing_rules.billing_method = {};
    }
    
    // Ensure critical arrays
    CRITICAL_PATHS.forEach(path => ensureArrayPath(currentValues, path));
    
    // Update form values
    form.setFieldsValue(currentValues);
    
    if (!silent) {
      messageApi.success('Form structure repaired');
    }
  };

  const handleTabChange = key => {
    setActiveTab(key);
    
    // Fix array structures when switching tabs
    setTimeout(() => fixFormArrayFields(true), 0); 
  };

  const handleSubmit = async () => {
    try {
      // Validate and get form values
      const values = await form.validateFields();
      
      // Fix array structures
      fixFormArrayFields(true);
      
      // Get the final form values after fixing
      const finalValues = form.getFieldsValue();
      
      // Determine which ID to use for the payload
      const accountServiceId = accountService.id;
      const serviceId = accountService.service_id;
      
      let payloadAccountServiceId;
      if (accountServiceId) {
        payloadAccountServiceId = accountServiceId;
      } else if (serviceId) {
        payloadAccountServiceId = serviceId;
      } else {
        throw new Error('No account service ID or service ID available');
      }
      
      // Prepare payload for tree structure API
      const payload = {
        account_id: accountId,
        account_service_id: payloadAccountServiceId,
        charging_metric: finalValues.charging_metric,
        billing_rules: finalValues.billing_rules
      };
      
      // Save using tree structure API
      setLoading(true);
      const response = await createAccountRevenueRulesFromTree(payload);
      
      if (response?.data?.success) {
        messageApi.success('Revenue rules saved successfully');
        
        if (onSave) {
          // Call the onSave callback with the original tree structure
          onSave(finalValues);
        }
      } else {
        throw new Error('Failed to save rules');
      }
    } catch (error) {
      console.error('Form validation or save error:', error);
      if (error.errorFields) {
        messageApi.error('Please fill in all required fields');
      } else {
        messageApi.error('Error saving revenue rules');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Configure Revenue Rules for ${accountService?.service?.name || 'Service'}`}
        open={visible}
        onCancel={onCancel}
        width={800}
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            Save Rules
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" preserve={false}>
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
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