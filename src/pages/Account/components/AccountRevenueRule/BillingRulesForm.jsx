import React, { useEffect } from 'react';
import { Form, Radio, Card, Divider } from 'antd';

// Schema constants (should match AccountRevenueRuleModal.jsx)
const TAX_RULE_TYPES = {
  INCLUDE: 'include',
  EXCLUDE: 'exclude'
};

const PAYMENT_TERMS = {
  FOURTEEN_DAYS: 14,
  THIRTY_DAYS: 30
};

// Robust BillingRulesForm with form-managed state  
const BillingRulesForm = ({ form }) => {
    
    return (
        <Card title="Billing Rules" className="revenue-rule-card">
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