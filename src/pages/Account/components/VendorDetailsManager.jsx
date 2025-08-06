import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Row, Col, message, DatePicker } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import moment from 'moment';
import { 
  createOrUpdateVendorDetails, 
  getVendorDetails, 
  deleteVendorDetails 
} from '../../../api/accountCommissionApi';

const VendorDetailsManager = ({ accountId, accountCategories, selectedAccountCategories, onVendorDetailsChange }) => {
  const [vendorForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vendorDetails, setVendorDetailsState] = useState(null);

  // Update parent component when vendor details change
  const setVendorDetails = (details) => {
    setVendorDetailsState(details);
    if (onVendorDetailsChange) {
      onVendorDetailsChange(details);
    }
  };

  // Helper function
  const isVendorCategory = (categoryIds, categories) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return false;
    const vendorCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('vendor')
    );
    return vendorCategory && categoryIds.includes(vendorCategory.id);
  };

  useEffect(() => {
    if (accountId) {
      fetchVendorDetails();
    }
  }, [accountId]);

  const fetchVendorDetails = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await getVendorDetails(accountId);
      const details = response.data;
      
      if (details) {
        setVendorDetails(details);
        vendorForm.setFieldsValue({
          vendor_type: details.vendor_type,
          vendor_classification: details.vendor_classification,
          vendor_rating: details.vendor_rating,
          tax_id: details.tax_id,
          contract_start_date: details.contract_start_date ? moment(details.contract_start_date) : null,
          contract_end_date: details.contract_end_date ? moment(details.contract_end_date) : null,
          payment_terms: details.payment_terms,
          delivery_terms: details.delivery_terms,
          certification: details.certification,
        });
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      // Don't show error message for empty vendor details (404 is expected)
      if (error.response?.status !== 404) {
        message.error('Failed to fetch vendor details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVendor = async (values) => {
    try {
      setLoading(true);
      const vendorData = {
        ...values,
        contract_start_date: values.contract_start_date ? values.contract_start_date.format('YYYY-MM-DD') : null,
        contract_end_date: values.contract_end_date ? values.contract_end_date.format('YYYY-MM-DD') : null,
      };

      await createOrUpdateVendorDetails(accountId, vendorData);
      message.success('Vendor details saved successfully');
      fetchVendorDetails();
    } catch (error) {
      console.error('Error saving vendor details:', error);
      message.error('Failed to save vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    try {
      setLoading(true);
      await deleteVendorDetails(accountId);
      message.success('Vendor details deleted successfully');
      setVendorDetails(null);
      vendorForm.resetFields();
    } catch (error) {
      console.error('Error deleting vendor details:', error);
      message.error('Failed to delete vendor details');
    } finally {
      setLoading(false);
    }
  };

  if (!isVendorCategory(selectedAccountCategories, accountCategories)) {
    return null;
  }

  // If no accountId, show message to save account first
  if (!accountId) {
    return (
      <Card title="Vendor Details">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
          <p>Please save the account first before managing vendor details.</p>
          <p>Vendor details can only be added to existing accounts.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Vendor Details">
      <Form
        form={vendorForm}
        layout="vertical"
        onFinish={handleSubmitVendor}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_type"
              label="Vendor Type"
              rules={[{ required: true, message: 'Please select vendor type' }]}
            >
              <Select placeholder="Select vendor type">
                <Select.Option value="supplier">Supplier</Select.Option>
                <Select.Option value="contractor">Contractor</Select.Option>
                <Select.Option value="consultant">Consultant</Select.Option>
                <Select.Option value="service_provider">Service Provider</Select.Option>
                <Select.Option value="distributor">Distributor</Select.Option>
                <Select.Option value="other">Other</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vendor_classification"
              label="Vendor Classification"
            >
              <Select placeholder="Select vendor classification">
                <Select.Option value="strategic">Strategic</Select.Option>
                <Select.Option value="preferred">Preferred</Select.Option>
                <Select.Option value="standard">Standard</Select.Option>
                <Select.Option value="conditional">Conditional</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_rating"
              label="Vendor Rating"
            >
              <Select placeholder="Select vendor rating">
                <Select.Option value="A">A - Excellent</Select.Option>
                <Select.Option value="B">B - Good</Select.Option>
                <Select.Option value="C">C - Satisfactory</Select.Option>
                <Select.Option value="D">D - Needs Improvement</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tax_id"
              label="Tax ID / NPWP"
            >
              <Input placeholder="Enter tax identification number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contract_start_date"
              label="Contract Start Date"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                placeholder="Select contract start date"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contract_end_date"
              label="Contract End Date"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                placeholder="Select contract end date"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="payment_terms"
              label="Payment Terms"
            >
              <Select placeholder="Select payment terms">
                <Select.Option value="net_30">Net 30</Select.Option>
                <Select.Option value="net_15">Net 15</Select.Option>
                <Select.Option value="net_7">Net 7</Select.Option>
                <Select.Option value="cod">COD</Select.Option>
                <Select.Option value="advance">Advance Payment</Select.Option>
                <Select.Option value="custom">Custom</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="delivery_terms"
              label="Delivery Terms"
            >
              <Select placeholder="Select delivery terms">
                <Select.Option value="fob">FOB</Select.Option>
                <Select.Option value="cif">CIF</Select.Option>
                <Select.Option value="ddu">DDU</Select.Option>
                <Select.Option value="ddp">DDP</Select.Option>
                <Select.Option value="ex_works">Ex Works</Select.Option>
                <Select.Option value="custom">Custom</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="certification"
              label="Certifications"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Enter vendor certifications (ISO, etc.)" 
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            icon={<SaveOutlined />}
          >
            Save Vendor Details
          </Button>
          {vendorDetails && (
            <Button 
              danger
              style={{ marginLeft: 8 }}
              onClick={handleDeleteVendor}
              loading={loading}
            >
              Delete Vendor Details
            </Button>
          )}
        </Form.Item>
      </Form>
    </Card>
  );
};

export default VendorDetailsManager;
