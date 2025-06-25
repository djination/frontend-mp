import { useEffect, useState, useCallback } from 'react';
import { Form, Radio, Card, Space } from 'antd';
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
                                        <SelectField
                                            value={addOnsTypeValue}
                                            onChange={e =>
                                                handleSelectChange(
                                                    { type: e.target.value, billing_type: undefined, amount: undefined },
                                                    addOnsName,
                                                    e.target.value
                                                )
                                            }
                                            options={[
                                                { value: 'system_integration', label: 'System Integration' },
                                                { value: 'infrastructure', label: 'Infrastructure' }
                                            ]}
                                        />
                                    </Form.Item>

                                    {addOnsTypeValue === 'system_integration' && (
                                        <>
                                            <Form.Item
                                                {...addOnsRest}
                                                name={[addOnsName, 'billing_type']}
                                                label="Billing Type"
                                                rules={[{ required: true, message: 'Please select billing type' }]}
                                            >
                                                <SelectField
                                                    value={billingTypeValue}
                                                    onChange={e =>
                                                        handleSelectChange(
                                                            { billing_type: e.target.value },
                                                            addOnsName,
                                                            e.target.value
                                                        )
                                                    }
                                                    options={[
                                                        { value: 'otc', label: 'OTC' },
                                                        { value: 'monthly', label: 'Monthly' }
                                                    ]}
                                                />
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
function DedicatedTierFields({ fields, add, remove, form }) {
    // Added debug log for fields
    useEffect(() => {
        console.log('DedicatedTierFields - fields:', fields);
    }, [fields]);

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
        const currentValues = form.getFieldValue(['charging_metric', 'dedicated', 'tiers']) || [];
        const updated = [...currentValues];
        updated[name] = { ...updated[name], type: value };
        form.setFieldsValue({ charging_metric: { dedicated: { tiers: updated } } });
        
        console.log(`Dedicated tier ${name} type changed to ${value}`);
    };

    return (
        <>
            {fields.map(({ key, name, ...restField }) => {
                const tierType = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', name, 'type']);
                console.log(`Rendering dedicated tier ${name}, type:`, tierType);
                return (
                    <div key={key} style={{ marginBottom: 16, border: '1px solid #eee', padding: 16, borderRadius: 4 }}>
                        <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            label="Dedicated Type"
                            rules={[{ required: true, message: 'Please select dedicated type' }]}
                        >
                            <SelectField
                                value={tierType}
                                onChange={e => handleTypeChange(name, e.target.value)}
                                options={[
                                    { value: 'package', label: 'Package' },
                                    { value: 'non_package', label: 'Non Package' },
                                    { value: 'add_ons', label: 'Add-Ons' }
                                ]}
                            />
                        </Form.Item>

                        {tierType === 'package' && (
                            <div className="rule-subsection">
                                <Form.List name={['charging_metric', 'dedicated', 'package', 'tiers']}>
                                    {(pkgFields, { add: addPkg, remove: removePkg }) => (
                                        <>
                                            {pkgFields.map(({ key: pkgKey, name: pkgName, ...pkgRest }) => (
                                                <Space key={pkgKey} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                                                    <Form.Item {...pkgRest} name={[pkgName, 'min']} rules={[{ required: true, message: 'Min required' }]}>
                                                        <CurrencyInput placeholder="Min (Rp)" />
                                                    </Form.Item>
                                                    <span> - </span>
                                                    <Form.Item {...pkgRest} name={[pkgName, 'max']} rules={[{ required: true, message: 'Max required' }]}>
                                                        <CurrencyInput placeholder="Max (Rp)" />
                                                    </Form.Item>
                                                    <span>=</span>
                                                    <Form.Item {...pkgRest} name={[pkgName, 'amount']} rules={[{ required: true, message: 'Amount required' }]}>
                                                        <CurrencyInput placeholder="Amount (Rp)" />
                                                    </Form.Item>
                                                    {pkgFields.length > 1 && (
                                                        <a onClick={() => removePkg(pkgName)} style={{ color: 'red' }}>Remove</a>
                                                    )}
                                                </Space>
                                            ))}
                                            <Form.Item>
                                                <a onClick={() => addPkg()} style={{ color: '#1890ff' }}>+ Add Tier</a>
                                            </Form.Item>
                                        </>
                                    )}
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

                        {tierType === 'add_ons' && (
                            <AddOnsFields
                                form={form}
                                name={name}
                                parentPath={['charging_metric', 'dedicated', 'tiers']}
                            />
                        )}

                        {fields.length > 1 && (
                            <a onClick={() => remove(name)} style={{ color: 'red', marginTop: 8, display: 'inline-block' }}>Remove</a>
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
                            <a onClick={() => remove(name)} style={{ color: 'red', marginTop: 8, display: 'inline-block' }}>Remove</a>
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
            currentValues.dedicated = { tiers: [], package: { tiers: [] } };
            updated = true;
        } else {
            if (!Array.isArray(currentValues.dedicated.tiers)) {
                currentValues.dedicated.tiers = [];
                updated = true;
            }
            if (!currentValues.dedicated.package) {
                currentValues.dedicated.package = { tiers: [] };
                updated = true;
            } else if (!Array.isArray(currentValues.dedicated.package.tiers)) {
                currentValues.dedicated.package.tiers = [];
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
        console.log('Updating form structure:', currentValues);
        form.setFieldsValue({ charging_metric: currentValues });
    }

    return updated;
};

const ChargingMetricForm = ({ form }) => {
    const [chargingType, setChargingType] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const watchChargingType = Form.useWatch(['charging_metric', 'type'], form);

    // Inisialisasi saat komponen mount
    const initializeFormStructure = useCallback(() => {
        const currentValues = form.getFieldValue(['charging_metric']);
        
        console.log('Current charging_metric values:', currentValues);
        
        if (currentValues?.type && !chargingType) {
            console.log(`Setting charging type to ${currentValues.type} from existing data`);
            setChargingType(currentValues.type);
        }
        
        ensureArrayStructure(form, currentValues?.type || chargingType);
    }, [form, chargingType]);

    useEffect(() => {
        initializeFormStructure();
    }, [initializeFormStructure]);

    // Update structure when type changes
    useEffect(() => {
        if (watchChargingType) {
            ensureArrayStructure(form, watchChargingType);
        }
    }, [form, watchChargingType]);

     // Update state when form value changes
    useEffect(() => {
        if (watchChargingType && watchChargingType !== chargingType) {
            console.log(`Charging type changed from ${chargingType} to ${watchChargingType}`);
            setChargingType(watchChargingType);
        }
    }, [watchChargingType, chargingType]);
    
    // Log whenever form values change for debugging
    useEffect(() => {
        const chargeValues = form.getFieldValue(['charging_metric']);
        console.log('Form value update - charging_metric:', chargeValues);
        
        // Check if tiers are properly initialized
        if (chargeValues?.dedicated?.tiers) {
            console.log('Dedicated tiers:', chargeValues.dedicated.tiers);
        }
        
        if (chargeValues?.non_dedicated?.tiers) {
            console.log('Non-dedicated tiers:', chargeValues.non_dedicated.tiers);
        }
    }, [form]);

    return (
        <Card title="Charging Metric" className="revenue-rule-card">
            <Form.Item name={['charging_metric', 'type']} label="Charging Type">
                <Radio.Group>
                    <Radio value="dedicated">Dedicated</Radio>
                    <Radio value="non_dedicated">Non Dedicated</Radio>
                </Radio.Group>
            </Form.Item>

            {chargingType === 'dedicated' && (
                <div className="rule-subsection">
                    {/* This ensures the tiers array is created if it doesn't exist */}
                    <Form.Item noStyle shouldUpdate>
                        {() => {
                            const tiers = form.getFieldValue(['charging_metric', 'dedicated', 'tiers']);
                            if (!Array.isArray(tiers)) {
                                console.log('Initializing dedicated tiers array');
                                form.setFieldsValue({
                                    charging_metric: { 
                                        ...form.getFieldValue(['charging_metric']),
                                        dedicated: { 
                                            ...form.getFieldValue(['charging_metric', 'dedicated']),
                                            tiers: [] 
                                        } 
                                    }
                                });
                            }
                            return null;
                        }}
                    </Form.Item>
                    <Form.List name={['charging_metric', 'dedicated', 'tiers']}>
                        {(fields, { add, remove }) => (
                            <DedicatedTierFields fields={fields} add={add} remove={remove} form={form} />
                        )}
                    </Form.List>
                </div>
            )}

            {chargingType === 'non_dedicated' && (
                <div className="rule-subsection">
                    {/* This ensures the non_dedicated tiers array is created if it doesn't exist */}
                    <Form.Item noStyle shouldUpdate>
                        {() => {
                            const tiers = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers']);
                            if (!Array.isArray(tiers)) {
                                console.log('Initializing non_dedicated tiers array');
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
