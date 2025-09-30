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
    // Find owner PIC (owner = true)
    const pics = accountData.pics || accountData.account_pic || [];
    const ownerPic = pics.find(pic => pic.owner === true) || {};
    
    // Find non-owner PICs (owner = false)
    const nonOwnerPics = pics.filter(pic => pic.owner === false) || [];
    
    // Get primary address (first address or main address)
    const addresses = accountData.addresses || accountData.account_address || [];
    const primaryAddress = addresses[0] || {};
    
    // Get parent account UUID if parent_id exists
    let parentUuidBe = null;
    if (accountData.parent_id) {
      // This would need to be fetched from the parent account's uuid_be field
      // For now, we'll pass the parent_id as-is and it should be resolved server-side
      parentUuidBe = accountData.parent_id;
    }
    
    // Transform main customer data according to new mapping
    const customer = {
      name: accountData.name || '', // m_account.name
      email: accountData.email || '', // m_account.email
      msisdn: accountData.phone_no ? (accountData.phone_no.startsWith('+') ? accountData.phone_no : `+${accountData.phone_no.startsWith('0') ? '62' + accountData.phone_no.slice(1) : accountData.phone_no}`) : '', // m_account.phone_no
      address: {
        building: primaryAddress.address1 || '', // m_account_address.address1
        street: primaryAddress.address2 || '', // m_account_address.address2
        region: primaryAddress.sub_district || '', // m_account_address.sub_district
        city: primaryAddress.city || '', // m_account_address.city
        state: primaryAddress.province || '', // m_account_address.province
        country: primaryAddress.country || 'Indonesia', // m_account_address.country
        zip_code: primaryAddress.postalcode || '' // m_account_address.postalcode
      },
      deduction_active_type: "nominal", // Fixed value "nominal"
      customer_role: accountData.account_type_name || "branch", // m_account.account_type_name
      parent_id: parentUuidBe, // uuid_be from parent account
      customer_type: accountData.type_of_business_detail || "INDIVIDUAL", // m_account.type_of_business_detail
      ktp: ownerPic.ktp || '', // m_account_pic.ktp (for owner=true)
      npwp: ownerPic.npwp || '' // m_account_pic.npwp (for owner=true)
    };

    // Transform tier data (m_account_package_tier)
    const packageTiers = accountData.package_tiers || accountData.packageTiers || [];
    const tier = [];
    packageTiers.forEach(packageTier => {
      tier.push({
        tier_type: "nominal", // Fixed value "nominal"
        tier_category: "regular", // Fixed value "regular"
        min_amount: packageTier.min_value || 0, // m_account_package_tier.min_value
        max_amount: packageTier.max_value || 0, // m_account_package_tier.max_value
        fee: packageTier.amount || 0, // m_account_package_tier.amount
        valid_from: packageTier.start_date || new Date().toISOString(), // m_account_package_tier.start_date
        valid_to: packageTier.end_date || "2050-12-31T23:59:59" // m_account_package_tier.end_date
      });
    });

    // Transform customer crew (non-owner PIC data)
    const customerCrew = [];
    nonOwnerPics.forEach(pic => {
      customerCrew.push({
        ktp: pic.ktp || '', // m_account_pic.ktp (for owner=false)
        npwp: pic.npwp || '', // m_account_pic.npwp (for owner=false)
        name: pic.name || '', // m_account_pic.name (for owner=false)
        msisdn: pic.phone_no ? (pic.phone_no.startsWith('+') ? pic.phone_no : `+${pic.phone_no}`) : '', // m_account_pic.phone_no (for owner=false, with + prefix)
        email: pic.email || '', // m_account_pic.email (for owner=false)
        username: pic.username || pic.name?.toLowerCase().replace(/\s+/g, '') || `user${Date.now()}` // m_account_pic.username (for owner=false)
      });
    });

    // Transform beneficiary account (bank data)
    let beneficiaryAccount = null;
    const banks = accountData.banks || accountData.account_bank || [];
    if (banks && banks.length > 0) {
      const primaryBank = banks[0];
      beneficiaryAccount = {
        firstname: primaryBank.bank_account_firstname || '', // m_account_bank.bank_account_firstname
        lastname: primaryBank.bank_account_lastname || '', // m_account_bank.bank_account_lastname
        bank: {
          id: primaryBank.bank_id || '' // From GET http://test-stg01.merahputih-id.tech:5002/api/bank/query
        },
        account_number: primaryBank.bank_account_no || '', // m_account_bank.bank_account_no
        account_name: primaryBank.bank_account_holder_name || '', // m_account_bank.bank_account_holder_name
        account_type: {
          id: "3" // From http://test-stg01.merahputih-id.tech:5002/api/account-type/query
        },
        customer_type: {
          id: "2" // From http://test-stg01.merahputih-id.tech:5002/api/customer-type/query
        },
        customer_status: {
          id: "1" // From http://test-stg01.merahputih-id.tech:5002/api/customer-status/query
        },
        region_code: {
          id: "1" // From http://test-stg01.merahputih-id.tech:5002/api/region-code/query
        },
        country_code: {
          id: "IDN" // From http://test-stg01.merahputih-id.tech:5002/api/country-code/query
        }
      };
    }

    // Transform branch data - find branches from account tree
    const branches = [];
    if (accountData.account_tree && Array.isArray(accountData.account_tree)) {
      console.log('🏢 Processing account tree with', accountData.account_tree.length, 'items');
      
      try {
        // Filter for branch accounts or all children if no specific branch type
        const branchAccounts = accountData.account_tree.filter(acc => {
          // Check if it's explicitly a branch type or if no specific type filtering needed
          const accountTypeName = acc.account_type?.name || acc.account_type;
          const isBranch = (typeof accountTypeName === 'string' && accountTypeName.toLowerCase().includes('branch')) ||
                          (typeof acc.account_type === 'string' && acc.account_type.toLowerCase() === 'branch');
          console.log('🔍 Account:', acc.name, 'Type:', accountTypeName, 'Is Branch:', isBranch);
          return isBranch || accountData.account_tree.length <= 5; // Include all if few children
        });
        
        console.log('✅ Found', branchAccounts.length, 'branch accounts');
        
        branchAccounts.forEach(branchAccount => {
          try {
            const branchAddresses = branchAccount.addresses || branchAccount.account_address || [];
            const branchAddress = branchAddresses[0] || {};
            
            const branchData = {
              name: branchAccount.name || '', // m_account.name
              code: branchAccount.account_no || '', // m_account.account_no
              address: {
                building: branchAddress.address1 || '', // m_account_address.address1
                street: branchAddress.address2 || '', // m_account_address.address2
                region: branchAddress.sub_district || '', // m_account_address.sub_district
                city: branchAddress.city || '', // m_account_address.city
                state: branchAddress.province || '', // m_account_address.province
                country: branchAddress.country || 'Indonesia', // m_account_address.country
                zip_code: branchAddress.postalcode || '' // m_account_address.postalcode
              },
              contact_info: {
                // Additional branch contact info if available
                pic_name: '',
                pic_phone: ''
              }
            };
            
            branches.push(branchData);
            console.log('🏢 Added branch:', branchData.name, 'Code:', branchData.code);
          } catch (branchError) {
            console.error('❌ Error processing branch:', branchAccount?.name || 'Unknown', branchError);
          }
        });
      } catch (treeError) {
        console.error('❌ Error processing account tree:', treeError);
      }
    } else {
      console.log('ℹ️  No account_tree available or not an array');
    }

  // If no branches found from tree, create from main account data
  if (branches.length === 0) {
    console.log('ℹ️ No branches found in tree, using main account as branch');
    branches.push({
      name: accountData.name || '',
      code: accountData.account_no || '',
      address: customer.address
    });
  }

  const result = {
    customer,
    tier, // Add the tier data to the result
    "customer-crew": customerCrew,
    "beneficiary-account": beneficiaryAccount,
    branch: branches.length === 1 ? branches[0] : branches
  };

  // Validate required fields
  const validation = {
    customer_name: !!result.customer.name,
    customer_address: !!(result.customer.address.city || result.customer.address.state),
    branch_data: !!(result.branch && (Array.isArray(result.branch) ? result.branch.length > 0 : result.branch.name))
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
  if (Array.isArray(result.branch)) {
    result.branch = result.branch.map(b => ({
      ...b,
      name: b.name || 'Default Branch',
      code: b.code || 'BR001',
      address: {
        ...b.address,
        country: b.address.country || 'Indonesia'
      }
    }));
  } else if (result.branch) {
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
      branchCount: Array.isArray(customerCommandData.branch) ? customerCommandData.branch.length : 1
    });

    // Make API request
    const response = await backendExtApi.makeSimplifiedApiRequest({
      config_id: targetConfigId,
      data: customerCommandData,
      user_id: userId,
      account_id: accountId
    });

    console.log('✅ Customer sync completed successfully:', response);

    // Check if the response contains nested error from external API
    if (response && response.data && response.data.data && response.data.data.success === false) {
      console.error('❌ External API returned error:', response.data.data.error);
      
      const externalError = response.data.data.error;
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

    return {
      success: true,
      response: response,
      customerData: customerCommandData
    };

  } catch (error) {
    console.error('❌ Customer sync failed:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.response?.data || error
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
