import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Form, Input, Select, Button, Row, Col, Divider, Space, Table, Popconfirm, message, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import { 
  createOrUpdateVendorDetails, 
  getVendorDetails, 
  deleteVendorDetails 
} from '../../../api/accountCommissionApi';

const VendorDetailsManager = ({ accountId, accountCategories, selectedAccountCategories, onVendorDetailsChange, initialVendorDetails }) => {
  const [vendorForm] = Form.useForm();
  const [vendorDetails, setVendorDetailsState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Notify parent component about vendor details change
  useEffect(() => {
    onVendorDetailsChange?.(vendorDetails);
  }, [vendorDetails, onVendorDetailsChange]);

  // Helper function
  const isVendorCategory = useCallback((categoryIds, categories) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return false;
    const vendorCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('vendor')
    );
    return vendorCategory && categoryIds.includes(vendorCategory.id);
  }, []);

  useEffect(() => {
    if (initialVendorDetails && vendorDetails.length === 0) {
      const detailsArray = Array.isArray(initialVendorDetails) 
        ? initialVendorDetails 
        : [initialVendorDetails];
      setVendorDetailsState(detailsArray);
      return;
    }
    
    if (accountId && vendorDetails.length === 0) {
      fetchVendorDetails();
    }
  }, [accountId, initialVendorDetails]);

  const fetchVendorDetails = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const response = await getVendorDetails(accountId);
      
      let vendorData = [];
      if (response && response.data) {
        vendorData = Array.isArray(response.data) ? response.data : [response.data];
      }
      
      setVendorDetailsState(vendorData);
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      if (error.response?.status !== 404) {
        message.error('Failed to fetch vendor details');
      }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const forceRefreshFromBackend = async () => {
    setVendorDetailsState([]);
    await fetchVendorDetails();
  };

  const handleAddVendorClick = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    try {
      const values = await vendorForm.validateFields();
      await handleSubmitVendor(values);
    } catch (error) {
      console.error('Error in handleAddVendorClick:', error);
      if (error.errorFields) {
        message.error('Please fix the form errors');
      } else {
        message.error('Failed to add vendor details');
      }
    }
  };

  const handleSubmitVendor = async (values) => {
    try {
      setLoading(true);
      
      const vendorData = {
        vendor_type: values.vendor_type,
        vendor_classification: values.vendor_classification || '',
        vendor_rating: values.vendor_rating || '',
        tax_id: values.tax_id || '',
        contract_start_date: values.contract_start_date ? values.contract_start_date.format('YYYY-MM-DD') : null,
        contract_end_date: values.contract_end_date ? values.contract_end_date.format('YYYY-MM-DD') : null,
        payment_terms: values.payment_terms || '',
        delivery_terms: values.delivery_terms || '',
        certification: values.certification || '',
        id: editingVendor?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      };

      let newVendorDetails;
      if (editingVendor) {
        newVendorDetails = vendorDetails.map(details => 
          details.id === editingVendor.id ? { ...details, ...vendorData } : details
        );
        message.success('Vendor details updated successfully');
      } else {
        newVendorDetails = [...vendorDetails, vendorData];
        message.success('Vendor details added successfully');
      }
      
      setVendorDetailsState(newVendorDetails);
      vendorForm.resetFields();
      setEditingVendor(null);
      
      return true;
      
    } catch (error) {
      console.error('Error in handleSubmitVendor:', error);
      message.error('Failed to save vendor details');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditVendor = useCallback((vendor) => {
    setEditingVendor(vendor);
    vendorForm.setFieldsValue({
      vendor_type: vendor.vendor_type,
      vendor_classification: vendor.vendor_classification,
      vendor_rating: vendor.vendor_rating,
      tax_id: vendor.tax_id,
      contract_start_date: vendor.contract_start_date ? moment(vendor.contract_start_date) : null,
      contract_end_date: vendor.contract_end_date ? moment(vendor.contract_end_date) : null,
      payment_terms: vendor.payment_terms,
      delivery_terms: vendor.delivery_terms,
      certification: vendor.certification,
    });
  }, [vendorForm]);

  const handleDeleteVendor = useCallback(async (vendorId) => {
    try {
      setLoading(true);
      
      const newVendorDetails = vendorDetails.filter(details => details.id !== vendorId);
      setVendorDetailsState(newVendorDetails);
      
      message.success('Vendor details deleted successfully');
      
      if (editingVendor && editingVendor.id === vendorId) {
        vendorForm.resetFields();
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Error deleting vendor details:', error);
      message.error('Failed to delete vendor details');
    } finally {
      setLoading(false);
    }
  }, [vendorDetails, editingVendor, vendorForm]);

  const handleCancelEdit = () => {
    vendorForm.resetFields();
    setEditingVendor(null);
  };

  // Define table columns for vendor details with useMemo to prevent recreation
  const vendorColumns = useMemo(() => [
    {
      title: 'Vendor Type',
      dataIndex: 'vendor_type',
      key: 'vendor_type',
      render: (text) => text || '-',
    },
    {
      title: 'Classification',
      dataIndex: 'vendor_classification',
      key: 'vendor_classification',
      render: (text) => text || '-',
    },
    {
      title: 'Rating',
      dataIndex: 'vendor_rating',
      key: 'vendor_rating',
      render: (text) => text || '-',
    },
    {
      title: 'Tax ID',
      dataIndex: 'tax_id',
      key: 'tax_id',
      render: (text) => text || '-',
    },
    {
      title: 'Contract Period',
      key: 'contract_period',
      render: (record) => {
        const start = record.contract_start_date ? moment(record.contract_start_date).format('YYYY-MM-DD') : '';
        const end = record.contract_end_date ? moment(record.contract_end_date).format('YYYY-MM-DD') : '';
        if (start && end) {
          return `${start} to ${end}`;
        } else if (start) {
          return `From ${start}`;
        } else if (end) {
          return `Until ${end}`;
        }
        return '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditVendor(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this vendor details?"
            onConfirm={() => handleDeleteVendor(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleEditVendor, handleDeleteVendor]);

  // Memoized select options to prevent recreation
  const vendorTypeOptions = useMemo(() => [
    { value: "supplier", label: "Supplier" },
    { value: "contractor", label: "Contractor" },
    { value: "consultant", label: "Consultant" },
    { value: "service_provider", label: "Service Provider" },
    { value: "distributor", label: "Distributor" },
    { value: "other", label: "Other" }
  ], []);

  const vendorClassificationOptions = useMemo(() => [
    { value: "strategic", label: "Strategic" },
    { value: "preferred", label: "Preferred" },
    { value: "standard", label: "Standard" },
    { value: "conditional", label: "Conditional" }
  ], []);

  const vendorRatingOptions = useMemo(() => [
    { value: "A", label: "A - Excellent" },
    { value: "B", label: "B - Good" },
    { value: "C", label: "C - Satisfactory" },
    { value: "D", label: "D - Needs Improvement" }
  ], []);

  const paymentTermsOptions = useMemo(() => [
    { value: "net_30", label: "Net 30" },
    { value: "net_15", label: "Net 15" },
    { value: "net_7", label: "Net 7" },
    { value: "cod", label: "COD" },
    { value: "advance", label: "Advance Payment" },
    { value: "custom", label: "Custom" }
  ], []);

  const deliveryTermsOptions = useMemo(() => [
    { value: "fob", label: "FOB" },
    { value: "cif", label: "CIF" },
    { value: "ddu", label: "DDU" },
    { value: "ddp", label: "DDP" },
    { value: "ex_works", label: "Ex Works" },
    { value: "custom", label: "Custom" }
  ], []);

  // Check if current category is vendor
  const isCurrentlyVendorCategory = useMemo(() => 
    isVendorCategory(selectedAccountCategories, accountCategories), 
    [selectedAccountCategories, accountCategories, isVendorCategory]
  );

  if (!isCurrentlyVendorCategory) {
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
    <Card 
      title="Vendor Details" 
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={forceRefreshFromBackend}
            title="Refresh from backend"
          >
            Refresh
          </Button>
        </Space>
      }
    >
      {/* Add/Edit Form */}
      <Form
        form={vendorForm}
        layout="vertical"
        onFinish={(e) => {
          e.preventDefault?.();
          return false;
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_type"
              label="Vendor Type"
              rules={[{ required: true, message: 'Please select vendor type' }]}
            >
              <Select placeholder="Select vendor type" options={vendorTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vendor_classification"
              label="Vendor Classification"
            >
              <Select placeholder="Select vendor classification" options={vendorClassificationOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_rating"
              label="Vendor Rating"
            >
              <Select placeholder="Select vendor rating" options={vendorRatingOptions} />
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
              <Select placeholder="Select payment terms" options={paymentTermsOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="delivery_terms"
              label="Delivery Terms"
            >
              <Select placeholder="Select delivery terms" options={deliveryTermsOptions} />
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

        <Row gutter={16}>
          <Col span={24}>
            <Space>
              <Button 
                type="primary" 
                loading={loading}
                icon={<PlusOutlined />}
                onClick={handleAddVendorClick}
              >
                {editingVendor ? 'Update Vendor Details' : 'Add Vendor Details'}
              </Button>
              {editingVendor && (
                <Button onClick={handleCancelEdit}>
                  Cancel Edit
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Form>

      <Divider />

      {/* Vendor Details Table */}
      <div style={{ marginTop: 24 }}>
        <Table
          columns={vendorColumns}
          dataSource={vendorDetails}
          rowKey="id"
          pagination={false}
          loading={loading}
          locale={{ emptyText: 'No vendor details added yet' }}
          size="middle"
        />
      </div>
    </Card>
  );
};

export default VendorDetailsManager;
