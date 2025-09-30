import axios from "axios";
import { getOAuthTokenWithCORSHandling, clearOAuthToken } from "./corsOAuthFallback.js";

const MACHINE_CRUD_BASE = "http://test-stg01.merahputih-id.tech:5002/api/machine";
const MACHINE_QUERY_BASE = "http://test-stg01.merahputih-id.tech:5002/api/cdt/core/master/machine";

let authToken = null;
let tokenExpiry = null;

const clearToken = () => {
  authToken = null;
  tokenExpiry = null;
  clearOAuthToken(); // Also clear the OAuth fallback cache
  console.log("Cleared expired authentication token");
};

const getAuthToken = async () => {
  if (authToken && tokenExpiry && new Date() < new Date(tokenExpiry)) {
    console.log("Using cached token from machineApi");
    return authToken;
  }
  
  console.log("Requesting new OAuth token via CORS handling...");
  try {
    const tokenResult = await getOAuthTokenWithCORSHandling();
    console.log("Token response received:", tokenResult ? "Success" : "Failed");
    
    if (tokenResult && typeof tokenResult === "string" && tokenResult.length > 50) {
      authToken = tokenResult;
      tokenExpiry = new Date(Date.now() + 3600 * 1000);
      console.log("OAuth token cached successfully in machineApi");
      return authToken;
    }
    
    console.warn("Invalid token response format:", typeof tokenResult, tokenResult);
    throw new Error("No valid token in response");
  } catch (error) {
    console.error("Failed to get OAuth token in machineApi:", error);
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

export const getMachines = async (page = 1, limit = 10) => {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching machines (page: ${page}, limit: ${limit}), attempt ${retryCount + 1}...`);
      
      // Always ensure we have a valid OAuth token first
      const headers = await getHeaders();
      
      if (!headers.Authorization) {
        console.error("Failed to obtain OAuth token for machine API");
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      
      // Try proxy first with authentication
      try {
        console.log("Attempting machine fetch via proxy with auth...");
        const response = await axios.get(`/external-api/machine/query?page=${page}&limit=${limit}`, { headers });
        console.log("Machines fetched via proxy with auth", response.data);
        
        // Check if response.data is an array (direct API format) or has data property
        if (Array.isArray(response.data)) {
          return { 
            data: response.data, 
            pagination: { page, limit, total: response.data.length, totalPages: 1 } 
          };
        } else if (response.data && response.data.data) {
          return response.data;
        } else {
          return response.data;
        }
      } catch (proxyError) {
        console.warn(`Proxy machine API failed:`, proxyError.message);
        
        // If it's a 401 error, clear token and retry
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        // Fallback to direct API call
        try {
          console.log("Trying direct API as fallback...");
          const response = await axios.get(`${MACHINE_QUERY_BASE}/query?page=${page}&limit=${limit}`, { headers });
          console.log("Machines fetched via direct API", response.data);
          
          // Check if response.data is an array (direct API format) or has data property
          if (Array.isArray(response.data)) {
            return { 
              data: response.data, 
              pagination: { page, limit, total: response.data.length, totalPages: 1 } 
            };
          } else if (response.data && response.data.data) {
            return response.data;
          } else {
            return response.data;
          }
        } catch (directError) {
          // If direct API also returns 401, clear token and retry
          if (directError.response?.status === 401 && retryCount === 0) {
            console.log("Direct API also returned 401, clearing token and retrying...");
            clearToken();
            retryCount++;
            continue;
          }
          
          console.error("All machine fetch attempts failed:", {
            proxyError: proxyError.message,
            directError: directError.message
          });
          return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
        }
      }
    } catch (error) {
      console.error(`Critical error in getMachines:`, error);
      
      // If it's a 401 error on first attempt, clear token and retry
      if (error.response?.status === 401 && retryCount === 0) {
        console.log("Critical 401 error, clearing token and retrying...");
        clearToken();
        retryCount++;
        continue;
      }
      
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }
  
  console.error(`Max retries (${maxRetries}) exceeded for machine fetch`);
  return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
};

export const createMachine = async (data) => {
  try {
    console.log('Creating machine with data:', data);
    const headers = await getHeaders();
    
    if (!headers.Authorization) {
      throw new Error('No valid authentication token');
    }
    
    // Try direct API first
    try {
      const response = await axios.post(`${MACHINE_CRUD_BASE}`, data, { headers });
      console.log('Machine created successfully via direct API');
      return response.data;
    } catch (directError) {
      console.warn('Direct create failed, checking if it\'s auth issue...', directError.message);
      
      // If it's 401, clear token and throw error for retry mechanism
      if (directError.response?.status === 401) {
        clearToken();
        throw new Error('Authentication failed - token may be expired');
      }
      
      // For other errors, throw directly
      throw directError;
    }
  } catch (error) {
    console.error('Machine creation failed:', error);
    throw error;
  }
};

export const updateMachine = async (id, data) => {
  try {
    console.log(`Updating machine ${id} with data:`, data);
    const headers = await getHeaders();
    
    if (!headers.Authorization) {
      throw new Error('No valid authentication token');
    }
    
    // Try direct API first
    try {
      const response = await axios.put(`${MACHINE_CRUD_BASE}/${id}`, data, { headers });
      console.log('Machine updated successfully via direct API');
      return response.data;
    } catch (directError) {
      console.warn('Direct update failed, checking if it\'s auth issue...', directError.message);
      
      // If it's 401, clear token and throw error for retry mechanism
      if (directError.response?.status === 401) {
        clearToken();
        throw new Error('Authentication failed - token may be expired');
      }
      
      // For other errors, throw directly
      throw directError;
    }
  } catch (error) {
    console.error('Machine update failed:', error);
    throw error;
  }
};

export const deleteMachine = async (id) => {
  try {
    console.log(`Deleting machine ${id}`);
    const headers = await getHeaders();
    
    if (!headers.Authorization) {
      throw new Error('No valid authentication token');
    }
    
    // Try direct API first
    try {
      const response = await axios.delete(`${MACHINE_CRUD_BASE}/${id}`, { headers });
      console.log('Machine deleted successfully via direct API');
      return response.data;
    } catch (directError) {
      console.warn('Direct delete failed, checking if it\'s auth issue...', directError.message);
      
      // If it's 401, clear token and throw error for retry mechanism
      if (directError.response?.status === 401) {
        clearToken();
        throw new Error('Authentication failed - token may be expired');
      }
      
      // For other errors, throw directly
      throw directError;
    }
  } catch (error) {
    console.error('Machine deletion failed:', error);
    throw error;
  }
};

export const getVendors = async (type = "all") => {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching vendors (type: ${type}), attempt ${retryCount + 1}...`);
      
      // Always ensure we have a valid OAuth token first
      const headers = await getHeaders();
      
      if (!headers.Authorization) {
        console.error("Failed to obtain OAuth token for vendor API");
        return { data: [] };
      }
      
      // Try proxy first with authentication
      try {
        console.log("Attempting vendor fetch via proxy with auth...");
        const response = await axios.get("/external-api/vendor/query", { headers });
        console.log(`Vendors fetched via proxy with auth, filtering for ${type}...`);
        return filterVendorsByType(response.data, type);
      } catch (proxyError) {
        console.warn(`Proxy vendor API failed for type ${type}:`, proxyError.message);
        
        // If it's a 401 error, clear token and retry
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        // Fallback to direct API call
        try {
          console.log("Trying direct API as fallback...");
          const response = await axios.get(
            "http://test-stg01.merahputih-id.tech:5002/api/cdt/core/master/vendor/query", 
            { headers }
          );
          console.log(`Vendors fetched via direct API, filtering for ${type}...`);
          return filterVendorsByType(response.data, type);
        } catch (directError) {
          // If direct API also returns 401, clear token and retry
          if (directError.response?.status === 401 && retryCount === 0) {
            console.log("Direct API also returned 401, clearing token and retrying...");
            clearToken();
            retryCount++;
            continue;
          }
          
          console.error(`All vendor fetch attempts failed for type ${type}:`, {
            proxyError: proxyError.message,
            directError: directError.message
          });
          return { data: [] };
        }
      }
    } catch (error) {
      console.error(`Critical error in getVendors for type ${type}:`, error);
      
      // If it's a 401 error on first attempt, clear token and retry
      if (error.response?.status === 401 && retryCount === 0) {
        console.log("Critical 401 error, clearing token and retrying...");
        clearToken();
        retryCount++;
        continue;
      }
      
      return { data: [] };
    }
  }
  
  console.error(`Max retries (${maxRetries}) exceeded for vendor fetch`);
  return { data: [] };
};

const filterVendorsByType = (responseData, type) => {
  console.log("Filtering vendors - Raw response:", responseData);
  
  let allVendors;
  if (Array.isArray(responseData)) {
    allVendors = responseData;
    console.log("Detected direct array response");
  } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
    allVendors = responseData.data;
    console.log("Detected wrapped response with data property");
  } else {
    console.warn("Invalid vendor response format:", responseData);
    return { data: [] };
  }
  
  console.log(`Total vendors received: ${allVendors.length}`);
  
  let filteredVendors = [];
  
  switch (type) {
    case "gateway":
      filteredVendors = allVendors.filter(vendor => vendor.gateway === true);
      break;
    case "pjpur":
      filteredVendors = allVendors.filter(vendor => vendor.pjpur === true);
      break;
    case "supplier":
      filteredVendors = allVendors.filter(vendor => vendor.supplier === true);
      break;
    case "maintenance":
      filteredVendors = allVendors.filter(vendor => vendor.maintenance === true);
      break;
    case "all":
    default:
      filteredVendors = allVendors;
  }
  
  console.log(`Found ${filteredVendors.length} vendors for type: ${type}`);
  console.log("Sample vendor properties:", allVendors[0] ? Object.keys(allVendors[0]) : "No vendors");
  
  return {
    data: filteredVendors,
    total: filteredVendors.length
  };
};

export const getGatewayVendors = async () => {
  return await getVendors("gateway");
};

export const getPjpurVendors = async () => {
  return await getVendors("pjpur");
};

export const getSupplierVendors = async () => {
  return await getVendors("supplier");
};

export const getMaintenanceVendors = async () => {
  return await getVendors("maintenance");
};

export const getBranches = async (type = "all") => {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching branches (type: ${type}), attempt ${retryCount + 1}...`);
      
      // Always ensure we have a valid OAuth token first
      const headers = await getHeaders();
      
      if (!headers.Authorization) {
        console.error("Failed to obtain OAuth token for branch API");
        return { data: [] };
      }
      
      // Try proxy first with authentication
      try {
        console.log("Attempting branch fetch via proxy with auth...");
        const response = await axios.get("/external-api/branch/query", { headers });
        console.log(`Branch data fetched via proxy with auth`);
        return response.data;
      } catch (proxyError) {
        console.warn(`Proxy branch API failed for type ${type}:`, proxyError.message);
        
        // If it's a 401 error, clear token and retry
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        // Fallback to direct API call
        try {
          console.log("Trying direct API as fallback...");
          const response = await axios.get(
            "http://test-stg01.merahputih-id.tech:5002/api/cdt/core/master/branch/query", 
            { headers }
          );
          console.log(`Branch data fetched via direct API`);
          return response.data;
        } catch (directError) {
          // If direct API also returns 401, clear token and retry
          if (directError.response?.status === 401 && retryCount === 0) {
            console.log("Direct API also returned 401, clearing token and retrying...");
            clearToken();
            retryCount++;
            continue;
          }
          
          console.error(`All branch fetch attempts failed for type ${type}:`, {
            proxyError: proxyError.message,
            directError: directError.message
          });
          return { data: [] };
        }
      }
    } catch (error) {
      console.error(`Critical error in getBranches for type ${type}:`, error);
      
      // If it's a 401 error on first attempt, clear token and retry
      if (error.response?.status === 401 && retryCount === 0) {
        console.log("Critical 401 error, clearing token and retrying...");
        clearToken();
        retryCount++;
        continue;
      }
      
      return { data: [] };
    }
  }
  
  console.error(`Max retries (${maxRetries}) exceeded for branch fetch`);
  return { data: [] };
};

export const clearAuthToken = () => {
  authToken = null;
  tokenExpiry = null;
  console.log("Auth token cleared from machineApi");
};

export const getTokenStatus = () => {
  const status = {
    hasToken: !!authToken,
    tokenPreview: authToken ? authToken.substring(0, 20) + "..." : "None",
    expiry: tokenExpiry,
    isValid: authToken && tokenExpiry && new Date() < new Date(tokenExpiry)
  };
  console.log("Machine API Token Status:", status);
  return status;
};

if (typeof window !== "undefined") {
  window.machineApiDebug = {
    clearToken: clearAuthToken,
    getTokenStatus,
    testAuth: getAuthToken,
    testHeaders: getHeaders
  };
  console.log("Machine API debug tools available at window.machineApiDebug");
}

// ===== SERVICE LOCATION API =====
export const getServiceLocations = async (page = 1, limit = 10) => {
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching service locations (page: ${page}, limit: ${limit}), attempt ${retryCount + 1}...`);
      
      const headers = await getHeaders();
      if (!headers.Authorization) {
        console.error("Failed to obtain OAuth token for service location API");
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      
      try {
        const response = await axios.get(`/external-api/service-location/query?page=${page}&limit=${limit}`, { headers });
        console.log("Service locations fetched via proxy with auth", response.data);
        
        // Check if response.data is an array (direct API format) or has data property
        if (Array.isArray(response.data)) {
          return { 
            data: response.data, 
            pagination: { page, limit, total: response.data.length, totalPages: 1 } 
          };
        } else if (response.data && response.data.data) {
          return response.data;
        } else {
          return response.data;
        }
      } catch (proxyError) {
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        try {
          const response = await axios.get(`http://test-stg01.merahputih-id.tech:5002/api/cdt/core/master/service-location/query?page=${page}&limit=${limit}`, { headers });
          console.log("Service locations fetched via direct API", response.data);
          
          // Check if response.data is an array (direct API format) or has data property
          if (Array.isArray(response.data)) {
            return { 
              data: response.data, 
              pagination: { page, limit, total: response.data.length, totalPages: 1 } 
            };
          } else if (response.data && response.data.data) {
            return response.data;
          } else {
            return response.data;
          }
        } catch (directError) {
          if (directError.response?.status === 401 && retryCount === 0) {
            console.log("Direct API also returned 401, clearing token and retrying...");
            clearToken();
            retryCount++;
            continue;
          }
          
          console.error("All service location fetch attempts failed:", {
            proxyError: proxyError.message,
            directError: directError.message
          });
          return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
        }
      }
    } catch (error) {
      console.error(`Critical error in getServiceLocations:`, error);
      if (error.response?.status === 401 && retryCount === 0) {
        console.log("Critical 401 error, clearing token and retrying...");
        clearToken();
        retryCount++;
        continue;
      }
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }
  
  console.error(`Max retries (${maxRetries}) exceeded for service location fetch`);
  return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
};

export const createServiceLocation = async (data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.post("/external-api-crud/service-location", data, { headers });
    console.log("Service location created successfully");
    return response.data;
  } catch (error) {
    console.warn("Direct create failed, trying proxy...", error.message);
    try {
      const headers = await getHeaders();
      const response = await axios.post("/external-api-crud/service-location", data, { headers });
      console.log("Service location created via proxy");
      return response.data;
    } catch (proxyError) {
      console.error("All create attempts failed:", proxyError);
      throw error;
    }
  }
};

export const updateServiceLocation = async (id, data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`/external-api-crud/service-location/${id}`, data, { headers });
    console.log("Service location updated successfully");
    return response.data;
  } catch (error) {
    console.warn("Direct update failed, trying proxy...", error.message);
    try {
      const headers = await getHeaders();
      const response = await axios.put(`/external-api-crud/service-location/${id}`, data, { headers });
      console.log("Service location updated via proxy");
      return response.data;
    } catch (proxyError) {
      console.error("All update attempts failed:", proxyError);
      throw error;
    }
  }
};

// ===== VENDOR CRUD API =====
export const createVendor = async (data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.post("/external-api-crud/vendor", data, { headers });
    console.log("Vendor created successfully");
    return response.data;
  } catch (error) {
    console.warn("Direct create failed, trying proxy...", error.message);
    try {
      const headers = await getHeaders();
      const response = await axios.post("/external-api-crud/vendor", data, { headers });
      console.log("Vendor created via proxy");
      return response.data;
    } catch (proxyError) {
      console.error("All create attempts failed:", proxyError);
      throw error;
    }
  }
};

export const updateVendor = async (id, data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`/external-api-crud/vendor/${id}`, data, { headers });
    console.log("Vendor updated successfully");
    return response.data;
  } catch (error) {
    console.warn("Direct update failed, trying proxy...", error.message);
    try {
      const headers = await getHeaders();
      const response = await axios.put(`/external-api-crud/vendor/${id}`, data, { headers });
      console.log("Vendor updated via proxy");
      return response.data;
    } catch (proxyError) {
      console.error("All update attempts failed:", proxyError);
      throw error;
    }
  }
};

// ===== BRANCH UPDATE API =====
export const updateBranch = async (id, data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`/external-api-crud/branch/${id}`, data, { headers });
    console.log("Branch updated successfully");
    return response.data;
  } catch (error) {
    console.warn("Direct update failed, trying proxy...", error.message);
    try {
      const headers = await getHeaders();
      const response = await axios.put(`/external-api-crud/branch/${id}`, data, { headers });
      console.log("Branch updated via proxy");
      return response.data;
    } catch (proxyError) {
      console.error("All update attempts failed:", proxyError);
      throw error;
    }
  }
};
