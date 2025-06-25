import { useState, useEffect } from 'react';
import { Modal, Form, Tabs, Button, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import ChargingMetricForm from './ChargingMetricForm';
import BillingRulesForm from './BillingRulesForm';
import { getAccountRevenueRulesByAccountServiceAsTree, createAccountRevenueRulesFromTree } from '../../../../api/accountRevenueRuleApi';

const CRITICAL_PATHS = [
  ['charging_metric', 'dedicated', 'tiers'],
  ['charging_metric', 'non_dedicated', 'tiers'],
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

  // Fetch rules when modal opens
  useEffect(() => {
    if (!visible) return;
    
    form.resetFields();
    
    const fetchRules = async () => {
      if (!accountId || !accountService) return;
      
      setLoading(true);
      try {
        // Check if we have an account service relationship ID or just a service ID
        const accountServiceId = accountService.id;
        const serviceId = '12e6fef0-2b55-48ea-99ce-f8665f4c840c';
        
        console.log(`Fetching revenue rules for account: ${accountId}`);
        console.log(`Account service ID: ${accountServiceId}, Service ID: ${serviceId}`);
        
        let response;
        
        if (accountServiceId) {
          // We have an account service relationship ID, use it directly
          console.log(`Using account service relationship ID: ${accountServiceId}`);
          response = await getAccountRevenueRulesByAccountServiceAsTree(accountId, accountServiceId);
        } else if (serviceId) {
          // We only have a service ID, the backend should handle creating the relationship
          console.log(`Using service ID: ${serviceId}`);
          response = await getAccountRevenueRulesByAccountServiceAsTree(accountId, serviceId);
        } else {
          console.error('No account service ID or service ID available');
          message.error('Service information not available');
          return;
        }
        
        if (response?.data?.success && response.data.data) {
          console.log('✅ Tree structure received from backend:', response.data.data);
          
          // Extract the actual data from the nested response
          const treeData = response.data.data;
          console.log('Extracted tree data:', treeData);
          
          // Store the fetched data
          setFetchedData(treeData);
          
          // Ensure proper structure exists with fallbacks
          const formValues = {
            charging_metric: {
              type: treeData.charging_metric?.type || 'dedicated',
              dedicated: treeData.charging_metric?.dedicated || { tiers: [] },
              non_dedicated: treeData.charging_metric?.non_dedicated || { tiers: [] }
            },
            billing_rules: {
              billing_method: treeData.billing_rules?.billing_method || { methods: [] },
              tax_rules: treeData.billing_rules?.tax_rules || {},
              term_of_payment: treeData.billing_rules?.term_of_payment || {}
            }
          };
          
          // Ensure critical array paths exist
          CRITICAL_PATHS.forEach(path => ensureArrayPath(formValues, path));
          
          console.log('Setting form values:', formValues);
          console.log('Form values structure check:', {
            charging_metric_type: formValues.charging_metric.type,
            dedicated_tiers_length: formValues.charging_metric.dedicated?.tiers?.length,
            billing_methods_length: formValues.billing_rules.billing_method?.methods?.length,
            tax_rules_type: formValues.billing_rules.tax_rules?.type,
            term_of_payment_days: formValues.billing_rules.term_of_payment?.days
          });
          
          // Set form values with a delay to ensure form is ready
          setTimeout(() => {
            form.setFieldsValue(formValues);
            console.log('Form values set successfully');
            
            // Verify the values were set correctly
            const currentValues = form.getFieldsValue();
            console.log('Current form values after setting:', currentValues);
            
            // Check if values were actually set
            if (!currentValues.charging_metric || !currentValues.billing_rules) {
              console.warn('Form values were not set properly, trying again...');
              setTimeout(() => {
                form.setFieldsValue(formValues);
                console.log('Form values set again:', form.getFieldsValue());
              }, 100);
            }
          }, 200);
        } else {
          console.log('No rules found in backend, initializing with default structure');
          // Initialize with default structure
          const defaultValues = {
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
          
          form.setFieldsValue(defaultValues);
        }
      } catch (error) {
        console.error('Error fetching revenue rules:', error);
        message.error('Failed to load revenue rules');
        
        // Initialize with default structure on error
        const defaultValues = {
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
        
        form.setFieldsValue(defaultValues);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [visible, accountId, accountService, form, initialRules]);

  // Monitor form values to prevent reset
  useEffect(() => {
    if (visible) {
      const checkFormValues = () => {
        const currentValues = form.getFieldsValue();
        console.log('Form values check:', currentValues);
        
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
      console.log('Applying fetched data to form:', fetchedData);
      
      const formValues = {
        charging_metric: {
          type: fetchedData.charging_metric?.type || 'dedicated',
          dedicated: fetchedData.charging_metric?.dedicated || { tiers: [] },
          non_dedicated: fetchedData.charging_metric?.non_dedicated || { tiers: [] }
        },
        billing_rules: {
          billing_method: fetchedData.billing_rules?.billing_method || { methods: [] },
          tax_rules: fetchedData.billing_rules?.tax_rules || {},
          term_of_payment: fetchedData.billing_rules?.term_of_payment || {}
        }
      };
      
      // Ensure critical array paths exist
      CRITICAL_PATHS.forEach(path => ensureArrayPath(formValues, path));
      
      // Apply with a longer delay to ensure form components are fully mounted
      setTimeout(() => {
        form.setFieldsValue(formValues);
        console.log('Fetched data applied to form:', form.getFieldsValue());
      }, 300);
    }
  }, [fetchedData, visible, form]);
  
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
      console.log('Form values before submit:', values);
      
      // Fix array structures
      fixFormArrayFields(true);
      
      // Get the final form values after fixing
      const finalValues = form.getFieldsValue();
      console.log('accountService values:', accountService);
      console.log('Final values:', finalValues);
      
      // Determine which ID to use for the payload
      const accountServiceId = accountService.id;
      const serviceId = accountService.service_id;
      
      let payloadAccountServiceId;
      if (accountServiceId) {
        payloadAccountServiceId = accountServiceId;
        console.log(`Using account service relationship ID for payload: ${payloadAccountServiceId}`);
      } else if (serviceId) {
        payloadAccountServiceId = serviceId;
        console.log(`Using service ID for payload: ${payloadAccountServiceId}`);
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
      
      console.log('Sending tree payload to API:', payload);
      
      // Save using tree structure API
      setLoading(true);
      const response = await createAccountRevenueRulesFromTree(payload);
      
      if (response?.data?.success) {
        messageApi.success('Revenue rules saved successfully');
        console.log('✅ Rules saved successfully:', response.data);
        
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