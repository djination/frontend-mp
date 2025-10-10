import React, { useState } from 'react';
import { Modal, Tabs, Card, Tag, Alert, Button, Space, Typography, Collapse, Row, Col, Statistic, Divider, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
  EyeOutlined,
  BugOutlined
} from '@ant-design/icons';
import { validateCustomerCommandData, formatDataForPreview, generateDebugReport } from '../utils/debugUtils';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

/**
 * Modal untuk debug dan preview data sebelum hit ke external API
 */
const DebugDataModal = ({ 
  visible, 
  onClose, 
  originalData, 
  transformedData, 
  onConfirmSend = null,
  showSendButton = true 
}) => {
  const [activeTab, setActiveTab] = useState('validation');
  const [validationResult, setValidationResult] = useState(null);
  const [debugReport, setDebugReport] = useState(null);

  React.useEffect(() => {
    if (visible && transformedData) {
      // Run validation
      const validation = validateCustomerCommandData(transformedData);
      setValidationResult(validation);
      
      // Generate debug report
      const report = generateDebugReport(originalData, transformedData, validation);
      setDebugReport(report);
    }
  }, [visible, transformedData, originalData]);

  const handleCopyToClipboard = (data) => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      // You could add a notification here
      console.log('Data copied to clipboard');
    });
  };

  const handleDownloadData = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderValidationTab = () => {
    if (!validationResult) return <div>Loading validation...</div>;

    const { isValid, errors, warnings, summary } = validationResult;

    return (
      <div>
        {/* Summary Statistics */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Validation Status"
                value={summary.dataIntegrity}
                valueStyle={{ 
                  color: isValid ? '#52c41a' : '#ff4d4f',
                  fontSize: 16,
                  fontWeight: 'bold'
                }}
                prefix={isValid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Errors"
                value={summary.totalErrors}
                valueStyle={{ color: summary.totalErrors > 0 ? '#ff4d4f' : '#52c41a' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Warnings"
                value={summary.totalWarnings}
                valueStyle={{ color: summary.totalWarnings > 0 ? '#faad14' : '#52c41a' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Critical Issues"
                value={summary.criticalIssues}
                valueStyle={{ color: summary.criticalIssues > 0 ? '#ff4d4f' : '#52c41a' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Validation Results */}
        {errors.length > 0 && (
          <Alert
            message="Validation Errors"
            description={
              <div>
                <Text strong>Data tidak dapat dikirim karena terdapat error berikut:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  {errors.map((error, index) => (
                    <li key={index}><Text type="danger">{error}</Text></li>
                  ))}
                </ul>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {warnings.length > 0 && (
          <Alert
            message="Validation Warnings"
            description={
              <div>
                <Text>Data dapat dikirim namun ada beberapa field yang perlu diperhatikan:</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  {warnings.map((warning, index) => (
                    <li key={index}><Text type="warning">{warning}</Text></li>
                  ))}
                </ul>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {isValid && errors.length === 0 && warnings.length === 0 && (
          <Alert
            message="Data Valid"
            description="Semua data sudah sesuai format dan siap untuk dikirim ke external API."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Recommendations */}
        {debugReport?.recommendations && debugReport.recommendations.length > 0 && (
          <Card title="Rekomendasi" size="small" style={{ marginBottom: 16 }}>
            {debugReport.recommendations.map((rec, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Text>{rec}</Text>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  };

  const renderPreviewTab = () => {
    const preview = formatDataForPreview(transformedData);
    
    if (!preview) return <div>No data to preview</div>;

    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<CopyOutlined />} 
            onClick={() => handleCopyToClipboard(transformedData)}
          >
            Copy Raw Data
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => handleDownloadData(transformedData, 'customer-command-data.json')}
          >
            Download JSON
          </Button>
        </Space>

        <Collapse defaultActiveKey={['customer', 'tier', 'crew']}>
          <Panel header={`Customer Info ${preview.customer.name !== 'N/A' ? `- ${preview.customer.name}` : ''}`} key="customer">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Name:</Text> {preview.customer.name}
              </Col>
              <Col span={12}>
                <Text strong>Email:</Text> {preview.customer.email}
              </Col>
              <Col span={12}>
                <Text strong>Phone:</Text> {preview.customer.msisdn}
              </Col>
              <Col span={12}>
                <Text strong>Role:</Text> {preview.customer.customer_role}
              </Col>
              <Col span={12}>
                <Text strong>Type:</Text> {preview.customer.customer_type}
              </Col>
              <Col span={12}>
                <Text strong>KTP:</Text> {preview.customer.ktp}
              </Col>
              <Col span={24}>
                <Text strong>Address:</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                  {preview.customer.address.building} {preview.customer.address.street}<br />
                  {preview.customer.address.region}, {preview.customer.address.city}<br />
                  {preview.customer.address.state}, {preview.customer.address.country} {preview.customer.address.zip_code}
                </Paragraph>
              </Col>
            </Row>
          </Panel>

          <Panel header={`Tier Configuration (${preview.tier.count} items)`} key="tier">
            {preview.tier.items.length > 0 ? (
              preview.tier.items.map((tier, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Row gutter={[16, 8]}>
                    <Col span={8}>
                      <Text strong>Type:</Text> 
                      <Tag color={tier.type === 'nominal' ? 'blue' : 'green'} style={{ marginLeft: 4 }}>
                        {tier.type}
                      </Tag>
                    </Col>
                    <Col span={8}>
                      <Text strong>Category:</Text> {tier.category}
                    </Col>
                    <Col span={8}>
                      <Text strong>Fee:</Text> {tier.fee}
                    </Col>
                    <Col span={12}>
                      <Text strong>Min Amount:</Text> {tier.min_amount}
                    </Col>
                    <Col span={12}>
                      <Text strong>Max Amount:</Text> {tier.max_amount}
                    </Col>
                    <Col span={12}>
                      <Text strong>Valid From:</Text> {tier.valid_from}
                    </Col>
                    <Col span={12}>
                      <Text strong>Valid To:</Text> {tier.valid_to}
                    </Col>
                  </Row>
                </Card>
              ))
            ) : (
              <Text type="secondary">No tier configuration found</Text>
            )}
          </Panel>

          <Panel header={`Customer Crew (${preview.customerCrew.count} members)`} key="crew">
            {preview.customerCrew.items.length > 0 ? (
              preview.customerCrew.items.map((crew, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <Text strong>Name:</Text> {crew.name}
                    </Col>
                    <Col span={12}>
                      <Text strong>Email:</Text> {crew.email}
                    </Col>
                    <Col span={12}>
                      <Text strong>Phone:</Text> {crew.msisdn}
                    </Col>
                    <Col span={12}>
                      <Text strong>KTP:</Text> {crew.ktp}
                    </Col>
                  </Row>
                </Card>
              ))
            ) : (
              <Text type="secondary">No customer crew members found</Text>
            )}
          </Panel>

          <Panel header="Beneficiary Account" key="beneficiary">
            {preview.beneficiaryAccount ? (
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Name:</Text> {preview.beneficiaryAccount.name}
                </Col>
                <Col span={12}>
                  <Text strong>Account Number:</Text> {preview.beneficiaryAccount.account_number}
                </Col>
                <Col span={12}>
                  <Text strong>Bank ID:</Text> {preview.beneficiaryAccount.bank_id}
                </Col>
              </Row>
            ) : (
              <Text type="secondary">No beneficiary account configured</Text>
            )}
          </Panel>

          <Panel header="Branch Information" key="branch">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Name:</Text> {preview.branch.name}
              </Col>
              <Col span={12}>
                <Text strong>Code:</Text> {preview.branch.code}
              </Col>
              <Col span={24}>
                <Text strong>Address:</Text>
                <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                  {preview.branch.address.building} {preview.branch.address.street}<br />
                  {preview.branch.address.region}, {preview.branch.address.city}<br />
                  {preview.branch.address.state}, {preview.branch.address.country} {preview.branch.address.zip_code}
                </Paragraph>
              </Col>
            </Row>
          </Panel>
        </Collapse>

        <Divider />
        
        <Card title="Metadata" size="small">
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text strong>Timestamp:</Text> {preview.metadata.timestamp}
            </Col>
            <Col span={12}>
              <Text strong>Data Size:</Text> {preview.metadata.dataSize} bytes
            </Col>
            <Col span={12}>
              <Text strong>Auto Deduct:</Text> 
              <Badge 
                status={preview.metadata.hasAutoDeduct ? 'success' : 'default'} 
                text={preview.metadata.hasAutoDeduct ? 'Yes' : 'No'}
                style={{ marginLeft: 8 }}
              />
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  const renderRawDataTab = () => {
    return (
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<CopyOutlined />} 
            onClick={() => handleCopyToClipboard(transformedData)}
          >
            Copy Data
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => handleDownloadData(transformedData, 'transformed-data.json')}
          >
            Download Transformed
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => handleDownloadData(originalData, 'original-data.json')}
          >
            Download Original
          </Button>
        </Space>

        <Tabs defaultActiveKey="transformed">
          <TabPane tab="Transformed Data" key="transformed">
            <Card size="small">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 4, 
                maxHeight: 400, 
                overflow: 'auto',
                fontSize: 12
              }}>
                {JSON.stringify(transformedData, null, 2)}
              </pre>
            </Card>
          </TabPane>
          
          <TabPane tab="Original Data" key="original">
            <Card size="small">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 4, 
                maxHeight: 400, 
                overflow: 'auto',
                fontSize: 12
              }}>
                {JSON.stringify(originalData, null, 2)}
              </pre>
            </Card>
          </TabPane>

          <TabPane tab="Debug Report" key="report">
            <Card size="small">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: 16, 
                borderRadius: 4, 
                maxHeight: 400, 
                overflow: 'auto',
                fontSize: 12
              }}>
                {JSON.stringify(debugReport, null, 2)}
              </pre>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  const canSend = validationResult?.isValid === true;

  return (
    <Modal
      title={
        <Space>
          <BugOutlined />
          Debug Data - Preview & Validation
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ maxWidth: 1200 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        ...(showSendButton && onConfirmSend ? [
          <Button 
            key="send" 
            type="primary" 
            disabled={!canSend}
            onClick={() => {
              onConfirmSend(transformedData, validationResult);
              onClose();
            }}
            icon={canSend ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {canSend ? 'Send to External API' : 'Fix Errors First'}
          </Button>
        ] : [])
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <Space>
              <Badge count={validationResult?.errors?.length || 0} size="small">
                <CheckCircleOutlined />
              </Badge>
              Validation
            </Space>
          } 
          key="validation"
        >
          {renderValidationTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <EyeOutlined />
              Preview
            </Space>
          } 
          key="preview"
        >
          {renderPreviewTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <Space>
              <CodeOutlined />
              Raw Data
            </Space>
          } 
          key="raw"
        >
          {renderRawDataTab()}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default DebugDataModal;
