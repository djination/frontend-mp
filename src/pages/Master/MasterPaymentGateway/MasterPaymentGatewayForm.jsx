import React from 'react';
import { Form, Input, Select, Switch, Button } from 'antd';

const categoryOptions = [
  { label: 'Disbursement', value: 'DISBURSEMENT' },
  { label: 'Virtual Account', value: 'VIRTUAL_ACCOUNT' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Others', value: 'OTHERS' },
];

const MasterPaymentGatewayForm = ({ form, initialValues = {}, onSubmit, onCancel, loading }) => (
  <Form
    form={form}
    layout="vertical"
    initialValues={{ is_active: true, ...initialValues }}
    onFinish={onSubmit}
  >
    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}> 
      <Input />
    </Form.Item>
    <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}> 
      <Select options={categoryOptions} />
    </Form.Item>
    <Form.Item name="is_active" label="Active" valuePropName="checked">
      <Switch />
    </Form.Item>
    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
      <Button type="default" onClick={onCancel} style={{ marginRight: 8 }}>
        Cancel
      </Button>
      <Button type="primary" htmlType="submit" loading={loading}>
        Save
      </Button>
    </Form.Item>
  </Form>
);

export default MasterPaymentGatewayForm;
