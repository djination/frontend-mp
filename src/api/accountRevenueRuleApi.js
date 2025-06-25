import axios from '../config/axiosInstance';

export const getAccountRevenueRulesByAccountService = async (accountId, accountServiceId) => {
  try {
    console.log(`Fetching revenue rules for account ${accountId}, service ${accountServiceId}`);
    const response = await axios.get(`/account-revenue-rules/account/${accountId}/service/${accountServiceId}`);
    
    // Logging response structure for debugging
    console.log('API Response structure:', {
      status: response.status,
      hasData: !!response.data,
      dataIsArray: Array.isArray(response.data),
      dataStructure: response.data ? Object.keys(response.data) : null,
      hasNestedData: !!response.data?.data,
      nestedDataIsArray: Array.isArray(response.data?.data),
      nestedDataLength: response.data?.data ? response.data.data.length : null
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching revenue rules:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

export const createAccountRevenueRules = async (data) => {
  try {
    // Memastikan format data sesuai dengan API
    const sanitizedData = {
      account_id: data.account_id,
      account_service_id: data.account_service_id,
      rules: data.rules.map(rule => ({
        rule_category: String(rule.rule_category || ''),
        rule_path: String(rule.rule_path || ''),
        rule_value: String(rule.rule_value !== undefined ? rule.rule_value : '')
      }))
    };
    
    console.log('Sending to /account-revenue-rules:', sanitizedData);
    
    const response = await axios.post('/account-revenue-rules', sanitizedData, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error creating revenue rules:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('SERVER ERROR - Possible causes:');
      if (error.response.status === 500) {
        console.error('- Database constraint violations');
        console.error('- Invalid data format causing server exception');
        console.error('- Server-side validation failures');
      }
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

// Helper untuk debugging rule conversion
export const logRuleStructure = (rules) => {
  if (!Array.isArray(rules)) {
    console.error('Rules is not an array:', rules);
    return;
  }
  
  // Group rules by category
  const rulesByCategory = {};
  rules.forEach(rule => {
    if (!rulesByCategory[rule.rule_category]) {
      rulesByCategory[rule.rule_category] = [];
    }
    rulesByCategory[rule.rule_category].push(rule);
  });
  
  // Log each category separately
  Object.entries(rulesByCategory).forEach(([category, categoryRules]) => {
    console.log(`${category} rules (${categoryRules.length}):`);
    
    // Group by common parent paths
    const parentPaths = {};
    categoryRules.forEach(rule => {
      const pathParts = rule.rule_path.split('.');
      const parentPath = pathParts.slice(0, -1).join('.');
      if (!parentPaths[parentPath]) {
        parentPaths[parentPath] = [];
      }
      parentPaths[parentPath].push({
        key: pathParts[pathParts.length - 1],
        value: rule.rule_value
      });
    });
    
    // Log structured representation
    Object.entries(parentPaths).forEach(([parentPath, values]) => {
      console.log(`  ${parentPath}: {`);
      values.forEach(({key, value}) => {
        console.log(`    ${key}: ${value}`);
      });
      console.log('  }');
    });
  });
};