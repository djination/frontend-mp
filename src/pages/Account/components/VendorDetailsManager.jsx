import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Form, Input, Select, Button, Row, Col, Divider, Space, Table, Popconfirm, message, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ApiOutlined } from '@ant-design/icons';
import moment from 'moment';
import { 
  createOrUpdateVendorDetails, 
  getVendorDetails, 
  deleteVendorDetails,
  syncVendorToExternalApi
} from '../../../api/accountCommissionApi';

const VendorDetailsManager = ({ accountId, accountCategories, selectedAccountCategories, onVendorDetailsChange, initialVendorDetails, form, accountData }) => {
  const [vendorForm] = Form.useForm();
  const [vendorDetails, setVendorDetailsState] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Use parent form if provided, otherwise use local form
  const activeForm = form || vendorForm;

  // Helper function
  const isVendorCategory = useCallback((categoryIds, categories) => {
    if (!categoryIds || !Array.isArray(categoryIds)) return false;
    const vendorCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('vendor')
    );
    return vendorCategory && categoryIds.includes(vendorCategory.id);
  }, []);

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

  // Only initialize once when component mounts
  useEffect(() => {
    if (!hasInitialized && accountId) {
      if (initialVendorDetails && initialVendorDetails.length > 0) {
        const detailsArray = Array.isArray(initialVendorDetails) 
          ? initialVendorDetails 
          : [initialVendorDetails];
        setVendorDetailsState(detailsArray);
      } else {
        // Always fetch from backend when accountId is available
        fetchVendorDetails();
      }
      setHasInitialized(true);
    }
  }, [accountId, initialVendorDetails, hasInitialized, fetchVendorDetails]);

  // Force refresh when accountId changes (for edit mode)
  useEffect(() => {
    if (accountId && hasInitialized) {
      fetchVendorDetails();
    }
  }, [accountId, fetchVendorDetails, hasInitialized]);

  // Notify parent component about vendor details change
  useEffect(() => {
    onVendorDetailsChange?.(vendorDetails);
  }, [vendorDetails]); // Remove onVendorDetailsChange to prevent infinite loop

  const forceRefreshFromBackend = async () => {
    setVendorDetailsState([]);
    await fetchVendorDetails();
  };

  const handleAddVendorClick = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    try {
      // Get values from the vendor form fields directly
      const values = {
        vendor_type: activeForm.getFieldValue('vendor_vendor_type') || [],
        vendor_classification: activeForm.getFieldValue('vendor_vendor_classification'),
        vendor_rating: activeForm.getFieldValue('vendor_vendor_rating'),
        tax_id: activeForm.getFieldValue('vendor_tax_id'),
        email: activeForm.getFieldValue('vendor_email'),
        phone: activeForm.getFieldValue('vendor_phone'),
        contract_start_date: activeForm.getFieldValue('vendor_contract_start_date'),
        contract_end_date: activeForm.getFieldValue('vendor_contract_end_date'),
        payment_terms: activeForm.getFieldValue('vendor_payment_terms'),
        delivery_terms: activeForm.getFieldValue('vendor_delivery_terms'),
        certification: activeForm.getFieldValue('vendor_certification'),
      };
      
      // Validate required fields manually
      if (!values.vendor_type || values.vendor_type.length === 0) {
        message.error('Please select at least one vendor type');
        return;
      }
      if (!values.email) {
        message.error('Please enter vendor email');
        return;
      }
      if (!values.phone) {
        message.error('Please enter vendor phone');
        return;
      }
      // Validate phone format (+62)
      if (values.phone && !values.phone.startsWith('+62')) {
        message.error('Phone number must start with +62');
        return;
      }
      
      await handleSubmitVendor(values);
    } catch (error) {
      console.error('Error in handleAddVendorClick:', error);
      message.error('Failed to add vendor details');
    }
  };

  const handleSubmitVendor = async (values) => {
    try {
      setLoading(true);
      
      const vendorData = {
        vendor_type: Array.isArray(values.vendor_type) ? values.vendor_type : (values.vendor_type ? [values.vendor_type] : []),
        vendor_classification: values.vendor_classification || '',
        vendor_rating: values.vendor_rating || '',
        tax_id: values.tax_id || '',
        email: values.email || '',
        phone: values.phone || '',
        contract_start_date: values.contract_start_date ? values.contract_start_date.format('YYYY-MM-DD') : null,
        contract_end_date: values.contract_end_date ? values.contract_end_date.format('YYYY-MM-DD') : null,
        payment_terms: values.payment_terms || '',
        delivery_terms: values.delivery_terms || '',
        certification: values.certification || '',
        id: editingVendor?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      };

      // If editing existing vendor (not temp), update in backend immediately
      if (editingVendor && !editingVendor.id.toString().startsWith('temp_')) {
        const backendData = {
          vendor_type: vendorData.vendor_type, // Array
          vendor_classification: vendorData.vendor_classification,
          vendor_rating: vendorData.vendor_rating,
          tax_id: vendorData.tax_id,
          email: vendorData.email,
          phone: vendorData.phone,
          contract_start_date: vendorData.contract_start_date,
          contract_end_date: vendorData.contract_end_date,
          payment_terms: vendorData.payment_terms,
          delivery_terms: vendorData.delivery_terms,
          certification: vendorData.certification
        };
        await createOrUpdateVendorDetails(accountId, backendData);
        message.success('Vendor details updated successfully');
        // Refresh data from backend after update
        if (accountId) {
          const response = await getVendorDetails(accountId);
          let refreshedVendorData = [];
          if (response && response.data) {
            refreshedVendorData = Array.isArray(response.data) ? response.data : [response.data];
          }
          console.log('Refreshed vendor data after update:', refreshedVendorData); // Debug log
          setVendorDetailsState(refreshedVendorData);
        }
        // Clear vendor form fields after successful backend update
        activeForm.setFieldsValue({
          vendor_vendor_type: undefined,
          vendor_vendor_classification: undefined,
          vendor_vendor_rating: undefined,
          vendor_tax_id: undefined,
          vendor_email: undefined,
          vendor_phone: undefined,
          vendor_contract_start_date: undefined,
          vendor_contract_end_date: undefined,
          vendor_payment_terms: undefined,
          vendor_delivery_terms: undefined,
          vendor_certification: undefined,
        });
        setEditingVendor(null);
      } else {
        // For new entries or temp entries, just update local state
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
        // Clear vendor form fields after successful local update
        activeForm.setFieldsValue({
          vendor_vendor_type: undefined,
          vendor_vendor_classification: undefined,
          vendor_vendor_rating: undefined,
          vendor_tax_id: undefined,
          vendor_email: undefined,
          vendor_phone: undefined,
          vendor_contract_start_date: undefined,
          vendor_contract_end_date: undefined,
          vendor_payment_terms: undefined,
          vendor_delivery_terms: undefined,
          vendor_certification: undefined,
        });
        setEditingVendor(null);
      }
      
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
    // Handle vendor_type as array or string
    const vendorTypeValue = Array.isArray(vendor.vendor_type) 
      ? vendor.vendor_type 
      : vendor.vendor_type 
        ? [vendor.vendor_type] 
        : [];
    
    activeForm.setFieldsValue({
      vendor_vendor_type: vendorTypeValue,
      vendor_vendor_classification: vendor.vendor_classification,
      vendor_vendor_rating: vendor.vendor_rating,
      vendor_tax_id: vendor.tax_id,
      vendor_email: vendor.email,
      vendor_phone: vendor.phone,
      vendor_contract_start_date: vendor.contract_start_date ? moment(vendor.contract_start_date) : null,
      vendor_contract_end_date: vendor.contract_end_date ? moment(vendor.contract_end_date) : null,
      vendor_payment_terms: vendor.payment_terms,
      vendor_delivery_terms: vendor.delivery_terms,
      vendor_certification: vendor.certification,
    });
  }, [activeForm]);

  const handleDeleteVendor = useCallback(async (vendorId) => {
    try {
      setLoading(true);
      
      // If it's not a temporary ID, delete from backend first
      if (!vendorId.toString().startsWith('temp_')) {
        await deleteVendorDetails(accountId);
        // Refresh data from backend after delete
        if (accountId) {
          const response = await getVendorDetails(accountId);
          let vendorData = [];
          if (response && response.data) {
            vendorData = Array.isArray(response.data) ? response.data : [response.data];
          }
          setVendorDetailsState(vendorData);
        }
        return; // Don't update local state if we're refreshing from backend
      }
      
      // For temporary IDs, just remove from local state
      const newVendorDetails = vendorDetails.filter(details => details.id !== vendorId);
      setVendorDetailsState(newVendorDetails);
      
      message.success('Vendor details deleted successfully');
      
      if (editingVendor && editingVendor.id === vendorId) {
        activeForm.setFieldsValue({
          vendor_vendor_type: undefined,
          vendor_vendor_classification: undefined,
          vendor_vendor_rating: undefined,
          vendor_tax_id: undefined,
          vendor_email: undefined,
          vendor_phone: undefined,
          vendor_contract_start_date: undefined,
          vendor_contract_end_date: undefined,
          vendor_payment_terms: undefined,
          vendor_delivery_terms: undefined,
          vendor_certification: undefined,
        });
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Error deleting vendor details:', error);
      message.error('Failed to delete vendor details');
    } finally {
      setLoading(false);
    }
  }, [vendorDetails, editingVendor, activeForm, accountId]); // Remove fetchVendorDetails from dependencies

  // Handler for syncing vendor to external API
  const handleSyncVendorToExternalApi = async () => {
    if (!accountId) {
      message.error('Account ID is required');
      return;
    }

    // Check if vendor details exist
    if (!vendorDetails || vendorDetails.length === 0) {
      message.error('Please create vendor details first before syncing');
      return;
    }

    const vendorDetail = vendorDetails[0]; // Get first vendor detail (should only be one)

    // Validate required fields
    if (!vendorDetail.email) {
      message.error('Vendor email is required');
      return;
    }
    if (!vendorDetail.phone) {
      message.error('Vendor phone is required');
      return;
    }
    if (!vendorDetail.phone.startsWith('+62')) {
      message.error('Phone number must start with +62');
      return;
    }

    setSyncing(true);
    try {
      message.loading({ content: 'Syncing vendor to external API...', key: 'sync', duration: 0 });
      
      const result = await syncVendorToExternalApi(accountId);
      
      // Handle response structure
      let syncResult = result;
      if (result && result.success && result.data) {
        syncResult = result.data;
      }
      
      if (syncResult && syncResult.success !== false) {
        message.success({
          content: syncResult.message || 'Vendor synced successfully',
          key: 'sync',
          duration: 5,
        });
        
        // Refresh vendor details to get updated vendor_uuid_be
        await fetchVendorDetails();
      } else {
        message.error({
          content: syncResult?.error || syncResult?.message || 'Failed to sync vendor',
          key: 'sync',
          duration: 5,
        });
      }
    } catch (error) {
      console.error('Sync vendor error:', error);
      
      let errorMessage = 'Failed to sync vendor to external API';
      if (error.response) {
        const errorData = error.response.data;
        if (errorData) {
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : errorData.error.message || errorMessage;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error({
        content: errorMessage,
        key: 'sync',
        duration: 5,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelEdit = () => {
    activeForm.setFieldsValue({
      vendor_vendor_type: undefined,
      vendor_vendor_classification: undefined,
      vendor_vendor_rating: undefined,
      vendor_tax_id: undefined,
      vendor_email: undefined,
      vendor_phone: undefined,
      vendor_contract_start_date: undefined,
      vendor_contract_end_date: undefined,
      vendor_payment_terms: undefined,
      vendor_delivery_terms: undefined,
      vendor_certification: undefined,
    });
    setEditingVendor(null);
  };

  // Define table columns for vendor details with useMemo to prevent recreation
  const vendorColumns = useMemo(() => [
    {
      title: 'Vendor Type',
      dataIndex: 'vendor_type',
      key: 'vendor_type',
      render: (types) => {
        if (!types) return '-';
        const typeArray = Array.isArray(types) ? types : [types];
        return typeArray.length > 0 ? typeArray.join(', ') : '-';
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
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

  // Memoized select options to prevent recreation - Updated to match requirements
  const vendorTypeOptions = useMemo(() => [
    { value: "PJPUR", label: "PJPUR" },
    { value: "Gateway", label: "Gateway" },
    { value: "Supplier", label: "Supplier" },
    { value: "Maintenance", label: "Maintenance" }
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
          <Button 
            type="primary"
            icon={<ApiOutlined />} 
            onClick={handleSyncVendorToExternalApi}
            loading={syncing}
            disabled={!vendorDetails || vendorDetails.length === 0}
            title="Sync vendor to external API"
          >
            Sync to External API
          </Button>
        </Space>
      }
    >
      {/* Add/Edit Form - Remove Form wrapper to avoid nested forms */}
      <div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_vendor_type"
              label="Vendor Type"
              rules={[{ required: false, message: 'Please select at least one vendor type' }]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Select 
                mode="multiple"
                placeholder="Select vendor types" 
                options={vendorTypeOptions}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vendor_vendor_classification"
              label="Vendor Classification"
            >
              <Select placeholder="Select vendor classification" options={vendorClassificationOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_email"
              label="Email"
              rules={[
                { required: false, message: 'Please enter vendor email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input placeholder="Enter vendor email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vendor_phone"
              label="Phone"
              rules={[
                { required: false, message: 'Please enter vendor phone' },
                {
                  validator: (_, value) => {
                    if (!value || value.startsWith('+62')) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Phone number must start with +62'));
                  }
                }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input placeholder="Enter vendor phone (e.g., +6281234567890)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_vendor_rating"
              label="Vendor Rating"
            >
              <Select placeholder="Select vendor rating" options={vendorRatingOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vendor_tax_id"
              label="Tax ID / NPWP"
            >
              <Input placeholder="Enter tax identification number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vendor_contract_start_date"
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
              name="vendor_contract_end_date"
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
              name="vendor_payment_terms"
              label="Payment Terms"
            >
              <Select placeholder="Select payment terms" options={paymentTermsOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vendor_delivery_terms"
              label="Delivery Terms"
            >
              <Select placeholder="Select delivery terms" options={deliveryTermsOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="vendor_certification"
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
      </div>

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
