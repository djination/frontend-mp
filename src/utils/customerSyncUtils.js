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
 * Transform account data to customer command format
 * @param {Object} accountData - Account data from form
 * @returns {Object} - Transformed data for customer command API
 */
export const transformAccountToCustomerCommand = (accountData) => {
  console.log('🔄 Transforming account data:', accountData);
  
  try {
    // Find owner PIC (is_owner = true)
    const pics = accountData.pics || accountData.account_pic || [];
    const ownerPic = pics.find(pic => pic.is_owner === true) || {};
    
    // Find non-owner PICs (is_owner = false)
    const nonOwnerPics = pics.filter(pic => pic.is_owner === false) || [];
    
    // Get primary address (first address or main address)
    const addresses = accountData.addresses || accountData.account_address || [];
    const primaryAddress = addresses[0] || {};
    
    // Transform main customer data
    const customer = {
      name: accountData.name || '',
      email: ownerPic.email || '',
      msisdn: ownerPic.phone_no ? `+${ownerPic.phone_no.startsWith('0') ? '62' + ownerPic.phone_no.slice(1) : ownerPic.phone_no}` : '',
      address: {
        building: primaryAddress.address1 || '',
        street: primaryAddress.address2 || '',
        region: primaryAddress.sub_district || '',
        city: primaryAddress.city || '',
        state: primaryAddress.province || '',
        country: primaryAddress.country || '',
        zip_code: primaryAddress.postalcode || ''
      },
      customer_type: accountData.type_of_business?.name || 'INDIVIDUAL',
      ktp: ownerPic.no_ktp || '',
      npwp: ownerPic.no_npwp || ''
    };

    // Transform customer crew (non-owner PIC data)
    const customerCrew = [];
    nonOwnerPics.forEach(pic => {
      customerCrew.push({
        ktp: pic.no_ktp || '',
        npwp: pic.no_npwp || '',
        name: pic.name || '',
        msisdn: pic.phone_no ? `+${pic.phone_no}` : '',
        email: pic.email || '',
        username: pic.name?.toLowerCase().replace(/\s+/g, '') || `user${Date.now()}`
      });
    });

    // Transform beneficiary account (bank data)
    let beneficiaryAccount = null;
    const banks = accountData.banks || accountData.account_bank || [];
    if (banks && banks.length > 0) {
      const primaryBank = banks[0];
      beneficiaryAccount = {
        firstname: primaryBank.bank_account_holder_firstname || '',
        lastname: primaryBank.bank_account_holder_lastname || '',
        bank: {
          id: primaryBank.bank_id || ''
        },
        account_number: primaryBank.bank_account_number || '',
        account_name: primaryBank.bank_account_holder_name || '',
        account_type: {
          id: "3"
        },
        customer_type: {
          id: "2"
        },
        customer_status: {
          id: "1"
        },
        region_code: {
          id: "1"
        },
        country_code: {
          id: "IDN"
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
            name: branchAccount.name || '',
            code: branchAccount.account_no || '',
            address: {
              building: branchAddress.address1 || '',
              street: branchAddress.address2 || '',
              region: branchAddress.reg || '',
              city: branchAddress.city || '',
              state: branchAddress.province || '',
              country: branchAddress.country || 'Indonesia',
              zip_code: branchAddress.postalcode || ''
            }
          };
          
          branches.push(branchData);
          console.log('🏢 Added branch:', branchData.name, 'Code:', branchData.code);
        } catch (branchError) {
          console.error('❌ Error processing branch account:', branchAccount.name, branchError);
        }
      });
    } catch (filterError) {
      console.error('❌ Error filtering branch accounts:', filterError);
      // Fallback: use all accounts as branches if filtering fails
      accountData.account_tree.forEach(acc => {
        branches.push({
          name: acc.name || '',
          code: acc.account_no || '',
          address: customer.address
        });
      });
    }
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
