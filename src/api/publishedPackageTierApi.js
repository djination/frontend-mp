import axiosInstance from '../config/axiosInstance';
import axios from 'axios';

// OAuth Token Management (with fallback for development)
const OAUTH_CONFIG = {
  clientId: import.meta.env.REACT_APP_OAUTH_CLIENT_ID || "bmp-admin-credential-id",
  clientSecret: import.meta.env.REACT_APP_OAUTH_CLIENT_SECRET || "bmp-admin-credential-secret",
  grantType: "client_credentials",
  scope: "admin.internal.read admin.internal.create",
  tokenUrl: "/oauth/token" // Use proxy instead of direct URL
};

let cachedToken = null;
let tokenExpiry = null;

const getAuthToken = async () => {
  if (cachedToken && tokenExpiry && new Date() < new Date(tokenExpiry)) {
    return cachedToken;
  }

  // Try OAuth first
  try {
    const params = new URLSearchParams();
    params.append("grant_type", OAUTH_CONFIG.grantType);
    params.append("scope", OAUTH_CONFIG.scope);

    // Create Basic Auth header
    const credentials = btoa(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`);
    
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
      timeout: 5000  // Short timeout for OAuth
    });
    
    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;
      tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
      
      return cachedToken;
    }
    
    throw new Error("No access_token in response");
    
  } catch (error) {
    console.warn("⚠️ OAuth failed, using development fallback:", error.message);
    
    // Fallback for development: generate a mock token
    cachedToken = "dev_token_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    tokenExpiry = new Date(Date.now() + (3600 * 1000)); // 1 hour
    
    return cachedToken;
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

// Published Package Tier API endpoints
export const createPublishedPackageTier = async (tierData) => {
  try {
    const response = await axiosInstance.post('/published-package-tiers', tierData);
    return response.data;
  } catch (error) {
    console.error('Error creating published package tier:', error);
    throw error;
  }
};

export const getPublishedPackageTiers = async () => {
  try {
    const response = await axiosInstance.get('/published-package-tiers');
    return response.data;
  } catch (error) {
    console.error('Error fetching published package tiers:', error);
    throw error;
  }
};

export const getPublishedPackageTier = async (tierId) => {
  try {
    const response = await axiosInstance.get(`/published-package-tiers/${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching published package tier:', error);
    throw error;
  }
};

export const updatePublishedPackageTier = async (tierId, updateData) => {
  try {
    const response = await axiosInstance.patch(`/published-package-tiers/${tierId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating published package tier:', error);
    throw error;
  }
};

export const updatePublishedPackageTierUuidBe = async (tierId, uuidBe) => {
  try {
    const response = await axiosInstance.patch(`/published-package-tiers/${tierId}/uuid-be`, {
      uuid_be: uuidBe
    });
    return response.data;
  } catch (error) {
    console.error('Error updating published package tier uuid_be:', error);
    throw error;
  }
};

export const deletePublishedPackageTier = async (tierId) => {
  try {
    const response = await axiosInstance.delete(`/published-package-tiers/${tierId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting published package tier:', error);
    throw error;
  }
};

export const createBulkPublishedPackageTiers = async (tiers) => {
  try {
    const response = await axiosInstance.post('/published-package-tiers/bulk', tiers);
    return response.data;
  } catch (error) {
    console.error('Error creating bulk published package tiers:', error);
    throw error;
  }
};

export const uploadPublishedPackageTiers = async (formData) => {
  try {
    const response = await axiosInstance.post('/published-package-tiers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading published package tiers:', error);
    throw error;
  }
};

// Audit trail functionality for external API sync
const logApiCall = async (method, url, data = null, response = null, error = null) => {
  try {
    console.log('📝 Audit trail (sync):', {
      method,
      url,
      status: response?.status || error?.response?.status,
      timestamp: new Date().toISOString()
    });

    // Format data sesuai dengan struktur backend audit trail logs (sama seperti machine API)
    const logData = {
      app_name: 'frontend',
      feature_name: 'published-package-tier-sync',
      method: method.toUpperCase(),
      url: url,
      endpoint: url.split('?')[0], // Extract endpoint without query params
      request_data: data || null, // Send as object, not JSON string
      request_params: null, // No query params for sync operations
      response_status: response?.status || error?.response?.status || null,
      response_data: response?.data || null, // Send as object, not JSON string
      error_message: error?.message || null,
      execution_time_ms: null, // Will be calculated by backend or set to null
      user_agent: navigator.userAgent,
      ip_address: null, // Will be extracted from request on backend
      session_id: null // Optional field
    };

    const auditResponse = await axios.post('/backend-ext/audit-logs', logData, {
      headers: { 
        'Content-Type': 'application/json',
        ...(await getHeaders()), // Include JWT Authorization header
      },
      timeout: 5000,
      validateStatus: (status) => status < 500 // Don't throw on 401, only on server errors
    });

    console.log('✅ Audit trail logged successfully:', auditResponse.status);
  } catch (auditError) {
    console.warn('⚠️ Failed to log audit trail:', auditError.message);
  }
};

// Transform tier data for external API
const transformTierForExternal = (tier, isUpdate = false) => {
  const tierType = tier.percentage == false ? 'nominal' : 'percentage';
  const fee = tier.amount;

  const baseData = {
    tier_type: tierType,
    tier_category: 'regular',
    min_amount: tier.min_value,
    max_amount: tier.max_value,
    fee: fee,
    valid_from: tier.start_date,
    valid_to: tier.end_date
  };

  if (isUpdate) {
    return {
      tier_id: tier.uuid_be,
      update_data: baseData
    };
  }

  return baseData;
};

// Sync tiers to external API
export const syncTiersToExternal = async (tiers = null) => {
  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  try {
    // Fetch tiers if not provided
    if (!tiers) {
      console.log('🔄 Fetching published package tiers for sync...');
      const response = await getPublishedPackageTiers();
      tiers = response.data || response;
      
      if (!Array.isArray(tiers)) {
        tiers = [];
      }
    }

    // Ensure tiers is an array
    if (!Array.isArray(tiers)) {
      throw new Error('Invalid tiers data: expected array');
    }

    console.log(`🔄 Starting sync process for ${tiers.length} tiers`);

    // Separate tiers by uuid_be status
    const newTiers = tiers.filter(tier => !tier.uuid_be);
    const existingTiers = tiers.filter(tier => tier.uuid_be);

    // Handle POST requests for new tiers
    if (newTiers.length > 0) {
      try {
        const postData = newTiers.map(tier => transformTierForExternal(tier, false));
        
        console.log('🔄 Syncing new tiers to external API:', postData);
        
        const response = await axios.post(
          '/external-api-crud/tiers/bulk',
          postData,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(await getHeaders()), // Include JWT Authorization header
            },
            timeout: 60000
          }
        );

        console.log('✅ POST sync successful:', response.data);
        
        // Update local tier records with returned uuid_be from external API
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
          console.log('🔄 Updating local tier records with uuid_be...');
          
          let successCount = 0;
          let failedCount = 0;
          
          for (const result of response.data.results) {
            if (result.status === 'success' && result.data && result.data.id && typeof result.index === 'number') {
              const originalTier = newTiers[result.index];
              
              if (originalTier && originalTier.id) {
                try {
                  // Use dedicated endpoint for updating uuid_be only
                  await updatePublishedPackageTierUuidBe(originalTier.id, result.data.id);
                  console.log(`✅ Updated tier ${originalTier.id} with uuid_be: ${result.data.id} (index: ${result.index})`);
                  successCount++;
                } catch (updateError) {
                  console.warn(`⚠️ Failed to update tier ${originalTier.id} with uuid_be:`, updateError.response?.data?.error || updateError.message);
                  failedCount++;
                }
              } else {
                console.warn(`⚠️ Original tier not found for index ${result.index}`);
                failedCount++;
              }
            }
          }
          
          console.log(`📊 UUID_BE Update Summary: ${successCount} success, ${failedCount} failed`);
          
          // Show user notification about partial success
          if (failedCount > 0 && successCount > 0) {
            console.warn(`⚠️ Partial success: ${successCount}/${successCount + failedCount} tiers updated with uuid_be`);
          }
        }
        
        // Log audit trail for successful POST
        await logApiCall('POST', '/external-api-crud/tiers/bulk', postData, response, null);
        
        results.success += newTiers.length;
        results.details.push({
          type: 'POST',
          count: newTiers.length,
          status: 'success',
          message: 'New tiers synced successfully'
        });

        // TODO: Update local tier records with returned uuid_be from external API
        // This would require updating the backend to accept uuid_be updates
        
      } catch (error) {
        console.error('❌ POST sync failed:', error);
        
        // Log audit trail for failed POST
        await logApiCall('POST', '/external-api-crud/tiers/bulk', 
          newTiers.map(tier => transformTierForExternal(tier, false)), null, error);
        
        results.failed += newTiers.length;
        results.details.push({
          type: 'POST',
          count: newTiers.length,
          status: 'failed',
          message: error.response?.data?.message || error.message
        });
      }
    }

    // Handle PUT requests for existing tiers
    if (existingTiers.length > 0) {
      try {
        const putData = existingTiers.map(tier => transformTierForExternal(tier, true));
        
        console.log('🔄 Updating existing tiers in external API:', putData);
        
        const response = await axios.put(
          '/external-api-crud/tiers/bulk',
          putData,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(await getHeaders()), // Include JWT Authorization header
            },
            timeout: 60000
          }
        );

        console.log('✅ PUT sync successful:', response.data);
        
        // Log audit trail for successful PUT
        await logApiCall('PUT', '/external-api-crud/tiers/bulk', putData, response, null);
        
        results.success += existingTiers.length;
        results.details.push({
          type: 'PUT',
          count: existingTiers.length,
          status: 'success',
          message: 'Existing tiers updated successfully'
        });
        
      } catch (error) {
        console.error('❌ PUT sync failed:', error);
        
        // Log audit trail for failed PUT
        await logApiCall('PUT', '/external-api-crud/tiers/bulk', 
          existingTiers.map(tier => transformTierForExternal(tier, true)), null, error);
        
        results.failed += existingTiers.length;
        results.details.push({
          type: 'PUT',
          count: existingTiers.length,
          status: 'failed',
          message: error.response?.data?.message || error.message
        });
      }
    }

    return results;
    
  } catch (error) {
    console.error('❌ Sync process failed:', error);
    throw error;
  }
};
