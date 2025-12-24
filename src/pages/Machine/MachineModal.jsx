import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Row, Col } from 'antd';
import { createMachine, updateMachine, getServiceLocations } from '../../api/machineApi';
import { getAccountOptions } from '../../api/accountApi';
import { createMasterMachine, updateMasterMachine, getMasterMachines } from '../../api/masterMachineApi';

const { Option } = Select;
const { TextArea } = Input;

const MachineModal = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  editingMachine = null,
  vendorFilters = {},
  branches = [],
  useBackendExt = false
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [serviceLocations, setServiceLocations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [masterMachineId, setMasterMachineId] = useState(null);
  const isEdit = !!editingMachine;

  useEffect(() => {
    if (visible) {
      // Fetch service locations and accounts when modal opens
      fetchServiceLocations();
      fetchAccounts();
      
      if (isEdit && editingMachine) {
        // Fetch master machine data to get account_id and machine_type
        fetchMasterMachineData(editingMachine.id);
        
        // Populate form with editing machine data
        form.setFieldsValue({
          code: editingMachine.code,
          name: editingMachine.name,
          description: editingMachine.description,
          branch_id: editingMachine.branch?.id,
          supplier_id: editingMachine.supplier?.id,
          gateway_id: editingMachine.gateway?.id,
          pjpur_id: editingMachine.pjpur?.id,
          maintenance_id: editingMachine.maintenance?.id,
          service_location_id: editingMachine.service_location?.id,
        });
      } else {
        // Reset form for new machine
        form.resetFields();
        setMasterMachineId(null);
      }
    }
  }, [visible, isEdit, editingMachine, form]);

  const fetchAccounts = async () => {
    try {
      const response = await getAccountOptions();
      if (response?.data) {
        setAccounts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      message.warning('Failed to load accounts');
    }
  };

  const fetchMasterMachineData = async (machineId) => {
    try {
      // Find master machine by machine_id (stored in data field)
      const response = await getMasterMachines();
      const machines = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
      
      // Find master machine that has this machine ID in its data
      const masterMachine = machines.find(m => 
        m.data && (m.data.id === machineId || m.data.code === editingMachine.code)
      );
      
      if (masterMachine) {
        setMasterMachineId(masterMachine.id);
        form.setFieldsValue({
          account_id: masterMachine.account_id,
          machine_type: masterMachine.machine_type,
        });
      }
    } catch (error) {
      console.error('Failed to fetch master machine data:', error);
    }
  };

  const fetchServiceLocations = async () => {
    try {
      let response;
      
      if (useBackendExt) {
        response = await machineApiWithBackendExt.getServiceLocations(1, 100);
      } else {
        response = await getServiceLocations(1, 100); // Get first 100 service locations
      }
      
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
    } catch (error) {
      console.error('Failed to fetch service locations:', error);
      message.error('Failed to load service locations');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      let machineResponse;
      
      if (isEdit) {
        if (useBackendExt) {
          machineResponse = await machineApiWithBackendExt.updateMachine(editingMachine.id, values);
        } else {
          machineResponse = await updateMachine(editingMachine.id, values);
        }
        message.success('Machine updated successfully');
      } else {
        if (useBackendExt) {
          machineResponse = await machineApiWithBackendExt.createMachine(values);
        } else {
          machineResponse = await createMachine(values);
        }
        message.success('Machine created successfully');
      }
      
      // Save to MasterMachine entity if account_id and machine_type are provided
      if (values.account_id && values.machine_type) {
        try {
          // Extract machine data from response
          let machineData = {};
          if (machineResponse?.data) {
            machineData = machineResponse.data;
          } else if (machineResponse) {
            machineData = machineResponse;
          } else if (isEdit && editingMachine) {
            machineData = editingMachine;
          } else {
            // For new machines, use form values
            machineData = {
              code: values.code,
              name: values.name,
              description: values.description,
            };
          }
          
          // Ensure we have the machine ID
          if (!machineData.id && (machineResponse?.id || editingMachine?.id)) {
            machineData.id = machineResponse?.id || editingMachine?.id;
          }
          
          const masterMachineData = {
            account_id: values.account_id,
            machine_type: values.machine_type,
            data: machineData
          };
          
          if (masterMachineId) {
            // Update existing master machine
            await updateMasterMachine(masterMachineId, masterMachineData);
          } else {
            // Create new master machine
            await createMasterMachine(masterMachineData);
          }
        } catch (masterError) {
          console.error('Failed to save to master machine:', masterError);
          message.warning('Machine saved but failed to link to account');
        }
      }
      
      onSuccess();
      handleCancel();
    } catch (error) {
      console.error('Failed to save machine:', error);
      const apiMethod = useBackendExt ? 'backend-ext' : 'direct API';
      message.error(`Failed to ${isEdit ? 'update' : 'create'} machine via ${apiMethod}: ${error.message}`);
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

        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="account_id"
              label="Account Name"
              rules={[{ required: true, message: 'Please select an account' }]}
            >
              <Select
                placeholder="Select account"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {accounts.map(account => (
                  <Select.Option key={account.value || account.id} value={account.value || account.id}>
                    {account.label || `${account.account_no} - ${account.name}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="machine_type"
              label="Machine Type"
              rules={[{ required: true, message: 'Please select machine type' }]}
            >
              <Select placeholder="Select machine type">
                <Select.Option value="dedicated">Dedicated</Select.Option>
                <Select.Option value="non-dedicated">Non-Dedicated</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default MachineModal;