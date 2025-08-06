import { Form, Input, Select, Button, Space, Checkbox } from 'antd';
import { React, useEffect } from 'react';

const CdmProviderForm = ({ cdmProvider, onSubmit, onCancel, allCdmProviders }) => {
  const [form] = Form.useForm();

  // Flat list for parent dropdown
  const flatCdmProviders = (cdmProviders, level = 0) => {
    let list = [];
    cdmProviders.forEach(s => {
      list.push({ ...s, level });
      if (s.children && s.children.length > 0) {
        list = list.concat(flatCdmProviders(s.children, level + 1));
      }
    });
    return list;
  };

  // Exclude self from parent options
  const availableParents = flatCdmProviders(allCdmProviders).filter(s => !cdmProvider || s.id !== cdmProvider.id);

  useEffect(() => {
    if (cdmProvider) {
      form.setFieldsValue({
        name: cdmProvider.name,
        description: cdmProvider.description,
        parentId: cdmProvider.parentId || (cdmProvider.parent && cdmProvider.parent.id) || undefined,
      });
    } else {
      form.resetFields();
    }
  }, [cdmProvider, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={
        cdmProvider
          ? {
              name: cdmProvider.name,
              description: cdmProvider.description,
              parentId: cdmProvider.parentId || (cdmProvider.parent && cdmProvider.parent.id) || undefined,
              is_active: cdmProvider.is_active !== undefined ? cdmProvider.is_active : true,
            }
          : { name: '', description: '', parentId: undefined, is_active: true }
      }
    >
      <Form.Item
        name="name"
        label="CdmProvider Name"
        rules={[{ required: true, message: 'Please enter cdmProvider name' }]}
      >
        <Input placeholder="Enter cdmProvider name" />
      </Form.Item>
      <Form.Item
        name="description"
        label="CdmProvider Description"
      >
        <Input placeholder="Enter cdmProvider description" />
      </Form.Item>
      <Form.Item
        name="parentId"
        label="Parent CdmProvider"
      >
        <Select
          allowClear
          placeholder="Select parent cdmProvider"
          options={[
            { value: null, label: '-- No Parent --' },
            ...availableParents.map(s => ({
              value: s.id,
              label: `${'\u00A0\u00A0'.repeat(s.level)}${s.name}`,
            })),
          ]}
        />
      </Form.Item>
      <Form.Item
        name="is_active"
        label="Is Active"
        valuePropName="checked"
      >
        <Checkbox />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            {cdmProvider ? 'Update CdmProvider' : 'Add CdmProvider'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default CdmProviderForm;