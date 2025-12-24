import React, { useState } from 'react';
import { Button, Modal, Upload, message, Steps, Alert, Typography, Space } from 'antd';
import { UploadOutlined, FileExcelOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { createBulkPublishedPackageTiers } from '../../../../api/publishedPackageTierApi';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { Step } = Steps;
const { Text, Paragraph } = Typography;

export const MassUploadPackageTierButton = ({ onUploadSuccess }) => {
  const [visible, setVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      message.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // Parse CSV content
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain header and at least one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['min_value', 'max_value', 'amount', 'start_date', 'end_date'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Parse data
      const packageTiers = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const tierData = {
          min_value: parseFloat(values[headers.indexOf('min_value')]),
          max_value: parseFloat(values[headers.indexOf('max_value')]),
          amount: parseFloat(values[headers.indexOf('amount')]),
          start_date: values[headers.indexOf('start_date')],
          end_date: values[headers.indexOf('end_date')],
        };

        // Optional percentage
        const percentageIndex = headers.indexOf('percentage');
        if (percentageIndex >= 0 && values[percentageIndex]) {
          tierData.percentage = parseFloat(values[percentageIndex]);
        }

        packageTiers.push(tierData);
      }
      
      // For this use case, we'll just pass the data to the parent for form integration
      // Instead of saving to database immediately
      setUploadResult({ data: packageTiers, success: packageTiers.length });
      setCurrentStep(2);

      if (onUploadSuccess) {
        onUploadSuccess(packageTiers);
      }

      message.success(`Successfully parsed ${packageTiers.length} package tiers`);

    } catch (error) {
      console.error('Upload error:', error);
      message.error(`Failed to process file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      'min_value,max_value,amount,percentage,start_date,end_date',
      '100000,500000,25000,2.5,2025-01-01,2025-12-31',
      '500001,1000000,50000,3.0,2025-01-01,2025-12-31',
      '1000001,5000000,100000,3.5,2025-01-01,2025-12-31'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'package_tier_template.csv';
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
      if (!file.name.toLowerCase().endsWith('.csv')) {
        message.error('Please upload a CSV file only');
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        message.error('File size must be less than 10MB');
        return false;
      }

      setFile(file);
      return false;
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
    setVisible(false);
  };

  const renderInstructions = () => (
    <div>
      <Alert
        message="Package Tier Upload Instructions"
        description={
          <div>
            <Paragraph>
              <strong>Before you start:</strong>
            </Paragraph>
            <ol>
              <li>Download the CSV template to see the required format</li>
              <li>Fill in your package tier data following the template structure</li>
              <li>Ensure all date formats are YYYY-MM-DD</li>
              <li>Upload the completed CSV file</li>
            </ol>
            
            <div>
              <Text strong>Required Fields:</Text> min_value, max_value, amount, start_date, end_date<br />
              <Text strong>Optional Fields:</Text> percentage<br />
              <Text strong>Date Format:</Text> YYYY-MM-DD (e.g., 2025-01-01)
            </div>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Space>
        <Button 
          type="primary" 
          icon={<UploadOutlined />}
          onClick={handleDownloadTemplate}
        >
          Download Template
        </Button>
        <Button type="default" onClick={() => setCurrentStep(1)}>
          Continue to Upload
        </Button>
      </Space>
    </div>
  );

  const renderUploadStep = () => (
    <div>
      <Dragger {...uploadProps} style={{ marginBottom: 24 }}>
        <p className="ant-upload-drag-icon">
          <FileExcelOutlined style={{ fontSize: 48, color: '#e53e3e' }} />
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

      <Space>
        <Button onClick={() => setCurrentStep(0)}>Back</Button>
        <Button
          type="primary"
          onClick={handleUpload}
          loading={uploading}
          disabled={!file}
        >
          {uploading ? 'Processing...' : 'Process File'}
        </Button>
      </Space>
    </div>
  );

  const renderResultsStep = () => {
    if (!uploadResult) return null;

    return (
      <div>
        <Alert
          message="Upload Successful"
          description={`Successfully processed ${uploadResult.success} package tiers. They have been added to your form.`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Space>
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
    <>
      <Button 
        type="default" 
        size="small"
        icon={<UploadOutlined />}
        onClick={() => setVisible(true)}
      >
        Upload CSV
      </Button>

      <Modal
        title="Upload Package Tiers from CSV"
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Instructions" icon={<InfoCircleOutlined />} />
          <Step title="Upload" icon={<UploadOutlined />} />
          <Step title="Results" icon={<CheckCircleOutlined />} />
        </Steps>

        {steps[currentStep].content}
      </Modal>
    </>
  );
};
