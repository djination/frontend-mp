import axios from "axios";
import { getOAuthTokenWithCORSHandling, clearOAuthToken } from "./corsOAuthFallback.js";

// Audit trail functionality - only for POST/PUT operations
const logApiCall = async (method, url, data = null, params = null, response = null, error = null) => {
  try {
    // Only log POST and PUT operations (create/update), skip GET operations
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH' && method !== 'DELETE') {
      console.log('📝 Audit trail (skipped for GET):', method, url);
      return;
    }

    console.log('📝 Audit trail (logging):', {
      method,
      url,
      status: response?.status || error?.response?.status,
      timestamp: new Date().toISOString()
    });

    const logData = {
      request_method: method,
      request_url: url,
      request_data: data ? JSON.stringify(data) : null,
      request_params: params ? JSON.stringify(params) : null,
      response_status: response?.status || (error?.response?.status || null),
      response_data: response?.data ? JSON.stringify(response.data) : null,
      error_message: error?.message || null,
      execution_time: Date.now(),
      created_at: new Date().toISOString()
    };

    // Send to audit trail endpoint (secured with service token)
    try {
      await axios.post('/audit/logs', logData, {
        timeout: 5000, // 5 second timeout
        headers: {
          'X-Service-Token': import.meta.env.VITE_AUDIT_SERVICE_TOKEN || 'audit-service-2024-secure-token-merahputih',
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw on 401, only on server errors
      });
      console.log('✅ Audit log sent successfully');
    } catch (logError) {
      if (logError.response?.status === 401) {
        console.warn('⚠️ Audit logging authentication failed - check service token');
      } else {
        console.warn('❌ Failed to send audit log:', logError.message);
      }
      // Don't throw, just warn - audit logging shouldn't break main functionality
    }
  } catch (logError) {
    console.warn('Audit logging failed:', logError.message);
    // Don't throw, just warn - audit logging shouldn't break main functionality
  }
};

// Proxy endpoints (defined in vite.config.js)
// /external-api → http://test-stg01.merahputih-id.tech:5002/api/cdt/core/master
// /external-api-crud → http://test-stg01.merahputih-id.tech:5002/api

// Transform flat form data to nested API format
const transformMachineData = (formData, isCreate = true) => {
  const transformed = {
    code: formData.code,
    name: formData.name,
    description: formData.description,
    branch: {
      id: formData.branch_id
    },
    supplier: {
      id: formData.supplier_id
    },
    pjpur: {
      id: formData.pjpur_id
    },
    service_location: {
      id: formData.service_location_id
    }
  };

  // For create operations, include gateway
  if (isCreate && formData.gateway_id) {
    transformed.gateway = {
      id: formData.gateway_id
    };
  }

  // For update operations, include maintenance (if available)
  if (!isCreate && formData.maintenance_id) {
    transformed.maintenance = {
      id: formData.maintenance_id
    };
  }

  return transformed;
};

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
  const startTime = Date.now();
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Fetching machines (page: ${page}, limit: ${limit}), attempt ${retryCount + 1}...`);
      
      // Always ensure we have a valid OAuth token first
      const headers = await getHeaders();
      
      if (!headers.Authorization) {
        console.error("Failed to obtain OAuth token for machine API");
        const result = { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
        return result;
      }
      
      // Use proxy for machine query API
      try {
        console.log("Fetching machines via proxy...");
        const response = await axios.get(`/external-api/machine/query?page=${page}&limit=${limit}`, { headers });
        console.log("Machines fetched via proxy", response.data);
        
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
        // If it's a 401 error, clear token and retry
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        console.error("Machine API call failed:", proxyError.message);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
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
    console.log('Creating machine with form data:', data);
    
    // Transform flat form data to nested API format
    const transformedData = transformMachineData(data, true);
    console.log('Transformed data for API:', JSON.stringify(transformedData, null, 2));
    
    const headers = await getHeaders();
    
    if (!headers.Authorization) {
      const error = new Error('No valid authentication token');
      await logApiCall('POST', '/external-api-crud/machine', transformedData, null, null, error);
      throw error;
    }
    
    // Use proxy for machine command/create
    try {
      const response = await axios.post('/external-api-crud/machine', transformedData, { headers });
      console.log('Machine created successfully via proxy');
      
      // Log successful create
      await logApiCall('POST', '/external-api-crud/machine', transformedData, null, response);
      
      return response.data;
    } catch (proxyError) {
      console.warn('Machine create failed via proxy:', proxyError.message);
      console.error('📥 Create error response:', proxyError.response?.data);
      
      // Log proxy error
      await logApiCall('POST', '/external-api-crud/machine', transformedData, null, null, proxyError);
      
      // If it's 401, clear token and throw error for retry mechanism
      if (proxyError.response?.status === 401) {
        clearToken();
        throw new Error('Authentication failed - token may be expired');
      }
      
      // For other errors, throw directly
      throw proxyError;
    }
  } catch (error) {
    console.error('Machine creation failed:', error);
    
    // Log final error if not already logged
    if (!error.message.includes('Authentication failed')) {
      await logApiCall('POST', '/external-api-crud/machine', data, null, null, error);
    }
    
    throw error;
  }
};

export const updateMachine = async (id, data) => {
  try {
    console.log(`Updating machine ${id} with form data:`, data);
    
    // Transform flat form data to nested API format
    const transformedData = transformMachineData(data, false);
    console.log('Transformed data for API:', JSON.stringify(transformedData, null, 2));
    console.log(`🔍 Target endpoint: /external-api-crud/machine/${id}`);
    
    const headers = await getHeaders();
    
    if (!headers.Authorization) {
      const error = new Error('No valid authentication token');
      await logApiCall('PUT', `/external-api-crud/machine/${id}`, transformedData, null, null, error);
      throw error;
    }
    
    // Use proxy for machine command/update
    try {
      console.log('🔄 Trying primary update endpoint...');
      const response = await axios.put(`/external-api-crud/machine/${id}`, transformedData, { headers });
      console.log('Machine updated successfully via proxy');
      
      // Log successful update
      await logApiCall('PUT', `/external-api-crud/machine/${id}`, transformedData, null, response);
      
      return response.data;
    } catch (proxyError) {
      console.warn('Primary update endpoint failed:', proxyError.message);
      console.error('📥 Response error data:', proxyError.response?.data);
      
      // Log proxy error
      await logApiCall('PUT', `/external-api-crud/machine/${id}`, transformedData, null, null, proxyError);
      
      // If it's 401, clear token and throw error for retry mechanism
      if (proxyError.response?.status === 401) {
        clearToken();
        throw new Error('Authentication failed - token may be expired');
      }
      
      // For other errors, throw directly
      throw proxyError;
    }
  } catch (error) {
    console.error('Machine update failed:', error);
    
    // Log final error if not already logged
    if (!error.message.includes('Authentication failed')) {
      await logApiCall('PUT', `/external-api-crud/machine/${id}`, data, null, null, error);
    }
    
    throw error;
  }
};
export const deleteMachine = async (id) => {
  try {
    console.log(`Deleting machine ${id}`);
    const headers = await getHeaders();
    
    if (!headers.Authorization) {
      const error = new Error('No valid authentication token');
      await logApiCall('DELETE', `/external-api-crud/machine/${id}`, null, null, null, error);
      throw error;
    }
    
    // Use proxy for machine command/delete
    try {
      const response = await axios.delete(`/external-api-crud/machine/${id}`, { headers });
      console.log('Machine deleted successfully via proxy');
      
      // Log successful delete
      await logApiCall('DELETE', `/external-api-crud/machine/${id}`, null, null, response);
      
      return response.data;
    } catch (proxyError) {
      console.warn('Machine delete failed via proxy:', proxyError.message);
      
      // Log proxy error
      await logApiCall('DELETE', `/external-api-crud/machine/${id}`, null, null, null, proxyError);
      
      // If it's 401, clear token and throw error for retry mechanism
      if (proxyError.response?.status === 401) {
        clearToken();
        throw new Error('Authentication failed - token may be expired');
      }
      
      // For other errors, throw directly
      throw proxyError;
    }
  } catch (error) {
    console.error('Machine deletion failed:', error);
    
    // Log final error if not already logged
    if (!error.message.includes('Authentication failed')) {
      await logApiCall('DELETE', `/external-api-crud/machine/${id}`, null, null, null, error);
    }
    
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
        const result = { data: [] };
        return result;
      }
      
      // Use proxy for vendor query API
      try {
        console.log("Fetching vendors via proxy...");
        const response = await axios.get("/external-api/vendor/query", { headers });
        console.log(`Vendors fetched via proxy, filtering for ${type}...`);
        
        return filterVendorsByType(response.data, type);
      } catch (proxyError) {
        console.warn(`Vendor API failed for type ${type}:`, proxyError.message);
        
        // If it's a 401 error, clear token and retry
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        console.error(`Vendor fetch failed for type ${type}:`, proxyError.message);
        return { data: [] };
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
      
      // Use proxy for branch query API
      try {
        console.log("Fetching branches via proxy...");
        const response = await axios.get("/external-api/branch/query", { headers });
        console.log(`Branch data fetched via proxy`);
        return response.data;
      } catch (proxyError) {
        console.warn(`Branch API failed for type ${type}:`, proxyError.message);
        
        // If it's a 401 error, clear token and retry
        if (proxyError.response?.status === 401 && retryCount === 0) {
          console.log("Got 401 error, clearing token and retrying...");
          clearToken();
          retryCount++;
          continue;
        }
        
        console.error(`Branch fetch failed for type ${type}:`, proxyError.message);
        return { data: [] };
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
        console.log("Service locations fetched via proxy", response.data);
        
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
        
        console.error("Service location fetch failed:", proxyError.message);
        return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
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
    
    // Log successful create
    await logApiCall('POST', '/external-api-crud/service-location', data, null, response);
    
    return response.data;
  } catch (error) {
    console.error("Service location creation failed:", error.message);
    
    // Log error
    await logApiCall('POST', '/external-api-crud/service-location', data, null, null, error);
    
    throw error;
  }
};

export const updateServiceLocation = async (id, data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`/external-api-crud/service-location/${id}`, data, { headers });
    console.log("Service location updated successfully");
    
    // Log successful update
    await logApiCall('PUT', `/external-api-crud/service-location/${id}`, data, null, response);
    
    return response.data;
  } catch (error) {
    console.error("Service location update failed:", error.message);
    
    // Log error
    await logApiCall('PUT', `/external-api-crud/service-location/${id}`, data, null, null, error);
    
    throw error;
  }
};

// ===== VENDOR CRUD API =====
export const createVendor = async (data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.post("/external-api-crud/vendor", data, { headers });
    console.log("Vendor created successfully");
    
    // Log successful create
    await logApiCall('POST', '/external-api-crud/vendor', data, null, response);
    
    return response.data;
  } catch (error) {
    console.error("Vendor creation failed:", error.message);
    
    // Log error
    await logApiCall('POST', '/external-api-crud/vendor', data, null, null, error);
    
    throw error;
  }
};

export const updateVendor = async (id, data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`/external-api-crud/vendor/${id}`, data, { headers });
    console.log("Vendor updated successfully");
    
    // Log successful update
    await logApiCall('PUT', `/external-api-crud/vendor/${id}`, data, null, response);
    
    return response.data;
  } catch (error) {
    console.error("Vendor update failed:", error.message);
    
    // Log error
    await logApiCall('PUT', `/external-api-crud/vendor/${id}`, data, null, null, error);
    
    throw error;
  }
};

// ===== BRANCH UPDATE API =====
export const updateBranch = async (id, data) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`/external-api-crud/branch/${id}`, data, { headers });
    console.log("Branch updated successfully");
    
    // Log successful update
    await logApiCall('PUT', `/external-api-crud/branch/${id}`, data, null, response);
    
    return response.data;
  } catch (error) {
    console.error("Branch update failed:", error.message);
    
    // Log error
    await logApiCall('PUT', `/external-api-crud/branch/${id}`, data, null, null, error);
    
    throw error;
  }
};