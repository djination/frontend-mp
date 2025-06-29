import { useEffect, useState, useCallback } from 'react';
import { Form, Radio, Card, Space, Checkbox } from 'antd';
import { CurrencyInput, PercentageInput } from '../../../../components/NumericInput';

// Schema constants (should match AccountRevenueRuleModal.jsx)
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

// Utility: Select component for options
const SelectField = ({ value, onChange, options, ...props }) => (
    <select style={{ width: 200 }} value={value} onChange={onChange} {...props}>
        <option value="">Select Type</option>
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

// Add-Ons Fields (shared)
function AddOnsFields({ form, name, parentPath }) {
    const handleSelectChange = (field, addOnsName, value) => {
        const currentValues = form.getFieldValue([...parentPath, name, 'add_ons_types']) || [];
        const updated = [...currentValues];
        updated[addOnsName] = { ...updated[addOnsName], ...field };
        // Build nested object for setFieldsValue
        let nested = {};
        let ref = nested;
        parentPath.forEach(p => {
            ref[p] = {};
            ref = ref[p];
        });
        ref[name] = { add_ons_types: updated };
        form.setFieldsValue(nested);
    };

    return (
        <div className="rule-subsection">
            <Form.List name={[name, 'add_ons_types']}>
                {(addOnsFields, { add: addAddOns, remove: removeAddOns }) => (
                    <>
                        {addOnsFields.map(({ key: addOnsKey, name: addOnsName, ...addOnsRest }) => {
                            const addOnsTypeValue = form.getFieldValue([
                                ...parentPath,
                                name,
                                'add_ons_types',
                                addOnsName,
                                'type'
                            ]);
                            const billingTypeValue = form.getFieldValue([
                                ...parentPath,
                                name,
                                'add_ons_types',
                                addOnsName,
                                'billing_type'
                            ]);
                            return (
                                <div key={addOnsKey} style={{ marginBottom: 16, border: '1px dashed #ccc', padding: 12, borderRadius: 4 }}>
                                    <Form.Item
                                        {...addOnsRest}
                                        name={[addOnsName, 'type']}
                                        label="Add-Ons Type"
                                        rules={[{ required: true, message: 'Please select add-ons type' }]}
                                    >
                                                                <Radio.Group onChange={e =>
                            handleSelectChange(
                                { type: e.target.value, billing_type: undefined, amount: undefined },
                                addOnsName,
                                e.target.value
                            )
                        }>
                            <Radio value={ADD_ONS_TYPES.SYSTEM_INTEGRATION}>System Integration</Radio>
                            <Radio value={ADD_ONS_TYPES.INFRASTRUCTURE}>Infrastructure</Radio>
                        </Radio.Group>
                                    </Form.Item>

                                    {addOnsTypeValue === ADD_ONS_TYPES.SYSTEM_INTEGRATION && (
                                        <>
                                            <Form.Item
                                                {...addOnsRest}
                                                name={[addOnsName, 'billing_type']}
                                                label="Billing Type"
                                                rules={[{ required: true, message: 'Please select billing type' }]}
                                            >
                                                <Radio.Group onChange={e =>
                                                    handleSelectChange(
                                                        { billing_type: e.target.value },
                                                        addOnsName,
                                                        e.target.value
                                                    )
                                                }>
                                                    <Radio value={BILLING_TYPES.OTC}>OTC</Radio>
                                                    <Radio value={BILLING_TYPES.MONTHLY}>Monthly</Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                            <Form.Item
                                                {...addOnsRest}
                                                name={[addOnsName, 'amount']}
                                                label="System Integration Amount"
                                                rules={[{ required: true, message: 'Please input amount' }]}
                                            >
                                                <CurrencyInput placeholder="Enter amount" />
                                            </Form.Item>
                                        </>
                                    )}

                                    {addOnsTypeValue === ADD_ONS_TYPES.INFRASTRUCTURE && (
                                        <Form.Item
                                            {...addOnsRest}
                                            name={[addOnsName, 'amount']}
                                            label="Infrastructure Amount"
                                            rules={[{ required: true, message: 'Please input amount' }]}
                                        >
                                            <CurrencyInput placeholder="Enter amount" />
                                        </Form.Item>
                                    )}

                                    {addOnsFields.length > 1 && (
                                        <a onClick={() => removeAddOns(addOnsName)} style={{ color: 'red', marginTop: 8, display: 'inline-block' }}>
                                            Remove Add-Ons
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                        <Form.Item>
                            <a onClick={() => addAddOns()} style={{ color: '#1890ff' }}>+ Add Add-Ons Type</a>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        </div>
    );
}

// Individual Dedicated Tier Field Component
function DedicatedTierField({ tierKey, tierName, restField, form, onRemove, canRemove }) {
    const tierType = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'type']);
    const hasAddOns = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'has_add_ons']);

    const handleTypeChange = (value) => {
        const currentTier = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName]) || {};
        const updated = { ...currentTier, type: value };
        
        // Clear package data when switching away from package type
        if (value !== 'package') {
            updated.package = undefined;
        } else {
            // Initialize package structure when switching to package type
            updated.package = { tiers: [] };
        }
        
        // Clear non_package data when switching away from non_package type
        if (value !== 'non_package') {
            updated.non_package_type = undefined;
            updated.amount = undefined;
        }
        
        const allTiers = form.getFieldValue(['charging_metric', 'dedicated', 'tiers']) || [];
        allTiers[tierName] = updated;
        
        form.setFieldsValue({ 
            charging_metric: { 
                ...form.getFieldValue(['charging_metric']),
                dedicated: { 
                    ...form.getFieldValue(['charging_metric', 'dedicated']),
                    tiers: allTiers 
                } 
            } 
        });
    };

    const handleAddOnsChange = (checked) => {
        const currentTier = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName]) || {};
        const updated = { ...currentTier, has_add_ons: checked };
        if (!checked) {
            updated.add_ons_types = undefined;
        }
        
        const allTiers = form.getFieldValue(['charging_metric', 'dedicated', 'tiers']) || [];
        allTiers[tierName] = updated;
        
        form.setFieldsValue({ 
            charging_metric: { 
                ...form.getFieldValue(['charging_metric']),
                dedicated: { 
                    ...form.getFieldValue(['charging_metric', 'dedicated']),
                    tiers: allTiers 
                } 
            } 
        });
    };

    return (
        <div key={tierKey} style={{ marginBottom: 16, border: '1px solid #eee', padding: 16, borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4>Dedicated Tier {tierName + 1}</h4>
                {canRemove && (
                    <a onClick={onRemove} style={{ color: 'red' }}>
                        Remove Tier
                    </a>
                )}
            </div>
            
            <Form.Item
                {...restField}
                name={[tierName, 'type']}
                label="Dedicated Type"
                rules={[{ required: true, message: 'Please select dedicated type' }]}
            >
                <Radio.Group onChange={e => handleTypeChange(e.target.value)}>
                    <Radio value={DEDICATED_TIER_TYPES.PACKAGE}>Package</Radio>
                    <Radio value={DEDICATED_TIER_TYPES.NON_PACKAGE}>Non Package</Radio>
                </Radio.Group>
            </Form.Item>
            
            {tierType === DEDICATED_TIER_TYPES.PACKAGE && (
                <div className="rule-subsection">
                    <Form.List name={[tierName, 'package', 'tiers']}>
                        {(pkgFields, { add: addPkg, remove: removePkg }) => {
                            // Ensure pkgFields is always an array
                            const safeFields = Array.isArray(pkgFields) ? pkgFields : [];
                            
                            return (
                                <>
                                    {safeFields.map(({ key: pkgKey, name: pkgName, ...pkgRest }) => (
                                        <Space key={pkgKey} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                                            <Form.Item 
                                                {...pkgRest} 
                                                name={[pkgName, 'min']} 
                                                rules={[{ required: true, message: 'Min required' }]}
                                            >
                                                <CurrencyInput placeholder="Min (Rp)" />
                                            </Form.Item>
                                            <span> - </span>
                                            <Form.Item 
                                                {...pkgRest} 
                                                name={[pkgName, 'max']} 
                                                rules={[{ required: true, message: 'Max required' }]}
                                            >
                                                <CurrencyInput placeholder="Max (Rp)" />
                                            </Form.Item>
                                            <span>=</span>
                                            <Form.Item 
                                                {...pkgRest} 
                                                name={[pkgName, 'amount']} 
                                                rules={[{ required: true, message: 'Amount required' }]}
                                            >
                                                <CurrencyInput placeholder="Amount (Rp)" />
                                            </Form.Item>
                                            {safeFields.length > 1 && (
                                                <a onClick={() => removePkg(pkgName)} style={{ color: 'red' }}>
                                                    Remove
                                                </a>
                                            )}
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <a onClick={() => addPkg()} style={{ color: '#1890ff' }}>+ Add Package Tier</a>
                                    </Form.Item>
                                </>
                            );
                        }}
                    </Form.List>
                </div>
            )}
            
            {tierType === DEDICATED_TIER_TYPES.NON_PACKAGE && (
                <div className="rule-subsection">
                    <Form.Item
                        {...restField}
                        name={[tierName, 'non_package_type']}
                        label="Non Package Type"
                        rules={[{ required: true, message: 'Please select non package type' }]}
                    >
                        <Radio.Group>
                            <Radio value={NON_PACKAGE_TYPES.MACHINE_ONLY}>Machine Only</Radio>
                            <Radio value={NON_PACKAGE_TYPES.SERVICE_ONLY}>Service Only</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        name={[tierName, 'amount']}
                        label="Non Package Amount"
                        rules={[{ required: true, message: 'Please input non package amount' }]}
                    >
                        <CurrencyInput placeholder="Enter non package amount" />
                    </Form.Item>
                </div>
            )}
            
            {tierType && (
                <Form.Item
                    {...restField}
                    name={[tierName, 'has_add_ons']}
                    valuePropName="checked"
                >
                    <Checkbox onChange={e => handleAddOnsChange(e.target.checked)}>
                        Include Add-Ons
                    </Checkbox>
                </Form.Item>
            )}
            
            {tierType && hasAddOns && (
                <AddOnsFields
                    form={form}
                    name={tierName}
                    parentPath={['charging_metric', 'dedicated', 'tiers']}
                />
            )}
        </div>
    );
}

// Container component for all Dedicated Tier Fields
function DedicatedTierFields({ fields, add, remove, form }) {
    console.log('🎯 DedicatedTierFields received fields:', fields);
    
    if (!Array.isArray(fields)) {
        console.log('⚠️ Fields is not an array:', fields);
        return (
            <div>
                <p style={{ color: 'red' }}>Error: Form data format is not valid</p>
                <Form.Item>
                    <a onClick={() => add && add()} style={{ color: '#1890ff' }}>+ Add Dedicated Tier</a>
                </Form.Item>
            </div>
        );
    }
    
    if (fields.length === 0) {
        console.log('⚠️ No dedicated tiers found, showing add button');
        return (
            <div>
                <p>No dedicated tiers configured.</p>
                <Form.Item>
                    <a onClick={() => add && add()} style={{ color: '#1890ff' }}>+ Add Dedicated Tier</a>
                </Form.Item>
            </div>
        );
    }
    
    console.log(`✅ Rendering ${fields.length} dedicated tier(s)`);
    
    return (
        <>
            {fields.map(({ key, name, ...restField }) => {
                console.log(`📝 Rendering dedicated tier ${name}:`, { key, name, restField });
                
                return (
                    <DedicatedTierField
                        key={key}
                        tierKey={key}
                        tierName={name}
                        restField={restField}
                        form={form}
                        onRemove={() => {
                            console.log(`🗑️ Removing dedicated tier ${name}`);
                            remove && remove(name);
                        }}
                        canRemove={fields.length > 1}
                    />
                );
            })}
            
            <Form.Item>
                <a 
                    onClick={() => {
                        console.log('➕ Adding new dedicated tier');
                        add && add();
                    }} 
                    style={{ color: '#1890ff' }}
                >
                    + Add Dedicated Tier
                </a>
            </Form.Item>
        </>
    );
}

// Non Dedicated Tier Fields
function NonDedicatedTierFields({ fields, add, remove, form }) {
    if (!Array.isArray(fields)) {
        return (
            <div>
                <p style={{ color: 'red' }}>Error: Form data format is not valid</p>
                <Form.Item>
                    <a onClick={() => add()} style={{ color: '#1890ff' }}>+ Add Row</a>
                </Form.Item>
            </div>
        );
    }
    
    const handleTypeChange = (name, value) => {
        const currentValues = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers']) || [];
        const updated = [...currentValues];
        updated[name] = { type: value };
        form.setFieldsValue({ charging_metric: { non_dedicated: { tiers: updated } } });
    };

    return (
        <>
            {fields.map(({ key, name, ...restField }) => {
                const nonDedicatedType = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'type']);
                return (
                    <div key={key} style={{ marginBottom: 16, border: '1px solid #eee', padding: 16, borderRadius: 4 }}>
                        <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            label="Non Dedicated Type"
                            rules={[{ required: true, message: 'Please select type' }]}
                        >
                            <SelectField
                                value={nonDedicatedType}
                                onChange={e => handleTypeChange(name, e.target.value)}
                                options={[
                                    { value: NON_DEDICATED_TYPES.TRANSACTION_FEE, label: 'Transaction Fee' },
                                    { value: NON_DEDICATED_TYPES.SUBSCRIPTION, label: 'Subscription' },
                                    { value: NON_DEDICATED_TYPES.ADD_ONS, label: 'Add-Ons' }
                                ]}
                            />
                        </Form.Item>

                        {nonDedicatedType === NON_DEDICATED_TYPES.TRANSACTION_FEE && (
                            <div className="rule-subsection">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'transaction_fee_type']}
                                    label="Fee Type"
                                    rules={[{ required: true, message: 'Please select fee type' }]}
                                >
                                    <Radio.Group>
                                        <Radio value={TRANSACTION_FEE_TYPES.FIXED_RATE}>Fixed Rate</Radio>
                                        <Radio value={TRANSACTION_FEE_TYPES.PERCENTAGE}>Percentage (%)</Radio>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const feeType = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'transaction_fee_type']);
                                        if (feeType === TRANSACTION_FEE_TYPES.FIXED_RATE) {
                                            return (
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'fixed_rate_value']}
                                                    label="Fixed Rate Value"
                                                    rules={[{ required: true, message: 'Please input fixed rate value' }]}
                                                >
                                                    <CurrencyInput placeholder="Enter fixed rate value" />
                                                </Form.Item>
                                            );
                                        }
                                        if (feeType === TRANSACTION_FEE_TYPES.PERCENTAGE) {
                                            return (
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'percentage_value']}
                                                    label="Percentage Value"
                                                    rules={[{ required: true, message: 'Please input percentage value' }]}
                                                >
                                                    <PercentageInput placeholder="Enter percentage value" />
                                                </Form.Item>
                                            );
                                        }
                                        return null;
                                    }}
                                </Form.Item>
                            </div>
                        )}

                        {nonDedicatedType === NON_DEDICATED_TYPES.SUBSCRIPTION && (
                            <div className="rule-subsection">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'subscription_type']}
                                    label="Subscription Type"
                                    rules={[{ required: true, message: 'Please select subscription type' }]}
                                >
                                    <Radio.Group>
                                        <Radio value={SUBSCRIPTION_TYPES.MONTHLY}>Monthly</Radio>
                                        <Radio value={SUBSCRIPTION_TYPES.YEARLY}>Yearly</Radio>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'subscription_amount']}
                                    label="Subscription Amount"
                                    rules={[{ required: true, message: 'Please input subscription amount' }]}
                                >
                                    <CurrencyInput placeholder="Enter subscription amount" />
                                </Form.Item>
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const type = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'subscription_type']);
                                        return type === SUBSCRIPTION_TYPES.YEARLY ? (
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'yearly_discount']}
                                                label="Yearly Discount"
                                                rules={[{ required: true, message: 'Please input yearly discount' }]}
                                            >
                                                <PercentageInput placeholder="Enter discount percentage" />
                                            </Form.Item>
                                        ) : null;
                                    }}
                                </Form.Item>
                            </div>
                        )}

                        {nonDedicatedType === NON_DEDICATED_TYPES.ADD_ONS && (
                            <AddOnsFields
                                form={form}
                                name={name}
                                parentPath={['charging_metric', 'non_dedicated', 'tiers']}
                            />
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
                <a onClick={() => add()} style={{ color: '#1890ff' }}>+ Add Row</a>
            </Form.Item>
        </>
    );
}

// Robust ChargingMetricForm with form-managed state
const ChargingMetricForm = ({ form }) => {
    const [chargingType, setChargingType] = useState(null);
    const watchChargingType = Form.useWatch(['charging_metric', 'type'], form);

    // Update local state when form value changes
    useEffect(() => {
        if (watchChargingType && watchChargingType !== chargingType) {
            console.log('🔄 Charging type changed:', watchChargingType);
            setChargingType(watchChargingType);
        }
    }, [watchChargingType, chargingType]);

    // Initialize charging type from form data
    useEffect(() => {
        const currentType = form.getFieldValue(['charging_metric', 'type']);
        if (currentType && currentType !== chargingType) {
            console.log('🔄 Initial charging type from form:', currentType);
            setChargingType(currentType);
        }
    }, [form, chargingType]);

    // Ensure proper structure when type changes
    const handleChargingTypeChange = (value) => {
        const currentValues = form.getFieldValue(['charging_metric']) || {};
        
        const updatedValues = {
            ...currentValues,
            type: value,
            dedicated: {
                ...currentValues.dedicated,
                tiers: value === CHARGING_METRIC_TYPES.DEDICATED ? (currentValues.dedicated?.tiers?.length ? currentValues.dedicated.tiers : [{
                    type: DEDICATED_TIER_TYPES.PACKAGE,
                    package: { tiers: [] },
                    non_package_type: NON_PACKAGE_TYPES.MACHINE_ONLY,
                    amount: 0,
                    has_add_ons: false,
                    add_ons_types: []
                }]) : []
            },
            non_dedicated: {
                ...currentValues.non_dedicated,
                tiers: value === CHARGING_METRIC_TYPES.NON_DEDICATED ? (currentValues.non_dedicated?.tiers?.length ? currentValues.non_dedicated.tiers : [{
                    type: NON_DEDICATED_TYPES.TRANSACTION_FEE,
                    transaction_fee_type: TRANSACTION_FEE_TYPES.FIXED_RATE,
                    fixed_rate_value: 0,
                    percentage_value: 0,
                    subscription_type: SUBSCRIPTION_TYPES.MONTHLY,
                    subscription_amount: 0,
                    yearly_discount: 0,
                    add_ons_types: []
                }]) : []
            }
        };

        form.setFieldsValue({ charging_metric: updatedValues });
        setChargingType(value);
    };

    return (
        <Card title="Charging Metric" className="revenue-rule-card">
            <Form.Item name={['charging_metric', 'type']} label="Charging Type">
                <Radio.Group onChange={e => handleChargingTypeChange(e.target.value)}>
                    <Radio value={CHARGING_METRIC_TYPES.DEDICATED}>Dedicated</Radio>
                    <Radio value={CHARGING_METRIC_TYPES.NON_DEDICATED}>Non Dedicated</Radio>
                </Radio.Group>
            </Form.Item>

            {(chargingType === CHARGING_METRIC_TYPES.DEDICATED || watchChargingType === CHARGING_METRIC_TYPES.DEDICATED) && (
                <div className="rule-subsection">
                    <Form.List name={['charging_metric', 'dedicated', 'tiers']}>
                        {(fields, { add, remove }) => (
                            <DedicatedTierFields fields={fields} add={add} remove={remove} form={form} />
                        )}
                    </Form.List>
                </div>
            )}

            {(chargingType === CHARGING_METRIC_TYPES.NON_DEDICATED || watchChargingType === CHARGING_METRIC_TYPES.NON_DEDICATED) && (
                <div className="rule-subsection">
                    <Form.List name={['charging_metric', 'non_dedicated', 'tiers']}>
                        {(fields, { add, remove }) => (
                            <NonDedicatedTierFields fields={fields} add={add} remove={remove} form={form} />
                        )}
                    </Form.List>
                </div>
            )}
        </Card>
    );
};

// // Debug utility for testing form structure
// window.testChargingMetricStructure = (formInstance) => {
//     console.log('🧪 Testing ChargingMetricForm structure...');
    
//     const chargingMetric = formInstance.getFieldValue(['charging_metric']);
//     console.log('📊 Current charging metric:', chargingMetric);
    
//     const issues = [];
    
//     if (!chargingMetric) {
//         issues.push('Missing charging_metric');
//     } else {
//         if (!chargingMetric.type) {
//             issues.push('Missing charging_metric.type');
//         }
        
//         if (!Array.isArray(chargingMetric.dedicated?.tiers)) {
//             issues.push('dedicated.tiers is not an array');
//         } else {
//             console.log(`✅ Dedicated tiers: ${chargingMetric.dedicated.tiers.length} tiers`);
//             chargingMetric.dedicated.tiers.forEach((tier, index) => {
//                 console.log(`  Tier ${index}:`, tier);
//             });
//         }
        
//         if (!Array.isArray(chargingMetric.non_dedicated?.tiers)) {
//             issues.push('non_dedicated.tiers is not an array');
//         } else {
//             console.log(`✅ Non-dedicated tiers: ${chargingMetric.non_dedicated.tiers.length} tiers`);
//             chargingMetric.non_dedicated.tiers.forEach((tier, index) => {
//                 console.log(`  Tier ${index}:`, tier);
//             });
//         }
//     }
    
//     if (issues.length === 0) {
//         console.log('✅ ChargingMetricForm structure is valid!');
//     } else {
//         console.log('❌ Issues found:', issues);
//     }
    
//     return {
//         valid: issues.length === 0,
//         issues,
//         structure: chargingMetric
//     };
// };

// console.log('🔧 ChargingMetric debug utility available: window.testChargingMetricStructure(formInstance)');

export default ChargingMetricForm;
