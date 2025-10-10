import { useState, useCallback } from 'react';
import { 
  debugCustomerData, 
  previewCustomerData, 
  validateCustomerData, 
  transformCustomerData,
  syncCustomerToExternalApi 
} from '../utils/customerSyncUtils';

/**
 * Custom hook untuk debug customer data
 */
export const useCustomerDebug = () => {
  const [debugResult, setDebugResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Debug customer data (validate & preview without sending to API)
   */
  const debugData = useCallback(async (accountData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Starting debug for customer data...');
      const result = await debugCustomerData(accountData);
      setDebugResult(result);
      return result;
    } catch (err) {
      console.error('❌ Debug error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Preview customer data (alias for debugData)
   */
  const previewData = useCallback(async (accountData) => {
    return await debugData(accountData);
  }, [debugData]);

  /**
   * Validate transformed data only
   */
  const validateData = useCallback((transformedData) => {
    try {
      const result = validateCustomerData(transformedData);
      setDebugResult({
        success: true,
        mode: 'validation-only',
        transformedData,
        validationResult: result
      });
      return result;
    } catch (err) {
      console.error('❌ Validation error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Transform data only (no validation)
   */
  const transformData = useCallback((accountData) => {
    try {
      const transformedData = transformCustomerData(accountData);
      setDebugResult({
        success: true,
        mode: 'transform-only',
        originalData: accountData,
        transformedData
      });
      return transformedData;
    } catch (err) {
      console.error('❌ Transform error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Send data to external API with optional debug mode
   */
  const sendToAPI = useCallback(async (accountData, configId = null, userId = null, accountId = null, debugMode = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Sending customer data to API (debug: ${debugMode})...`);
      const result = await syncCustomerToExternalApi(accountData, configId, userId, accountId, debugMode);
      
      if (debugMode) {
        setDebugResult(result);
      }
      
      return result;
    } catch (err) {
      console.error('❌ Send to API error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear debug results
   */
  const clearResults = useCallback(() => {
    setDebugResult(null);
    setError(null);
  }, []);

  /**
   * Check if data can be sent (validation passed)
   */
  const canSend = useCallback(() => {
    return debugResult?.validationResult?.isValid === true;
  }, [debugResult]);

  /**
   * Get validation summary
   */
  const getValidationSummary = useCallback(() => {
    if (!debugResult?.validationResult) return null;
    
    const validation = debugResult.validationResult;
    return {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      criticalIssues: validation.summary?.criticalIssues || 0,
      dataIntegrity: validation.summary?.dataIntegrity || 'UNKNOWN'
    };
  }, [debugResult]);

  return {
    // State
    debugResult,
    loading,
    error,
    
    // Actions
    debugData,
    previewData,
    validateData,
    transformData,
    sendToAPI,
    clearResults,
    
    // Helpers
    canSend,
    getValidationSummary,
    
    // Computed values
    hasData: !!debugResult,
    hasErrors: error !== null,
    hasValidationIssues: debugResult?.validationResult?.errors?.length > 0,
    hasWarnings: debugResult?.validationResult?.warnings?.length > 0
  };
};

export default useCustomerDebug;
