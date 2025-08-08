import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Space, Popconfirm, message,
  Card, Row, Col, Upload, Divider, Select, InputNumber
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  DownloadOutlined, SearchOutlined
} from '@ant-design/icons';
import axiosInstance from '../../../config/axiosInstance';

const { Option } = Select;

const PostalCodeMaster = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchParams, setSearchParams] = useState({});

  // Load data
  const loadData = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/postalcode', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          ...searchParams,
          ...params,
        }
      });

      if (response.data && response.data.success) {
        setData(response.data.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.total || 0,
          current: response.data.data.page || 1,
        }));
      }
    } catch (error) {
      console.error('Error loading postal codes:', error);
      message.error('Failed to load postal codes');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const handleTableChange = (paginationInfo) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    }));
    loadData({
      page: paginationInfo.current,
      limit: paginationInfo.pageSize,
    });
  };

  const handleSearch = async () => {
    try {
      const values = await searchForm.validateFields();
      setSearchParams(values);
      setPagination(prev => ({ ...prev, current: 1 }));
      loadData({ ...values, page: 1 });
    } catch (error) {
      console.error('Search validation failed:', error);
    }
  };

  const handleResetSearch = () => {
    searchForm.resetFields();
    setSearchParams({});
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData({ page: 1 });
  };

  const showModal = (record) => {
    setEditingRecord(record || null);
    form.resetFields();
    if (record) {
      form.setFieldsValue(record);
    }
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingRecord) {
        // Update
        await axiosInstance.patch(`/postalcode/${editingRecord.id}`, values);
        message.success('Postal code updated successfully');
      } else {
        // Create
        await axiosInstance.post('/postalcode', values);
        message.success('Postal code created successfully');
      }

      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('Error saving postal code:', error);
      message.error('Failed to save postal code');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/postalcode/${id}`);
      message.success('Postal code deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting postal code:', error);
      message.error('Failed to delete postal code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Country,Province,City,District,Sub District,Postal Code\n" +
                      "INDONESIA,DKI JAKARTA,JAKARTA PUSAT,GAMBIR,GAMBIR,10110\n" +
                      "INDONESIA,DKI JAKARTA,JAKARTA PUSAT,GAMBIR,KEBON KELAPA,10120\n" +
                      "INDONESIA,JAWA BARAT,BANDUNG,BANDUNG KOTA,BABAKAN CIAMIS,40117";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'postal_code_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    message.success('Template downloaded successfully');
  };

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get('/postalcode/export/csv', {
        params: searchParams,
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `postal_codes_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      message.error('Failed to export data');
    }
  };

  const handleImport = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axiosInstance.post('/postalcode/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.success) {
        message.success(`Import completed successfully. Imported: ${response.data.imported} records`);
        if (response.data.errors && response.data.errors.length > 0) {
          console.warn('Import errors:', response.data.errors);
          message.warning(`Some records had errors. Check console for details.`);
        }
      }
      
      loadData();
    } catch (error) {
      console.error('Error importing data:', error);
      message.error('Failed to import data');
    } finally {
      setLoading(false);
    }

    return false; // Prevent default upload behavior
  };

  const columns = [
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      sorter: true,
      width: 120,
    },
    {
      title: 'Province',
      dataIndex: 'province',
      key: 'province',
      sorter: true,
      width: 150,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      sorter: true,
      width: 150,
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
      sorter: true,
      width: 150,
    },
    {
      title: 'Sub District',
      dataIndex: 'sub_district',
      key: 'sub_district',
      sorter: true,
      width: 150,
    },
    {
      title: 'Postal Code',
      dataIndex: 'postal_code',
      key: 'postal_code',
      sorter: true,
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this postal code?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="Postal Code Master Data" style={{ marginBottom: 16 }}>
        {/* Search Section */}
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="country" label="Country">
            <Input placeholder="Search by country" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="province" label="Province">
            <Input placeholder="Search by province" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="city" label="City">
            <Input placeholder="Search by city" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="postal_code" label="Postal Code">
            <Input placeholder="Search by postal code" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button onClick={handleResetSearch}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        {/* Action Buttons */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
            >
              Add Postal Code
            </Button>
          </Col>
          <Col>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </Col>
          <Col>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </Col>
          <Col>
            <Upload
              beforeUpload={handleImport}
              accept=".csv,.xlsx,.xls"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                Import CSV
              </Button>
            </Upload>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal for Add/Edit */}
      <Modal
        title={editingRecord ? 'Edit Postal Code' : 'Add Postal Code'}
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleSave}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please enter country' }]}
              >
                <Input placeholder="Enter country" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="province"
                label="Province"
                rules={[{ required: true, message: 'Please enter province' }]}
              >
                <Input placeholder="Enter province" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="district"
                label="District"
                rules={[{ required: true, message: 'Please enter district' }]}
              >
                <Input placeholder="Enter district" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sub_district"
                label="Sub District"
                rules={[{ required: true, message: 'Please enter sub district' }]}
              >
                <Input placeholder="Enter sub district" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="postal_code"
                label="Postal Code"
                rules={[{ required: true, message: 'Please enter postal code' }]}
              >
                <Input placeholder="Enter postal code" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PostalCodeMaster;
