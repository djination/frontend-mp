import React from 'react';
import { Form, Card, Space, Button, Select, InputNumber, Checkbox, Switch, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import BillingMethodFields from './BillingMethodFields';

const { Title, Text } = Typography;
const { Option } = Select;

const AddOnsForm = ({ form }) => {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Add-Ons Configuration</Title>
      
      <Form.List name={['add_ons']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => (
              <Card
                key={field.key}
                size="small"
                style={{ marginBottom: 16 }}
                title={
                  <Space align="center">
                    <Text strong>Add-On #{index + 1}</Text>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Add-On Type Selection */}
                  <Form.Item
                    key={`addon-type-${field.key}`}
                    name={[field.name, 'type']}
                    label="Add-On Type"
                    rules={[{ required: true, message: 'Please select add-on type' }]}
                    fieldKey={[field.fieldKey, 'type']}
                  >
                    <Select
                      placeholder="Select add-on type"
                      style={{ width: '100%' }}
                    >
                      <Option value="system_integration">System Integration</Option>
                      <Option value="infrastructure">Infrastructure</Option>
                    </Select>
                  </Form.Item>

                  {/* System Integration Fields */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => {
                      const prevType = prevValues?.add_ons?.[field.name]?.type;
                      const currentType = currentValues?.add_ons?.[field.name]?.type;
                      return prevType !== currentType;
                    }}
                  >
                    {({ getFieldValue }) => {
                      const addOnType = getFieldValue(['add_ons', field.name, 'type']);
                      
                      if (addOnType === 'system_integration') {
                        return (
                          <Card size="small" title="System Integration Details" style={{ backgroundColor: '#fafafa' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              {/* API Type */}
                              <Form.Item
                                key={`api-type-${field.key}`}
                                name={[field.name, 'system_integration', 'api_type']}
                                label="API Type"
                                rules={[{ required: true, message: 'Please select API type' }]}
                                fieldKey={[field.fieldKey, 'system_integration', 'api_type']}
                              >
                                <Select placeholder="Select API type">
                                  <Option value="restful">RESTful API</Option>
                                  <Option value="soap">SOAP API</Option>
                                  <Option value="graphql">GraphQL API</Option>
                                  <Option value="webhook">Webhook</Option>
                                </Select>
                              </Form.Item>

                              {/* Integration Complexity */}
                              <Form.Item
                                key={`integration-complexity-${field.key}`}
                                name={[field.name, 'system_integration', 'complexity']}
                                label="Integration Complexity"
                                rules={[{ required: true, message: 'Please select complexity' }]}
                                fieldKey={[field.fieldKey, 'system_integration', 'complexity']}
                              >
                                <Select placeholder="Select complexity level">
                                  <Option value="simple">Simple (Basic CRUD)</Option>
                                  <Option value="medium">Medium (Business Logic)</Option>
                                  <Option value="complex">Complex (Advanced Processing)</Option>
                                </Select>
                              </Form.Item>

                              {/* Base Integration Fee */}
                              <Form.Item
                                key={`base-fee-${field.key}`}
                                name={[field.name, 'system_integration', 'base_fee']}
                                label="Base Integration Fee"
                                rules={[{ required: true, message: 'Please enter base fee' }]}
                                fieldKey={[field.fieldKey, 'system_integration', 'base_fee']}
                              >
                                <InputNumber
                                  placeholder="Enter base fee"
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                                />
                              </Form.Item>

                              {/* Custom Development Required */}
                              <Form.Item
                                key={`custom-dev-${field.key}`}
                                name={[field.name, 'system_integration', 'requires_custom_development']}
                                label="Requires Custom Development"
                                valuePropName="checked"
                                fieldKey={[field.fieldKey, 'system_integration', 'requires_custom_development']}
                              >
                                <Switch />
                              </Form.Item>

                              {/* Custom Development Fee (conditional) */}
                              <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => {
                                  const prevCustomDev = prevValues?.add_ons?.[field.name]?.system_integration?.requires_custom_development;
                                  const currentCustomDev = currentValues?.add_ons?.[field.name]?.system_integration?.requires_custom_development;
                                  return prevCustomDev !== currentCustomDev;
                                }}
                              >
                                {({ getFieldValue }) => {
                                  const requiresCustomDev = getFieldValue(['add_ons', field.name, 'system_integration', 'requires_custom_development']);
                                  
                                  if (requiresCustomDev) {
                                    return (
                                      <Form.Item
                                        key={`custom-dev-fee-${field.key}`}
                                        name={[field.name, 'system_integration', 'custom_development_fee']}
                                        label="Custom Development Fee"
                                        rules={[{ required: true, message: 'Please enter custom development fee' }]}
                                        fieldKey={[field.fieldKey, 'system_integration', 'custom_development_fee']}
                                      >
                                        <InputNumber
                                          placeholder="Enter custom development fee"
                                          min={0}
                                          style={{ width: '100%' }}
                                          formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                          parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                                        />
                                      </Form.Item>
                                    );
                                  }
                                  return null;
                                }}
                              </Form.Item>

                              {/* Billing Method for System Integration */}
                              <BillingMethodFields
                                form={form}
                                fieldName={[field.name, 'system_integration', 'billing_method']}
                                fieldKey={[field.fieldKey, 'system_integration', 'billing_method']}
                              />
                            </Space>
                          </Card>
                        );
                      }

                      if (addOnType === 'infrastructure') {
                        return (
                          <Card size="small" title="Infrastructure Details" style={{ backgroundColor: '#fafafa' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                              {/* Infrastructure Type */}
                              <Form.Item
                                key={`infra-type-${field.key}`}
                                name={[field.name, 'infrastructure', 'type']}
                                label="Infrastructure Type"
                                rules={[{ required: true, message: 'Please select infrastructure type' }]}
                                fieldKey={[field.fieldKey, 'infrastructure', 'type']}
                              >
                                <Select placeholder="Select infrastructure type">
                                  <Option value="server">Server/Hosting</Option>
                                  <Option value="database">Database</Option>
                                  <Option value="cdn">CDN</Option>
                                  <Option value="load_balancer">Load Balancer</Option>
                                  <Option value="monitoring">Monitoring Tools</Option>
                                  <Option value="backup">Backup Storage</Option>
                                </Select>
                              </Form.Item>

                              {/* Resource Size */}
                              <Form.Item
                                key={`resource-size-${field.key}`}
                                name={[field.name, 'infrastructure', 'size']}
                                label="Resource Size"
                                rules={[{ required: true, message: 'Please select resource size' }]}
                                fieldKey={[field.fieldKey, 'infrastructure', 'size']}
                              >
                                <Select placeholder="Select resource size">
                                  <Option value="small">Small (Basic)</Option>
                                  <Option value="medium">Medium (Standard)</Option>
                                  <Option value="large">Large (Premium)</Option>
                                  <Option value="enterprise">Enterprise (Custom)</Option>
                                </Select>
                              </Form.Item>

                              {/* Monthly Fee */}
                              <Form.Item
                                key={`monthly-fee-${field.key}`}
                                name={[field.name, 'infrastructure', 'monthly_fee']}
                                label="Monthly Fee"
                                rules={[{ required: true, message: 'Please enter monthly fee' }]}
                                fieldKey={[field.fieldKey, 'infrastructure', 'monthly_fee']}
                              >
                                <InputNumber
                                  placeholder="Enter monthly fee"
                                  min={0}
                                  style={{ width: '100%' }}
                                  formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                  parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                                />
                              </Form.Item>

                              {/* Setup Required */}
                              <Form.Item
                                key={`setup-required-${field.key}`}
                                name={[field.name, 'infrastructure', 'requires_setup']}
                                label="Requires Setup Fee"
                                valuePropName="checked"
                                fieldKey={[field.fieldKey, 'infrastructure', 'requires_setup']}
                              >
                                <Switch />
                              </Form.Item>

                              {/* Setup Fee (conditional) */}
                              <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => {
                                  const prevSetup = prevValues?.add_ons?.[field.name]?.infrastructure?.requires_setup;
                                  const currentSetup = currentValues?.add_ons?.[field.name]?.infrastructure?.requires_setup;
                                  return prevSetup !== currentSetup;
                                }}
                              >
                                {({ getFieldValue }) => {
                                  const requiresSetup = getFieldValue(['add_ons', field.name, 'infrastructure', 'requires_setup']);
                                  
                                  if (requiresSetup) {
                                    return (
                                      <Form.Item
                                        key={`setup-fee-${field.key}`}
                                        name={[field.name, 'infrastructure', 'setup_fee']}
                                        label="Setup Fee"
                                        rules={[{ required: true, message: 'Please enter setup fee' }]}
                                        fieldKey={[field.fieldKey, 'infrastructure', 'setup_fee']}
                                      >
                                        <InputNumber
                                          placeholder="Enter setup fee"
                                          min={0}
                                          style={{ width: '100%' }}
                                          formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                          parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                                        />
                                      </Form.Item>
                                    );
                                  }
                                  return null;
                                }}
                              </Form.Item>

                              {/* Billing Method for Infrastructure */}
                              <BillingMethodFields
                                form={form}
                                fieldName={[field.name, 'infrastructure', 'billing_method']}
                                fieldKey={[field.fieldKey, 'infrastructure', 'billing_method']}
                              />
                            </Space>
                          </Card>
                        );
                      }

                      return null;
                    }}
                  </Form.Item>
                </Space>
              </Card>
            ))}

            <Button
              type="dashed"
              onClick={() => add()}
              icon={<PlusOutlined />}
              style={{ width: '100%', marginTop: 16 }}
            >
              Add Add-On
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default AddOnsForm;