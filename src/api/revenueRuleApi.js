import axiosInstance from "../config/axiosInstance";

const REVENUE_RULES_API = '/account-revenue-rules';

const handleError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  throw error.response?.data || error;
};

export const revenueRuleApi = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get(REVENUE_RULES_API);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`${REVENUE_RULES_API}/${id}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  create: async (data) => {
    try {
      // Remove undefined or null values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await axiosInstance.post(REVENUE_RULES_API, cleanData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  update: async (id, data) => {
    try {
      // Remove undefined or null values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await axiosInstance.patch(`${REVENUE_RULES_API}/${id}`, cleanData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  delete: async (id) => {
    try {
      await axiosInstance.delete(`${REVENUE_RULES_API}/${id}`);
    } catch (error) {
      handleError(error);
    }
  },

  // Tree structure endpoints
  createFromTree: async (data) => {
    try {
      const response = await axiosInstance.post(`${REVENUE_RULES_API}/tree`, data);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getByAccountAndServiceAsTree: async (accountId, accountServiceId) => {
    try {
      const response = await axiosInstance.get(`${REVENUE_RULES_API}/tree/account/${accountId}/service/${accountServiceId}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getTreeRuleById: async (id) => {
    try {
      const response = await axiosInstance.get(`${REVENUE_RULES_API}/tree/${id}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  deleteTree: async (id) => {
    try {
      await axiosInstance.delete(`${REVENUE_RULES_API}/tree/${id}`);
    } catch (error) {
      handleError(error);
    }
  },

  // Package Tier endpoints
  packageTiers: {
    create: async (data) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/package-tiers`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByAccountId: async (accountId) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/package-tiers/account/${accountId}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getById: async (id) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/package-tiers/${id}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    update: async (id, data) => {
      try {
        const response = await axiosInstance.patch(`${REVENUE_RULES_API}/package-tiers/${id}`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    delete: async (id) => {
      try {
        await axiosInstance.delete(`${REVENUE_RULES_API}/package-tiers/${id}`);
      } catch (error) {
        handleError(error);
      }
    },

    createBulk: async (accountId, tiers) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/package-tiers/bulk/${accountId}`, tiers);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  },

  // Billing Method endpoints
  billingMethods: {
    create: async (data) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/billing-methods`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByAccountId: async (accountId) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/billing-methods/account/${accountId}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getById: async (id) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/billing-methods/${id}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    update: async (id, data) => {
      try {
        const response = await axiosInstance.patch(`${REVENUE_RULES_API}/billing-methods/${id}`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    delete: async (id) => {
      try {
        await axiosInstance.delete(`${REVENUE_RULES_API}/billing-methods/${id}`);
      } catch (error) {
        handleError(error);
      }
    },

    createBulk: async (accountId, methods) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/billing-methods/bulk/${accountId}`, methods);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  },

  // Tax Rule endpoints
  taxRules: {
    create: async (data) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/tax-rules`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByAccountId: async (accountId) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/tax-rules/account/${accountId}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getById: async (id) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/tax-rules/${id}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    update: async (id, data) => {
      try {
        const response = await axiosInstance.patch(`${REVENUE_RULES_API}/tax-rules/${id}`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    delete: async (id) => {
      try {
        await axiosInstance.delete(`${REVENUE_RULES_API}/tax-rules/${id}`);
      } catch (error) {
        handleError(error);
      }
    },

    createBulk: async (accountId, rules) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/tax-rules/bulk/${accountId}`, rules);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  },

  // Term of Payment endpoints
  termOfPayment: {
    create: async (data) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/term-of-payment`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByAccountId: async (accountId) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/term-of-payment/account/${accountId}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getById: async (id) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/term-of-payment/${id}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    update: async (id, data) => {
      try {
        const response = await axiosInstance.patch(`${REVENUE_RULES_API}/term-of-payment/${id}`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    delete: async (id) => {
      try {
        await axiosInstance.delete(`${REVENUE_RULES_API}/term-of-payment/${id}`);
      } catch (error) {
        handleError(error);
      }
    },

    createOrUpdate: async (accountId, data) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/term-of-payment/create-or-update/${accountId}`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  },

  // Add-Ons endpoints
  addOns: {
    create: async (data) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/add-ons`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByAccountId: async (accountId) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/add-ons/account/${accountId}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByType: async (accountId, addOnsType) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/add-ons/account/${accountId}/type/${addOnsType}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getByBillingType: async (accountId, billingType) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/add-ons/account/${accountId}/billing/${billingType}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    getById: async (id) => {
      try {
        const response = await axiosInstance.get(`${REVENUE_RULES_API}/add-ons/${id}`);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    update: async (id, data) => {
      try {
        const response = await axiosInstance.patch(`${REVENUE_RULES_API}/add-ons/${id}`, data);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    },

    delete: async (id) => {
      try {
        await axiosInstance.delete(`${REVENUE_RULES_API}/add-ons/${id}`);
      } catch (error) {
        handleError(error);
      }
    },

    createBulk: async (accountId, addOnsList) => {
      try {
        const response = await axiosInstance.post(`${REVENUE_RULES_API}/add-ons/bulk/${accountId}`, addOnsList);
        return response.data;
      } catch (error) {
        handleError(error);
      }
    }
  }
};

export default revenueRuleApi;
