import React, { useState, useEffect } from 'react';
import {
  Modal, Upload, Button, Alert, Progress, Table, Typography,
  Divider, Space, Card, List, Statistic, Row, Col, message,
  Tabs, Collapse, Tag, Tooltip, Steps
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, FileExcelOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
  WarningOutlined, EyeOutlined
} from '@ant-design/icons';
import { 
  massUploadAccounts, 
  downloadAccountTemplate, 
  getAccountLookupData 
} from '../../../api/accountApi';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

const MassUploadAccount = ({ visible, onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Instructions, 1: Upload, 2: Results
  const [lookupData, setLookupData] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Fetch lookup data when modal opens
  useEffect(() => {
    if (visible) {
      fetchLookupData();
    }
  }, [visible]);

  const fetchLookupData = async () => {
    setLoadingLookup(true);
    try {
      const data = await getAccountLookupData();
      setLookupData(data);
    } catch (error) {
      console.error('Error fetching lookup data:', error);
      message.warning('Could not load reference data');
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      message.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await massUploadAccounts(formData);
      setUploadResult(result);
      setCurrentStep(2);

      // Show appropriate messages
      if (result.successCount > 0) {
        message.success(`Successfully uploaded ${result.successCount} accounts`);
        if (onSuccess) onSuccess();
      }

      if (result.errorCount > 0) {
        message.warning(`${result.errorCount} accounts failed to upload`);
      }

      if (result.warnings && result.warnings.length > 0) {
        message.info(`Upload completed with ${result.warnings.length} warnings`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      message.error(`Failed to upload file: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadAccountTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'account_upload_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Template downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download template');
    }
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
    setLookupData(null);
    onClose();
  };

const renderInstructions = () => (
    <div>
        <Alert
            message="Mass Upload Instructions"
            description={
                <div>
                    <Paragraph>
                        <strong>Before you start:</strong>
                    </Paragraph>
                    <ol>
                        <li>Download the CSV template to see the required format</li>
                        <li>Fill in your account data following the template structure</li>
                        <li>Ensure all referenced data exists in the system (see Reference Data tab)</li>
                        <li>Parent accounts must be listed before child accounts in your CSV</li>
                        <li>Upload the completed CSV file</li>
                    </ol>
                    
                    <Divider orientation="left" plain>Field Requirements</Divider>
                    <ul>
                        <li><Text strong>Required:</Text> name</li>
                        <li><Text strong>Optional:</Text> brand_name, parent_account_name, industry_name, type_of_business_name, type_of_business_detail, account_type_name, account_category_names, is_active</li>
                        <li><Text strong>Special:</Text> type_of_business_detail is required only when type_of_business_name is "Other"</li>
                        <li><Text strong>Multiple values:</Text> account_category_names should be comma-separated (e.g., "Premium,Corporate")</li>
                        <li><Text strong>Boolean:</Text> is_active accepts true/false, 1/0, yes/no (default: true)</li>
                    </ul>

                    <Divider orientation="left" plain>Important Notes</Divider>
                    <ul>
                        <li>Account names must be unique across the system</li>
                        <li>Parent accounts must exist before creating child accounts</li>
                        <li>The system will auto-generate account numbers</li>
                        <li>All referenced data (industries, types, categories) must exist in the system</li>
                    </ul>
                </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
        />

        <Card title="Step 1: Download Template" style={{ marginBottom: 16 }}>
            <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                size="large"
            >
                Download CSV Template
            </Button>
            <Text type="secondary" style={{ marginLeft: 16 }}>
                Get the template with sample data and proper format
            </Text>
        </Card>

        <Card title="Step 2: Check Reference Data">
            {renderReferenceData()}
        </Card>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button
                type="primary"
                size="large"
                onClick={() => setCurrentStep(1)}
            >
                Next: Upload File
            </Button>
        </div>
    </div>
);

  const renderReferenceData = () => {
    if (loadingLookup) {
      return <div style={{ textAlign: 'center', padding: 20 }}>Loading reference data...</div>;
    }

    if (!lookupData) {
      return <div style={{ textAlign: 'center', padding: 20 }}>No reference data available</div>;
    }

    return (
      <Collapse size="small">
        <Panel header={`Industries (${lookupData.industries?.length || 0})`} key="industries">
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {lookupData.industries?.map(item => (
              <Tag key={item.id} style={{ margin: 2 }}>{item.name}</Tag>
            ))}
          </div>
        </Panel>
        
        <Panel header={`Type of Business (${lookupData.typeOfBusinesses?.length || 0})`} key="typeOfBusiness">
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {lookupData.typeOfBusinesses?.map(item => (
              <Tag 
                key={item.id} 
                color={item.is_other ? 'orange' : 'red'} 
                style={{ margin: 2 }}
              >
                {item.name} {item.is_other && '(Other - requires detail)'}
              </Tag>
            ))}
          </div>
        </Panel>
        
        <Panel header={`Account Types (${lookupData.accountTypes?.length || 0})`} key="accountTypes">
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {lookupData.accountTypes?.map(item => (
              <Tag key={item.id} style={{ margin: 2 }}>{item.name}</Tag>
            ))}
          </div>
        </Panel>
        
        <Panel header={`Account Categories (${lookupData.accountCategories?.length || 0})`} key="accountCategories">
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {lookupData.accountCategories?.map(item => (
              <Tag key={item.id} style={{ margin: 2 }}>{item.name}</Tag>
            ))}
          </div>
        </Panel>
        
        <Panel header={`Existing Accounts (${lookupData.accounts?.length || 0}) - for Parent Reference`} key="accounts">
          <div style={{ maxHeight: 150, overflowY: 'auto' }}>
            {lookupData.accounts?.slice(0, 20).map(item => (
              <Tag key={item.id} color="green" style={{ margin: 2 }}>{item.name}</Tag>
            ))}
            {lookupData.accounts?.length > 20 && (
              <Text type="secondary">... and {lookupData.accounts.length - 20} more</Text>
            )}
          </div>
        </Panel>
      </Collapse>
    );
  };

  const renderUploadStep = () => (
    <div>
      <Card title="Upload CSV File" style={{ marginBottom: 16 }}>
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
          {uploading ? 'Uploading...' : 'Upload Accounts'}
        </Button>
      </Space>
    </div>
  );

  const renderResultsStep = () => {
    if (!uploadResult) return null;

    const { totalRows, successCount, errorCount, errors, successfulAccounts, warnings } = uploadResult;

    return (
      <div>
        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Rows"
                value={totalRows}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Successful"
                value={successCount}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Failed"
                value={errorCount}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={totalRows > 0 ? Math.round((successCount / totalRows) * 100) : 0}
                suffix="%"
                valueStyle={{ color: successCount === totalRows ? '#3f8600' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Progress Bar */}
        <Progress
          percent={totalRows > 0 ? Math.round((successCount / totalRows) * 100) : 0}
          status={errorCount > 0 ? 'exception' : 'success'}
          format={(percent) => `${successCount}/${totalRows} accounts created`}
          style={{ marginBottom: 24 }}
        />

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <Alert
            message={`${warnings.length} Warning(s)`}
            description={
              <List
                size="small"
                dataSource={warnings}
                renderItem={(warning) => (
                  <List.Item>
                    <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <Text>{warning}</Text>
                  </List.Item>
                )}
              />
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Success Details */}
        {successCount > 0 && (
          <Card 
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                Successfully Created Accounts ({successCount})
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <List
              size="small"
              dataSource={successfulAccounts}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Text strong>Row {item.row}:</Text>
                    <Text>{item.account.name}</Text>
                    {item.account.brand_name && (
                      <Text type="secondary">({item.account.brand_name})</Text>
                    )}
                    <Tag>{item.account.account_no}</Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Error Details */}
        {errorCount > 0 && (
          <Card 
            title={
              <Space>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                Errors ({errorCount})
              </Space>
            }
            type="inner"
          >
            <List
              size="small"
              dataSource={errors}
              renderItem={(error) => (
                <List.Item>
                  <Text type="danger">{error}</Text>
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Action Buttons */}
        <Space style={{ marginTop: 24 }}>
          <Button onClick={() => { setCurrentStep(1); setUploadResult(null); }}>
            Upload Another File
          </Button>
          <Button type="primary" onClick={handleClose}>Close</Button>
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
          Mass Upload Accounts
          {currentStep === 2 && uploadResult && (
            <Tag color={uploadResult.errorCount === 0 ? 'success' : 'warning'}>
              {uploadResult.successCount}/{uploadResult.totalRows} Success
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={1000}
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

export default MassUploadAccount;