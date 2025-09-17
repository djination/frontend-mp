import axiosInstance from '../config/axiosInstance';

export const getPublishedPackageTiersDebug = async () => {
  const response = await axiosInstance.get('/published-package-tiers/debug/all');
  return response.data;
};