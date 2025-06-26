# Account Revenue Rule Forms

This directory contains the components for managing account revenue rules with proper data mapping between API responses and form structures.

## Components

### AccountRevenueRuleModal.jsx
The main modal component that handles:
- Fetching revenue rules from the API using `getAccountRevenueRulesByAccountServiceAsTree`
- Mapping API response data to form-compatible structure
- Managing form state and validation
- Saving data using `createAccountRevenueRulesFromTree`

### ChargingMetricForm.jsx
Handles charging metric configuration:
- Dedicated tiers (package and non-package types)
- Non-dedicated tiers (transaction fees, subscriptions, add-ons)
- Add-ons configuration for both dedicated and non-dedicated types

### BillingRulesForm.jsx
Handles billing rules configuration:
- Billing methods (auto-deduct, post-paid)
- Tax rules
- Term of payment

## Data Mapping

### API Response Structure
The API returns data in this structure:
```javascript
{
  charging_metric: {
    type: 'dedicated' | 'non_dedicated',
    dedicated: {
      tiers: [
        {
          type: 'package' | 'non_package',
          package: { tiers: [{ min, max, amount }] },
          non_package_type: 'machine_only' | 'service_only',
          amount: number,
          has_add_ons: boolean,
          add_ons_types: [
            {
              type: 'system_integration' | 'infrastructure',
              billing_type: 'otc' | 'monthly',
              amount: number
            }
          ]
        }
      ]
    },
    non_dedicated: {
      tiers: [
        {
          type: 'transaction_fee' | 'subscription' | 'add_ons',
          transaction_fee_type: 'fixed_rate' | 'percentage',
          fixed_rate_value: number,
          percentage_value: number,
          subscription_type: 'monthly' | 'yearly',
          subscription_amount: number,
          yearly_discount: number,
          add_ons_types: [...]
        }
      ]
    }
  },
  billing_rules: {
    billing_method: {
      methods: [
        {
          type: 'auto_deduct' | 'post_paid',
          auto_deduct: { is_enabled: boolean },
          post_paid: {
            type: 'transaction' | 'subscription',
            transaction: { schedule: 'weekly' | 'monthly' },
            subscription: { schedule: 'monthly' | 'yearly' },
            custom_fee: number
          }
        }
      ]
    },
    tax_rules: {
      type: 'include' | 'exclude',
      rate: number
    },
    term_of_payment: {
      days: number
    }
  }
}
```

### Form Data Structure
The forms expect data in the same structure as the API response, with proper defaults and array initialization.

## Key Features

### 1. Comprehensive Data Mapping
- `mapApiResponseToFormData()` function ensures proper structure mapping
- Handles null/empty responses with default values
- Validates data structure integrity
- Provides detailed logging for debugging

### 2. Form Structure Validation
- `validateFormDataStructure()` function checks for required fields
- Ensures arrays are properly initialized
- Logs validation errors for debugging

### 3. Default Value Handling
- Provides sensible defaults for all form fields
- Initializes empty arrays and objects as needed
- Maintains data consistency across form states

### 4. Error Handling
- Graceful handling of API errors
- Fallback to default structures on errors
- User-friendly error messages

## Usage

### Basic Usage
```javascript
import RevenueRuleModal from './AccountRevenueRule/AccountRevenueRuleModal';

// In your component
const [modalVisible, setModalVisible] = useState(false);
const [accountService, setAccountService] = useState(null);

<RevenueRuleModal
  visible={modalVisible}
  onCancel={() => setModalVisible(false)}
  accountId="account-uuid"
  accountService={accountService}
  onSave={(data) => {
    console.log('Saved revenue rules:', data);
    setModalVisible(false);
  }}
/>
```

### Testing Data Mapping
To test the data mapping functionality, uncomment the test line in `AccountRevenueRuleModal.jsx`:
```javascript
// Uncomment to run tests
testDataMapping();
```

## Debugging

### Console Logs
The components provide extensive logging:
- API response data
- Data mapping process
- Form structure validation
- Form value changes
- Error conditions

### Common Issues
1. **Empty form fields**: Check if API response has proper structure
2. **Validation errors**: Verify all required fields are present
3. **Array issues**: Ensure arrays are properly initialized

### Validation
The system validates:
- Required form structures exist
- Arrays are properly initialized
- Data types match expectations
- Nested objects have correct structure

## Best Practices

1. **Always use the mapping function**: Don't directly set form values from API response
2. **Handle edge cases**: Account for null/undefined values
3. **Validate data**: Use the validation function to catch issues early
4. **Provide defaults**: Always have fallback values for missing data
5. **Log extensively**: Use console logs for debugging complex data structures

## API Integration

### Fetching Data
```javascript
const response = await getAccountRevenueRulesByAccountServiceAsTree(accountId, accountServiceId);
const formData = mapApiResponseToFormData(response.data.data);
form.setFieldsValue(formData);
```

### Saving Data
```javascript
const formValues = form.getFieldsValue();
const payload = {
  account_id: accountId,
  account_service_id: accountServiceId,
  charging_metric: formValues.charging_metric,
  billing_rules: formValues.billing_rules
};
const response = await createAccountRevenueRulesFromTree(payload);
```

This ensures consistent data handling between the frontend forms and backend API. 