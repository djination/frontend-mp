// Comprehensive Revenue Rule Schema Testing Utility
// This utility validates that the JSON schema is properly implemented

// Mock data for testing
const generateTestData = () => ({
  // Test data for dedicated charging metric
  dedicatedChargingMetric: {
    type: 'dedicated',
    dedicated: {
      tiers: [
        {
          type: 'package',
          package: {
            tiers: [
              { min: 0, max: 1000000, amount: 500000 },
              { min: 1000001, max: 5000000, amount: 1000000 }
            ]
          },
          non_package_type: 'machine_only',
          amount: 0,
          has_add_ons: true,
          add_ons_types: [
            {
              type: 'system_integration',
              billing_type: 'otc',
              amount: 250000
            },
            {
              type: 'infrastructure',
              billing_type: 'monthly',
              amount: 100000
            }
          ]
        },
        {
          type: 'non_package',
          package: { tiers: [] },
          non_package_type: 'service_only',
          amount: 750000,
          has_add_ons: false,
          add_ons_types: []
        }
      ]
    },
    non_dedicated: {
      tiers: []
    }
  },

  // Test data for non-dedicated charging metric
  nonDedicatedChargingMetric: {
    type: 'non_dedicated',
    dedicated: {
      tiers: []
    },
    non_dedicated: {
      tiers: [
        {
          type: 'transaction_fee',
          transaction_fee_type: 'fixed_rate',
          fixed_rate_value: 5000,
          percentage_value: 0,
          subscription_type: 'monthly',
          subscription_amount: 0,
          yearly_discount: 0,
          add_ons_types: []
        },
        {
          type: 'subscription',
          transaction_fee_type: 'fixed_rate',
          fixed_rate_value: 0,
          percentage_value: 0,
          subscription_type: 'yearly',
          subscription_amount: 1200000,
          yearly_discount: 15,
          add_ons_types: []
        },
        {
          type: 'add_ons',
          transaction_fee_type: 'percentage',
          fixed_rate_value: 0,
          percentage_value: 2.5,
          subscription_type: 'monthly',
          subscription_amount: 0,
          yearly_discount: 0,
          add_ons_types: [
            {
              type: 'system_integration',
              billing_type: 'otc',
              amount: 500000
            }
          ]
        }
      ]
    }
  },

  // Test data for billing rules
  billingRules: {
    billing_method: {
      methods: [
        {
          type: 'auto_deduct',
          auto_deduct: {
            is_enabled: true
          },
          post_paid: {
            type: 'transaction',
            transaction: {
              schedule: 'weekly'
            },
            subscription: {
              schedule: 'monthly'
            },
            custom_fee: 0
          }
        },
        {
          type: 'post_paid',
          auto_deduct: {
            is_enabled: false
          },
          post_paid: {
            type: 'subscription',
            transaction: {
              schedule: 'weekly'
            },
            subscription: {
              schedule: 'yearly'
            },
            custom_fee: 25000
          }
        }
      ]
    },
    tax_rules: {
      type: 'include',
      rate: 11
    },
    term_of_payment: {
      days: 30
    }
  }
});

// Schema validation functions
const validateChargingMetric = (chargingMetric) => {
  const errors = [];
  
  if (!chargingMetric) {
    errors.push('Charging metric is required');
    return errors;
  }
  
  // Validate type
  if (!['dedicated', 'non_dedicated'].includes(chargingMetric.type)) {
    errors.push(`Invalid charging metric type: ${chargingMetric.type}`);
  }
  
  // Validate dedicated structure
  if (chargingMetric.type === 'dedicated') {
    if (!chargingMetric.dedicated || !Array.isArray(chargingMetric.dedicated.tiers)) {
      errors.push('Dedicated tiers must be an array');
    } else if (chargingMetric.dedicated.tiers.length === 0) {
      errors.push('At least one dedicated tier is required');
    } else {
      chargingMetric.dedicated.tiers.forEach((tier, index) => {
        if (!['package', 'non_package'].includes(tier.type)) {
          errors.push(`Invalid dedicated tier type at index ${index}: ${tier.type}`);
        }
        
        if (tier.type === 'package') {
          if (!tier.package || !Array.isArray(tier.package.tiers)) {
            errors.push(`Package tiers must be an array at tier index ${index}`);
          }
        }
        
        if (tier.type === 'non_package') {
          if (!['machine_only', 'service_only'].includes(tier.non_package_type)) {
            errors.push(`Invalid non_package_type at tier index ${index}: ${tier.non_package_type}`);
          }
          if (typeof tier.amount !== 'number') {
            errors.push(`Amount must be a number at tier index ${index}`);
          }
        }
        
        if (tier.has_add_ons && (!Array.isArray(tier.add_ons_types))) {
          errors.push(`add_ons_types must be an array when has_add_ons is true at tier index ${index}`);
        }
      });
    }
  }
  
  // Validate non-dedicated structure
  if (chargingMetric.type === 'non_dedicated') {
    if (!chargingMetric.non_dedicated || !Array.isArray(chargingMetric.non_dedicated.tiers)) {
      errors.push('Non-dedicated tiers must be an array');
    } else if (chargingMetric.non_dedicated.tiers.length === 0) {
      errors.push('At least one non-dedicated tier is required');
    } else {
      chargingMetric.non_dedicated.tiers.forEach((tier, index) => {
        if (!['transaction_fee', 'subscription', 'add_ons'].includes(tier.type)) {
          errors.push(`Invalid non-dedicated tier type at index ${index}: ${tier.type}`);
        }
        
        if (tier.type === 'transaction_fee') {
          if (!['fixed_rate', 'percentage'].includes(tier.transaction_fee_type)) {
            errors.push(`Invalid transaction_fee_type at tier index ${index}: ${tier.transaction_fee_type}`);
          }
        }
        
        if (tier.type === 'subscription') {
          if (!['monthly', 'yearly'].includes(tier.subscription_type)) {
            errors.push(`Invalid subscription_type at tier index ${index}: ${tier.subscription_type}`);
          }
        }
      });
    }
  }
  
  return errors;
};

const validateBillingRules = (billingRules) => {
  const errors = [];
  
  if (!billingRules) {
    errors.push('Billing rules are required');
    return errors;
  }
  
  // Validate billing methods
  if (!billingRules.billing_method || !Array.isArray(billingRules.billing_method.methods)) {
    errors.push('Billing methods must be an array');
  } else if (billingRules.billing_method.methods.length === 0) {
    errors.push('At least one billing method is required');
  } else {
    billingRules.billing_method.methods.forEach((method, index) => {
      if (!['auto_deduct', 'post_paid'].includes(method.type)) {
        errors.push(`Invalid billing method type at index ${index}: ${method.type}`);
      }
      
      if (method.type === 'post_paid' && method.post_paid) {
        if (!['transaction', 'subscription'].includes(method.post_paid.type)) {
          errors.push(`Invalid post_paid type at method index ${index}: ${method.post_paid.type}`);
        }
        
        if (method.post_paid.transaction && !['weekly', 'monthly'].includes(method.post_paid.transaction.schedule)) {
          errors.push(`Invalid transaction schedule at method index ${index}: ${method.post_paid.transaction.schedule}`);
        }
        
        if (method.post_paid.subscription && !['monthly', 'yearly'].includes(method.post_paid.subscription.schedule)) {
          errors.push(`Invalid subscription schedule at method index ${index}: ${method.post_paid.subscription.schedule}`);
        }
      }
    });
  }
  
  // Validate tax rules
  if (!billingRules.tax_rules || !['include', 'exclude'].includes(billingRules.tax_rules.type)) {
    errors.push(`Invalid tax rule type: ${billingRules.tax_rules?.type}`);
  }
  
  // Validate term of payment
  if (!billingRules.term_of_payment || ![14, 30].includes(billingRules.term_of_payment.days)) {
    errors.push(`Invalid payment term: ${billingRules.term_of_payment?.days}`);
  }
  
  return errors;
};

// Test functions
const runSchemaTests = () => {
  console.log('🧪 Starting Revenue Rule Schema Tests...');
  console.log('='.repeat(50));
  
  const testData = generateTestData();
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Validate dedicated charging metric
  totalTests++;
  console.log('\n📊 Test 1: Dedicated Charging Metric Validation');
  const dedicatedErrors = validateChargingMetric(testData.dedicatedChargingMetric);
  if (dedicatedErrors.length === 0) {
    console.log('✅ PASSED: Dedicated charging metric is valid');
    passedTests++;
  } else {
    console.log('❌ FAILED: Dedicated charging metric validation errors:');
    dedicatedErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Test 2: Validate non-dedicated charging metric
  totalTests++;
  console.log('\n📊 Test 2: Non-Dedicated Charging Metric Validation');
  const nonDedicatedErrors = validateChargingMetric(testData.nonDedicatedChargingMetric);
  if (nonDedicatedErrors.length === 0) {
    console.log('✅ PASSED: Non-dedicated charging metric is valid');
    passedTests++;
  } else {
    console.log('❌ FAILED: Non-dedicated charging metric validation errors:');
    nonDedicatedErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Test 3: Validate billing rules
  totalTests++;
  console.log('\n📊 Test 3: Billing Rules Validation');
  const billingErrors = validateBillingRules(testData.billingRules);
  if (billingErrors.length === 0) {
    console.log('✅ PASSED: Billing rules are valid');
    passedTests++;
  } else {
    console.log('❌ FAILED: Billing rules validation errors:');
    billingErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Test 4: Complete revenue rule structure
  totalTests++;
  console.log('\n📊 Test 4: Complete Revenue Rule Structure');
  const completeRule = {
    charging_metric: testData.dedicatedChargingMetric,
    billing_rules: testData.billingRules
  };
  
  const chargingErrors = validateChargingMetric(completeRule.charging_metric);
  const billingRuleErrors = validateBillingRules(completeRule.billing_rules);
  const allErrors = [...chargingErrors, ...billingRuleErrors];
  
  if (allErrors.length === 0) {
    console.log('✅ PASSED: Complete revenue rule structure is valid');
    console.log('📋 Complete structure:', JSON.stringify(completeRule, null, 2));
    passedTests++;
  } else {
    console.log('❌ FAILED: Complete revenue rule validation errors:');
    allErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  // Test 5: Invalid data handling
  totalTests++;
  console.log('\n📊 Test 5: Invalid Data Handling');
  const invalidChargingMetric = {
    type: 'invalid_type',
    dedicated: { tiers: [] },
    non_dedicated: { tiers: [] }
  };
  
  const invalidErrors = validateChargingMetric(invalidChargingMetric);
  if (invalidErrors.length > 0) {
    console.log('✅ PASSED: Invalid data correctly rejected');
    console.log(`   Found ${invalidErrors.length} validation errors as expected`);
    passedTests++;
  } else {
    console.log('❌ FAILED: Invalid data was not rejected');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`🏁 Test Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Schema implementation is correct.');
  } else {
    console.log('⚠️ Some tests failed. Please review the schema implementation.');
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests,
    testData
  };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runRevenueRuleSchemaTests = runSchemaTests;
  window.validateChargingMetric = validateChargingMetric;
  window.validateBillingRules = validateBillingRules;
  window.generateRevenueRuleTestData = generateTestData;
  
  console.log('🔧 Revenue Rule Schema Testing utilities loaded!');
  console.log('Available functions:');
  console.log('- window.runRevenueRuleSchemaTests()');
  console.log('- window.validateChargingMetric(chargingMetric)');
  console.log('- window.validateBillingRules(billingRules)');
  console.log('- window.generateRevenueRuleTestData()');
}

export {
  runSchemaTests,
  validateChargingMetric,
  validateBillingRules,
  generateTestData
}; 