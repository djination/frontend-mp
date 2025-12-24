import React, { useState } from 'react';
import { Button, Space, Modal, message } from 'antd';
import { BugOutlined, SendOutlined, EyeOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import DebugDataModal from './DebugDataModal';
import { useCustomerDebug } from '../hooks/useCustomerDebug';

/**
 * Button komponen untuk debug customer data sebelum hit ke external API
 */
const CustomerDebugButton = ({ 
  accountData, 
  configId = null, 
  userId = null, 
  accountId = null,
  onSuccess = null,
  onError = null,
  disabled = false,
  showSendButton = true,
  buttonText = "Debug Data",
  buttonType = "default",
  buttonSize = "default"
}) => {
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const { 
    debugData, 
    sendToAPI, 
    loading, 
    error, 
    canSend, 
    getValidationSummary,
    hasValidationIssues,
    hasWarnings
  } = useCustomerDebug();

  const handleDebugClick = async () => {
    if (!accountData) {
      message.error('No account data provided for debugging');
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
      console.error('❌ Debug button error:', err);
      message.error('Debug failed: ' + err.message);
    }
  };

  const handleSendClick = async () => {
    if (!accountData) {
      message.error('No account data provided for sending');
      return;
    }

    try {
      const result = await sendToAPI(accountData, configId, userId, accountId, false);
      
      if (result?.success) {
        message.success('Data sent to external API successfully');
        onSuccess?.(result);
      } else {
        message.error('Send failed: ' + (result?.error || 'Unknown error'));
        onError?.(result);
      }
    } catch (err) {
      console.error('❌ Send button error:', err);
      message.error('Send failed: ' + err.message);
      onError?.(err);
    }
  };

  const handleDebugModalConfirm = async (transformedData, validationResult) => {
    if (!validationResult.isValid) {
      message.error('Cannot send data with validation errors. Please fix the issues first.');
      return;
    }

    try {
      const result = await sendToAPI(accountData, configId, userId, accountId, false);
      
      if (result?.success) {
        message.success('Data sent to external API successfully');
        onSuccess?.(result);
        setDebugModalVisible(false);
      } else {
        message.error('Send failed: ' + (result?.error || 'Unknown error'));
        onError?.(result);
      }
    } catch (err) {
      console.error('❌ Send from debug modal error:', err);
      message.error('Send failed: ' + err.message);
      onError?.(err);
    }
  };

  const getButtonIcon = () => {
    if (loading) return <BugOutlined spin />;
    if (hasValidationIssues) return <ExclamationCircleOutlined />;
    if (hasWarnings) return <ExclamationCircleOutlined />;
    return <BugOutlined />;
  };

  const getButtonStatus = () => {
    if (loading) return 'loading';
    if (hasValidationIssues) return 'error';
    if (hasWarnings) return 'warning';
    return 'default';
  };

  return (
    <>
      <Space>
        <Button
          type={buttonType}
          size={buttonSize}
          icon={getButtonIcon()}
          onClick={handleDebugClick}
          loading={loading}
          disabled={disabled || !accountData}
          status={getButtonStatus()}
        >
          {buttonText}
        </Button>

        {showSendButton && (
          <Button
            type="primary"
            size={buttonSize}
            icon={<SendOutlined />}
            onClick={handleSendClick}
            loading={loading}
            disabled={disabled || !accountData}
          >
            Send to API
          </Button>
        )}
      </Space>

      {/* Debug Modal */}
      <DebugDataModal
        visible={debugModalVisible}
        onClose={() => setDebugModalVisible(false)}
        originalData={accountData}
        transformedData={debugData?.transformedData}
        onConfirmSend={showSendButton ? handleDebugModalConfirm : null}
        showSendButton={showSendButton}
      />
    </>
  );
};

/**
 * Hook untuk menggunakan debug functionality secara standalone
 */
export const useCustomerDebugButton = (accountData) => {
  const [modalVisible, setModalVisible] = useState(false);
  const debugHook = useCustomerDebug();

  const showDebugModal = async () => {
    if (!accountData) {
      message.error('No account data provided');
      return;
    }

    const result = await debugHook.debugData(accountData);
    if (result?.success) {
      setModalVisible(true);
    }
  };

  const DebugModal = ({ onSuccess, onError, showSendButton = true }) => (
    <DebugDataModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      originalData={accountData}
      transformedData={debugHook.debugResult?.transformedData}
      onConfirmSend={showSendButton ? async (transformedData, validationResult) => {
        if (!validationResult.isValid) {
          message.error('Cannot send data with validation errors');
          return;
        }
        
        const result = await debugHook.sendToAPI(accountData, null, null, null, false);
        if (result?.success) {
          onSuccess?.(result);
          setModalVisible(false);
        } else {
          onError?.(result);
        }
      } : null}
      showSendButton={showSendButton}
    />
  );

  return {
    ...debugHook,
    showDebugModal,
    DebugModal,
    modalVisible,
    setModalVisible
  };
};

export default CustomerDebugButton;
