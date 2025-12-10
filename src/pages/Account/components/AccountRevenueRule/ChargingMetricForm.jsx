import React, { useEffect, useState, useCallback } from 'react';
import { Form, Radio, Card, Space, Checkbox, DatePicker, Input, Select, Typography, Alert, message, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { CurrencyInput, PercentageInput } from '../../../../components/NumericInput';
import dayjs from 'dayjs';
import { MassUploadPackageTierButton } from './MassUploadPackageTierButton';
import { syncCustomerToExternalApi } from '../../../../utils/customerSyncUtils';
import { useAuth } from '../../../../components/AuthContext';

const { Text } = Typography;

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

const BILLING_METHOD_TYPES = {
    AUTO_DEDUCT: 'auto_deduct',
    POST_PAID: 'post_paid'
};

const POST_PAID_TYPES = {
    TRANSACTION: 'transaction',
    SUBSCRIPTION: 'subscription'
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

// Billing Method Fields Component
const BillingMethodFields = ({ form, name, parentPath, label = "Billing Method" }) => {
    const methodType = form.getFieldValue([...parentPath, name, 'billing_method', 'type']);
    const postPaidType = form.getFieldValue([...parentPath, name, 'billing_method', 'post_paid', 'type']);

    const handleMethodTypeChange = (value) => {
        // Build nested object for setFieldsValue
        let nested = {};
        let ref = nested;
        parentPath.forEach(p => {
            ref[p] = {};
            ref = ref[p];
        });
        ref[name] = {
            billing_method: {
                type: value,
                auto_deduct: value === BILLING_METHOD_TYPES.AUTO_DEDUCT ? { is_enabled: true } : undefined,
                post_paid: value === BILLING_METHOD_TYPES.POST_PAID ? { type: POST_PAID_TYPES.TRANSACTION } : undefined
            }
        };
        form.setFieldsValue(nested);
    };

    const handlePostPaidTypeChange = (value) => {
        let nested = {};
        let ref = nested;
        parentPath.forEach(p => {
            ref[p] = {};
            ref = ref[p];
        });
        ref[name] = {
            billing_method: {
                ...form.getFieldValue([...parentPath, name, 'billing_method']),
                post_paid: { type: value }
            }
        };
        form.setFieldsValue(nested);
    };

    const handleScheduleChange = (value) => {
        let nested = {};
        let ref = nested;
        parentPath.forEach(p => {
            ref[p] = {};
            ref = ref[p];
        });
        ref[name] = {
            billing_method: {
                ...form.getFieldValue([...parentPath, name, 'billing_method']),
                post_paid: {
                    ...form.getFieldValue([...parentPath, name, 'billing_method', 'post_paid']),
                    schedule: value
                }
            }
        };
        form.setFieldsValue(nested);
    };

    return (
        <>
            <Form.Item
                name={[name, 'billing_method', 'type']}
                label={<span style={{ color: '#333' }}>Method Type</span>}
                rules={[{ required: true, message: 'Please select billing method' }]}
            >
                <Select
                    placeholder="Select method type"
                    onChange={handleMethodTypeChange}
                    value={methodType}
                    options={[
                        { value: BILLING_METHOD_TYPES.AUTO_DEDUCT, label: 'Auto Deduct' },
                        { value: BILLING_METHOD_TYPES.POST_PAID, label: 'Post Paid' }
                    ]}
                />
            </Form.Item>

            {methodType === BILLING_METHOD_TYPES.POST_PAID && (
                <>
                    <Form.Item
                        name={[name, 'billing_method', 'post_paid', 'type']}
                        label={<span style={{ color: '#333' }}>Post Paid Type</span>}
                        rules={[{ required: true, message: 'Please select post paid type' }]}
                    >
                        <Radio.Group onChange={e => handlePostPaidTypeChange(e.target.value)} value={postPaidType}>
                            <Radio value={POST_PAID_TYPES.TRANSACTION}>Transaction</Radio>
                            <Radio value={POST_PAID_TYPES.SUBSCRIPTION}>Subscription</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {postPaidType === POST_PAID_TYPES.SUBSCRIPTION && (
                        <Form.Item
                            name={[name, 'billing_method', 'post_paid', 'schedule']}
                            label={<span style={{ color: '#333' }}>Subscription Schedule</span>}
                            rules={[{ required: true, message: 'Please select subscription schedule' }]}
                        >
                            <Radio.Group onChange={e => handleScheduleChange(e.target.value)}>
                                <Radio value="monthly">Monthly</Radio>
                                <Radio value="yearly">Yearly</Radio>
                            </Radio.Group>
                        </Form.Item>
                    )}

                    <Form.Item
                        name={[name, 'billing_method', 'post_paid', 'custom_fee']}
                        label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                    >
                        <CurrencyInput
                            placeholder="Enter custom fee amount"
                        />
                    </Form.Item>
                </>
            )}
        </>
    );
};

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
                                                label="Infrastructure Amount"
                                                rules={[{ required: true, message: 'Please input amount' }]}
                                            >
                                                <CurrencyInput placeholder="Enter amount" />
                                            </Form.Item>
                                        </>
                                    )}

                                    {/* Additional fields for database storage */}
                                    {addOnsTypeValue && (
                                        <>
                                            <Form.Item
                                                {...addOnsRest}
                                                name={[addOnsName, 'description']}
                                                label="Description"
                                            >
                                                <Input placeholder="Enter description" />
                                            </Form.Item>

                                            <Space style={{ display: 'flex' }}>
                                                <Form.Item
                                                    {...addOnsRest}
                                                    name={[addOnsName, 'start_date']}
                                                    label="Start Date"
                                                >
                                                    <DatePicker placeholder="Start date" />
                                                </Form.Item>

                                                <Form.Item
                                                    {...addOnsRest}
                                                    name={[addOnsName, 'end_date']}
                                                    label="End Date"
                                                >
                                                    <DatePicker placeholder="End date" />
                                                </Form.Item>
                                            </Space>

                                            <Form.Item
                                                {...addOnsRest}
                                                name={[addOnsName, 'is_active']}
                                                label="Status"
                                                initialValue={true}
                                            >
                                                <Radio.Group>
                                                    <Radio value={true}>Active</Radio>
                                                    <Radio value={false}>Inactive</Radio>
                                                </Radio.Group>
                                            </Form.Item>

                                            {/* Method Type for Add-Ons */}
                                            <Form.Item
                                                {...addOnsRest}
                                                name={[addOnsName, 'method_type']}
                                                label={<span style={{ color: '#333' }}>Method Type</span>}
                                                rules={[{ required: true, message: 'Please select method type' }]}
                                            >
                                                <Select
                                                    placeholder="Select method type"
                                                    options={[
                                                        { value: 'auto_deduct', label: 'Auto Deduct' },
                                                        { value: 'post_paid', label: 'Post Paid' }
                                                    ]}
                                                />
                                            </Form.Item>

                                            <Form.Item shouldUpdate>
                                                {() => {
                                                    const methodType = form.getFieldValue([...parentPath, name, 'add_ons_types', addOnsName, 'method_type']);
                                                    return methodType === 'post_paid' ? (
                                                        <Form.Item
                                                            {...addOnsRest}
                                                            name={[addOnsName, 'custom_fee']}
                                                            label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                                                        >
                                                            <CurrencyInput placeholder="Enter custom fee amount" />
                                                        </Form.Item>
                                                    ) : null;
                                                }}
                                            </Form.Item>
                                        </>
                                    )}

                                    {addOnsFields.length > 1 && (
                                        <a onClick={() => removeAddOns(addOnsName)} style={{ color: '#ff4d4f', marginTop: 8, display: 'inline-block', fontSize: '13px' }}>
                                            Remove Add-Ons
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                        <Form.Item>
                            <a onClick={() => addAddOns()} style={{ color: '#e53e3e' }}>+ Add Add-Ons Type</a>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        </div>
    );
}

// Individual Dedicated Tier Field Component
function DedicatedTierField({ tierKey, tierName, restField, form, onRemove, canRemove, accountData, onPATCHSuccess, user }) {
    const tierType = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'type']);
    const hasAddOns = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'has_add_ons']);
    const [patchLoading, setPatchLoading] = useState(false);

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

    const handlePackageUploadSuccess = (uploadedData, tierIndex, addPkg) => {
        // Add each uploaded package tier to the form
        uploadedData.forEach(tierData => {
            addPkg({
                min: tierData.min_value,
                max: tierData.max_value,
                amount: tierData.amount,
                start_date: dayjs(tierData.start_date),
                end_date: dayjs(tierData.end_date)
            });
        });
    };

    // PATCH function for updating customer tiers
    const handlePATCHCustomer = async () => {
        if (!accountData || !accountData.uuid_be) {
            message.error('Account must be synced first before updating tiers');
            return;
        }

        try {
            // Get current form values
            const formValues = form.getFieldsValue();
            const chargingMetric = formValues.charging_metric;
            
            if (!chargingMetric || chargingMetric.type !== CHARGING_METRIC_TYPES.DEDICATED) {
                message.error('Please configure dedicated charging metric first');
                return;
            }

            // Prepare account data for sync
            const accountDataToSync = {
                ...accountData,
                charging_metric: chargingMetric,
                package_tiers: [] // Will be populated from dedicated tiers
            };

            // Transform dedicated tiers to package_tiers format
            if (chargingMetric.dedicated && chargingMetric.dedicated.tiers) {
                const packageTiers = [];
                chargingMetric.dedicated.tiers.forEach(tier => {
                    if (tier.type === DEDICATED_TIER_TYPES.PACKAGE && tier.package && tier.package.tiers) {
                        tier.package.tiers.forEach(pkgTier => {
                            packageTiers.push({
                                min_value: pkgTier.min,
                                max_value: pkgTier.max,
                                amount: pkgTier.amount,
                                start_date: pkgTier.start_date ? dayjs(pkgTier.start_date).format('YYYY-MM-DD') : null,
                                end_date: pkgTier.end_date ? dayjs(pkgTier.end_date).format('YYYY-MM-DD') : null,
                                percentage: tier.percentage || false,
                                method_type: tier.method_type || 'auto_deduct'
                            });
                        });
                    }
                });
                accountDataToSync.package_tiers = packageTiers;
            }

            // Import syncCustomerToExternalApi here to avoid circular dependency
            const { syncCustomerToExternalApi } = await import('../../../../utils/customerSyncUtils');

            // Sync customer to external API (PATCH operation)
            const result = await syncCustomerToExternalApi(
                accountDataToSync, 
                null, // configId - will be auto-detected 
                user?.id, // userId for logging
                accountData.id // accountId for logging
            );
            
            if (result.success) {
                message.success(`Successfully updated customer tiers: ${accountData.name}`);
                
                if (onPATCHSuccess) {
                    onPATCHSuccess(result);
                }
            } else {
                message.error(`Failed to update customer tiers: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            message.error(`PATCH failed: ${error.message || 'Unknown error'}`);
        }
    };

    return (
        <div key={tierKey} style={{ marginBottom: 16, border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '16px', fontWeight: '600' }}>Dedicated Tier {tierName + 1}</h4>
                {canRemove && (
                    <a onClick={onRemove} style={{ color: '#ff4d4f', fontSize: '14px' }}>
                        Remove Tier
                    </a>
                )}
            </div>

            <Form.Item
                {...restField}
                name={[tierName, 'type']}
                label={<span style={{ color: '#333', fontWeight: '500' }}>Dedicated Type</span>}
                rules={[{ required: true, message: 'Please select dedicated type' }]}
                style={{ marginBottom: 16 }}
            >
                <Radio.Group onChange={e => handleTypeChange(e.target.value)}>
                    <Radio value={DEDICATED_TIER_TYPES.PACKAGE} style={{ fontSize: '14px' }}>Package</Radio>
                    <Radio value={DEDICATED_TIER_TYPES.NON_PACKAGE} style={{ fontSize: '14px' }}>Non Package</Radio>
                </Radio.Group>
            </Form.Item>

            {tierType === DEDICATED_TIER_TYPES.PACKAGE && (
                <div className="rule-subsection">
                    {/* Percentage checkbox for package type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <Form.Item
                            {...restField}
                            name={[tierName, 'percentage']}
                            valuePropName="checked"
                            style={{ marginBottom: 0 }}
                        >
                            <Checkbox>
                                <span style={{ fontWeight: '500' }}>Percentage</span>
                            </Checkbox>
                        </Form.Item>
                        
                        {/* PATCH button for updating tiers */}
                        {accountData && accountData.uuid_be && (
                            <Button
                                type="primary"
                                icon={<SyncOutlined />}
                                onClick={handlePATCHCustomer}
                                loading={patchLoading}
                                size="small"
                                style={{ marginLeft: 8 }}
                            >
                                Update Tiers
                            </Button>
                        )}
                    </div>

                    <Form.List name={[tierName, 'package', 'tiers']}>
                        {(pkgFields, { add: addPkg, remove: removePkg }) => {
                            // Ensure pkgFields is always an array
                            const safeFields = Array.isArray(pkgFields) ? pkgFields : [];

                            return (
                                <>
                                    {safeFields.map(({ key: pkgKey, name: pkgName, ...pkgRest }) => {
                                        return (
                                            <div key={pkgKey} style={{
                                                marginBottom: 16,
                                                border: '1px solid #d9d9d9',
                                                borderRadius: 6,
                                                padding: 16,
                                                backgroundColor: '#fafafa'
                                            }}>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                                    <Form.Item
                                                        {...pkgRest}
                                                        name={[pkgName, 'min']}
                                                        label="Min Value"
                                                        rules={[
                                                            { required: true, message: 'Min required' },
                                                            {
                                                                validator: (_, value) => {
                                                                    const maxValue = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'package', 'tiers', pkgName, 'max']);
                                                                    if (value && maxValue && parseFloat(value) >= parseFloat(maxValue)) {
                                                                        return Promise.reject(new Error('Min value must be less than max value'));
                                                                    }
                                                                    return Promise.resolve();
                                                                }
                                                            }
                                                        ]}
                                                        style={{ marginBottom: 0, minWidth: 120 }}
                                                    >
                                                        <Input placeholder="Min Value" type="number" />
                                                    </Form.Item>
                                                    <span style={{ paddingBottom: 4 }}> - </span>
                                                    <Form.Item
                                                        {...pkgRest}
                                                        name={[pkgName, 'max']}
                                                        label="Max Value"
                                                        rules={[
                                                            { required: true, message: 'Max required' },
                                                            {
                                                                validator: (_, value) => {
                                                                    const minValue = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'package', 'tiers', pkgName, 'min']);
                                                                    if (value && minValue && parseFloat(value) <= parseFloat(minValue)) {
                                                                        return Promise.reject(new Error('Max value must be greater than min value'));
                                                                    }
                                                                    return Promise.resolve();
                                                                }
                                                            }
                                                        ]}
                                                        style={{ marginBottom: 0, minWidth: 120 }}
                                                    >
                                                        <Input placeholder="Max Value" type="number" />
                                                    </Form.Item>
                                                    <span style={{ paddingBottom: 4 }}>=</span>
                                                    <Form.Item
                                                        {...pkgRest}
                                                        name={[pkgName, 'amount']}
                                                        label="Amount"
                                                        rules={[{ required: true, message: 'Amount required' }]}
                                                        style={{ marginBottom: 0, minWidth: 120 }}
                                                    >
                                                        <Input placeholder="Amount" />
                                                    </Form.Item>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                                    <Form.Item
                                                        {...pkgRest}
                                                        name={[pkgName, 'start_date']}
                                                        label="Start Date"
                                                        rules={[{ required: true, message: 'Start date required' }]}
                                                        style={{ marginBottom: 0, minWidth: 140 }}
                                                    >
                                                        <DatePicker
                                                            style={{ width: '100%' }}
                                                            placeholder="Start Date"
                                                            format="YYYY-MM-DD"
                                                        />
                                                    </Form.Item>
                                                    <span style={{ paddingBottom: 4 }}> to </span>
                                                    <Form.Item
                                                        {...pkgRest}
                                                        name={[pkgName, 'end_date']}
                                                        label="End Date"
                                                        rules={[
                                                            { required: true, message: 'End date required' },
                                                            ({ getFieldValue }) => ({
                                                                validator(_, value) {
                                                                    const startDate = getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'package', 'tiers', pkgName, 'start_date']);
                                                                    if (!value || !startDate) {
                                                                        return Promise.resolve();
                                                                    }
                                                                    if (dayjs(value).isAfter(dayjs(startDate))) {
                                                                        return Promise.resolve();
                                                                    }
                                                                    return Promise.reject(new Error('End date must be after start date'));
                                                                },
                                                            }),
                                                        ]}
                                                        style={{ marginBottom: 0, minWidth: 140 }}
                                                    >
                                                        <DatePicker
                                                            style={{ width: '100%' }}
                                                            placeholder="End Date"
                                                            format="YYYY-MM-DD"
                                                        />
                                                    </Form.Item>
                                                    {safeFields.length > 1 && (
                                                        <a onClick={() => removePkg(pkgName)} style={{ color: 'red', paddingBottom: 4 }}>
                                                            Remove
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <Form.Item>
                                        <Space>
                                            <a onClick={() => addPkg({
                                                min: 0,
                                                max: 0,
                                                amount: 0,
                                                start_date: dayjs(),
                                                end_date: dayjs().add(1, 'year')
                                            })} style={{ color: '#e53e3e' }}>+ Add Package Tier</a>
                                            <MassUploadPackageTierButton
                                                onUploadSuccess={(data) => handlePackageUploadSuccess(data, tierName, addPkg)}
                                            />
                                        </Space>
                                    </Form.Item>
                                </>
                            );
                        }}
                    </Form.List>

                    {/* Method Type for Package */}
                    <Form.Item
                        {...restField}
                        name={[tierName, 'method_type']}
                        label={<span style={{ color: '#333' }}>Method Type</span>}
                        rules={[{ required: true, message: 'Please select method type' }]}
                    >
                        <Select
                            placeholder="Select method type"
                            options={[
                                { value: 'auto_deduct', label: 'Auto Deduct' },
                                { value: 'post_paid', label: 'Post Paid' }
                            ]}
                        />
                    </Form.Item>

                    <Form.Item shouldUpdate>
                        {() => {
                            const methodType = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'method_type']);
                            return methodType === 'post_paid' ? (
                                <Form.Item
                                    {...restField}
                                    name={[tierName, 'custom_fee']}
                                    label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                                >
                                    <CurrencyInput placeholder="Enter custom fee amount" />
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
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

                    {/* Method Type for Non Package */}
                    <Form.Item
                        {...restField}
                        name={[tierName, 'method_type']}
                        label={<span style={{ color: '#333' }}>Method Type</span>}
                        rules={[{ required: true, message: 'Please select method type' }]}
                    >
                        <Select
                            placeholder="Select method type"
                            options={[
                                { value: 'auto_deduct', label: 'Auto Deduct' },
                                { value: 'post_paid', label: 'Post Paid' }
                            ]}
                        />
                    </Form.Item>

                    <Form.Item shouldUpdate>
                        {() => {
                            const methodType = form.getFieldValue(['charging_metric', 'dedicated', 'tiers', tierName, 'method_type']);
                            return methodType === 'post_paid' ? (
                                <Form.Item
                                    {...restField}
                                    name={[tierName, 'custom_fee']}
                                    label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                                >
                                    <CurrencyInput placeholder="Enter custom fee amount" />
                                </Form.Item>
                            ) : null;
                        }}
                    </Form.Item>
                </div>
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
function DedicatedTierFields({ fields, add, remove, form, accountData, onPATCHSuccess, user }) {

    if (!Array.isArray(fields)) {
        return (
            <div>
                <p style={{ color: 'red' }}>Error: Form data format is not valid</p>
                <Form.Item>
                    <a onClick={() => add && add()} style={{ color: '#e53e3e' }}>+ Add Dedicated Tier</a>
                </Form.Item>
            </div>
        );
    }

    if (fields.length === 0) {
        return (
            <div>
                <p>No dedicated tiers configured.</p>
                <Form.Item>
                    <a onClick={() => add && add()} style={{ color: '#e53e3e' }}>+ Add Dedicated Tier</a>
                </Form.Item>
            </div>
        );
    }


    return (
        <>
            {fields.map(({ key, name, ...restField }) => {

                return (
                    <DedicatedTierField
                        key={key}
                        tierKey={key}
                        tierName={name}
                        restField={restField}
                        form={form}
                        onRemove={() => {
                            remove && remove(name);
                        }}
                        canRemove={fields.length > 1}
                        accountData={accountData}
                        onPATCHSuccess={onPATCHSuccess}
                        user={user}
                    />
                );
            })}

            <Form.Item>
                <a
                    onClick={() => {
                        add && add();
                    }}
                    style={{ color: '#e53e3e' }}
                >
                    + Add Dedicated Tier
                </a>
            </Form.Item>
        </>
    );
}

// Non Dedicated Inheritance Section
function NonDedicatedInheritanceSection({ form }) {
    const [inheritFromParent, setInheritFromParent] = useState(false);
    const [parentValues, setParentValues] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInheritanceChange = async (checked) => {
        setInheritFromParent(checked);

        if (checked) {
            setLoading(true);
            try {
                // Here we would fetch parent account's revenue rule values
                // For now, we'll simulate with mock data
                const mockParentValues = {
                    tiers: [{
                        type: NON_DEDICATED_TYPES.TRANSACTION_FEE,
                        transaction_fee_type: TRANSACTION_FEE_TYPES.FIXED_RATE,
                        fixed_rate_value: 5000,
                        method_type: 'auto_deduct'
                    }]
                };

                setParentValues(mockParentValues);

                // Apply parent values to form
                form.setFieldsValue({
                    charging_metric: {
                        ...form.getFieldValue(['charging_metric']),
                        non_dedicated: {
                            inherit_from_parent: true,
                            tiers: mockParentValues.tiers
                        }
                    }
                });

                message.success('Parent values applied successfully');
            } catch (error) {
                console.error('Error fetching parent values:', error);
                message.error('Failed to fetch parent values');
            } finally {
                setLoading(false);
            }
        } else {
            // Reset to default values
            setParentValues(null);
            const defaultTier = {
                type: NON_DEDICATED_TYPES.TRANSACTION_FEE,
                transaction_fee_type: TRANSACTION_FEE_TYPES.FIXED_RATE,
                fixed_rate_value: 0,
                percentage_value: 0,
                subscription_type: SUBSCRIPTION_TYPES.MONTHLY,
                subscription_amount: 0,
                yearly_discount: 0,
                add_ons_types: []
            };

            form.setFieldsValue({
                charging_metric: {
                    ...form.getFieldValue(['charging_metric']),
                    non_dedicated: {
                        inherit_from_parent: false,
                        tiers: [defaultTier]
                    }
                }
            });
        }
    };

    return (
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <Form.Item
                name={['charging_metric', 'non_dedicated', 'inherit_from_parent']}
                valuePropName="checked"
                style={{ marginBottom: parentValues ? 12 : 0 }}
            >
                <Checkbox
                    onChange={(e) => handleInheritanceChange(e.target.checked)}
                    loading={loading}
                >
                    <Space>
                        <span style={{ fontWeight: 500 }}>Inherit values from parent account</span>
                        {loading && <span style={{ fontSize: 12, color: '#666' }}>Loading parent values...</span>}
                    </Space>
                </Checkbox>
            </Form.Item>

            {parentValues && (
                <Alert
                    message="Inherited Configuration"
                    description={
                        <div>
                            <Text type="secondary">
                                Using parent account's non-dedicated configuration.
                                To customize values for this account, uncheck the inheritance option above.
                            </Text>
                            <div style={{ marginTop: 8 }}>
                                <Text strong>Parent Values:</Text>
                                <ul style={{ marginTop: 4, marginLeft: 16 }}>
                                    {parentValues.tiers.map((tier, index) => (
                                        <li key={index}>
                                            {tier.type === NON_DEDICATED_TYPES.TRANSACTION_FEE
                                                ? `Transaction Fee: ${tier.transaction_fee_type === TRANSACTION_FEE_TYPES.FIXED_RATE
                                                    ? `Fixed Rate - Rp ${tier.fixed_rate_value?.toLocaleString('id-ID') || 0}`
                                                    : `Percentage - ${tier.percentage_value || 0}%`}`
                                                : `Subscription: ${tier.subscription_type} - Rp ${tier.subscription_amount?.toLocaleString('id-ID') || 0}`
                                            }
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    }
                    type="info"
                    showIcon
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
                    <a onClick={() => add()} style={{ color: '#e53e3e' }}>+ Add Row</a>
                </Form.Item>
            </div>
        );
    }

    // Check if inheritance is enabled
    const inheritFromParent = form.getFieldValue(['charging_metric', 'non_dedicated', 'inherit_from_parent']) || false;

    const handleTypeChange = (name, value) => {
        const currentValues = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers']) || [];
        const updated = [...currentValues];
        updated[name] = { type: value };
        form.setFieldsValue({ charging_metric: { non_dedicated: { tiers: updated } } });
    };

    const handleAddOnsChange = (tierName, checked) => {
        const currentTier = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', tierName]) || {};
        const updated = { ...currentTier, has_add_ons: checked };

        if (!checked) {
            // Clear add_ons_types when unchecked
            updated.add_ons_types = undefined;
        }

        const allTiers = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers']) || [];
        allTiers[tierName] = updated;

        form.setFieldsValue({
            charging_metric: {
                ...form.getFieldValue(['charging_metric']),
                non_dedicated: {
                    ...form.getFieldValue(['charging_metric', 'non_dedicated']),
                    tiers: allTiers
                }
            }
        });
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
                            <Radio.Group
                                onChange={e => handleTypeChange(name, e.target.value)}
                                disabled={inheritFromParent}
                            >
                                <Radio value={NON_DEDICATED_TYPES.TRANSACTION_FEE}>Transaction Fee</Radio>
                                <Radio value={NON_DEDICATED_TYPES.SUBSCRIPTION}>Subscription</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {nonDedicatedType === NON_DEDICATED_TYPES.TRANSACTION_FEE && (
                            <>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'transaction_fee_type']}
                                    label={<span style={{ color: '#333' }}>Fee Type</span>}
                                    rules={[{ required: true, message: 'Please select fee type' }]}
                                >
                                    <Radio.Group disabled={inheritFromParent}>
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
                                                    label={<span style={{ color: '#333' }}>Fixed Rate Value</span>}
                                                    rules={[{ required: true, message: 'Please input fixed rate value' }]}
                                                >
                                                    <CurrencyInput
                                                        placeholder="Enter fixed rate value"
                                                        disabled={inheritFromParent}
                                                    />
                                                </Form.Item>
                                            );
                                        }
                                        if (feeType === TRANSACTION_FEE_TYPES.PERCENTAGE) {
                                            return (
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'percentage_value']}
                                                    label={<span style={{ color: '#333' }}>Percentage Value</span>}
                                                    rules={[{ required: true, message: 'Please input percentage value' }]}
                                                >
                                                    <PercentageInput
                                                        placeholder="Enter percentage value"
                                                        disabled={inheritFromParent}
                                                    />
                                                </Form.Item>
                                            );
                                        }
                                        return null;
                                    }}
                                </Form.Item>

                                {/* Simplified Method Type for Transaction Fee */}
                                <Form.Item
                                    {...restField}
                                    name={[name, 'method_type']}
                                    label={<span style={{ color: '#333' }}>Method Type</span>}
                                    rules={[{ required: true, message: 'Please select method type' }]}
                                >
                                    <Select
                                        placeholder="Select method type"
                                        disabled={inheritFromParent}
                                        options={[
                                            { value: 'auto_deduct', label: 'Auto Deduct' },
                                            { value: 'post_paid', label: 'Post Paid' }
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item shouldUpdate>
                                    {() => {
                                        const methodType = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'method_type']);
                                        return methodType === 'post_paid' ? (
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'custom_fee']}
                                                label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                                            >
                                                <CurrencyInput placeholder="Enter custom fee amount" />
                                            </Form.Item>
                                        ) : null;
                                    }}
                                </Form.Item>
                            </>
                        )}

                        {nonDedicatedType === NON_DEDICATED_TYPES.SUBSCRIPTION && (
                            <>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'subscription_type']}
                                    label={<span style={{ color: '#333' }}>Subscription Type</span>}
                                    rules={[{ required: true, message: 'Please select subscription type' }]}
                                >
                                    <Radio.Group disabled={inheritFromParent}>
                                        <Radio value={SUBSCRIPTION_TYPES.MONTHLY}>Monthly</Radio>
                                        <Radio value={SUBSCRIPTION_TYPES.YEARLY}>Yearly</Radio>
                                    </Radio.Group>
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'subscription_amount']}
                                    label={<span style={{ color: '#333' }}>Subscription Amount</span>}
                                    rules={[{ required: true, message: 'Please input subscription amount' }]}
                                >
                                    <CurrencyInput
                                        placeholder="Enter subscription amount"
                                        disabled={inheritFromParent}
                                    />
                                </Form.Item>
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const type = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'subscription_type']);
                                        return type === SUBSCRIPTION_TYPES.YEARLY ? (
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'yearly_discount']}
                                                label={<span style={{ color: '#333' }}>Yearly Discount</span>}
                                                rules={[{ required: true, message: 'Please input yearly discount' }]}
                                            >
                                                <PercentageInput
                                                    placeholder="Enter discount percentage"
                                                    disabled={inheritFromParent}
                                                />
                                            </Form.Item>
                                        ) : null;
                                    }}
                                </Form.Item>

                                {/* Simplified Method Type for Subscription */}
                                <Form.Item
                                    {...restField}
                                    name={[name, 'method_type']}
                                    label={<span style={{ color: '#333' }}>Method Type</span>}
                                    rules={[{ required: true, message: 'Please select method type' }]}
                                >
                                    <Select
                                        placeholder="Select method type"
                                        disabled={inheritFromParent}
                                        options={[
                                            { value: 'auto_deduct', label: 'Auto Deduct' },
                                            { value: 'post_paid', label: 'Post Paid' }
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item shouldUpdate>
                                    {() => {
                                        const methodType = form.getFieldValue(['charging_metric', 'non_dedicated', 'tiers', name, 'method_type']);
                                        return methodType === 'post_paid' ? (
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'custom_fee']}
                                                label={<span style={{ color: '#333' }}>Custom Fee (Optional)</span>}
                                            >
                                                <CurrencyInput placeholder="Enter custom fee amount" />
                                            </Form.Item>
                                        ) : null;
                                    }}
                                </Form.Item>
                            </>
                        )}

                        {fields.length > 1 && (
                            <a
                                onClick={() => inheritFromParent ? null : remove(name)}
                                style={{
                                    color: inheritFromParent ? '#ccc' : '#ff4d4f',
                                    marginTop: 8,
                                    display: 'inline-block',
                                    fontSize: '13px',
                                    cursor: inheritFromParent ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Remove
                            </a>
                        )}
                    </div>
                );
            })}
            <Form.Item>
                <a
                    onClick={() => inheritFromParent ? null : add()}
                    style={{
                        color: inheritFromParent ? '#ccc' : '#e53e3e',
                        cursor: inheritFromParent ? 'not-allowed' : 'pointer'
                    }}
                >
                    + Add Row
                </a>
            </Form.Item>
        </>
    );
}

// Robust ChargingMetricForm with form-managed state
const ChargingMetricForm = ({ form, accountData = null, onPATCHSuccess = null }) => {
    const [chargingType, setChargingType] = useState(null);
    const [patchLoading, setPatchLoading] = useState(false);
    const watchChargingType = Form.useWatch(['charging_metric', 'type'], form);
    const { user } = useAuth();

    // Update local state when form value changes
    useEffect(() => {
        if (watchChargingType && watchChargingType !== chargingType) {
            setChargingType(watchChargingType);
        }
    }, [watchChargingType, chargingType]);

    // Initialize charging type from form data
    useEffect(() => {
        const currentType = form.getFieldValue(['charging_metric', 'type']);
        if (currentType && currentType !== chargingType) {
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
                            <DedicatedTierFields 
                                fields={fields} 
                                add={add} 
                                remove={remove} 
                                form={form} 
                                accountData={accountData}
                                onPATCHSuccess={onPATCHSuccess}
                                user={user}
                            />
                        )}
                    </Form.List>
                </div>
            )}

            {(chargingType === CHARGING_METRIC_TYPES.NON_DEDICATED || watchChargingType === CHARGING_METRIC_TYPES.NON_DEDICATED) && (
                <div className="rule-subsection">
                    <NonDedicatedInheritanceSection form={form} />
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
