import React, { useState, useEffect } from 'react';
import {
  Modal, Upload, Button, Alert, Progress, Table, Typography,
  Divider, Space, Card, message, Steps, Tag
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, FileExcelOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { uploadPublishedPackageTiers } from '../api/publishedPackageTierApi';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Step } = Steps;

const MassUploadPublishedPackageTier = ({ visible, onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Instructions, 1: Upload, 2: Results

  const handleUpload = async () => {
    if (!file) {
      message.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('=== Frontend Upload Debug ===');
      console.log('File to upload:', file.name, file.size);
      
      const result = await uploadPublishedPackageTiers(formData);
      console.log('Upload result received:', result);
      
      setUploadResult(result);
      setCurrentStep(2);

      // Show appropriate messages
      if (result.success > 0) {
        message.success(`Successfully uploaded ${result.success} published package tiers`);
        console.log('=== Calling onSuccess callback ===');
        if (onSuccess) {
          console.log('onSuccess callback exists, calling it...');
          onSuccess();
        } else {
          console.log('onSuccess callback is not provided');
        }
      }

      if (result.errors && result.errors.length > 0) {
        message.warning(`${result.errors.length} rows failed to upload`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      message.error(`Failed to upload file: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content with flexible date format
    const csvContent = [
      'min_value,max_value,amount,percentage,start_date,end_date',
      '100000,500000,25000,2.5,1/1/2025,12/31/2025',
      '500001,1000000,50000,3.0,1/1/2025,12/31/2025',
      '1000001,5000000,100000,3.5,1/1/2025,12/31/2025'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'published_package_tier_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    message.success('Template downloaded successfully');
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    beforeUpload: (file) => {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        message.error('Please upload a CSV file only');
        return false;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        message.error('File size must be less than 10MB');
        return false;
      }

      setFile(file);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFile(null);
    },
    fileList: file ? [file] : [],
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    setCurrentStep(0);
    onClose();
  };

  const renderInstructions = () => (
    <div>
      <Alert
        message="Published Package Tier Upload Instructions"
        description={
          <div>
            <Paragraph>
              <strong>Before you start:</strong>
            </Paragraph>
            <ol>
              <li>Download the CSV template to see the required format</li>
              <li>Fill in your published package tier data following the template structure</li>
              <li>Ensure date formats are either MM/DD/YYYY or YYYY-MM-DD</li>
              <li>Upload the completed CSV file</li>
            </ol>
            
            <Divider orientation="left" plain>Field Requirements</Divider>
            <ul>
              <li><Text strong>Required:</Text> min_value, max_value, amount, start_date, end_date</li>
              <li><Text strong>Optional:</Text> percentage</li>
              <li><Text strong>Date Format:</Text> MM/DD/YYYY or YYYY-MM-DD (e.g., 1/1/2025 or 2025-01-01)</li>
              <li><Text strong>Number Format:</Text> Use decimal values (e.g., 100000.50)</li>
            </ul>
            
            <Divider orientation="left" plain>Validation Rules</Divider>
            <ul>
              <li>min_value must be less than max_value</li>
              <li>start_date must be before end_date</li>
              <li>No overlapping value ranges for the same time period</li>
              <li>All values must be positive numbers</li>
              <li>Percentage must be between 0 and 100 (if provided)</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={handleDownloadTemplate}
        >
          Download CSV Template
        </Button>
        <Button type="default" onClick={() => setCurrentStep(1)}>
          Continue to Upload
        </Button>
      </Space>
    </div>
  );

  const renderUploadStep = () => (
    <div>
      <Card title="Upload CSV File" style={{ marginBottom: 16 }}>
        <Dragger {...uploadProps} style={{ marginBottom: 24 }}>
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Click or drag CSV file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for CSV files only. Maximum file size: 10MB
          </p>
        </Dragger>

        {file && (
          <Alert
            message={`Selected file: ${file.name}`}
            description={`Size: ${(file.size / 1024).toFixed(2)} KB`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </Card>

      <Space>
        <Button onClick={() => setCurrentStep(0)}>Back to Instructions</Button>
        <Button
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={!file}
          icon={<UploadOutlined />}
        >
          {uploading ? 'Uploading...' : 'Upload Published Package Tiers'}
        </Button>
      </Space>
    </div>
  );

  const renderResultsStep = () => {
    if (!uploadResult) return null;

    const { success, errors } = uploadResult;

    return (
      <div>
        {/* Statistics */}
        <Card title="Upload Summary" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {success}
              </div>
              <div>Successful</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                {errors ? errors.length : 0}
              </div>
              <div>Failed</div>
            </div>
          </div>
        </Card>

        {/* Errors */}
        {errors && errors.length > 0 && (
          <Card title="Errors" style={{ marginBottom: 24 }}>
            <Alert
              message={`${errors.length} errors occurred during upload`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {errors.map((error, index) => (
                <div key={index} style={{ padding: 4, borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="danger">{error}</Text>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Space>
          <Button onClick={() => setCurrentStep(0)}>Upload More</Button>
          <Button type="primary" onClick={handleClose}>
            Close
          </Button>
        </Space>
      </div>
    );
  };

  const steps = [
    {
      title: 'Instructions',
      content: renderInstructions(),
    },
    {
      title: 'Upload File',
      content: renderUploadStep(),
    },
    {
      title: 'Results',
      content: renderResultsStep(),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined />
          Mass Upload Published Package Tiers
          {currentStep === 2 && uploadResult && (
            <Tag color={uploadResult.errors?.length === 0 ? 'success' : 'warning'}>
              {uploadResult.success} Success
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnHidden
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Instructions" icon={<InfoCircleOutlined />} />
        <Step title="Upload" icon={<UploadOutlined />} />
        <Step title="Results" icon={<CheckCircleOutlined />} />
      </Steps>

      {steps[currentStep].content}
    </Modal>
  );
};

export default MassUploadPublishedPackageTier;
