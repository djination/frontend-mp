// src/pages/SettlementMethod/hooks/useSettlementMethods.js
import { useState, useCallback } from 'react';
import { 
  getSettlementMethods, 
  createSettlementMethod,
  updateSettlementMethod,
  deleteSettlementMethod,
  getCashDepositMethods,
  createCashDepositMethod,
  getNonCashMethods,
  createNonCashMethod,
  getSendMoneyMethods,
  createSendMoneyMethod,
  getSendGoodsMethods,
  createSendGoodsMethod,
  getBatchingDetails,
  createBatchingDetail
} from '../../../api/settlementMethodApi';

export const useSettlementMethods = () => {
  const [methods, setMethods] = useState({
    settlement: [],
    cashDeposit: [],
    nonCash: [],
    sendMoney: [],
    sendGoods: [],
    batching: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllMethods = useCallback(async () => {
    setLoading(true);
    try {
      const [
        settlementRes, 
        cashDepositRes, 
        nonCashRes, 
        sendMoneyRes, 
        sendGoodsRes, 
        batchingRes
      ] = await Promise.all([
        getSettlementMethods(),
        getCashDepositMethods(),
        getNonCashMethods(),
        getSendMoneyMethods(),
        getSendGoodsMethods(),
        getBatchingDetails()
      ]);

      setMethods({
        settlement: settlementRes.data,
        cashDeposit: cashDepositRes.data,
        nonCash: nonCashRes.data,
        sendMoney: sendMoneyRes.data,
        sendGoods: sendGoodsRes.data,
        batching: batchingRes.data
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch methods');
      console.error('Error fetching methods:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMethod = async (type, data) => {
    try {
      let response;
      switch (type) {
        case 'settlement':
          response = await createSettlementMethod(data);
          break;
        case 'cashDeposit':
          response = await createCashDepositMethod(data);
          break;
        // Add other cases as needed
        default:
          throw new Error('Invalid method type');
      }
      await fetchAllMethods();
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateMethod = async (type, id, data) => {
    try {
      let response;
      switch (type) {
        case 'settlement':
          response = await updateSettlementMethod(id, data);
          break;
        // Add other cases as needed
        default:
          throw new Error('Invalid method type');
      }
      await fetchAllMethods();
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeMethod = async (type, id) => {
    try {
      switch (type) {
        case 'settlement':
          await deleteSettlementMethod(id);
          break;
        // Add other cases as needed
        default:
          throw new Error('Invalid method type');
      }
      await fetchAllMethods();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    methods,
    loading,
    error,
    fetchAllMethods,
    createMethod,
    updateMethod,
    removeMethod
  };
};