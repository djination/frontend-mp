import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Input, Select, Space, Card, 
  message, Tooltip, Popconfirm, Switch, Modal, Upload, Progress
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';

// Import API
import { getIndustries, createIndustry, updateIndustry, deleteIndustry, bulkCreateIndustries } from '../../api/industryApi';

const MasterIndustry = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [csvUploadModalVisible, setCsvUploadModalVisible] = useState(false);
  const [uploadedData, setUploadedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch initial data
  useEffect(() => {
    console.log('MasterIndustry component mounted, calling fetchIndustries');
    fetchIndustries();
  }, []);

  const fetchIndustries = async (params = {}, paginationParams = null) => {
    setLoading(true);
    try {
      const currentPagination = paginationParams || pagination;
      const queryParams = {
        page: params.page || currentPagination.current,
        limit: params.limit || currentPagination.pageSize,
        ...params
      };
      
      console.log('Fetching industries with params:', queryParams);
      const response = await getIndustries(queryParams);
      console.log('API Response:', response);
      
      // Handle the wrapped response format: {success: true, data: {data: [...], meta: {...}}}
      if (response && response.success && response.data) {
        const responseData = response.data;
        
        if (responseData.data && Array.isArray(responseData.data)) {
          console.log('Setting data:', responseData.data.length, 'items');
          setData(responseData.data);
          
          if (responseData.meta) {
            const newPagination = {
              current: queryParams.page,
              pageSize: queryParams.limit,
              total: responseData.meta.total || responseData.data.length,
            };
            console.log('Setting pagination:', newPagination);
            setPagination(newPagination);
          } else {
            const newPagination = {
              current: queryParams.page,
              pageSize: queryParams.limit,
              total: responseData.data.length,
            };
            console.log('Setting pagination (no meta):', newPagination);
            setPagination(newPagination);
          }
        } else {
          console.log('No data array in response.data:', responseData);
          setData([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
          }));
        }
      } else if (response && response.data && Array.isArray(response.data)) {
        // Fallback: direct data array format
        console.log('Direct data array format:', response.data.length, 'items');
        setData(response.data);
        
        if (response.meta) {
          const newPagination = {
            current: queryParams.page,
            pageSize: queryParams.limit,
            total: response.meta.total || response.data.length,
          };
          setPagination(newPagination);
        } else {
          const newPagination = {
            current: queryParams.page,
            pageSize: queryParams.limit,
            total: response.data.length,
          };
          setPagination(newPagination);
        }
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array (old format)
        console.log('Direct array response:', response.length, 'items');
        setData(response);
        const newPagination = {
          current: queryParams.page,
          pageSize: queryParams.limit,
          total: response.length,
        };
        setPagination(newPagination);
      } else {
        console.log('No valid data in response:', response);
        setData([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
        }));
      }
    } catch (error) {
      console.error('Fetch industries error:', error);
      message.error('Failed to fetch industries');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    const newPagination = {
      ...pagination,
      current: 1, // Reset to first page on search
    };
    setPagination(newPagination);
    fetchIndustries(values, newPagination);
  };

  const handleTableChange = (newPagination, filters, sorter) => {
    const searchParams = {
      ...form.getFieldsValue(),
      page: newPagination.current,
      limit: newPagination.pageSize,
      sort: sorter.field,
      order: sorter.order,
      ...filters,
    };
    
    setPagination(newPagination);
    fetchIndustries(searchParams, newPagination);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    editForm.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteIndustry(id);
      message.success('Industry deleted successfully');
      const searchParams = form.getFieldsValue();
      fetchIndustries(searchParams);
    } catch (error) {
      message.error('Failed to delete industry');
      console.error(error);
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      if (editingRecord) {
        await updateIndustry(editingRecord.id, values);
        message.success('Industry updated successfully');
      } else {
        await createIndustry(values);
        message.success('Industry created successfully');
      }
      
      setModalVisible(false);
      const searchParams = form.getFieldsValue();
      fetchIndustries(searchParams);
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('Failed to save industry');
      console.error(error);
    }
  };

  // CSV Upload Functions
  const handleCsvUpload = () => {
    setCsvUploadModalVisible(true);
    setUploadedData([]);
    setPreviewData([]);
  };

  const parseCSVData = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must contain at least header and one data row');
    }

    // Check if first line is header or data
    const firstLine = lines[0].trim();
    let headerLine = firstLine;
    let dataStartIndex = 1;
    
    // If first line doesn't contain 'code' as header, assume it's data and create default header
    if (!firstLine.toLowerCase().includes('code') || !firstLine.includes(';')) {
      headerLine = 'code;name;description';
      dataStartIndex = 0; // Start from first line as data
    }
    
    const headers = headerLine.split(';').map(h => h.trim().toLowerCase());
    const expectedHeaders = ['code', 'name', 'description'];
    
    // Check if all required headers exist
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const data = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Handle quoted fields and semicolons within quotes
      const values = [];
      let current = '';
      let inQuotes = false;
      
      // Remove leading quote if entire line starts with quote
      let processLine = line;
      if (processLine.startsWith('"') && !processLine.startsWith('""')) {
        processLine = processLine.substring(1);
      }
      if (processLine.endsWith('"') && !processLine.endsWith('""')) {
        processLine = processLine.substring(0, processLine.length - 1);
      }
      
      for (let j = 0; j < processLine.length; j++) {
        const char = processLine[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ';' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last field
      
      // Remove quotes from values if they exist
      const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));
      
      // If we only have one value and no semicolons, it might be incorrectly formatted
      if (values.length === 1 && cleanValues[0]) {
        // Try to split by common patterns like space or comma as fallback
        const fallbackSplit = cleanValues[0].split(/[,\s]+/);
        if (fallbackSplit.length >= 2) {
          cleanValues[0] = fallbackSplit[0]; // code
          cleanValues[1] = fallbackSplit.slice(1).join(' '); // name
          cleanValues[2] = cleanValues[2] || ''; // description
        }
      }
      
      // Pad with empty strings if not enough columns, or trim if too many
      while (cleanValues.length < headers.length) {
        cleanValues.push('');
      }
      if (cleanValues.length > headers.length) {
        cleanValues.splice(headers.length);
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = cleanValues[index] || '';
      });

      // Validate required fields
      if (!row.code || !row.name) {
        console.log(`Row ${i + 1} debug:`, { 
          original: line, 
          processed: processLine, 
          values: cleanValues, 
          row: row 
        });
        throw new Error(`Row ${i + 1}: Code and Name are required. Found: code="${row.code}", name="${row.name}"`);
      }

      // Validate field lengths
      if (row.code && row.code.length > 50) {
        throw new Error(`Row ${i + 1}: Code too long (${row.code.length} chars, max 50). Code: "${row.code.substring(0, 50)}..."`);
      }
      
      if (row.name && row.name.length > 255) {
        throw new Error(`Row ${i + 1}: Name too long (${row.name.length} chars, max 255). Name: "${row.name.substring(0, 50)}..."`);
      }

      // Add default values
      row.is_active = true;
      
      data.push(row);
    }

    return data;
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = parseCSVData(e.target.result);
        setUploadedData(csvData);
        setPreviewData(csvData.slice(0, 10)); // Show first 10 rows for preview
        
        if (csvData.length > 0) {
          alert(`CSV parsed successfully! Found ${csvData.length} valid records.`);
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        alert(`CSV parsing error: ${error.message}\n\nPlease check your CSV format:\n1. Use semicolon (;) as delimiter\n2. Include headers: code;name;description OR start directly with data\n3. Format each row as: code;name;description\n4. Remove empty lines at the end\n5. For descriptions with semicolons, wrap in quotes\n\nExample formats:\nWith header:\ncode;name;description\n1111;Pertanian Jagung;Description here\n\nWithout header (direct data):\n1111;Pertanian Jagung;Description here`);
        setUploadedData([]);
        setPreviewData([]);
      }
    };
    reader.readAsText(file);
    return false; // Prevent automatic upload
  };

  const handleBulkSave = async () => {
    if (uploadedData.length === 0) {
      alert('No data to upload');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    try {
      // Split data into chunks to avoid payload size limits
      const chunkSize = 100; // Upload 100 records at a time
      const chunks = [];
      for (let i = 0; i < uploadedData.length; i += chunkSize) {
        chunks.push(uploadedData.slice(i, i + chunkSize));
      }

      let totalSuccessCount = 0;
      let totalUpdateCount = 0;
      let totalCreateCount = 0;
      let totalErrorCount = 0;
      const allErrors = [];

      // Process each chunk
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        try {
          console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} items)`);
          
          // Update progress
          setUploadProgress(Math.round((chunkIndex / chunks.length) * 100));
          
          const result = await bulkCreateIndustries(chunk);
          
          if (result && result.success && result.results && Array.isArray(result.results)) {
            result.results.forEach((item) => {
              if (item && item.success) {
                totalSuccessCount++;
                if (item.action === 'updated') {
                  totalUpdateCount++;
                } else {
                  totalCreateCount++;
                }
              } else {
                totalErrorCount++;
                const itemCode = item?.item?.code || 'unknown';
                const errorMsg = item?.error || 'Unknown error';
                allErrors.push(`Row with code "${itemCode}": ${errorMsg}`);
              }
            });
          } else {
            totalErrorCount += chunk.length;
            allErrors.push(`Chunk ${chunkIndex + 1} failed: Invalid response format`);
          }
        } catch (chunkError) {
          console.error(`Chunk ${chunkIndex + 1} error:`, chunkError);
          totalErrorCount += chunk.length;
          allErrors.push(`Chunk ${chunkIndex + 1} error: ${chunkError.message}`);
        }
      }

      // Final progress
      setUploadProgress(100);

      // Show final results
      if (allErrors.length > 0) {
        alert(`Upload completed with some errors:\n- ${totalSuccessCount} records processed successfully (${totalCreateCount} created, ${totalUpdateCount} updated)\n- ${totalErrorCount} records failed\n\nErrors:\n${allErrors.slice(0, 5).join('\n')}${allErrors.length > 5 ? `\n... and ${allErrors.length - 5} more errors` : ''}`);
      } else {
        alert(`Successfully uploaded ${totalSuccessCount} industries\n- ${totalCreateCount} new records created\n- ${totalUpdateCount} existing records updated`);
      }
      
      setCsvUploadModalVisible(false);
      setUploadProgress(0);
      const searchParams = form.getFieldsValue();
      fetchIndustries(searchParams);
    } catch (error) {
      alert(`Bulk upload failed: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const csvTemplate = `code;name;description
TECH;Technology;Technology and software development industry
HEALTH;Healthcare;Healthcare and medical services industry
FINANCE;Finance;Financial services and banking industry
RETAIL;Retail;Retail and consumer goods industry
MANUFACTURING;Manufacturing;Manufacturing and production industry`;

    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'industry_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <span style={{ color: active ? 'green' : 'red' }}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this industry?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="Master Industry">
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item name="code" label="Code">
              <Input placeholder="Search by industry code" />
            </Form.Item>
            
            <Form.Item name="name" label="Name">
              <Input placeholder="Search by industry name" />
            </Form.Item>
            
            <Form.Item name="is_active" label="Status">
              <Select 
                placeholder="Select status"
                allowClear
                style={{ width: 200 }}
                options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' },
                ]}
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  htmlType="submit"
                >
                  Search
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Industry
                </Button>
                <Button 
                  type="default" 
                  icon={<UploadOutlined />}
                  onClick={handleCsvUpload}
                >
                  CSV Upload
                </Button>
                <Button 
                  type="default" 
                  icon={<DownloadOutlined />}
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
        
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRecord ? 'Edit Industry' : 'Add New Industry'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        okText={editingRecord ? 'Update' : 'Create'}
        confirmLoading={loading}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter industry code' }]}
          >
            <Input placeholder="Enter industry code" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter industry name' }]}
          >
            <Input placeholder="Enter industry name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter description"
            />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        title="CSV Upload - Mass Industry Creation"
        open={csvUploadModalVisible}
        onOk={handleBulkSave}
        onCancel={() => setCsvUploadModalVisible(false)}
        okText="Upload Data"
        confirmLoading={loading}
        width={800}
        okButtonProps={{ disabled: uploadedData.length === 0 }}
      >
        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Progress 
              percent={uploadProgress} 
              status={uploadProgress === 100 ? 'success' : 'active'}
              format={(percent) => `${percent}%`}
            />
            <p style={{ textAlign: 'center', marginTop: 8 }}>
              Uploading data in batches... {uploadProgress}% complete
            </p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <p><strong>CSV Format Requirements:</strong></p>
          <ul>
            <li>Required columns: <code>code</code>, <code>name</code>, <code>description</code></li>
            <li>Delimiter: Use semicolon <code>;</code> as separator</li>
            <li>Field length limits: Code (max 50 chars), Name (max 255 chars), Description (unlimited)</li>
            <li>Can include header row OR start directly with data</li>
            <li>All records will be set as active automatically</li>
            <li><strong>Smart Upload:</strong> Creates new records or updates existing ones based on code</li>
            <li>Remove empty lines at the end of file</li>
            <li>If description contains semicolon, wrap entire line in quotes</li>
            <li>Download template file for easier data entry:</li>
          </ul>
          
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={downloadTemplate}
            style={{ marginBottom: 12 }}
          >
            Download CSV Template
          </Button>
          
          <p><strong>Supported formats:</strong></p>
          <pre style={{ background: '#f5f5f5', padding: 8, fontSize: 12 }}>
{`Option 1 - With header:
code;name;description
1111;Pertanian Jagung;Description here
1112;Pertanian Gandum;Description here

Option 2 - Direct data (no header):
1111;Pertanian Jagung;Description here
1112;Pertanian Gandum;Description here

Option 3 - With quotes for long descriptions:
"1111;Pertanian Jagung;Long description with; semicolons"
"1112;Pertanian Gandum;Another description"`}
          </pre>
        </div>

        <Upload
          beforeUpload={handleFileUpload}
          accept=".csv"
          showUploadList={false}
          style={{ marginBottom: 16 }}
        >
          <Button icon={<UploadOutlined />}>Select CSV File</Button>
        </Upload>

        {previewData.length > 0 && (
          <div>
            <h4>Preview Data ({uploadedData.length} total records, showing first 10):</h4>
            <Table
              columns={[
                { title: 'Code', dataIndex: 'code', key: 'code' },
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: () => 'Active' },
              ]}
              dataSource={previewData}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MasterIndustry;