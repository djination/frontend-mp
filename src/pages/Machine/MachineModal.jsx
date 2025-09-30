import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Row, Col } from 'antd';
import { createMachine, updateMachine, getServiceLocations } from '../../api/machineApi';

const { Option } = Select;
const { TextArea } = Input;

const MachineModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  editingMachine = null,
  vendorFilters = {},
  branches = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);
  const isEdit = !!editingMachine;

  useEffect(() => {
    if (visible) {
      // Fetch service locations when modal opens
      fetchServiceLocations();
      
      if (isEdit && editingMachine) {
        // Populate form with editing machine data
        form.setFieldsValue({
          code: editingMachine.code,
          name: editingMachine.name,
          description: editingMachine.description,
          branch_id: editingMachine.branch?.id,
          supplier_id: editingMachine.supplier?.id,
          gateway_id: editingMachine.gateway?.id,
          pjpur_id: editingMachine.pjpur?.id,
          service_location_id: editingMachine.service_location?.id,
        });
      } else {
        // Reset form for new machine
        form.resetFields();
      }
    }
  }, [visible, isEdit, editingMachine, form]);

  const fetchServiceLocations = async () => {
    try {
      const response = await getServiceLocations(1, 100); // Get first 100 service locations
      console.log('Service locations response:', response);
      
      // Handle different response formats
      let locations = [];
      if (Array.isArray(response)) {
        locations = response;
      } else if (response.data && Array.isArray(response.data)) {
        locations = response.data;
      } else if (response && response.data) {
        locations = response.data;
      }
      
      setServiceLocations(locations);
      console.log('Service locations set:', locations);
    } catch (error) {
      console.error('Failed to fetch service locations:', error);
      message.error('Failed to load service locations');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      console.log('Submitting machine data:', values);
      
      if (isEdit) {
        await updateMachine(editingMachine.id, values);
        message.success('Machine updated successfully');
      } else {
        await createMachine(values);
        message.success('Machine created successfully');
      }
      
      onSuccess();
      handleCancel();
    } catch (error) {
      console.error('Failed to save machine:', error);
      message.error(`Failed to ${isEdit ? 'update' : 'create'} machine: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Helper function to render select options
  const renderOptions = (items = []) => {
    return items.map(item => {
      // Handle vendor filter format: { text: 'name', value: 'id' }
      if (item.text && item.value) {
        return (
          <Option key={item.value} value={item.value}>
            {item.text}
          </Option>
        );
      }
      // Handle direct data format: { id: 'id', name: 'name' }
      return (
        <Option key={item.id || item.value} value={item.id || item.value}>
          {item.name || item.label || item.text}
        </Option>
      );
    });
  };

  return (
    <Modal
      title={isEdit ? 'Edit Machine' : 'Add New Machine'}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
        >
          {isEdit ? 'Update' : 'Create'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Machine Code"
              rules={[
                { required: true, message: 'Please enter machine code' },
                { max: 50, message: 'Code must not exceed 50 characters' }
              ]}
            >
              <Input placeholder="Enter machine code" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Machine Name"
              rules={[
                { required: true, message: 'Please enter machine name' },
                { max: 100, message: 'Name must not exceed 100 characters' }
              ]}
            >
              <Input placeholder="Enter machine name" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 500, message: 'Description must not exceed 500 characters' }
          ]}
        >
          <TextArea 
            rows={3} 
            placeholder="Enter machine description" 
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="branch_id"
              label="Branch"
              rules={[{ required: true, message: 'Please select a branch' }]}
            >
              <Select
                placeholder="Select branch"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {renderOptions(branches)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="supplier_id"
              label="Supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select
                placeholder="Select supplier"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {renderOptions(vendorFilters.supplier || [])}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gateway_id"
              label="Gateway Vendor"
              rules={[{ required: true, message: 'Please select a gateway vendor' }]}
            >
              <Select
                placeholder="Select gateway vendor"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {renderOptions(vendorFilters.gateway || [])}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="pjpur_id"
              label="PJPUR Vendor"
              rules={[{ required: true, message: 'Please select a PJPUR vendor' }]}
            >
              <Select
                placeholder="Select PJPUR vendor"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {renderOptions(vendorFilters.pjpur || [])}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="service_location_id"
          label="Service Location"
          rules={[{ required: true, message: 'Please select a service location' }]}
        >
          <Select
            placeholder="Select service location"
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {renderOptions(serviceLocations)}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MachineModal;