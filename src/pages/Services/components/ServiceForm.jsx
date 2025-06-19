import { Form, Input, Select, Button, Space } from 'antd';
import React, { useEffect } from 'react';

const ServiceForm = ({ service, onSubmit, onCancel, allServices }) => {
  const [form] = Form.useForm();

  // Flat list for parent dropdown
  const flatServices = (services, level = 0) => {
    let list = [];
    services.forEach(s => {
      list.push({ ...s, level });
      if (s.children && s.children.length > 0) {
        list = list.concat(flatServices(s.children, level + 1));
      }
    });
    return list;
  };

  // Exclude self from parent options
  const availableParents = flatServices(allServices).filter(s => !service || s.id !== service.id);

  useEffect(() => {
    if (service) {
      form.setFieldsValue({
        name: service.name,
        type: service.type,
        parentId: service.parentId || (service.parent && service.parent.id) || undefined,
      });
    } else {
      form.resetFields();
    }
  }, [service, form]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={
        service
          ? {
              name: service.name,
              type: service.type,
              parentId: service.parentId || (service.parent && service.parent.id) || undefined,
            }
          : { name: '', type: '', parentId: undefined }
      }
    >
      <Form.Item
        name="name"
        label="Service Name"
        rules={[{ required: true, message: 'Please enter service name' }]}
      >
        <Input placeholder="Enter service name" />
      </Form.Item>
      <Form.Item
        name="type"
        label="Service Type"
      >
        <Input placeholder="e.g., E-Wallet, Domestic" />
      </Form.Item>
      <Form.Item
        name="parentId"
        label="Parent Service"
      >
        <Select
          allowClear
          placeholder="Select parent service"
          options={[
            { value: null, label: '-- No Parent --' },
            ...availableParents.map(s => ({
              value: s.id,
              label: `${'\u00A0\u00A0'.repeat(s.level)}${s.name}`,
            })),
          ]}
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit">
            {service ? 'Update Service' : 'Add Service'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ServiceForm;