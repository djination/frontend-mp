import React from 'react';
import { Form, Select } from 'antd';
import { CurrencyInput } from '../../../../components/NumericInput';

const BILLING_METHOD_TYPES = {
  AUTO_DEDUCT: 'auto_deduct',
  POST_PAID: 'post_paid'
};

const BillingMethodFields = ({ form, parentPath, fieldName, fieldKey, label = "Billing Method" }) => {
    // Use form from props or Form context
    const formInstance = form || Form.useFormInstance();
    
    // Use fieldName if provided (for AddOns), otherwise use parentPath
    const actualPath = fieldName || parentPath || [];
    
    console.log('🏗️ BillingMethodFields props:', { form: !!form, parentPath, fieldName, fieldKey, actualPath });

    const handleMethodTypeChange = (value) => {
        console.log('🔄 handleMethodTypeChange called with:', value);
        console.log('🔄 actualPath:', actualPath);
        
        // Simply set the values using the actualPath
        const basePath = [...actualPath];
        
        // Set the billing method type
        formInstance.setFieldValue([...basePath, 'type'], value);
        console.log('✅ Set field value:', [...basePath, 'type'], '=', value);
        
        // Clear and set appropriate sub-fields based on the selected type
        if (value === BILLING_METHOD_TYPES.AUTO_DEDUCT) {
            formInstance.setFieldValue([...basePath, 'auto_deduct'], { is_enabled: true });
            formInstance.setFieldValue([...basePath, 'post_paid'], undefined);
            console.log('✅ Set auto_deduct fields');
        } else if (value === BILLING_METHOD_TYPES.POST_PAID) {
            formInstance.setFieldValue([...basePath, 'post_paid'], { custom_fee: 0 });
            formInstance.setFieldValue([...basePath, 'auto_deduct'], undefined);
            console.log('✅ Set post_paid fields');
        }
        
        // Force form to re-render by triggering validation
        formInstance.validateFields([[...basePath, 'type']]);
        console.log('🔄 Form values after change:', formInstance.getFieldsValue());
    };

    return (
        <>
            <Form.Item
                name={[...actualPath, 'type']}
                fieldKey={fieldKey ? [...fieldKey, 'type'] : undefined}
                label={<span style={{ color: '#333' }}>{label} Type</span>}
                rules={[{ required: true, message: 'Please select billing method' }]}
            >
                <Select 
                    placeholder="Select method type"
                    onChange={handleMethodTypeChange}
                    options={[
                        { value: BILLING_METHOD_TYPES.AUTO_DEDUCT, label: 'Auto Deduct' },
                        { value: BILLING_METHOD_TYPES.POST_PAID, label: 'Post Paid' }
                    ]}
                />
            </Form.Item>

            {/* Custom Fee - show when Post Paid is selected using shouldUpdate pattern */}
            <Form.Item shouldUpdate>
                {() => {
                    // Get method type directly from form values like ChargingMetricForm does
                    const fullFormValues = formInstance.getFieldsValue();
                    console.log('🔍 Full form values:', fullFormValues);
                    
                    // For Add-Ons context, we need to navigate differently
                    // actualPath = [0, 'system_integration', 'billing_method']
                    // We need to access: add_ons[0].system_integration.billing_method
                    let pathValue;
                    
                    if (actualPath.length === 3 && typeof actualPath[0] === 'number') {
                        // This is Add-Ons context: [index, 'system_integration'/'infrastructure', 'billing_method']
                        const addOnIndex = actualPath[0];
                        const addOnType = actualPath[1]; // 'system_integration' or 'infrastructure'
                        const field = actualPath[2]; // 'billing_method'
                        
                        pathValue = fullFormValues?.add_ons?.[addOnIndex]?.[addOnType]?.[field];
                        console.log(`🔍 Add-On context: add_ons[${addOnIndex}].${addOnType}.${field}:`, pathValue);
                    } else {
                        // Regular path navigation for other contexts
                        pathValue = fullFormValues;
                        for (const key of actualPath) {
                            pathValue = pathValue?.[key];
                            console.log(`🔍 Navigating path key "${key}":`, pathValue);
                        }
                    }
                    
                    const methodType = pathValue?.type;
                    
                    console.log('🔍 shouldUpdate render - actualPath:', actualPath, 'methodType:', methodType);
                    console.log('🔍 Final pathValue:', pathValue);
                    
                    return methodType === BILLING_METHOD_TYPES.POST_PAID ? (
                        <Form.Item
                            name={[...actualPath, 'post_paid', 'custom_fee']}
                            fieldKey={fieldKey ? [...fieldKey, 'post_paid', 'custom_fee'] : undefined}
                            label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                        >
                            <CurrencyInput 
                                placeholder="Enter custom fee amount" 
                            />
                        </Form.Item>
                    ) : null;
                }}
            </Form.Item>
            
            {/* Debug info */}
            <Form.Item shouldUpdate>
                {() => {
                    const fullFormValues = formInstance.getFieldsValue();
                    
                    let pathValue;
                    if (actualPath.length === 3 && typeof actualPath[0] === 'number') {
                        // Add-Ons context
                        const addOnIndex = actualPath[0];
                        const addOnType = actualPath[1];
                        const field = actualPath[2];
                        pathValue = fullFormValues?.add_ons?.[addOnIndex]?.[addOnType]?.[field];
                    } else {
                        // Regular context
                        pathValue = fullFormValues;
                        for (const key of actualPath) {
                            pathValue = pathValue?.[key];
                        }
                    }
                    
                    const methodType = pathValue?.type;
                    
                    // return (
                    //     <div style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                    //         Debug - Path: {JSON.stringify(actualPath)}, Method Type: "{methodType}", Show Custom Fee: {methodType === BILLING_METHOD_TYPES.POST_PAID ? 'YES' : 'NO'}
                    //     </div>
                    // );
                }}
            </Form.Item>
        </>
    );
};

export default BillingMethodFields;
