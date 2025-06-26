import { useState, useEffect } from 'react';
import { Form, Radio, Card, Divider, Space } from 'antd';
import { CurrencyInput } from '../../../../components/NumericInput';

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
                            <option value="auto_deduct">Auto Deduct</option>
                            <option value="post_paid">Post Paid</option>
                        </select>
                    </Form.Item>
                    
                    {/* AUTO DEDUCT */}
                    {methodType === 'auto_deduct' && (
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
                    {methodType === 'post_paid' && (
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
                                    <Radio value="transaction">Transaction</Radio>
                                    <Radio value="subscription">Subscription</Radio>
                                </Radio.Group>
                            </Form.Item>
                            
                            {postPaidType === 'transaction' && (
                                <Form.Item
                                    {...restField}
                                    name={[name, 'post_paid', 'transaction', 'schedule']}
                                    label="Transaction Schedule"
                                    rules={[{ required: true, message: 'Please select schedule' }]}
                                >
                                    <Radio.Group>
                                        <Radio value="weekly">Weekly</Radio>
                                        <Radio value="monthly">Monthly</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            )}
                            {postPaidType === 'subscription' && (
                                <Form.Item
                                    {...restField}
                                    name={[name, 'post_paid', 'subscription', 'schedule']}
                                    label="Subscription Schedule"
                                    rules={[{ required: true, message: 'Please select schedule' }]}
                                >
                                    <Radio.Group>
                                        <Radio value="monthly">Monthly</Radio>
                                        <Radio value="yearly">Yearly</Radio>
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
                                        
                    {fields.length > 1 && (
                        <a onClick={() => remove(name)} style={{ color: 'red', marginTop: 8, display: 'inline-block' }}>
                            Remove
                        </a>
                    )}
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

const BillingRulesForm = ({ form }) => {
    const watchTaxRuleType = Form.useWatch(['billing_rules', 'tax_rules', 'type'], form);
    
    // Initialize billing methods if not exists, but don't override existing data
    useEffect(() => {
        const currentMethods = form.getFieldValue(['billing_rules', 'billing_method', 'methods']);
        console.log('BillingRulesForm - Current billing methods:', currentMethods);
        
        if (!Array.isArray(currentMethods) || currentMethods.length === 0) {
            console.log('BillingRulesForm - Initializing empty billing methods array');
            form.setFieldsValue({
                billing_rules: {
                    ...form.getFieldValue(['billing_rules']),
                    billing_method: {
                        ...form.getFieldValue(['billing_rules', 'billing_method']),
                        methods: [{
                            type: 'auto_deduct',
                            auto_deduct: { is_enabled: true },
                            post_paid: {
                                type: 'transaction',
                                transaction: { schedule: 'weekly' },
                                subscription: { schedule: 'monthly' },
                                custom_fee: 0
                            }
                        }]
                    }
                }
            });
        } else {
            console.log('BillingRulesForm - Billing methods already exist:', currentMethods);
            
            // Ensure each method has proper structure
            const updatedMethods = currentMethods.map(method => ({
                type: method.type || 'auto_deduct',
                auto_deduct: method.auto_deduct || { is_enabled: true },
                post_paid: method.post_paid || {
                    type: 'transaction',
                    transaction: { schedule: 'weekly' },
                    subscription: { schedule: 'monthly' },
                    custom_fee: 0
                }
            }));
            
            // Only update if structure is different
            if (JSON.stringify(currentMethods) !== JSON.stringify(updatedMethods)) {
                console.log('BillingRulesForm - Updating billing methods structure');
                form.setFieldsValue({
                    billing_rules: {
                        ...form.getFieldValue(['billing_rules']),
                        billing_method: {
                            ...form.getFieldValue(['billing_rules', 'billing_method']),
                            methods: updatedMethods
                        }
                    }
                });
            }
        }
    }, [form]);
    
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
                        <Radio value="include">Include</Radio>
                        <Radio value="exclude">Exclude</Radio>
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
                        <Radio value={14}>14 days</Radio>
                        <Radio value={30}>30 days</Radio>
                    </Radio.Group>
                </Form.Item>
            </Card>
        </Card>
    );
};

export default BillingRulesForm;