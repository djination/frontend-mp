import axiosInstance from '../config/axiosInstance';

const BASE_URL = '/master-payment-gateway';

export const getAllPaymentGateways = () => axiosInstance.get(BASE_URL);

export const getPaymentGatewayById = (id) => axiosInstance.get(`${BASE_URL}/${id}`);

export const createPaymentGateway = (data) => axiosInstance.post(BASE_URL, data);

export const updatePaymentGateway = (id, data) => axiosInstance.patch(`${BASE_URL}/${id}`, data);

export const deletePaymentGateway = (id) => axiosInstance.delete(`${BASE_URL}/${id}`);
