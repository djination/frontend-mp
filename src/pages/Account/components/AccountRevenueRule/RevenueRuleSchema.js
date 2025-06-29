// Revenue Rule JSON Schema Definition
// This defines the complete structure for charging_metric and billing_rules

export const CHARGING_METRIC_TYPES = {
  DEDICATED: 'dedicated',
  NON_DEDICATED: 'non_dedicated'
};

export const DEDICATED_TIER_TYPES = {
  PACKAGE: 'package',
  NON_PACKAGE: 'non_package'
};

export const NON_PACKAGE_TYPES = {
  MACHINE_ONLY: 'machine_only',
  SERVICE_ONLY: 'service_only'
};

export const NON_DEDICATED_TYPES = {
  TRANSACTION_FEE: 'transaction_fee',
  SUBSCRIPTION: 'subscription',
  ADD_ONS: 'add_ons'
};

export const TRANSACTION_FEE_TYPES = {
  FIXED_RATE: 'fixed_rate',
  PERCENTAGE: 'percentage'
};

export const SUBSCRIPTION_TYPES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const ADD_ONS_TYPES = {
  SYSTEM_INTEGRATION: 'system_integration',
  INFRASTRUCTURE: 'infrastructure'
};

export const BILLING_TYPES = {
  OTC: 'otc',
  MONTHLY: 'monthly'
};

export const BILLING_METHOD_TYPES = {
  AUTO_DEDUCT: 'auto_deduct',
  POST_PAID: 'post_paid'
};

export const POST_PAID_TYPES = {
  TRANSACTION: 'transaction',
  SUBSCRIPTION: 'subscription'
};

export const POST_PAID_SCHEDULES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const TAX_RULE_TYPES = {
  INCLUDE: 'include',
  EXCLUDE: 'exclude'
};

export const PAYMENT_TERMS = {
  FOURTEEN_DAYS: 14,
  THIRTY_DAYS: 30
};

// Complete JSON Schema for Revenue Rules
export const REVENUE_RULE_SCHEMA = {
  type: 'object',
  properties: {
    charging_metric: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          type: 'string',
          enum: Object.values(CHARGING_METRIC_TYPES)
        },
        dedicated: {
          type: 'object',
          properties: {
            tiers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: {
                    type: 'string',
                    enum: Object.values(DEDICATED_TIER_TYPES)
                  },
                  package: {
                    type: 'object',
                    properties: {
                      tiers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['min', 'max', 'amount'],
                          properties: {
                            min: { type: 'number', minimum: 0 },
                            max: { type: 'number', minimum: 0 },
                            amount: { type: 'number', minimum: 0 }
                          }
                        }
                      }
                    }
                  },
                  non_package_type: {
                    type: 'string',
                    enum: Object.values(NON_PACKAGE_TYPES)
                  },
                  amount: {
                    type: 'number',
                    minimum: 0
                  },
                  has_add_ons: {
                    type: 'boolean'
                  },
                  add_ons_types: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['type', 'amount'],
                      properties: {
                        type: {
                          type: 'string',
                          enum: Object.values(ADD_ONS_TYPES)
                        },
                        billing_type: {
                          type: 'string',
                          enum: Object.values(BILLING_TYPES)
                        },
                        amount: {
                          type: 'number',
                          minimum: 0
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        non_dedicated: {
          type: 'object',
          properties: {
            tiers: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: {
                    type: 'string',
                    enum: Object.values(NON_DEDICATED_TYPES)
                  },
                  transaction_fee_type: {
                    type: 'string',
                    enum: Object.values(TRANSACTION_FEE_TYPES)
                  },
                  fixed_rate_value: {
                    type: 'number',
                    minimum: 0
                  },
                  percentage_value: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100
                  },
                  subscription_type: {
                    type: 'string',
                    enum: Object.values(SUBSCRIPTION_TYPES)
                  },
                  subscription_amount: {
                    type: 'number',
                    minimum: 0
                  },
                  yearly_discount: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100
                  },
                  add_ons_types: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['type', 'amount'],
                      properties: {
                        type: {
                          type: 'string',
                          enum: Object.values(ADD_ONS_TYPES)
                        },
                        billing_type: {
                          type: 'string',
                          enum: Object.values(BILLING_TYPES)
                        },
                        amount: {
                          type: 'number',
                          minimum: 0
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    billing_rules: {
      type: 'object',
      required: ['billing_method', 'tax_rules', 'term_of_payment'],
      properties: {
        billing_method: {
          type: 'object',
          required: ['methods'],
          properties: {
            methods: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: {
                    type: 'string',
                    enum: Object.values(BILLING_METHOD_TYPES)
                  },
                  auto_deduct: {
                    type: 'object',
                    properties: {
                      is_enabled: {
                        type: 'boolean'
                      }
                    }
                  },
                  post_paid: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: Object.values(POST_PAID_TYPES)
                      },
                      transaction: {
                        type: 'object',
                        properties: {
                          schedule: {
                            type: 'string',
                            enum: [POST_PAID_SCHEDULES.WEEKLY, POST_PAID_SCHEDULES.MONTHLY]
                          }
                        }
                      },
                      subscription: {
                        type: 'object',
                        properties: {
                          schedule: {
                            type: 'string',
                            enum: [POST_PAID_SCHEDULES.MONTHLY, POST_PAID_SCHEDULES.YEARLY]
                          }
                        }
                      },
                      custom_fee: {
                        type: 'number',
                        minimum: 0
                      }
                    }
                  }
                }
              }
            }
          }
        },
        tax_rules: {
          type: 'object',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: Object.values(TAX_RULE_TYPES)
            },
            rate: {
              type: 'number',
              minimum: 0,
              maximum: 100
            }
          }
        },
        term_of_payment: {
          type: 'object',
          required: ['days'],
          properties: {
            days: {
              type: 'number',
              enum: Object.values(PAYMENT_TERMS)
            }
          }
        }
      }
    }
  }
};

// Default values following the schema
export const getDefaultChargingMetric = () => ({
  type: CHARGING_METRIC_TYPES.DEDICATED,
  dedicated: {
    tiers: [{
      type: DEDICATED_TIER_TYPES.PACKAGE,
      package: {
        tiers: []
      },
      non_package_type: NON_PACKAGE_TYPES.MACHINE_ONLY,
      amount: 0,
      has_add_ons: false,
      add_ons_types: []
    }]
  },
  non_dedicated: {
    tiers: []
  }
});

export const getDefaultBillingRules = () => ({
  billing_method: {
    methods: [{
      type: BILLING_METHOD_TYPES.AUTO_DEDUCT,
      auto_deduct: {
        is_enabled: true
      },
      post_paid: {
        type: POST_PAID_TYPES.TRANSACTION,
        transaction: {
          schedule: POST_PAID_SCHEDULES.WEEKLY
        },
        subscription: {
          schedule: POST_PAID_SCHEDULES.MONTHLY
        },
        custom_fee: 0
      }
    }]
  },
  tax_rules: {
    type: TAX_RULE_TYPES.INCLUDE,
    rate: 11
  },
  term_of_payment: {
    days: PAYMENT_TERMS.THIRTY_DAYS
  }
});

export const getDefaultRevenueRule = () => ({
  charging_metric: getDefaultChargingMetric(),
  billing_rules: getDefaultBillingRules()
});

// Validation functions
export const validateChargingMetric = (chargingMetric) => {
  const errors = [];
  
  if (!chargingMetric) {
    errors.push('Charging metric is required');
    return errors;
  }
  
  if (!chargingMetric.type || !Object.values(CHARGING_METRIC_TYPES).includes(chargingMetric.type)) {
    errors.push('Valid charging metric type is required');
  }
  
  if (chargingMetric.type === CHARGING_METRIC_TYPES.DEDICATED) {
    if (!chargingMetric.dedicated || !Array.isArray(chargingMetric.dedicated.tiers)) {
      errors.push('Dedicated tiers array is required');
    } else if (chargingMetric.dedicated.tiers.length === 0) {
      errors.push('At least one dedicated tier is required');
    }
  }
  
  if (chargingMetric.type === CHARGING_METRIC_TYPES.NON_DEDICATED) {
    if (!chargingMetric.non_dedicated || !Array.isArray(chargingMetric.non_dedicated.tiers)) {
      errors.push('Non-dedicated tiers array is required');
    } else if (chargingMetric.non_dedicated.tiers.length === 0) {
      errors.push('At least one non-dedicated tier is required');
    }
  }
  
  return errors;
};

export const validateBillingRules = (billingRules) => {
  const errors = [];
  
  if (!billingRules) {
    errors.push('Billing rules are required');
    return errors;
  }
  
  if (!billingRules.billing_method || !Array.isArray(billingRules.billing_method.methods)) {
    errors.push('Billing methods array is required');
  } else if (billingRules.billing_method.methods.length === 0) {
    errors.push('At least one billing method is required');
  }
  
  if (!billingRules.tax_rules || !Object.values(TAX_RULE_TYPES).includes(billingRules.tax_rules.type)) {
    errors.push('Valid tax rule type is required');
  }
  
  if (!billingRules.term_of_payment || !Object.values(PAYMENT_TERMS).includes(billingRules.term_of_payment.days)) {
    errors.push('Valid payment term is required');
  }
  
  return errors;
};

export const validateRevenueRule = (revenueRule) => {
  const errors = [];
  
  if (!revenueRule) {
    errors.push('Revenue rule data is required');
    return errors;
  }
  
  const chargingMetricErrors = validateChargingMetric(revenueRule.charging_metric);
  const billingRulesErrors = validateBillingRules(revenueRule.billing_rules);
  
  return [...errors, ...chargingMetricErrors, ...billingRulesErrors];
};

// Utility functions for form manipulation
export const ensureChargingMetricStructure = (chargingMetric) => {
  if (!chargingMetric) {
    return getDefaultChargingMetric();
  }
  
  const result = {
    type: chargingMetric.type || CHARGING_METRIC_TYPES.DEDICATED,
    dedicated: {
      tiers: Array.isArray(chargingMetric.dedicated?.tiers) ? chargingMetric.dedicated.tiers : []
    },
    non_dedicated: {
      tiers: Array.isArray(chargingMetric.non_dedicated?.tiers) ? chargingMetric.non_dedicated.tiers : []
    }
  };
  
  // Ensure at least one tier for the selected type
  if (result.type === CHARGING_METRIC_TYPES.DEDICATED && result.dedicated.tiers.length === 0) {
    result.dedicated.tiers.push(getDefaultChargingMetric().dedicated.tiers[0]);
  }
  
  return result;
};

export const ensureBillingRulesStructure = (billingRules) => {
  if (!billingRules) {
    return getDefaultBillingRules();
  }
  
  const result = {
    billing_method: {
      methods: Array.isArray(billingRules.billing_method?.methods) ? billingRules.billing_method.methods : []
    },
    tax_rules: billingRules.tax_rules || getDefaultBillingRules().tax_rules,
    term_of_payment: billingRules.term_of_payment || getDefaultBillingRules().term_of_payment
  };
  
  // Ensure at least one billing method
  if (result.billing_method.methods.length === 0) {
    result.billing_method.methods.push(getDefaultBillingRules().billing_method.methods[0]);
  }
  
  return result;
};

// Form data transformation utilities
export const transformApiToFormData = (apiData) => {
  console.log('🔄 Transforming API data to form structure:', apiData);
  
  try {
    const result = {
      charging_metric: ensureChargingMetricStructure(apiData?.charging_metric),
      billing_rules: ensureBillingRulesStructure(apiData?.billing_rules)
    };
    
    console.log('✅ Transformed form data:', result);
    return result;
  } catch (error) {
    console.error('❌ Error transforming API data:', error);
    return getDefaultRevenueRule();
  }
};

export const transformFormToApiData = (formData) => {
  console.log('🔄 Transforming form data to API structure:', formData);
  
  try {
    // Clean up the data by removing empty/undefined values
    const cleanData = JSON.parse(JSON.stringify(formData, (key, value) => {
      if (value === undefined || value === null) return undefined;
      if (Array.isArray(value) && value.length === 0) return [];
      return value;
    }));
    
    console.log('✅ Cleaned API data:', cleanData);
    return cleanData;
  } catch (error) {
    console.error('❌ Error transforming form data:', error);
    return formData;
  }
}; 