import { useState, useEffect } from 'react';
import { Modal, Form, Tabs, Button, Spin, message } from 'antd';
import PropTypes from 'prop-types';
import ChargingMetricForm from './ChargingMetricForm';
import BillingRulesForm from './BillingRulesForm';
import { getAccountRevenueRulesByAccountService } from '../../../../api/accountRevenueRuleApi';

const CRITICAL_PATHS = [
  ['charging_metric', 'dedicated', 'tiers'],
  ['charging_metric', 'dedicated', 'package', 'tiers'],
  ['charging_metric', 'non_dedicated', 'tiers'],
];

// Memastikan setiap path adalah array
const ensureArrayPath = (obj, pathArr) => {
  let current = obj;
  for (let i = 0; i < pathArr.length - 1; i++) {
    if (!current[pathArr[i]]) current[pathArr[i]] = {};
    current = current[pathArr[i]];
  }
  const last = pathArr[pathArr.length - 1];
  if (!Array.isArray(current[last])) current[last] = [];
};

// Transformasi rules dari backend ke format form
const transformRulesToFormValues = (rules) => {
  // Initialize form values with default structure
  const values = {
    charging_metric: {
      type: 'dedicated',
      dedicated: { 
        tiers: [], 
        package: { tiers: [] } 
      },
      non_dedicated: { tiers: [] }
    },
    billing_rules: {
      billing_method: { methods: [] },
      tax_rules: {},
      term_of_payment: {}
    }
  };

  // Ensure all critical array paths exist
  CRITICAL_PATHS.forEach(path => ensureArrayPath(values, path));

  // Find charging_metric type first (to set the base structure)
  const typeRule = rules.find(rule => rule.rule_category === 'charging_metric' && rule.rule_path === 'type');
  if (typeRule) {
    values.charging_metric.type = typeRule.rule_value;
  }

  // Parse all tier indexes from the rules
  const tierMap = {
    dedicated: {},
    non_dedicated: {},
    package: {}
  };

  // First pass: identify all tier indexes
  rules.forEach(rule => {
    if (rule.rule_category !== 'charging_metric') return;
    
    // Dedicated tiers
    const dedicatedMatch = rule.rule_path.match(/^dedicated\.tiers\.(\d+)\./);
    if (dedicatedMatch) {
      const tierIndex = parseInt(dedicatedMatch[1]);
      if (!tierMap.dedicated[tierIndex]) {
        tierMap.dedicated[tierIndex] = {};
      }
    }
    
    // Non-dedicated tiers
    const nonDedicatedMatch = rule.rule_path.match(/^non_dedicated\.tiers\.(\d+)\./);
    if (nonDedicatedMatch) {
      const tierIndex = parseInt(nonDedicatedMatch[1]);
      if (!tierMap.non_dedicated[tierIndex]) {
        tierMap.non_dedicated[tierIndex] = {};
      }
    }
    
    // Package tiers
    const packageMatch = rule.rule_path.match(/^dedicated\.package\.tiers\.(\d+)\./);
    if (packageMatch) {
      const tierIndex = parseInt(packageMatch[1]);
      if (!tierMap.package[tierIndex]) {
        tierMap.package[tierIndex] = {};
      }
    }
  });

  // Initialize tier arrays with the correct length
  const dedicatedTierCount = Object.keys(tierMap.dedicated).length;
  const nonDedicatedTierCount = Object.keys(tierMap.non_dedicated).length;
  const packageTierCount = Object.keys(tierMap.package).length;

  values.charging_metric.dedicated.tiers = new Array(dedicatedTierCount).fill().map(() => ({}));
  values.charging_metric.non_dedicated.tiers = new Array(nonDedicatedTierCount).fill().map(() => ({}));
  values.charging_metric.dedicated.package.tiers = new Array(packageTierCount).fill().map(() => ({}));

  // Second pass: populate values
  rules.forEach(rule => {
    const { rule_category, rule_path, rule_value } = rule;
    
    if (!values[rule_category]) {
      values[rule_category] = {};
    }
    
    const parts = rule_path.split('.');
    let current = values[rule_category];
    
    // Process each part of the path
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // Handle array indexes
      if (!isNaN(parseInt(part))) {
        const index = parseInt(part);
        
        // Ensure array exists and has enough elements
        if (!Array.isArray(current)) {
          console.warn(`Expected array at ${parts.slice(0, i).join('.')}`);
          continue;
        }
        
        while (current.length <= index) {
          current.push({});
        }
        
        current = current[index];
      } else {
        if (!current[part]) {
          // Check if next part is a number (array index)
          const nextPart = parts[i + 1];
          current[part] = !isNaN(parseInt(nextPart)) ? [] : {};
        }
        current = current[part];
      }
    }
    
    // Set the final value with type conversion
    const lastPart = parts[parts.length - 1];
    let parsedValue = rule_value;
    
    // Convert string values to appropriate types
    if (rule_value === 'true') parsedValue = true;
    else if (rule_value === 'false') parsedValue = false;
    else if (!isNaN(parseFloat(rule_value)) && isFinite(rule_value)) {
      parsedValue = parseFloat(rule_value);
    }
    
    current[lastPart] = parsedValue;
  });

  console.log('🔄 Form values after transformation:', values);
  return values;
};

// Convert form values back to API format
const transformFormValuesToRules = (values) => {
  const rules = [];
  
  const processValue = (obj, category, path = []) => {
    if (obj === undefined || obj === null) return;
    
    // Handle different value types
    if (typeof obj !== 'object') {
      // Scalar value
      rules.push({
        rule_category: category,
        rule_path: path.join('.'),
        rule_value: String(obj)
      });
      return;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (item === undefined || item === null) return;
        processValue(item, category, [...path, index]);
      });
      return;
    }
    
    // Handle objects
    Object.entries(obj).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      processValue(value, category, [...path, key]);
    });
  };
  
  // Process charging_metric and billing_rules
  if (values.charging_metric) {
    processValue(values.charging_metric, 'charging_metric');
  }
  
  if (values.billing_rules) {
    processValue(values.billing_rules, 'billing_rules');
  }
  
  return rules;
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

  // Fetch rules when modal opens
  useEffect(() => {
    if (!visible) return;
    
    form.resetFields();
    
    const fetchRules = async () => {
      if (!accountId || !accountService?.id) return;
      
      setLoading(true);
      try {
        console.log(`Fetching revenue rules for account: ${accountId}, service: ${accountService.id}`);
        const response = await getAccountRevenueRulesByAccountService(accountId, accountService.id);
        
        if (response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          console.log('✅ Rules fetched from backend:', response.data.data);
          
          // Transform backend rules to form format
          const formValues = transformRulesToFormValues(response.data.data);
          console.log('Setting form values:', formValues);
          
          // Set form values with a slight delay to ensure form is ready
          setTimeout(() => {
            form.setFieldsValue(formValues);
          }, 200);
        } else {
          console.log('No rules found in backend, using initialRules:', initialRules);
          if (initialRules.length > 0) {
            const formValues = transformRulesToFormValues(initialRules);
            form.setFieldsValue(formValues);
          }
        }
      } catch (error) {
        console.error('Error fetching revenue rules:', error);
        message.error('Failed to load revenue rules');
        
        // Fall back to initialRules if backend fetch fails
        if (initialRules.length > 0) {
          const formValues = transformRulesToFormValues(initialRules);
          form.setFieldsValue(formValues);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [visible, accountId, accountService, form, initialRules]);
  
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
    
    // Ensure package section
    if (!currentValues.charging_metric.dedicated.package) {
      currentValues.charging_metric.dedicated.package = {};
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
    setTimeout(fixFormArrayFields, 0); 
  };

  const handleSubmit = async () => {
    try {
      // Validate and get form values
      const values = await form.validateFields();
      console.log('Form values before submit:', values);
      
      // Fix array structures
      fixFormArrayFields(true);
      
      // Transform to API format
      const rules = transformFormValuesToRules(values);
      console.log('Transformed rules for API:', rules);
      
      // Save rules
      setLoading(true);
      if (onSave) {
        onSave(rules);
        messageApi.success('Revenue rules saved successfully');
      }
    } catch (error) {
      console.error('Form validation error:', error);
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
        destroyOnHidden={true}
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