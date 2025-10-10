import backendExtApi from '../api/backendExtApi';
import { updateAccount } from '../api/accountApi';
import { updatePackageTier } from '../api/packageTierApi';
import { updateAccountPIC } from '../api/accountPICApi';
import { validateCustomerCommandData, formatDataForPreview, generateDebugReport } from './debugUtils';

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
 * Calculate deduction_active_type based on method type and percentage count
 * @param {Object} accountData - Account data with revenue rules
 * @returns {string|null} - deduction_active_type value or null if not auto deduct
 */
export const calculateDeductionActiveType = (accountData) => {
  if (!accountData) return null;

  // Check if any method type is auto_deduct
  const packageTiers = accountData.package_tiers || [];
  const hasAutoDeduct = packageTiers.some(tier => 
    tier.method_type === 'auto_deduct' || 
    tier.billing_method_type === 'Auto Deduct' ||
    tier.billingMethodType === 'Auto Deduct'
  );

  // If no auto deduct method, return null (don't include deduction_active_type)
  if (!hasAutoDeduct) {
    console.log('🔍 No auto deduct method found, deduction_active_type will be omitted');
    return null;
  }

  // Count percentage = true and percentage = false
  let percentageTrueCount = 0;
  let percentageFalseCount = 0;

  packageTiers.forEach(tier => {
    // Check if this tier has auto deduct method
    const isAutoDeduct = tier.method_type === 'auto_deduct' || 
                        tier.billing_method_type === 'Auto Deduct' ||
                        tier.billingMethodType === 'Auto Deduct';
    
    if (isAutoDeduct) {
      // Check percentage field from ChargingMetricForm
      if (tier.percentage === true) {
        percentageTrueCount++;
      } else {
        percentageFalseCount++;
      }
    }
  });

  console.log('🔍 Percentage count analysis:', {
    percentageTrueCount,
    percentageFalseCount,
    hasAutoDeduct
  });

  // Determine deduction_active_type based on majority
  if (percentageTrueCount > percentageFalseCount) {
    console.log('✅ More percentage=true, setting deduction_active_type to "percentage"');
    return 'percentage';
  } else {
    console.log('✅ More percentage=false, setting deduction_active_type to "nominal"');
    return 'nominal';
  }
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
export const transformAccountToCustomerCommand = (accountData, isUpdate = false) => {
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
    
    // Calculate deduction_active_type based on method type and percentage count
    const deductionActiveType = calculateDeductionActiveType(accountData);
    console.log('🔍 Calculated deduction_active_type:', deductionActiveType);

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
      customer_role: accountData.account_type.name || "branch", // getAccount.data.account_type.name
      parent_id: (accountData.parent_id && accountData.parent.id) || null, // getAccount.data.parent.id
      // customer_type: accountData.type_of_business_detail || "INDIVIDUAL", // getAccount.data.type_of_business_detail
      customer_type: "INDIVIDUAL", // getAccount.data.type_of_business_detail
      ktp: accountData.no_ktp || '', // getAccount.data.no_ktp 
      npwp: accountData.no_npwp || '' // getAccount.data.no_npwp 
    };

    // Add deduction_active_type only if method type is auto_deduct
    if (deductionActiveType) {
      customer.deduction_active_type = deductionActiveType;
      console.log('✅ Added deduction_active_type:', deductionActiveType);
    } else {
      console.log('ℹ️ No deduction_active_type added (no auto deduct method found)');
    }

    // Add ID for PATCH operation
    if (isUpdate && accountData.uuid_be) {
      customer.id = accountData.uuid_be;
      console.log('🔄 PATCH operation: Adding customer ID:', accountData.uuid_be);
    }

    // Add validation logs for debugging
    console.log('🔍 Customer validation:', customer);

    // Transform tier data from getAccountPackageTier
    const packageTiers = accountData.package_tiers || [];
    const tier = [];
    packageTiers.forEach(packageTier => {
      const tierData = {
        tier_type: packageTier.percentage === false ? 'nominal' : 'percentage', // getAccountPackageTier.data[].percentage == false ? 'nominal' : 'percentage'
        tier_category: "discount",
        min_amount: parseFloat(packageTier.min_value) || 0, // getAccountPackageTier.data[].min_value
        max_amount: parseFloat(packageTier.max_value) || 0, // getAccountPackageTier.data[].max_value
        fee: parseFloat(packageTier.amount) || 0, // getAccountPackageTier.data[].amount
        valid_from: packageTier.start_date ? `${packageTier.start_date}T00:00:00` : new Date().toISOString(), // getAccountPackageTier.data[].start_date
        valid_to: packageTier.end_date ? `${packageTier.end_date}T23:59:59` : "2050-12-31T23:59:59" // getAccountPackageTier.data[].end_date
      };

      // Add ID for PATCH operation
      if (isUpdate && packageTier.uuid_be) {
        tierData.id = packageTier.uuid_be;
        console.log('🔄 PATCH operation: Adding tier ID:', packageTier.uuid_be);
      }

      tier.push(tierData);
    });
    console.log('🔍 Tier data:', tier);

    // Transform customer crew (non-owner PIC data)
    const customerCrew = [];
    pics.forEach(pic => {
      const crewData = {
        ktp: pic.no_ktp || '', // getAccount.data.account_pic[].no_ktp
        npwp: pic.no_npwp || '', // getAccount.data.account_pic[].no_npwp
        name: pic.name || '', // getAccount.data.account_pic[].name
        msisdn: pic.phone_no ? (pic.phone_no.startsWith('+') ? pic.phone_no : `+${pic.phone_no.startsWith('0') ? '62' + pic.phone_no.slice(1) : pic.phone_no}`) : '', // getAccount.data.account_pic[].phone_no dengan format msisdn
        email: pic.email || '', // getAccount.data.account_pic[].email
        username: pic.username || pic.name?.toLowerCase().replace(/\s+/g, '') || `user${Date.now()}` // getAccount.data.account_pic[].username
      };

      // Add ID for PATCH operation
      if (isUpdate && pic.uuid_be) {
        crewData.id = pic.uuid_be;
        console.log('🔄 PATCH operation: Adding crew ID:', pic.uuid_be);
      }

      customerCrew.push(crewData);
    });
    console.log('🔍 Customer crew data:', customerCrew);

    // Transform beneficiary account (bank data)
    let beneficiaryAccount = null;
    const banks = accountData.account_bank || [];
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
          id: primaryBank.bank.uuid_be || '' // getAccount.data.account_bank.bank.uuid_be
        },
        account_number: primaryBank.bank_account_no || '', // getAccount.data.account_bank.bank_account_no
        account_name: primaryBank.bank_account_holder_name || '', // getAccount.data.account_bank.bank_account_holder_name
        account_type: {
           id:"1"
        },
        customer_type: {
           id:"2"// sementara kosongkan
        },
        customer_status: {
          id: accountData.is_active ? "1" : "2"
        },
        region_code: {
           id:"31"// DKI Jakarta
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
      // "tier-assignment": {
      //   "data": []
      // },
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

    // Add ID for branch in PATCH operation
    if (isUpdate && accountData.uuid_be) {
      result.branch.id = accountData.uuid_be;
      console.log('🔄 PATCH operation: Adding branch ID:', accountData.uuid_be);
    }

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

  // For PATCH operation, return only tier and tier-assignment data
  if (isUpdate) {
    // Filter out tiers without IDs for tier-assignment
    const validTierIds = result.tier
      .filter(tier => tier.id && tier.id.trim() !== '')
      .map(tier => ({ id: tier.id }));
    
    const patchData = {
      tier: result.tier,
      "tier-assignment": {
        data: validTierIds
      }
    };

    // Add deduction_active_type only if method type is auto_deduct
    if (deductionActiveType) {
      patchData.deduction_active_type = deductionActiveType;
      console.log('✅ Added deduction_active_type to PATCH data:', deductionActiveType);
    } else {
      console.log('ℹ️ No deduction_active_type added to PATCH data (no auto deduct method found)');
    }
    
    console.log('✅ PATCH data (tier only):', patchData);
    console.log('✅ Valid tier IDs for assignment:', validTierIds);
    return patchData;
  }

  console.log('✅ POST data (full structure):', result);
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
 * Debug mode: Validate and preview data without sending to external API
 * @param {Object} accountData - Account data
 * @returns {Object} - Debug information
 */
export const debugCustomerData = async (accountData) => {
  try {
    console.log('🔍 DEBUG MODE: Validating customer data without sending to API...');
    
    // Transform account data to customer command format
    const customerCommandData = transformAccountToCustomerCommand(accountData);
    
    // Validate the transformed data
    const validationResult = validateCustomerCommandData(customerCommandData);
    
    // Format data for preview
    const previewData = formatDataForPreview(customerCommandData);
    
    // Generate debug report
    const debugReport = generateDebugReport(accountData, customerCommandData, validationResult);
    
    console.log('🔍 DEBUG RESULTS:', {
      validationStatus: validationResult.isValid ? 'PASS' : 'FAIL',
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      dataSize: JSON.stringify(customerCommandData).length,
      customerName: customerCommandData.customer?.name || 'N/A'
    });
    
    return {
      success: true,
      mode: 'debug',
      originalData: accountData,
      transformedData: customerCommandData,
      validationResult,
      previewData,
      debugReport,
      summary: {
        canSend: validationResult.isValid,
        totalIssues: validationResult.errors.length + validationResult.warnings.length,
        customerName: customerCommandData.customer?.name || 'N/A',
        dataIntegrity: validationResult.isValid ? 'PASS' : 'FAIL'
      }
    };
    
  } catch (error) {
    console.error('❌ DEBUG MODE ERROR:', error);
    
    return {
      success: false,
      mode: 'debug',
      error: error.message,
      originalData: accountData,
      transformedData: null,
      validationResult: null,
      previewData: null,
      debugReport: null
    };
  }
};

/**
 * Sync customer data to external API
 * @param {Object} accountData - Account data
 * @param {string} configId - Backend ext config ID (optional, will use active config)
 * @param {boolean} debugMode - If true, validate data but don't send to API
 * @returns {Promise<Object>} - API response
 */
export const syncCustomerToExternalApi = async (accountData, configId = null, userId = null, accountId = null, debugMode = false) => {
  try {
    console.log('🔄 Starting customer sync to external API...');

    // If debug mode is enabled, return debug information instead of sending to API
    if (debugMode) {
      console.log('🔍 DEBUG MODE ENABLED: Returning debug information instead of sending to API');
      return await debugCustomerData(accountData);
    }

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

    // Check if this is a create (POST) or update (PATCH) operation
    const isUpdate = accountData.uuid_be && accountData.uuid_be !== null && accountData.uuid_be !== '';
    const operationType = isUpdate ? 'PATCH' : 'POST';
    
    console.log(`🔄 Operation type: ${operationType} (uuid_be: ${accountData.uuid_be})`);

    // Transform account data to customer command format
    const customerCommandData = transformAccountToCustomerCommand(accountData, isUpdate);

    // Log different data based on operation type
    if (isUpdate) {
      console.log('📤 Sending PATCH data to external API:', {
        operationType,
        configId: targetConfigId,
        tierCount: customerCommandData.tier?.length || 0,
        tierAssignmentCount: customerCommandData['tier-assignment']?.data?.length || 0,
        existingUuidBe: accountData.uuid_be
      });
    } else {
      console.log('📤 Sending POST data to external API:', {
        operationType,
        configId: targetConfigId,
        customerName: customerCommandData.customer?.name || 'N/A',
        customerCrewCount: customerCommandData['customer-crew']?.length || 0,
        hasBeneficiaryAccount: !!customerCommandData['beneficiary-account'],
        customerEmail: customerCommandData.customer?.email || 'N/A',
        customerPhone: customerCommandData.customer?.msisdn || 'N/A',
        branchName: customerCommandData.branch?.name || 'N/A'
      });
    }

    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // Make API request with different parameters for PATCH
        const requestData = {
          config_id: targetConfigId,
          data: customerCommandData,
          user_id: userId,
          account_id: accountId
        };

        // For PATCH operation, add the customer UUID to the URL
        if (isUpdate && accountData.uuid_be) {
          requestData.url_suffix = `/api/customer/${accountData.uuid_be}`;
          requestData.method = 'PATCH';
          console.log('🔄 PATCH request with URL suffix:', requestData.url_suffix);
        }

        response = await backendExtApi.makeSimplifiedApiRequest(requestData);

        console.log('✅ Customer sync completed successfully:', response);
        
        // Process the response and update database with external IDs
        try {
          console.log('🔄 Processing external API response for database updates...');
          const processingResult = await processExternalApiResponse(response, accountData, userId);
          
          if (processingResult.success) {
            console.log('✅ Database updates completed:', processingResult);
            response.processingResult = processingResult;
          } else {
            console.warn('⚠️ Some database updates failed:', processingResult);
            
            // Log detailed error information
            if (processingResult.errors && processingResult.errors.length > 0) {
              processingResult.errors.forEach((error, index) => {
                console.error(`❌ Error ${index + 1}:`, error);
              });
            }
            
            response.processingResult = processingResult;
          }
        } catch (processingError) {
          console.error('❌ Error processing response for database updates:', processingError);
          response.processingError = processingError.message;
        }
        
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
        // Helper function to safely check error content
        const checkErrorContent = (errorContent, keywords) => {
          if (!errorContent) return false;
          
          // Handle array of errors
          if (Array.isArray(errorContent)) {
            return errorContent.some(error => {
              const errorText = typeof error === 'string' ? error : 
                               typeof error === 'object' ? JSON.stringify(error) : 
                               String(error);
              return keywords.some(keyword => 
                errorText.toLowerCase().includes(keyword.toLowerCase())
              );
            });
          }
          
          // Handle string error
          if (typeof errorContent === 'string') {
            return keywords.some(keyword => 
              errorContent.toLowerCase().includes(keyword.toLowerCase())
            );
          }
          
          // Handle object error
          if (typeof errorContent === 'object') {
            const errorText = JSON.stringify(errorContent);
            return keywords.some(keyword => 
              errorText.toLowerCase().includes(keyword.toLowerCase())
            );
          }
          
          return false;
        };

        const isTokenError = apiError.isRetryRequested ||
                            apiError.response?.status === 403 || 
                            (apiError.response?.data && (
                              checkErrorContent(apiError.response.data.error, ['token', 'forbidden', 'unauthorized']) ||
                              checkErrorContent(apiError.response.data.message, ['token', 'forbidden'])
                            )) ||
                            checkErrorContent(apiError.message, ['403', 'forbidden']);

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
    
    // Log detailed error information for debugging
    console.error('❌ Detailed error information:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });
    
    // Handle array errors from external API
    if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
      const errorArray = error.response.data.error;
      console.error('❌ External API returned array of errors:', errorArray);
      
      // Convert array errors to readable message
      const readableErrors = errorArray.map((err, index) => {
        if (typeof err === 'string') {
          return `${index + 1}. ${err}`;
        } else if (typeof err === 'object' && err.message) {
          return `${index + 1}. ${err.message}`;
        } else {
          return `${index + 1}. ${JSON.stringify(err)}`;
        }
      }).join('\n');
      
      errorMessage = `External API validation errors:\n${readableErrors}`;
      errorDetails = {
        ...errorDetails,
        readableErrors: readableErrors,
        errorArray: errorArray
      };
    }

    // Check for specific error types
    if (error.response?.status === 403) {
      errorMessage = 'Authentication failed: OAuth token expired or invalid. The system attempted to refresh the token automatically but failed. Please try again or contact administrator if the issue persists.';
      
      // Add more specific information for 403 errors
      if (checkErrorContent(error.response?.data?.error, ['token'])) {
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

/**
 * Helper function untuk memudahkan penggunaan debug mode
 * @param {Object} accountData - Account data
 * @returns {Promise<Object>} - Debug information
 */
export const previewCustomerData = async (accountData) => {
  return await debugCustomerData(accountData);
};

/**
 * Helper function untuk validasi data saja (tanpa transform)
 * @param {Object} data - Data yang sudah ditransform
 * @returns {Object} - Validation result
 */
export const validateCustomerData = (data) => {
  return validateCustomerCommandData(data);
};

/**
 * Helper function untuk transform data saja (tanpa validasi)
 * @param {Object} accountData - Account data
 * @returns {Object} - Transformed data
 */
export const transformCustomerData = (accountData) => {
  return transformAccountToCustomerCommand(accountData);
};

/**
 * Process response dari external API dan update database dengan ID yang diterima
 * @param {Object} apiResponse - Response dari external API
 * @param {Object} originalAccountData - Data account original
 * @param {string} userId - User ID yang melakukan sync
 * @returns {Promise<Object>} - Hasil processing
 */
export const processExternalApiResponse = async (apiResponse, originalAccountData, userId = null) => {
  try {
    console.log('🔄 Processing external API response...');
    console.log('📥 API Response:', apiResponse);

    const processedResults = {
      success: true,
      updatedRecords: [],
      errors: [],
      summary: {
        totalUpdated: 0,
        totalErrors: 0
      }
    };

    // Extract response data
    let responseData = null;
    if (apiResponse?.data?.data) {
      responseData = apiResponse.data.data;
    } else if (apiResponse?.data) {
      responseData = apiResponse.data;
    } else {
      responseData = apiResponse;
    }

    console.log('📊 Extracted response data:', responseData);
    console.log('🔍 Full API Response Structure:', JSON.stringify(apiResponse, null, 2));

    // 1. Process Customer data (update account.uuid_be)
    // Try different possible response structures
    const customerId = responseData.customer?.data?.id || 
                      responseData.customer?.id || 
                      responseData.customer_id ||
                      responseData.data?.customer?.id ||
                      responseData.data?.customer_id;
                      
    console.log('👤 Customer ID found:', customerId);
    console.log('👤 Customer data structure:', responseData.customer);
    console.log('👤 Full responseData keys:', Object.keys(responseData));
    
    if (customerId) {
      const customerResult = await processCustomerResponse(customerId, originalAccountData, userId);
      if (customerResult.success) {
        processedResults.updatedRecords.push(customerResult);
        processedResults.summary.totalUpdated++;
      } else {
        processedResults.errors.push(customerResult.error);
        processedResults.summary.totalErrors++;
      }
    }

    // 2. Process Tier data (update package_tier.uuid_be)
    console.log('📊 Tier data structure:', responseData.tier);
    console.log('📊 Tier data array:', responseData.tier?.data);
    
    // Try different possible tier response structures
    const tierData = responseData.tier?.data || 
                    responseData.tier || 
                    responseData.tiers?.data ||
                    responseData.tiers ||
                    responseData.data?.tier?.data ||
                    responseData.data?.tiers;
                    
    console.log('📊 Tier data found:', tierData);
    
    if (tierData && Array.isArray(tierData)) {
      const tierResult = await processTierResponse({ data: tierData }, originalAccountData, userId);
      if (tierResult.success) {
        processedResults.updatedRecords.push(tierResult);
        processedResults.summary.totalUpdated++;
      } else {
        console.error('❌ Tier processing failed:', tierResult);
        processedResults.errors.push({
          type: 'tier',
          error: tierResult.error || 'Unknown tier processing error',
          details: tierResult.details || []
        });
        processedResults.summary.totalErrors++;
      }
    }

    // 3. Process Customer-Crew data (update account_pic.uuid_be)
    if (responseData.crew && responseData.crew.data && Array.isArray(responseData.crew.data)) {
      const crewResult = await processCrewResponse(responseData.crew, originalAccountData, userId);
      if (crewResult.success) {
        processedResults.updatedRecords.push(crewResult);
        processedResults.summary.totalUpdated++;
      } else {
        processedResults.errors.push(crewResult.error);
        processedResults.summary.totalErrors++;
      }
    }

    console.log('✅ Response processing completed:', processedResults);

    return processedResults;

  } catch (error) {
    console.error('❌ Error processing external API response:', error);
    
    return {
      success: false,
      error: error.message,
      updatedRecords: [],
      errors: [error.message],
      summary: {
        totalUpdated: 0,
        totalErrors: 1
      }
    };
  }
};

/**
 * Process customer response dan update account.uuid_be
 * @param {string} externalCustomerId - External customer ID
 * @param {Object} originalAccountData - Data account original
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Hasil processing
 */
const processCustomerResponse = async (externalCustomerId, originalAccountData, userId) => {
  try {
    console.log('👤 Processing customer response:', externalCustomerId);
    console.log('👤 Original account data:', originalAccountData);

    if (!externalCustomerId || !originalAccountData.id) {
      throw new Error('Missing customer ID or account ID');
    }

    // Update account.uuid_be dengan external customer ID
    const updateData = {
      uuid_be: externalCustomerId
    };
    
    console.log('👤 Update data for account:', updateData);
    console.log('👤 Calling updateAccount with ID:', originalAccountData.id);

    const updateResult = await updateAccount(originalAccountData.id, updateData);

    if (updateResult.success !== false) {
      console.log('✅ Customer UUID updated successfully:', {
        accountId: originalAccountData.id,
        uuidBe: externalCustomerId
      });

      return {
        success: true,
        type: 'customer',
        accountId: originalAccountData.id,
        uuidBe: externalCustomerId,
        updatedAt: new Date().toISOString()
      };
    } else {
      throw new Error(`Failed to update account UUID: ${updateResult.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Error processing customer response:', error);
    
    return {
      success: false,
      type: 'customer',
      error: error.message,
      accountId: originalAccountData.id,
      externalCustomerId
    };
  }
};

/**
 * Process tier response dan update package_tier.uuid_be
 * @param {Object} tierResponse - Tier response dari external API
 * @param {Object} originalAccountData - Data account original
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Hasil processing
 */
const processTierResponse = async (tierResponse, originalAccountData, userId) => {
  try {
    console.log('📊 Processing tier response:', tierResponse);
    console.log('📊 Original account data tiers:', originalAccountData.package_tiers);

    if (!tierResponse.data || !Array.isArray(tierResponse.data)) {
      throw new Error('Invalid tier response data');
    }

    const tierIds = tierResponse.data.map(tier => tier.id).filter(id => id);
    const originalTiers = originalAccountData.package_tiers || [];
    
    console.log('📊 Extracted tier IDs:', tierIds);
    console.log('📊 Original tiers count:', originalTiers.length);

    if (tierIds.length === 0) {
      return {
        success: true,
        type: 'tier',
        message: 'No tier IDs to update',
        updatedCount: 0
      };
    }

    const updatePromises = [];
    const updateResults = [];

    // Update each tier dengan external ID
    for (let i = 0; i < Math.min(tierIds.length, originalTiers.length); i++) {
      const externalTierId = tierIds[i];
      const originalTier = originalTiers[i];

      if (externalTierId && originalTier.id) {
             const updateData = {
               uuid_be: externalTierId
             };

        updatePromises.push(
          updatePackageTier(originalTier.id, updateData)
            .then(result => {
              console.log(`✅ Successfully updated tier ${originalTier.id} with uuid_be: ${externalTierId}`);
              return {
                success: true,
                tierId: originalTier.id,
                uuidBe: externalTierId
              };
            })
            .catch(error => {
              console.error(`❌ Failed to update tier ${originalTier.id}:`, error);
              console.error(`❌ Tier data:`, originalTier);
              console.error(`❌ Update data:`, updateData);
              
              // Extract more detailed error information
              let errorMessage = error.message;
              if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
              } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }
              
              return {
                success: false,
                tierId: originalTier.id,
                uuidBe: externalTierId,
                error: errorMessage,
                fullError: error
              };
            })
        );
      }
    }

    const results = await Promise.all(updatePromises);
    
    const successfulUpdates = results.filter(r => r.success);
    const failedUpdates = results.filter(r => !r.success);

    console.log('✅ Tier updates completed:', {
      total: results.length,
      successful: successfulUpdates.length,
      failed: failedUpdates.length
    });

    return {
      success: failedUpdates.length === 0,
      type: 'tier',
      updatedCount: successfulUpdates.length,
      failedCount: failedUpdates.length,
      details: results,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error processing tier response:', error);
    
    return {
      success: false,
      type: 'tier',
      error: error.message
    };
  }
};

/**
 * Process crew response dan update account_pic.uuid_be
 * @param {Object} crewResponse - Crew response dari external API
 * @param {Object} originalAccountData - Data account original
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Hasil processing
 */
const processCrewResponse = async (crewResponse, originalAccountData, userId) => {
  try {
    console.log('👥 Processing crew response:', crewResponse);

    if (!crewResponse.data || !Array.isArray(crewResponse.data)) {
      throw new Error('Invalid crew response data');
    }

    const crewIds = crewResponse.data.map(crew => crew.id).filter(id => id);
    const originalPics = originalAccountData.pics || originalAccountData.account_pic || [];

    if (crewIds.length === 0) {
      return {
        success: true,
        type: 'crew',
        message: 'No crew IDs to update',
        updatedCount: 0
      };
    }

    const updatePromises = [];
    const updateResults = [];

    // Update each PIC dengan external ID
    for (let i = 0; i < Math.min(crewIds.length, originalPics.length); i++) {
      const externalCrewId = crewIds[i];
      const originalPic = originalPics[i];

      if (externalCrewId && originalPic.id) {
        const updateData = {
          uuid_be: externalCrewId
        };

        updatePromises.push(
          updateAccountPIC(originalPic.id, updateData)
            .then(result => ({
              success: true,
              picId: originalPic.id,
              uuidBe: externalCrewId
            }))
            .catch(error => ({
              success: false,
              picId: originalPic.id,
              uuidBe: externalCrewId,
              error: error.message
            }))
        );
      }
    }

    const results = await Promise.all(updatePromises);
    
    const successfulUpdates = results.filter(r => r.success);
    const failedUpdates = results.filter(r => !r.success);

    console.log('✅ Crew updates completed:', {
      total: results.length,
      successful: successfulUpdates.length,
      failed: failedUpdates.length
    });

    return {
      success: failedUpdates.length === 0,
      type: 'crew',
      updatedCount: successfulUpdates.length,
      failedCount: failedUpdates.length,
      details: results,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error processing crew response:', error);
    
    return {
      success: false,
      type: 'crew',
      error: error.message
    };
  }
};

export default {
  transformAccountToCustomerCommand,
  syncCustomerToExternalApi,
  debugCustomerData,
  previewCustomerData,
  validateCustomerData,
  transformCustomerData,
  processExternalApiResponse,
  getAvailableBackendConfigs,
  hasAutoDeductBilling,
  resolveParentUuid,
  calculateDeductionActiveType
};
