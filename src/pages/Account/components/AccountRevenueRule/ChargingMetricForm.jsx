import { useEffect, useState, useCallback } from 'react';
import { Form, Radio, Card, Space, Checkbox } from 'antd';
import { CurrencyInput, PercentageInput } from '../../../../components/NumericInput';

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
                                            <Radio value="system_integration">System Integration</Radio>
                                            <Radio value="infrastructure">Infrastructure</Radio>
                                        </Radio.Group>
                                    </Form.Item>

                                    {addOnsTypeValue === 'system_integration' && (
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
                                                    <Radio value="otc">OTC</Radio>
                                                    <Radio value="monthly">Monthly</Radio>
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

                                    {addOnsTypeValue === 'infrastructure' && (
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

// Dedicated Tier Fields
function DedicatedTierFields({ fields, form }) {
    if (!Array.isArray(fields) || fields.length === 0) return null;
    
    const { key, name, ...restField } = fields[0];
    const tierType = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', name, 'type']);
    const hasAddOns = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', name, 'has_add_ons']);

    const handleTypeChange = (name, value) => {
        const currentTier = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', name]) || {};
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
        allTiers[name] = updated;
        
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

    const handleAddOnsChange = (name, checked) => {
        const currentTier = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', name]) || {};
        const updated = { ...currentTier, has_add_ons: checked };
        if (!checked) {
            updated.add_ons_types = undefined;
        }
        
        const allTiers = form.getFieldValue(['charging_metric', 'dedicated', 'tiers']) || [];
        allTiers[name] = updated;
        
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
        <div key={key} style={{ marginBottom: 16, border: '1px solid #eee', padding: 16, borderRadius: 4 }}>
            <Form.Item
                {...restField}
                name={[name, 'type']}
                label="Dedicated Type"
                rules={[{ required: true, message: 'Please select dedicated type' }]}
            >
                <Radio.Group onChange={e => handleTypeChange(name, e.target.value)}>
                    <Radio value="package">Package</Radio>
                    <Radio value="non_package">Non Package</Radio>
                </Radio.Group>
            </Form.Item>
            
            {tierType === 'package' && (
                <div className="rule-subsection">
                    <Form.List name={[name, 'package', 'tiers']}>
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
                                        <a onClick={() => addPkg()} style={{ color: '#1890ff' }}>+ Add Tier</a>
                                    </Form.Item>
                                </>
                            );
                        }}
                    </Form.List>
                </div>
            )}
            
            {tierType === 'non_package' && (
                <div className="rule-subsection">
                    <Form.Item
                        {...restField}
                        name={[name, 'non_package_type']}
                        label="Non Package Type"
                        rules={[{ required: true, message: 'Please select non package type' }]}
                    >
                        <Radio.Group>
                            <Radio value="machine_only">Machine Only</Radio>
                            <Radio value="service_only">Service Only</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        name={[name, 'amount']}
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
                    name={[name, 'has_add_ons']}
                    valuePropName="checked"
                >
                    <Checkbox onChange={e => handleAddOnsChange(name, e.target.checked)}>
                        Include Add-Ons
                    </Checkbox>
                </Form.Item>
            )}
            
            {tierType && hasAddOns && (
                <AddOnsFields
                    form={form}
                    name={name}
                    parentPath={['charging_metric', 'dedicated', 'tiers']}
                />
            )}
        </div>
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
                                    { value: 'transaction_fee', label: 'Transaction Fee' },
                                    { value: 'subscription', label: 'Subscription' },
                                    { value: 'add_ons', label: 'Add-Ons' }
                                ]}
                            />
                        </Form.Item>

                        {nonDedicatedType === 'transaction_fee' && (
                            <div className="rule-subsection">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'transaction_fee_type']}
                                    label="Fee Type"
                                    rules={[{ required: true, message: 'Please select fee type' }]}
                                >
                                    <Radio.Group>
                                        <Radio value="fixed_rate">Fixed Rate</Radio>
                                        <Radio value="percentage">Percentage (%)</Radio>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const feeType = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'transaction_fee_type']);
                                        if (feeType === 'fixed_rate') {
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
                                        if (feeType === 'percentage') {
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

                        {nonDedicatedType === 'subscription' && (
                            <div className="rule-subsection">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'subscription_type']}
                                    label="Subscription Type"
                                    rules={[{ required: true, message: 'Please select subscription type' }]}
                                >
                                    <Radio.Group>
                                        <Radio value="monthly">Monthly</Radio>
                                        <Radio value="yearly">Yearly</Radio>
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
                                        return type === 'yearly' ? (
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

                        {nonDedicatedType === 'add_ons' && (
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

const ensureArrayStructure = (form, chargingType) => {
    const currentValues = form.getFieldValue(['charging_metric']) || {};
    let updated = false;

    if (!currentValues.type) {
        currentValues.type = chargingType || 'dedicated';
        updated = true;
    }

    if (currentValues.type === 'dedicated') {
        if (!currentValues.dedicated) {
            currentValues.dedicated = { tiers: [] };
            updated = true;
        } else {
            if (!Array.isArray(currentValues.dedicated.tiers)) {
                currentValues.dedicated.tiers = [];
                updated = true;
            }
        }
    }

    if (currentValues.type === 'non_dedicated') {
        if (!currentValues.non_dedicated) {
            currentValues.non_dedicated = { tiers: [] };
            updated = true;
        } else if (!Array.isArray(currentValues.non_dedicated.tiers)) {
            currentValues.non_dedicated.tiers = [];
            updated = true;
        }
    }

    if (updated) {
        form.setFieldsValue({ charging_metric: currentValues });
    }

    return updated;
};

const ChargingMetricForm = ({ form }) => {
    const [chargingType, setChargingType] = useState(null);
    const watchChargingType = Form.useWatch(['charging_metric', 'type'], form);

    // Initialize form structure when component mounts
    const initializeFormStructure = useCallback(() => {
        const currentValues = form.getFieldValue(['charging_metric']) || {};
        console.log('ChargingMetricForm - Initializing form structure with current values:', currentValues);
        
        let changed = false;

        if (currentValues?.type) {
            if (currentValues.type === 'dedicated') {
                if (!currentValues.dedicated || !Array.isArray(currentValues.dedicated.tiers) || currentValues.dedicated.tiers.length === 0) {
                    console.log('ChargingMetricForm - Initializing dedicated tiers');
                    form.setFieldsValue({
                        charging_metric: {
                            ...currentValues,
                            dedicated: {
                                ...currentValues.dedicated,
                                tiers: [{
                                    type: 'package',
                                    package: { tiers: [] },
                                    non_package_type: 'machine_only',
                                    amount: 0,
                                    has_add_ons: false,
                                    add_ons_types: []
                                }],
                            },
                            non_dedicated: {
                                ...currentValues.non_dedicated,
                                tiers: [],
                            },
                        },
                    });
                    changed = true;
                }
            } else if (currentValues.type === 'non_dedicated') {
                if (!currentValues.non_dedicated || !Array.isArray(currentValues.non_dedicated.tiers) || currentValues.non_dedicated.tiers.length === 0) {
                    console.log('ChargingMetricForm - Initializing non_dedicated tiers');
                    form.setFieldsValue({
                        charging_metric: {
                            ...currentValues,
                            non_dedicated: {
                                ...currentValues.non_dedicated,
                                tiers: [{
                                    type: 'transaction_fee',
                                    transaction_fee_type: 'fixed_rate',
                                    fixed_rate_value: 0,
                                    percentage_value: 0,
                                    subscription_type: 'monthly',
                                    subscription_amount: 0,
                                    yearly_discount: 0,
                                    add_ons_types: []
                                }],
                            },
                            dedicated: {
                                ...currentValues.dedicated,
                                tiers: [],
                            },
                        },
                    });
                    changed = true;
                }
            }
        }
        if (!changed) {
            ensureArrayStructure(form, currentValues?.type);
        }
    }, [form]);

    useEffect(() => {
        initializeFormStructure();
    }, [initializeFormStructure]);

    // Update structure when type changes
    useEffect(() => {
        if (watchChargingType) {
            console.log('ChargingMetricForm - Charging type changed to:', watchChargingType);
            ensureArrayStructure(form, watchChargingType);
            // Automatically add one tier if none exists
            if (watchChargingType === 'dedicated') {
                const tiers = form.getFieldValue(['charging_metric', 'dedicated', 'tiers']);
                if (!Array.isArray(tiers) || tiers.length === 0) {
                    console.log('ChargingMetricForm - Adding default dedicated tier');
                    form.setFieldsValue({
                        charging_metric: {
                            ...form.getFieldValue(['charging_metric']),
                            dedicated: {
                                ...form.getFieldValue(['charging_metric', 'dedicated']),
                                tiers: [{
                                    type: 'package',
                                    package: { tiers: [] },
                                    non_package_type: 'machine_only',
                                    amount: 0,
                                    has_add_ons: false,
                                    add_ons_types: []
                                }],
                            },
                        },
                    });
                }
            } else if (watchChargingType === 'non_dedicated') {
                const tiers = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers']);
                if (!Array.isArray(tiers) || tiers.length === 0) {
                    console.log('ChargingMetricForm - Adding default non_dedicated tier');
                    form.setFieldsValue({
                        charging_metric: {
                            ...form.getFieldValue(['charging_metric']),
                            non_dedicated: {
                                ...form.getFieldValue(['charging_metric', 'non_dedicated']),
                                tiers: [{
                                    type: 'transaction_fee',
                                    transaction_fee_type: 'fixed_rate',
                                    fixed_rate_value: 0,
                                    percentage_value: 0,
                                    subscription_type: 'monthly',
                                    subscription_amount: 0,
                                    yearly_discount: 0,
                                    add_ons_types: []
                                }],
                            },
                        },
                    });
                }
            }
        }
    }, [form, watchChargingType]);

    // Update state when form value changes
    useEffect(() => {
        if (watchChargingType && watchChargingType !== chargingType) {
            setChargingType(watchChargingType);
        }
    }, [watchChargingType, chargingType]);

    const handleChargingTypeChange = (value) => {
        console.log('ChargingMetricForm - Handling charging type change to:', value);
        ensureArrayStructure(form, value);

        if (value === 'dedicated') {
            form.setFieldsValue({
                charging_metric: {
                    ...form.getFieldValue(['charging_metric']),
                    dedicated: {
                        ...form.getFieldValue(['charging_metric', 'dedicated']),
                        tiers: [{
                            type: 'package',
                            package: { tiers: [] },
                            non_package_type: 'machine_only',
                            amount: 0,
                            has_add_ons: false,
                            add_ons_types: []
                        }],
                    },
                    non_dedicated: {
                        ...form.getFieldValue(['charging_metric', 'non_dedicated']),
                        tiers: [],
                    },
                },
            });
        } else if (value === 'non_dedicated') {
            form.setFieldsValue({
                charging_metric: {
                    ...form.getFieldValue(['charging_metric']),
                    non_dedicated: {
                        ...form.getFieldValue(['charging_metric', 'non_dedicated']),
                        tiers: [{
                            type: 'transaction_fee',
                            transaction_fee_type: 'fixed_rate',
                            fixed_rate_value: 0,
                            percentage_value: 0,
                            subscription_type: 'monthly',
                            subscription_amount: 0,
                            yearly_discount: 0,
                            add_ons_types: []
                        }],
                    },
                    dedicated: {
                        ...form.getFieldValue(['charging_metric', 'dedicated']),
                        tiers: [],
                    },
                },
            });
        }
        // Important: set state after setFieldsValue to trigger re-render
        setChargingType(value);
    };

    return (
        <Card title="Charging Metric" className="revenue-rule-card">
            <Form.Item name={['charging_metric', 'type']} label="Charging Type">
                <Radio.Group onChange={e => handleChargingTypeChange(e.target.value)}>
                    <Radio value="dedicated">Dedicated</Radio>
                    <Radio value="non_dedicated">Non Dedicated</Radio>
                </Radio.Group>
            </Form.Item>

            {chargingType === 'dedicated' && (
                <div className="rule-subsection">
                    <Form.List name={['charging_metric', 'dedicated', 'tiers']}>
                        {(fields) => (
                            <DedicatedTierFields fields={fields} form={form} />
                        )}
                    </Form.List>
                </div>
            )}

            {chargingType === 'non_dedicated' && (
                <div className="rule-subsection">
                    <Form.Item noStyle shouldUpdate>
                        {() => {
                            const tiers = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers']);
                            if (!Array.isArray(tiers)) {
                                form.setFieldsValue({
                                    charging_metric: { 
                                        ...form.getFieldValue(['charging_metric']),
                                        non_dedicated: { 
                                            ...form.getFieldValue(['charging_metric', 'non_dedicated']),
                                            tiers: [] 
                                        } 
                                    }
                                });
                            }
                            return null;
                        }}
                    </Form.Item>
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

export default ChargingMetricForm;
