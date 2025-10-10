import React, { useState } from 'react';
import { Card, Button, Space, Typography, Row, Col, message } from 'antd';
import { BugOutlined, SendOutlined } from '@ant-design/icons';
import CustomerDebugButton from '../components/CustomerDebugButton';
import DebugDataModal from '../components/DebugDataModal';
import { useCustomerDebug } from '../hooks/useCustomerDebug';
import { debugCustomerData } from '../utils/customerSyncUtils';

const { Title, Text } = Typography;

/**
 * Contoh implementasi sistem debug untuk customer data
 */
const DebugExample = () => {
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [debugResult, setDebugResult] = useState(null);

  // Sample account data untuk testing
  const sampleAccountData = {
    name: "PT. Contoh Customer",
    email: "customer@example.com",
    phone_no: "08123456789",
    account_no: "ACC001",
    no_ktp: "1234567890123456",
    no_npwp: "12.345.678.9-012.000",
    account_type: {
      name: "branch"
    },
    type_of_business_detail: "CORPORATE",
    parent_id: null,
    addresses: [{
      address1: "Jl. Contoh No. 123",
      address2: "RT 01/RW 02",
      sub_district: "Menteng",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      country: "Indonesia",
      postalcode: "10310",
      is_primary: true
    }],
    pics: [
      {
        name: "John Doe",
        email: "john@example.com",
        phone_no: "08123456789",
        no_ktp: "1234567890123456",
        is_owner: true
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone_no: "08123456788",
        no_ktp: "1234567890123457",
        is_owner: false
      }
    ],
    account_bank: [{
      bank_account_no: "1234567890",
      bank_account_holder_name: "PT. Contoh Customer",
      bank_account_holder_firstname: "PT.",
      bank_account_holder_lastname: "Contoh Customer",
      bank: {
        uuid_be: "bank-uuid-123"
      }
    }],
    package_tiers: [
      {
        percentage: false,
        min_value: "1000000",
        max_value: "5000000",
        amount: "50000",
        start_date: "2024-01-01",
        end_date: "2024-12-31"
      }
    ]
  };

  // Method 1: Using CustomerDebugButton (Recommended)
  const handleDebugButtonSuccess = (result) => {
    console.log('✅ Debug Button Success:', result);
    message.success('Customer data synced successfully!');
  };

  const handleDebugButtonError = (error) => {
    console.error('❌ Debug Button Error:', error);
    message.error('Failed to sync customer data');
  };

  // Method 2: Using useCustomerDebug hook
  const {
    debugData,
    sendToAPI,
    loading,
    canSend,
    getValidationSummary
  } = useCustomerDebug();

  const handleCustomDebug = async () => {
    try {
      const result = await debugData(sampleAccountData);
      if (result?.success) {
        setDebugResult(result);
        setDebugModalVisible(true);
        message.success('Debug completed successfully');
      } else {
        message.error('Debug failed: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Custom debug error:', error);
      message.error('Debug failed: ' + error.message);
    }
  };

  const handleCustomSend = async () => {
    try {
      const result = await sendToAPI(sampleAccountData, null, 'user-123', 'account-456');
      if (result?.success) {
        message.success('Data sent to external API successfully');
      } else {
        message.error('Send failed: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Custom send error:', error);
      message.error('Send failed: ' + error.message);
    }
  };

  // Method 3: Direct function call
  const handleDirectDebug = async () => {
    try {
      const result = await debugCustomerData(sampleAccountData);
      console.log('🔍 Direct debug result:', result);
      
      if (result?.success) {
        setDebugResult(result);
        setDebugModalVisible(true);
        message.success('Direct debug completed');
      } else {
        message.error('Direct debug failed: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Direct debug error:', error);
      message.error('Direct debug failed: ' + error.message);
    }
  };

  const handleDebugModalConfirm = async (transformedData, validationResult) => {
    if (!validationResult.isValid) {
      message.error('Cannot send data with validation errors');
      return;
    }

    try {
      const result = await sendToAPI(sampleAccountData, null, 'user-123', 'account-456');
      if (result?.success) {
        message.success('Data sent to external API successfully');
        setDebugModalVisible(false);
      } else {
        message.error('Send failed: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Send from modal error:', error);
      message.error('Send failed: ' + error.message);
    }
  };

  const validationSummary = getValidationSummary();

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>🔍 Customer Data Debug System - Examples</Title>
      
      <Row gutter={[24, 24]}>
        {/* Method 1: CustomerDebugButton */}
        <Col span={24}>
          <Card title="Method 1: CustomerDebugButton (Recommended)" size="small">
            <Text>Easiest way to add debug functionality to your components:</Text>
            <br /><br />
            
            <CustomerDebugButton
              accountData={sampleAccountData}
              accountId="account-456"
              userId="user-123"
              onSuccess={handleDebugButtonSuccess}
              onError={handleDebugButtonError}
              buttonText="Debug Customer Data"
              showSendButton={true}
            />
            
            <br /><br />
            <Text code>
              {`<CustomerDebugButton
  accountData={accountData}
  accountId="account-456"
  userId="user-123"
  onSuccess={handleSuccess}
  onError={handleError}
/>`}
            </Text>
          </Card>
        </Col>

        {/* Method 2: useCustomerDebug Hook */}
        <Col span={24}>
          <Card title="Method 2: useCustomerDebug Hook" size="small">
            <Text>For custom implementations with more control:</Text>
            <br /><br />
            
            <Space>
              <Button
                type="default"
                icon={<BugOutlined />}
                onClick={handleCustomDebug}
                loading={loading}
              >
                Custom Debug
              </Button>
              
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleCustomSend}
                loading={loading}
                disabled={!canSend()}
              >
                Custom Send
              </Button>
            </Space>

            {validationSummary && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Validation Status: </Text>
                <Text type={validationSummary.isValid ? 'success' : 'danger'}>
                  {validationSummary.dataIntegrity}
                </Text>
                <br />
                <Text>Errors: {validationSummary.errorCount}, Warnings: {validationSummary.warningCount}</Text>
              </div>
            )}
            
            <br /><br />
            <Text code>
              {`const { debugData, sendToAPI, loading, canSend } = useCustomerDebug();

const handleDebug = async () => {
  const result = await debugData(accountData);
  // Handle result
};`}
            </Text>
          </Card>
        </Col>

        {/* Method 3: Direct Function Call */}
        <Col span={24}>
          <Card title="Method 3: Direct Function Call" size="small">
            <Text>For simple one-off debugging:</Text>
            <br /><br />
            
            <Button
              type="dashed"
              icon={<BugOutlined />}
              onClick={handleDirectDebug}
            >
              Direct Debug Function
            </Button>
            
            <br /><br />
            <Text code>
              {`import { debugCustomerData } from '../utils/customerSyncUtils';

const result = await debugCustomerData(accountData);`}
            </Text>
          </Card>
        </Col>

        {/* Sample Data Display */}
        <Col span={24}>
          <Card title="Sample Account Data" size="small">
            <Text code style={{ fontSize: 12 }}>
              {JSON.stringify(sampleAccountData, null, 2)}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Debug Modal */}
      <DebugDataModal
        visible={debugModalVisible}
        onClose={() => setDebugModalVisible(false)}
        originalData={sampleAccountData}
        transformedData={debugResult?.transformedData}
        onConfirmSend={handleDebugModalConfirm}
        showSendButton={true}
      />
    </div>
  );
};

export default DebugExample;
