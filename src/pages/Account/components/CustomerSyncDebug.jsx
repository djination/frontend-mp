import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, Typography, Row, Col, Statistic, Tag, Divider, message } from 'antd';
import { 
  BugOutlined, 
  SendOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import DebugDataModal from '../../../components/DebugDataModal';
import { useCustomerDebug } from '../../../hooks/useCustomerDebug';

const { Title, Text, Paragraph } = Typography;

/**
 * Komponen untuk debug customer sync data di halaman Account
 */
const CustomerSyncDebug = ({ 
  accountData, 
  accountId, 
  userId,
  onSyncSuccess = null,
  onSyncError = null 
}) => {
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [lastDebugResult, setLastDebugResult] = useState(null);
  
  const { 
    debugData, 
    sendToAPI, 
    loading, 
    error, 
    canSend, 
    getValidationSummary,
    hasValidationIssues,
    hasWarnings,
    clearResults
  } = useCustomerDebug();

  // Auto debug saat accountData berubah
  useEffect(() => {
    if (accountData && Object.keys(accountData).length > 0) {
      console.log('🔄 Account data changed, running auto debug...');
      handleAutoDebug();
    }
  }, [accountData]);

  const handleAutoDebug = async () => {
    if (!accountData) return;

    try {
      const result = await debugData(accountData);
      if (result?.success) {
        setLastDebugResult(result);
        console.log('✅ Auto debug completed');
      }
    } catch (err) {
      console.error('❌ Auto debug failed:', err);
    }
  };

  const handleManualDebug = async () => {
    if (!accountData) {
      message.error('No account data available for debugging');
      return;
    }

    try {
      const result = await debugData(accountData);
      if (result?.success) {
        setDebugModalVisible(true);
        message.success('Debug completed successfully');
      } else {
        message.error('Debug failed: ' + (result?.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Manual debug error:', err);
      message.error('Debug failed: ' + err.message);
    }
  };

  const handleSendToAPI = async () => {
    if (!accountData) {
      message.error('No account data available for sending');
      return;
    }

    try {
      const result = await sendToAPI(accountData, null, userId, accountId, false);
      
      if (result?.success) {
        message.success('Customer data sent to external API successfully');
        onSyncSuccess?.(result);
      } else {
        message.error('Send failed: ' + (result?.error || 'Unknown error'));
        onSyncError?.(result);
      }
    } catch (err) {
      console.error('❌ Send to API error:', err);
      message.error('Send failed: ' + err.message);
      onSyncError?.(err);
    }
  };

  const handleDebugModalConfirm = async (transformedData, validationResult) => {
    if (!validationResult.isValid) {
      message.error('Cannot send data with validation errors. Please fix the issues first.');
      return;
    }

    try {
      const result = await sendToAPI(accountData, null, userId, accountId, false);
      
      if (result?.success) {
        message.success('Data sent to external API successfully');
        onSyncSuccess?.(result);
        setDebugModalVisible(false);
      } else {
        message.error('Send failed: ' + (result?.error || 'Unknown error'));
        onSyncError?.(result);
      }
    } catch (err) {
      console.error('❌ Send from debug modal error:', err);
      message.error('Send failed: ' + err.message);
      onSyncError?.(err);
    }
  };

  const validationSummary = getValidationSummary();

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          Customer Sync Debug
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      {/* Status Overview */}
      {lastDebugResult && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="Data Status"
              value={validationSummary?.dataIntegrity || 'UNKNOWN'}
              valueStyle={{ 
                color: validationSummary?.dataIntegrity === 'PASS' ? '#52c41a' : '#ff4d4f',
                fontSize: 14
              }}
              prefix={validationSummary?.dataIntegrity === 'PASS' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Errors"
              value={validationSummary?.errorCount || 0}
              valueStyle={{ color: (validationSummary?.errorCount || 0) > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Warnings"
              value={validationSummary?.warningCount || 0}
              valueStyle={{ color: (validationSummary?.warningCount || 0) > 0 ? '#faad14' : '#52c41a' }}
              prefix={<InfoCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Can Send"
              value={canSend() ? 'YES' : 'NO'}
              valueStyle={{ color: canSend() ? '#52c41a' : '#ff4d4f' }}
              prefix={canSend() ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Col>
        </Row>
      )}

      {/* Alerts */}
      {hasValidationIssues && (
        <Alert
          message="Validation Errors Detected"
          description="There are validation errors that must be fixed before sending data to external API."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {hasWarnings && !hasValidationIssues && (
        <Alert
          message="Validation Warnings"
          description="There are validation warnings. Data can be sent but consider fixing these issues for better data quality."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {lastDebugResult && !hasValidationIssues && !hasWarnings && (
        <Alert
          message="Data Ready"
          description="All validation checks passed. Data is ready to be sent to external API."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Action Buttons */}
      <Space>
        <Button
          type="default"
          icon={<EyeOutlined />}
          onClick={handleManualDebug}
          loading={loading}
          disabled={!accountData}
        >
          Preview Data
        </Button>

        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendToAPI}
          loading={loading}
          disabled={!accountData || !canSend()}
        >
          Send to External API
        </Button>

        <Button
          type="default"
          onClick={clearResults}
          disabled={!lastDebugResult}
        >
          Clear Results
        </Button>
      </Space>

      {/* Customer Info Summary */}
      {lastDebugResult?.transformedData && (
        <>
          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Customer:</Text> {lastDebugResult.transformedData.customer?.name || 'N/A'}
            </Col>
            <Col span={12}>
              <Text strong>Email:</Text> {lastDebugResult.transformedData.customer?.email || 'N/A'}
            </Col>
            <Col span={12}>
              <Text strong>Phone:</Text> {lastDebugResult.transformedData.customer?.msisdn || 'N/A'}
            </Col>
            <Col span={12}>
              <Text strong>Type:</Text> {lastDebugResult.transformedData.customer?.customer_type || 'N/A'}
            </Col>
            <Col span={12}>
              <Text strong>Tier Count:</Text> {lastDebugResult.transformedData.tier?.length || 0}
            </Col>
            <Col span={12}>
              <Text strong>Crew Count:</Text> {lastDebugResult.transformedData['customer-crew']?.length || 0}
            </Col>
            <Col span={24}>
              <Text strong>Has Beneficiary:</Text> 
              <Tag color={lastDebugResult.transformedData['beneficiary-account'] ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                {lastDebugResult.transformedData['beneficiary-account'] ? 'Yes' : 'No'}
              </Tag>
            </Col>
          </Row>
        </>
      )}

      {/* Debug Modal */}
      <DebugDataModal
        visible={debugModalVisible}
        onClose={() => setDebugModalVisible(false)}
        originalData={accountData}
        transformedData={lastDebugResult?.transformedData}
        onConfirmSend={handleDebugModalConfirm}
        showSendButton={true}
      />
    </Card>
  );
};

export default CustomerSyncDebug;
