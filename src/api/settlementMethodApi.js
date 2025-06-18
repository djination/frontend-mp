import axiosInstance from "../config/axiosInstance";

// Settlement Methods
export const getSettlementMethods = () => {
  return axiosInstance.get('/settlement-methods');
};

export const getSettlementMethodById = (id) => {
  return axiosInstance.get(`/settlement-methods/${id}`);
};

export const createSettlementMethod = (data) => {
  return axiosInstance.post('/settlement-methods', data);
};

export const updateSettlementMethod = (id, data) => {
  return axiosInstance.patch(`/settlement-methods/${id}`, data);
};

export const deleteSettlementMethod = (id) => {
  return axiosInstance.delete(`/settlement-methods/${id}`);
};

// Cash Deposit Methods
export const getCashDepositMethods = () => {
  return axiosInstance.get('/settlement-methods/cash-deposit-methods');
};

export const createCashDepositMethod = (data) => {
  return axiosInstance.post('/settlement-methods/cash-deposit-methods', data);
};

// Non-Cash Methods
export const getNonCashMethods = () => {
  return axiosInstance.get('/settlement-methods/non-cash-methods');
};

export const createNonCashMethod = (data) => {
  return axiosInstance.post('/settlement-methods/non-cash-methods', data);
};

// Send Money Methods
export const getSendMoneyMethods = () => {
  return axiosInstance.get('/settlement-methods/send-money-methods');
};

export const createSendMoneyMethod = (data) => {
  return axiosInstance.post('/settlement-methods/send-money-methods', data);
};

// Send Goods Methods
export const getSendGoodsMethods = () => {
  return axiosInstance.get('/settlement-methods/send-goods-methods');
};

export const createSendGoodsMethod = (data) => {
  return axiosInstance.post('/settlement-methods/send-goods-methods', data);
};

// Batching Details
export const getBatchingDetails = () => {
  return axiosInstance.get('/settlement-methods/batching-details');
};

export const createBatchingDetail = (data) => {
  return axiosInstance.post('/settlement-methods/batching-details', data);
};
