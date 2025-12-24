import axios from "axios";
import { getOAuthTokenWithCORSHandling, clearOAuthToken } from "./corsOAuthFallback.js";

// API Base URLs based on provided specifications
const API_BASES = {
  // Query endpoints (GET operations)
  MACHINE_QUERY: "https://stg.merahputih-id.tech:5002/api/cdt/core/master/machine",
  BRANCH_QUERY: "https://stg.merahputih-id.tech:5002/api/cdt/core/master/branch", 
  SERVICE_LOCATION_QUERY: "https://stg.merahputih-id.tech:5002/api/cdt/core/master/service-location",
  VENDOR_QUERY: "https://stg.merahputih-id.tech:5002/api/cdt/core/master/vendor",
  
  // CRUD endpoints (POST/PUT operations)
  MACHINE_CRUD: "https://stg.merahputih-id.tech:5002/api/machine",
  BRANCH_CRUD: "https://stg.merahputih-id.tech:5002/api/branch",
  SERVICE_LOCATION_CRUD: "https://stg.merahputih-id.tech:5002/api/service-location", 
  VENDOR_CRUD: "https://stg.merahputih-id.tech:5002/api/vendor"
};

// Authentication management
let authToken = null;
let tokenExpiry = null;

const clearToken = () => {
  authToken = null;
  tokenExpiry = null;
  clearOAuthToken();
};

const getAuthToken = async () => {
  if (authToken && tokenExpiry && new Date() < new Date(tokenExpiry)) {
    return authToken;
  }
  
  try {
    const tokenResult = await getOAuthTokenWithCORSHandling();
    
    if (tokenResult && typeof tokenResult === "string" && tokenResult.length > 50) {
      authToken = tokenResult;
      tokenExpiry = new Date(Date.now() + 3600 * 1000);
      return authToken;
    }
    
    console.warn("Invalid token response format:", typeof tokenResult, tokenResult);
    throw new Error("No valid token in response");
  } catch (error) {
    console.error("Failed to get OAuth token in masterDataApi:", error);
    throw new Error(`Token acquisition failed: ${error.message}`);
  }
};

const getHeaders = async () => {
  try {
    const token = await getAuthToken();
    return { Authorization: `Bearer ${token}` };
  } catch (error) {
    console.error("Failed to get auth headers:", error);
    return {};
  }
};

// Generic retry function for 401 errors
const performRequestWithRetry = async (requestFn, entityName, operation) => {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      console.error(`${operation} ${entityName} failed:`, error.message);
      
      // If it's a 401 error and first attempt, clear token and retry
      if (error.response?.status === 401 && retryCount === 0) {
        clearToken();
        retryCount++;
        continue;
      }
      
      // For other errors or max retries reached, throw the error
      throw error;
    }
  }
  
  throw new Error(`Max retries (${maxRetries}) exceeded for ${operation} ${entityName}`);
};

// ===== MACHINE API =====
export const getMachines = async (page = 1, limit = 10) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for machine API");
    }
    
    const response = await axios.get(`${API_BASES.MACHINE_QUERY}/query?page=${page}&limit=${limit}`, { headers });
    return response.data;
  }, "machines", "Fetching");
};

export const createMachine = async (data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for machine creation");
    }
    
    const response = await axios.post(API_BASES.MACHINE_CRUD, data, { headers });
    return response.data;
  }, "machine", "Creating");
};

export const updateMachine = async (id, data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for machine update");
    }
    
    const response = await axios.put(`${API_BASES.MACHINE_CRUD}/${id}`, data, { headers });
    return response.data;
  }, "machine", "Updating");
};

export const deleteMachine = async (id) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for machine deletion");
    }
    
    const response = await axios.delete(`${API_BASES.MACHINE_CRUD}/${id}`, { headers });
    return response.data;
  }, "machine", "Deleting");
};

// ===== BRANCH API =====
export const getBranches = async (type = "all") => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for branch API");
    }
    
    const response = await axios.get(`${API_BASES.BRANCH_QUERY}/query`, { headers });
    return response.data;
  }, "branches", "Fetching");
};

export const updateBranch = async (id, data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for branch update");
    }
    
    const response = await axios.put(`${API_BASES.BRANCH_CRUD}/${id}`, data, { headers });
    return response.data;
  }, "branch", "Updating");
};

// ===== SERVICE LOCATION API =====
export const getServiceLocations = async (page = 1, limit = 10) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for service location API");
    }
    
    const response = await axios.get(`${API_BASES.SERVICE_LOCATION_QUERY}/query?page=${page}&limit=${limit}`, { headers });
    return response.data;
  }, "service locations", "Fetching");
};

export const createServiceLocation = async (data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for service location creation");
    }
    
    const response = await axios.post(API_BASES.SERVICE_LOCATION_CRUD, data, { headers });
    return response.data;
  }, "service location", "Creating");
};

export const updateServiceLocation = async (id, data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for service location update");
    }
    
    const response = await axios.put(`${API_BASES.SERVICE_LOCATION_CRUD}/${id}`, data, { headers });
    return response.data;
  }, "service location", "Updating");
};

// ===== VENDOR API =====
export const getVendors = async (type = "all") => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for vendor API");
    }
    
    const response = await axios.get(`${API_BASES.VENDOR_QUERY}/query`, { headers });
    
    // Apply filtering logic if needed
    return filterVendorsByType(response.data, type);
  }, "vendors", "Fetching");
};

export const createVendor = async (data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for vendor creation");
    }
    
    const response = await axios.post(API_BASES.VENDOR_CRUD, data, { headers });
    return response.data;
  }, "vendor", "Creating");
};

export const updateVendor = async (id, data) => {
  return performRequestWithRetry(async () => {
    const headers = await getHeaders();
    if (!headers.Authorization) {
      throw new Error("Failed to obtain OAuth token for vendor update");
    }
    
    const response = await axios.put(`${API_BASES.VENDOR_CRUD}/${id}`, data, { headers });
    return response.data;
  }, "vendor", "Updating");
};

// Helper function for vendor filtering (keeping existing logic)
const filterVendorsByType = (responseData, type) => {
  let allVendors;
  if (Array.isArray(responseData)) {
    allVendors = responseData;
  } else if (responseData && Array.isArray(responseData.data)) {
    allVendors = responseData.data;
  } else {
    console.warn("Invalid vendor response format:", responseData);
    return { data: [] };
  }
  
  if (type === "all") {
    return { data: allVendors };
  }
  
  const filtered = allVendors.filter(vendor => {
    if (!vendor.type) return false;
    return vendor.type.toLowerCase() === type.toLowerCase();
  });
  
  return { data: filtered };
};

// Export individual functions for backward compatibility
export {
  performRequestWithRetry,
  getHeaders,
  clearToken,
  API_BASES
};