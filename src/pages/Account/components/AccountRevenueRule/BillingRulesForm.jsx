import React, { useEffect } from 'react';
import { Form, Radio, Card, Divider } from 'antd';
import { CurrencyInput } from '../../../../components/NumericInput';

// Schema constants (should match AccountRevenueRuleModal.jsx)
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

const BillingMethodFields = ({ fields, add, remove, form }) => (
    <>
        {fields.map(({ key, name, ...restField }) => {
            const methodType = form.getFieldValue(['billing_rules', 'billing_method', 'methods', name, 'type']);
            const postPaidType = form.getFieldValue(['billing_rules', 'billing_method', 'methods', name, 'post_paid', 'type']);
            
            return (
                <div key={key} style={{ marginBottom: 16, border: '1px solid #eee', padding: 16, borderRadius: 4 }}>
                    <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        label="Method Type"
                        rules={[{ required: true, message: 'Please select billing method type' }]}
                    >
                        <select
                            style={{ width: 200 }}
                            onChange={e => {
                                const value = e.target.value;
                                const currentValues = form.getFieldValue(['billing_rules', 'billing_method', 'methods']);
                                const updated = [...(currentValues || [])];
                                // Reset dependent fields when changing method type
                                updated[name] = { type: value };
                                form.setFieldsValue({ billing_rules: { billing_method: { methods: updated } } });
                            }}
                            value={methodType}
                        >
                            <option value="">Select Method</option>
                            <option value={BILLING_METHOD_TYPES.AUTO_DEDUCT}>Auto Deduct</option>
                            <option value={BILLING_METHOD_TYPES.POST_PAID}>Post Paid</option>
                        </select>
                    </Form.Item>
                    
                    {/* AUTO DEDUCT */}
                    {methodType === BILLING_METHOD_TYPES.AUTO_DEDUCT && (
                        <div className="rule-subsection">
                            <Form.Item
                                {...restField}
                                name={[name, 'auto_deduct', 'is_enabled']}
                                label="Auto Deduct Status"
                                rules={[{ required: true, message: 'Please select status' }]}
                            >
                                <Radio.Group>
                                    <Radio value={true}>Enabled</Radio>
                                    <Radio value={false}>Disabled</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </div>
                    )}
                    
                    {/* POST PAID */}
                    {methodType === BILLING_METHOD_TYPES.POST_PAID && (
                        <div className="rule-subsection">
                            <Form.Item
                                {...restField}
                                name={[name, 'post_paid', 'type']}
                                label="Post Paid Type"
                                rules={[{ required: true, message: 'Please select post paid type' }]}
                            >
                                <Radio.Group
                                    onChange={e => {
                                        const value = e.target.value;
                                        const currentValues = form.getFieldValue(['billing_rules', 'billing_method', 'methods']);
                                        const updated = [...(currentValues || [])];
                                        // Reset schedule when changing post paid type
                                        updated[name] = {
                                            ...updated[name],
                                            post_paid: {
                                                type: value
                                            }
                                        };
                                        form.setFieldsValue({ billing_rules: { billing_method: { methods: updated } } });
                                    }}
                                    value={postPaidType}
                                >
                                    <Radio value={POST_PAID_TYPES.TRANSACTION}>Transaction</Radio>
                                    <Radio value={POST_PAID_TYPES.SUBSCRIPTION}>Subscription</Radio>
                                </Radio.Group>
                            </Form.Item>
                            
                            {postPaidType === POST_PAID_TYPES.TRANSACTION && (
                                <Form.Item
                                    {...restField}
                                    name={[name, 'post_paid', 'transaction', 'schedule']}
                                    label="Transaction Schedule"
                                    rules={[{ required: true, message: 'Please select schedule' }]}
                                >
                                    <Radio.Group>
                                        <Radio value={POST_PAID_SCHEDULES.WEEKLY}>Weekly</Radio>
                                        <Radio value={POST_PAID_SCHEDULES.MONTHLY}>Monthly</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            )}
                            {postPaidType === POST_PAID_TYPES.SUBSCRIPTION && (
                                <Form.Item
                                    {...restField}
                                    name={[name, 'post_paid', 'subscription', 'schedule']}
                                    label="Subscription Schedule"
                                    rules={[{ required: true, message: 'Please select schedule' }]}
                                >
                                    <Radio.Group>
                                        <Radio value={POST_PAID_SCHEDULES.MONTHLY}>Monthly</Radio>
                                        <Radio value={POST_PAID_SCHEDULES.YEARLY}>Yearly</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            )}

                            <Form.Item
                                {...restField}
                                name={[name, 'post_paid', 'custom_fee']}
                                label="Custom Fee (Optional)"
                            >
                                <CurrencyInput placeholder="Enter custom fee" />
                            </Form.Item>
                        </div>
                    )}
                                        
                    <a onClick={() => remove(name)} style={{ color: 'red', marginTop: 8, display: 'inline-block' }}>
                        Remove Billing Method
                    </a>
                </div>
            );
        })}
        <Form.Item>
            <a onClick={() => add()} style={{ color: '#1890ff' }}>
                + Add Billing Method
            </a>
        </Form.Item>
    </>
);

// Robust BillingRulesForm with form-managed state  
const BillingRulesForm = ({ form }) => {
    
    return (
        <Card title="Billing Rules" className="revenue-rule-card">
            {/* BILLING METHOD */}
            <Card type="inner" title="Billing Method">
                <Form.List name={['billing_rules', 'billing_method', 'methods']}>
                    {(fields, { add, remove }) => (
                        <BillingMethodFields fields={fields} add={add} remove={remove} form={form} />
                    )}
                </Form.List>
            </Card>
            
            <Divider />
            
            {/* TAX RULES */}
            <Card type="inner" title="Tax Rules">
                <Form.Item 
                    name={['billing_rules', 'tax_rules', 'type']} 
                    label="Tax Rule"
                    rules={[{ required: true, message: 'Please select tax rule' }]}
                >
                    <Radio.Group>
                        <Radio value={TAX_RULE_TYPES.INCLUDE}>Include</Radio>
                        <Radio value={TAX_RULE_TYPES.EXCLUDE}>Exclude</Radio>
                    </Radio.Group>
                </Form.Item>
            </Card>
            
            <Divider />
            
            {/* TERM OF PAYMENT (TOP) */}
            <Card type="inner" title="Term of Payment (TOP)">
                <Form.Item 
                    name={['billing_rules', 'term_of_payment', 'days']} 
                    label="Days"
                    rules={[{ required: true, message: 'Please select payment term' }]}
                >
                    <Radio.Group>
                        <Radio value={PAYMENT_TERMS.FOURTEEN_DAYS}>14 days</Radio>
                        <Radio value={PAYMENT_TERMS.THIRTY_DAYS}>30 days</Radio>
                    </Radio.Group>
                </Form.Item>
            </Card>
        </Card>
    );
};

export default BillingRulesForm;