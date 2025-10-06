import backendExtApi from '../api/backendExtApi';

/**
 * Check if account has Auto Deduct billing method
 * @param {Object} accountData - Account data with revenue rules
 * @returns {boolean} - True if has Auto Deduct billing method
 */
export const hasAutoDeductBilling = (accountData) => {
  if (!accountData) return false;

  // Check package tiers
  const packageTiers = accountData.packageTiers || accountData.package_tiers || [];
  const hasAutoDeductInPackages = packageTiers.some(tier => {
    // Check direct property
    if (tier.billing_method_type === 'Auto Deduct' || tier.billingMethodType === 'Auto Deduct') {
      return true;
    }
    
    // Check in rule_value or rule_path
    if (tier.rule_value && typeof tier.rule_value === 'string') {
      return tier.rule_value.toLowerCase().includes('auto deduct') || 
             tier.rule_value.toLowerCase().includes('auto_deduct');
    }
    
    return false;
  });

  // Check add-ons
  const addOns = accountData.addOns || accountData.add_ons || [];
  const hasAutoDeductInAddOns = addOns.some(addon => {
    // Check direct property
    if (addon.billing_method_type === 'Auto Deduct' || addon.billingMethodType === 'Auto Deduct') {
      return true;
    }
    
    // Check in rule_value or rule_path
    if (addon.rule_value && typeof addon.rule_value === 'string') {
      return addon.rule_value.toLowerCase().includes('auto deduct') || 
             addon.rule_value.toLowerCase().includes('auto_deduct');
    }
    
    return false;
  });

  // Check services revenue rules directly
  const services = accountData.services || [];
  const hasAutoDeductInServices = services.some(service => {
    if (!service.revenue_rules || !Array.isArray(service.revenue_rules)) return false;
    
    return service.revenue_rules.some(rule => {
      // Check for billing method type in various fields
      const hasAutoDeductInRule = [
        rule.rule_value,
        rule.rule_path,
        rule.rule_category
      ].some(field => {
        if (typeof field === 'string') {
          const lowerField = field.toLowerCase();
          return lowerField.includes('auto deduct') || 
                 lowerField.includes('auto_deduct') ||
                 lowerField.includes('autodeduct');
        }
        return false;
      });
      
      return hasAutoDeductInRule;
    });
  });

  console.log('🔍 Auto Deduct Check Results:', {
    accountName: accountData.name,
    hasAutoDeductInPackages,
    hasAutoDeductInAddOns, 
    hasAutoDeductInServices,
    packageTiersCount: packageTiers.length,
    addOnsCount: addOns.length,
    servicesCount: services.length
  });

  return hasAutoDeductInPackages || hasAutoDeductInAddOns || hasAutoDeductInServices;
};

/**
 * Helper function to resolve parent account UUID from parent_id
 * @param {string} parentId - Parent account ID
 * @returns {Promise<string|null>} - Parent account's uuid_be or null
 */
export const resolveParentUuid = async (parentId) => {
  if (!parentId) {
    return null;
  }
  
  try {
    console.log('🔍 Resolving parent UUID for ID:', parentId);
    
    // This would call your account API to get the parent account's uuid_be
    // For now, returning the parentId as-is since the server should handle the resolution
    // TODO: Implement actual API call to get account by ID and return uuid_be field
    
    /*
    const parentAccount = await accountApi.getAccountById(parentId);
    if (parentAccount && parentAccount.uuid_be) {
      console.log('✅ Found parent UUID:', parentAccount.uuid_be);
      return parentAccount.uuid_be;
    }
    */
    
    console.log('ℹ️ Using parent_id as-is, server should resolve UUID');
    return parentId;
  } catch (error) {
    console.error('❌ Error resolving parent UUID:', error);
    return null;
  }
};

/**
 * Transform account data to customer command format with updated mapping
 * @param {Object} accountData - Account data from form
 * @returns {Object} - Transformed data for customer command API
 */
export const transformAccountToCustomerCommand = (accountData) => {
  console.log('🔄 Transforming account data:', accountData);
  
  try {
    // Find owner PIC (is_owner = true)
    const pics = accountData.pics || accountData.account_pic || [];
    const ownerPic = pics.find(pic => pic.is_owner === true) || {};
    
    // Find non-owner PICs (is_owner = false or not specified)
    const nonOwnerPics = pics.filter(pic => pic.is_owner !== true) || [];
    
    // Get primary address (is_primary = true)
    const addresses = accountData.addresses || accountData.account_address || [];
    const primaryAddress = addresses.find(addr => addr.is_primary === true) || addresses[0] || {};
    
    // Get parent account UUID if parent_id exists
    let parentUuidBe = null;
    if (accountData.parent_id) {
      // This would need to be fetched from the parent account's uuid_be field
      // For now, we'll pass the parent_id as-is and it should be resolved server-side
      parentUuidBe = accountData.parent_id;
    }
    
    // Transform main customer data according to new mapping
    const customer = {
      name: accountData.name || '', // getAccount.data.name
      email: accountData.email || '', // getAccount.data.email
      msisdn: accountData.phone_no ? (accountData.phone_no.startsWith('+') ? accountData.phone_no : `+${accountData.phone_no.startsWith('0') ? '62' + accountData.phone_no.slice(1) : accountData.phone_no}`) : '', // getAccount.data.phone_no dengan format msisdn
      address: {
        building: primaryAddress.address1 || '', // getAccount.data.account_address.address1 when is_primary = true
        street: primaryAddress.address2 || '', // getAccount.data.account_address.address2 when is_primary = true
        region: primaryAddress.sub_district || '', // getAccount.data.account_address.sub_district when is_primary = true
        city: primaryAddress.city || '', // getAccount.data.account_address.city when is_primary = true
        state: primaryAddress.province || '', // getAccount.data.account_address.province when is_primary = true
        country: primaryAddress.country || 'Indonesia', // getAccount.data.account_address.country when is_primary = true
        zip_code: primaryAddress.postalcode || '' // getAccount.data.account_address.postalcode when is_primary = true
      },
      deduction_active_type: "nominal",
      customer_role: (accountData.account_type && accountData.account_type.name) || "branch", // getAccount.data.account_type.name
      parent_id: (accountData.parent && accountData.parent.id) || null, // getAccount.data.parent.id
      customer_type: accountData.type_of_business_detail || "INDIVIDUAL", // getAccount.data.type_of_business_detail
      ktp: ownerPic.no_ktp || '', // getAccount.data.account_pic.no_ktp when is_owner = true
      npwp: ownerPic.no_npwp || '' // getAccount.data.account_pic.no_npwp when is_owner = true
    };

    // Add validation logs for debugging
    console.log('🔍 Customer validation:', {
      name: customer.name,
      email: customer.email,
      msisdn: customer.msisdn,
      hasAddress: !!(customer.address.city || customer.address.state),
      customer_role: customer.customer_role,
      customer_type: customer.customer_type
    });

    // Transform tier data from getAccountPackageTier
    const packageTiers = accountData.package_tiers || accountData.packageTiers || [];
    const tier = [];
    packageTiers.forEach(packageTier => {
      tier.push({
        tier_type: packageTier.percentage === false ? 'nominal' : 'percentage', // getAccountPackageTier.data[].percentage == false ? 'nominal' : 'percentage'
        tier_category: "discount",
        min_amount: parseFloat(packageTier.min_value) || 0, // getAccountPackageTier.data[].min_value
        max_amount: parseFloat(packageTier.max_value) || 0, // getAccountPackageTier.data[].max_value
        fee: parseFloat(packageTier.amount) || 0, // getAccountPackageTier.data[].amount
        valid_from: packageTier.start_date ? `${packageTier.start_date}T00:00:00` : new Date().toISOString(), // getAccountPackageTier.data[].start_date
        valid_to: packageTier.end_date ? `${packageTier.end_date}T23:59:59` : "2050-12-31T23:59:59" // getAccountPackageTier.data[].end_date
      });
    });

    // Transform customer crew (non-owner PIC data)
    const customerCrew = [];
    nonOwnerPics.forEach(pic => {
      customerCrew.push({
        ktp: pic.no_ktp || '', // getAccount.data.account_pic[].no_ktp
        npwp: pic.no_npwp || '', // getAccount.data.account_pic[].no_npwp
        name: pic.name || '', // getAccount.data.account_pic[].name
        msisdn: pic.phone_no ? (pic.phone_no.startsWith('+') ? pic.phone_no : `+${pic.phone_no.startsWith('0') ? '62' + pic.phone_no.slice(1) : pic.phone_no}`) : '', // getAccount.data.account_pic[].phone_no dengan format msisdn
        email: pic.email || '', // getAccount.data.account_pic[].email
        username: pic.username || pic.name?.toLowerCase().replace(/\s+/g, '') || `user${Date.now()}` // getAccount.data.account_pic[].username
      });
    });

    // Transform beneficiary account (bank data)
    let beneficiaryAccount = null;
    const banks = accountData.banks || accountData.account_bank || [];
    if (banks && banks.length > 0) {
      const primaryBank = banks[0];
      
      // Parse nama lengkap jika firstname/lastname kosong
      let firstname = primaryBank.bank_account_holder_firstname || '';
      let lastname = primaryBank.bank_account_holder_lastname || '';
      
      if ((!firstname || !lastname) && primaryBank.bank_account_holder_name) {
        const nameParts = primaryBank.bank_account_holder_name.split(' ');
        if (nameParts.length >= 2) {
          firstname = firstname || nameParts[0];
          lastname = lastname || nameParts.slice(1).join(' ');
        } else {
          firstname = firstname || nameParts[0] || 'Unknown';
          lastname = lastname || 'User';
        }
      }
      
      beneficiaryAccount = {
        firstname: firstname || 'Unknown', // getAccount.data.account_bank.bank_account_holder_firstname
        lastname: lastname || 'User', // getAccount.data.account_bank.bank_account_holder_lastname
        bank: {
          id: (primaryBank.bank && primaryBank.bank.uuid_be) || primaryBank.bank_id || '' // getAccount.data.account_bank.bank.uuid_be
        },
        account_number: primaryBank.bank_account_no || '', // getAccount.data.account_bank.bank_account_no
        account_name: primaryBank.bank_account_holder_name || '', // getAccount.data.account_bank.bank_account_holder_name
        account_type: {
          id: "3" // sementara kosongkan
        },
        customer_type: {
          id: "2" // sementara kosongkan
        },
        customer_status: {
          id: "1" // sementara kosongkan
        },
        region_code: {
          id: "1" // sementara kosongkan
        },
        country_code: {
          id: "IDN" // sementara kosongkan
        }
      };
    }

    // Transform branch data - use main account data only (not from account_tree)
    const result = {
      customer,
      tier,
      "tier-assignment": {
        "data": [
          {
            "id": "41fba461-8718-4549-9ac6-12cc3d153aaa" // fixed ID as requested
          }
        ]
      },
      "customer-crew": customerCrew,
      "beneficiary-account": beneficiaryAccount,
      branch: {
        name: accountData.name || '', // getAccount.data.name
        code: accountData.account_no || '', // getAccount.data.account_no
        address: {
          building: primaryAddress.address1 || '', // getAccount.data.account_address.address1 when is_primary = true
          street: primaryAddress.address2 || '', // getAccount.data.account_address.address2 when is_primary = true
          region: primaryAddress.sub_district || '', // getAccount.data.account_address.sub_district when is_primary = true
          city: primaryAddress.city || '', // getAccount.data.account_address.city when is_primary = true
          state: primaryAddress.province || '', // getAccount.data.account_address.province when is_primary = true
          country: primaryAddress.country || 'Indonesia', // getAccount.data.account_address.country when is_primary = true
          zip_code: primaryAddress.postalcode || '' // getAccount.data.account_address.postalcode when is_primary = true
        }
      }
    };

  // Validate required fields
  const validation = {
    customer_name: !!result.customer.name,
    customer_address: !!(result.customer.address.city || result.customer.address.state),
    branch_data: !!(result.branch && result.branch.name)
  };

  console.log('🔍 Data validation:', validation);

  // Add default values for missing critical fields
  if (!result.customer.customer_type) {
    result.customer.customer_type = 'INDIVIDUAL';
  }

  if (!result.customer.address.country) {
    result.customer.address.country = 'Indonesia';
  }

  // Ensure branch has required fields
  if (result.branch) {
    result.branch = {
      ...result.branch,
      name: result.branch.name || 'Default Branch',
      code: result.branch.code || 'BR001',
      address: {
        ...result.branch.address,
        country: result.branch.address.country || 'Indonesia'
      }
    };
  }

  console.log('✅ Transformed data:', result);
  return result;
  
  } catch (error) {
    console.error('❌ Error in transformAccountToCustomerCommand:', error);
    
    // Return minimal structure on error
    return {
      customer: {
        name: accountData.name || '',
        email: '',
        msisdn: '',
        address: {
          building: '',
          street: '',
          region: '',
          city: '',
          state: '',
          country: 'Indonesia',
          zip_code: ''
        },
        customer_type: 'INDIVIDUAL',
        ktp: '',
        npwp: ''
      },
      "customer-crew": [],
      "beneficiary-account": null,
      branch: {
        name: accountData.name || 'Default Branch',
        code: accountData.account_no || 'BR001',
        address: {
          building: '',
          street: '',
          region: '',
          city: '',
          state: '',
          country: 'Indonesia',
          zip_code: ''
        }
      }
    };
  }
};

/**
 * Sync customer data to external API
 * @param {Object} accountData - Account data
 * @param {string} configId - Backend ext config ID (optional, will use active config)
 * @returns {Promise<Object>} - API response
 */
export const syncCustomerToExternalApi = async (accountData, configId = null, userId = null, accountId = null) => {
  try {
    console.log('🔄 Starting customer sync to external API...');

    // Get active backend ext config if not provided
    let targetConfigId = configId;
    if (!targetConfigId) {
      const activeConfigs = await backendExtApi.getActiveConfigs();
      console.log('📥 Active configs response:', activeConfigs);
      
      // Handle different response structures
      let configsData = [];
      if (activeConfigs && activeConfigs.success && activeConfigs.data) {
        if (activeConfigs.data.data && Array.isArray(activeConfigs.data.data)) {
          // Nested structure: response.data.data
          configsData = activeConfigs.data.data;
        } else if (Array.isArray(activeConfigs.data)) {
          // Direct array: response.data
          configsData = activeConfigs.data;
        }
      } else if (activeConfigs && Array.isArray(activeConfigs)) {
        // Direct array response
        configsData = activeConfigs;
      }
      
      console.log('📊 Processed configs data:', configsData);
      
      if (!Array.isArray(configsData) || configsData.length === 0) {
        throw new Error('No active backend external configuration found');
      }
      
      // Find Customer Command API config
      const customerConfig = configsData.find(config => 
        config.name.toLowerCase().includes('customer') || 
        config.url?.includes('/customer/command')
      );
      
      if (!customerConfig) {
        throw new Error('Customer Command API configuration not found');
      }
      
      targetConfigId = customerConfig.id;
      console.log('✅ Using config:', customerConfig.name, 'ID:', targetConfigId);
    }

    // Transform account data to customer command format
    const customerCommandData = transformAccountToCustomerCommand(accountData);

    console.log('📤 Sending customer data to external API:', {
      configId: targetConfigId,
      customerName: customerCommandData.customer.name,
      customerCrewCount: customerCommandData['customer-crew'].length,
      hasBeneficiaryAccount: !!customerCommandData['beneficiary-account'],
      customerEmail: customerCommandData.customer.email,
      customerPhone: customerCommandData.customer.msisdn,
      branchName: customerCommandData.branch?.name || 'N/A'
    });

    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // Make API request
        response = await backendExtApi.makeSimplifiedApiRequest({
          config_id: targetConfigId,
          data: customerCommandData,
          user_id: userId,
          account_id: accountId
        });

        console.log('✅ Customer sync completed successfully:', response);
        
        // Check if the response contains nested error from external API BEFORE breaking
        if (response && response.data && response.data.data && response.data.data.success === false) {
          console.error('❌ External API returned error:', response.data.data.error);
          
          const externalError = response.data.data.error;
          
          // Debug logging for error structure
          console.log('🔍 External error analysis:', {
            status: externalError.status,
            message: externalError.message,
            dataError: externalError.data?.error,
            retryCount: retryCount,
            maxRetries: maxRetries
          });
          
          // Check if this is a 403 token error from external API that should trigger retry
          const isExternalTokenError = (externalError.status === 403 && retryCount < maxRetries) ||
                                       (externalError.data?.error?.toLowerCase()?.includes('forbidden') && retryCount < maxRetries) ||
                                       (externalError.data?.error?.toLowerCase()?.includes('token') && retryCount < maxRetries) ||
                                       (externalError.message?.toLowerCase()?.includes('403') && retryCount < maxRetries) ||
                                       (externalError.message?.toLowerCase()?.includes('forbidden') && retryCount < maxRetries) ||
                                       (externalError.message?.toLowerCase()?.includes('token') && retryCount < maxRetries);
          
          console.log('🔍 Is external token error?', isExternalTokenError);
          
          if (isExternalTokenError) {
            console.log('🔄 External API token error detected, attempting to refresh token and retry...');
            
            try {
              // Clear token cache with progressive strategy
              if (retryCount === 0) {
                console.log('🧹 Clearing specific config cache...');
                await backendExtApi.clearCacheForConfig(targetConfigId);
              } else {
                console.log('🧹 Clearing all cache...');
                await backendExtApi.clearAllCache();
              }
              
              // Progressive retry delay
              const retryDelay = (retryCount + 1) * 2000; // 2s, 4s
              console.log(`⏳ Waiting ${retryDelay/1000}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              
              retryCount++;
              console.log(`🔄 Retrying customer sync (attempt ${retryCount + 1}/${maxRetries + 1})...`);
              
              // Throw a special error to trigger retry in outer catch block
              const retryError = new Error('External API token error - retry requested');
              retryError.isRetryRequested = true;
              throw retryError;
            } catch (recoveryError) {
              if (recoveryError.isRetryRequested) {
                throw recoveryError; // Re-throw retry request
              }
              console.warn('⚠️ Could not recover from external API token error:', recoveryError.message);
              retryCount++;
              const retryError = new Error('External API token error - retry requested');
              retryError.isRetryRequested = true;
              throw retryError;
            }
          }
          
          // Not a token error, process as regular external API error
          let errorMessage = 'External API error';
          
          if (externalError.data && externalError.data.message) {
            if (typeof externalError.data.message === 'object') {
              errorMessage = externalError.data.message.message || 'External API error';
            } else {
              errorMessage = externalError.data.message;
            }
          } else if (externalError.message) {
            errorMessage = externalError.message;
          }
          
          return {
            success: false,
            error: `External API Error: ${errorMessage}`,
            details: externalError,
            customerData: customerCommandData
          };
        }
        
        break; // Success, exit retry loop

      } catch (apiError) {
        console.error(`❌ API request failed (attempt ${retryCount + 1}):`, {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message
        });

        // Check if it's a retry request or a regular 403 token error
        const isTokenError = apiError.isRetryRequested ||
                            apiError.response?.status === 403 || 
                            (apiError.response?.data && (
                              apiError.response.data.error?.toLowerCase()?.includes('token') ||
                              apiError.response.data.error?.toLowerCase()?.includes('forbidden') ||
                              apiError.response.data.error?.toLowerCase()?.includes('unauthorized') ||
                              apiError.response.data.message?.toLowerCase()?.includes('token') ||
                              apiError.response.data.message?.toLowerCase()?.includes('forbidden')
                            )) ||
                            apiError.message?.toLowerCase()?.includes('403') ||
                            apiError.message?.toLowerCase()?.includes('forbidden');

        if (isTokenError && retryCount < maxRetries) {
          console.log('🔄 Token error detected, attempting to refresh token and retry...');
          
          // If this is a retry request from external API token error, the cache clearing was already done
          if (apiError.isRetryRequested) {
            console.log('🔄 External token error retry - cache already cleared, proceeding with retry');
            continue;
          }
          
          try {
            // Clear cache for this config to force token refresh on next request
            console.log(`🧹 Clearing cache for config: ${targetConfigId}`);
            await backendExtApi.clearCacheForConfig(targetConfigId);
            console.log('✅ Cache cleared successfully');
            
            // Also try clearing all cache if specific config cache clear doesn't work
            if (retryCount === 0) {
              console.log('🧹 Also clearing all cache as extra precaution...');
              await backendExtApi.clearAllCache();
              console.log('✅ All cache cleared successfully');
            }
            
            // Wait longer before retry to allow backend to get fresh token
            const retryDelay = (retryCount + 1) * 2000; // 2s, 4s delays
            console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            retryCount++;
            console.log(`🔄 Retrying API call (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            continue; // Retry the API call
          } catch (recoveryError) {
            console.warn('⚠️ Could not recover from token error:', recoveryError.message);
            retryCount++;
            continue;
          }
        } else {
          // Not a token error or max retries exceeded
          throw apiError;
        }
      }
    }

    return {
      success: true,
      response: response,
      customerData: customerCommandData
    };

  } catch (error) {
    console.error('❌ Customer sync failed:', error);
    
    // Enhanced error handling for different types of errors
    let errorMessage = error.message || 'Unknown error occurred';
    let errorDetails = error.response?.data || error;

    // Check for specific error types
    if (error.response?.status === 403) {
      errorMessage = 'Authentication failed: OAuth token expired or invalid. The system attempted to refresh the token automatically but failed. Please try again or contact administrator if the issue persists.';
      
      // Add more specific information for 403 errors
      if (error.response?.data?.error?.toLowerCase()?.includes('token')) {
        errorMessage += ' Token refresh may be needed at backend level.';
      }
    } else if (error.response?.status === 401) {
      errorMessage = 'Unauthorized: Please check external API credentials and configuration.';
    } else if (error.response?.status === 404) {
      errorMessage = 'External API endpoint not found. Please check configuration URL.';
    } else if (error.response?.status === 500) {
      errorMessage = 'External API server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout: External API took more than 2 minutes to respond. This may indicate heavy server load. Please try again in a few minutes.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection failed: Cannot reach external API server.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
      customerData: error.response ? null : transformAccountToCustomerCommand(accountData) // Include customer data if not a response error
    };
  }
};

/**
 * Utility to check backend ext configurations
 * @returns {Promise<Array>} - List of available configurations
 */
export const getAvailableBackendConfigs = async () => {
  try {
    const response = await backendExtApi.getActiveConfigs();
    return response.success ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch backend configurations:', error);
    return [];
  }
};

export default {
  transformAccountToCustomerCommand,
  syncCustomerToExternalApi,
  getAvailableBackendConfigs
};
