import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber } from 'antd';

const { Option } = Select;

// Enums
const ENUMS = {
  Category: ['CHARGING_METRIC', 'BILLING_RULES'],
  ChargingType: ['DEDICATED', 'NON_DEDICATED'],
  DedicatedType: ['PACKAGE', 'NON_PACKAGE', 'ADD_ONS'],
  NonPackageType: ['MACHINE_ONLY', 'SERVICE_ONLY'],
  AddOnsType: ['SYSTEM_INTEGRATION', 'INFRASTRUCTURE'],
  SystemIntegrationType: ['OTC', 'MONTHLY'],
  NonDedicatedType: ['TRANSACTION_FEE', 'SUBSCRIPTION', 'HYBRID', 'ADD_ONS'],
  TransactionFeeType: ['FIXED_RATE', 'PERCENTAGE'],
  SubscriptionPeriod: ['MONTHLY', 'YEARLY'],
  BillingRuleType: ['BILLING_METHOD', 'TAX_RULES', 'TERM_OF_PAYMENT'],
  BillingMethodType: ['AUTO_DEDUCT', 'POST_PAID', 'HYBRID'],
  PaymentType: ['TRANSACTION', 'SUBSCRIPTION'],
  PaymentPeriod: ['WEEKLY', 'MONTHLY', 'YEARLY'],
  TaxRuleType: ['INCLUDE', 'EXCLUDE'],
  TopPeriod: ['14_DAYS', '30_DAYS'],
};

const RevenueRuleForm = ({ form, selectedCategory, onCategoryChange, availableParents, editingRuleId }) => {
  // Watch form values for conditional rendering
  const formValues = Form.useWatch([], form);

  // Reset dependent fields when parent fields change
  useEffect(() => {
    if (form && formValues) {
      const { category, chargingType, dedicatedType, addOnsType, nonDedicatedType, billingRuleType, billingMethodType, paymentType } = formValues || {};

      // Reset fields based on category
      if (category !== selectedCategory) {
        form.resetFields([
          'chargingType', 'dedicatedType', 'nonPackageType', 'addOnsType',
          'systemIntegrationType', 'nonDedicatedType', 'transactionFeeType',
          'subscriptionPeriod', 'billingRuleType', 'billingMethodType',
          'paymentType', 'paymentPeriod', 'taxRuleType', 'topPeriod'
        ]);
      }

      // Reset dependent fields for charging metric
      if (category === 'CHARGING_METRIC') {
        if (chargingType === 'DEDICATED') {
          if (!dedicatedType) {
            form.resetFields(['nonPackageType', 'addOnsType', 'systemIntegrationType']);
          } else if (dedicatedType === 'ADD_ONS' && (!addOnsType || addOnsType !== 'SYSTEM_INTEGRATION')) {
            form.resetFields(['systemIntegrationType']);
          }
        } else if (chargingType === 'NON_DEDICATED') {
          if (!nonDedicatedType) {
            form.resetFields(['transactionFeeType', 'subscriptionPeriod']);
          }
        }
      }

      // Reset dependent fields for billing rules
      if (category === 'BILLING_RULES') {
        if (!billingRuleType) {
          form.resetFields(['billingMethodType', 'paymentType', 'paymentPeriod', 'taxRuleType', 'topPeriod']);
        } else if (billingRuleType === 'BILLING_METHOD') {
          if (!billingMethodType) {
            form.resetFields(['paymentType', 'paymentPeriod']);
          } else if (!['AUTO_DEDUCT', 'POST_PAID'].includes(billingMethodType)) {
            form.resetFields(['paymentType', 'paymentPeriod']);
          } else if (paymentType !== 'TRANSACTION') {
            form.resetFields(['paymentPeriod']);
          }
        }
      }
    }
  }, [formValues, form, selectedCategory]);

  const renderSelectField = (name, options, label, required = true) => (
    <Form.Item
      name={name}
      label={label || name}
      rules={required ? [{ required: true, message: `Please select ${label || name}!` }] : []}
    >
      <Select allowClear={!required}>
        {options.map(option => (
          <Option key={option} value={option}>
            {option.replace(/_/g, ' ')}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );

  const renderChargingMetricFields = () => (
    <>
      {renderSelectField('chargingType', ENUMS.ChargingType, 'Charging Type')}
      {formValues?.chargingType === 'DEDICATED' && (
        <>
          {renderSelectField('dedicatedType', ENUMS.DedicatedType, 'Dedicated Type')}
          {formValues?.dedicatedType === 'NON_PACKAGE' && (
            renderSelectField('nonPackageType', ENUMS.NonPackageType, 'Non Package Type')
          )}
          {formValues?.dedicatedType === 'ADD_ONS' && (
            <>
              {renderSelectField('addOnsType', ENUMS.AddOnsType, 'Add Ons Type')}
              {formValues?.addOnsType === 'SYSTEM_INTEGRATION' && (
                renderSelectField('systemIntegrationType', ENUMS.SystemIntegrationType, 'System Integration Type')
              )}
            </>
          )}
        </>
      )}
      {formValues?.chargingType === 'NON_DEDICATED' && (
        <>
          {renderSelectField('nonDedicatedType', ENUMS.NonDedicatedType, 'Non Dedicated Type')}
          {formValues?.nonDedicatedType === 'TRANSACTION_FEE' && (
            renderSelectField('transactionFeeType', ENUMS.TransactionFeeType, 'Transaction Fee Type')
          )}
          {formValues?.nonDedicatedType === 'SUBSCRIPTION' && (
            renderSelectField('subscriptionPeriod', ENUMS.SubscriptionPeriod, 'Subscription Period')
          )}
        </>
      )}
    </>
  );

  const renderBillingRulesFields = () => (
    <>
      {renderSelectField('billingRuleType', ENUMS.BillingRuleType, 'Billing Rule Type')}
      {formValues?.billingRuleType === 'BILLING_METHOD' && (
        <>
          {renderSelectField('billingMethodType', ENUMS.BillingMethodType, 'Billing Method Type')}
          {['AUTO_DEDUCT', 'POST_PAID'].includes(formValues?.billingMethodType) && (
            <>
              {renderSelectField('paymentType', ENUMS.PaymentType, 'Payment Type')}
              {formValues?.paymentType === 'TRANSACTION' && (
                renderSelectField('paymentPeriod', ENUMS.PaymentPeriod, 'Payment Period')
              )}
            </>
          )}
        </>
      )}
      {formValues?.billingRuleType === 'TAX_RULES' && (
        renderSelectField('taxRuleType', ENUMS.TaxRuleType, 'Tax Rule Type')
      )}
      {formValues?.billingRuleType === 'TERM_OF_PAYMENT' && (
        renderSelectField('topPeriod', ENUMS.TopPeriod, 'Term of Payment Period')
      )}
    </>
  );

  if (!form) {
    return null;
  }

  return (
    <>
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: 'Please input name!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: 'Please select category!' }]}
      >
        <Select onChange={onCategoryChange}>
          {ENUMS.Category.map(category => (
            <Option key={category} value={category}>
              {category.replace(/_/g, ' ')}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedCategory === 'CHARGING_METRIC' && renderChargingMetricFields()}
      {selectedCategory === 'BILLING_RULES' && renderBillingRulesFields()}

      <Form.Item
        name="value"
        label="Value"
        rules={[
          { required: true, message: 'Please input value!' },
          { type: 'number', message: 'Please input a valid number!' }
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="Enter numeric value"
          step="0.01"
          precision={2}
        />
      </Form.Item>

      <Form.Item
        name="parentId"
        label="Parent Rule"
      >
        <Select
          allowClear
          placeholder="Select parent rule"
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {availableParents
            .filter(parent => parent.id !== editingRuleId) // Prevent selecting self as parent
            .map(parent => (
              <Option key={parent.id} value={parent.id}>
                {parent.name} ({parent.category.replace(/_/g, ' ')})
              </Option>
            ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default RevenueRuleForm; 