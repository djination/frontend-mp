# Customer Data Debug System

Sistem debug untuk validasi dan preview data sebelum hit ke external API.

## 🚀 Quick Start

### 1. Import Debug Components

```jsx
import DebugDataModal from '../components/DebugDataModal';
import CustomerDebugButton from '../components/CustomerDebugButton';
import { useCustomerDebug } from '../hooks/useCustomerDebug';
```

### 2. Basic Usage - Debug Button

```jsx
import CustomerDebugButton from '../components/CustomerDebugButton';

function AccountPage({ accountData, accountId, userId }) {
  return (
    <div>
      {/* Your account form/content */}
      
      <CustomerDebugButton
        accountData={accountData}
        accountId={accountId}
        userId={userId}
        onSuccess={(result) => {
          console.log('Sync successful:', result);
          // Handle success
        }}
        onError={(error) => {
          console.error('Sync failed:', error);
          // Handle error
        }}
      />
    </div>
  );
}
```

### 3. Advanced Usage - Custom Hook

```jsx
import { useCustomerDebug } from '../hooks/useCustomerDebug';

function CustomAccountPage({ accountData }) {
  const {
    debugData,
    sendToAPI,
    loading,
    error,
    canSend,
    getValidationSummary,
    debugResult
  } = useCustomerDebug();

  const handleDebug = async () => {
    const result = await debugData(accountData);
    if (result?.success) {
      console.log('Debug result:', result);
      // Show modal or handle result
    }
  };

  const handleSend = async () => {
    if (canSend()) {
      const result = await sendToAPI(accountData, null, userId, accountId);
      // Handle result
    }
  };

  return (
    <div>
      <button onClick={handleDebug} disabled={loading}>
        Debug Data
      </button>
      
      <button onClick={handleSend} disabled={!canSend() || loading}>
        Send to API
      </button>
      
      {debugResult && (
        <div>
          <p>Status: {debugResult.summary.dataIntegrity}</p>
          <p>Errors: {debugResult.validationResult.errors.length}</p>
          <p>Warnings: {debugResult.validationResult.warnings.length}</p>
        </div>
      )}
    </div>
  );
}
```

### 4. Debug Modal Only

```jsx
import DebugDataModal from '../components/DebugDataModal';

function MyComponent({ accountData }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [debugResult, setDebugResult] = useState(null);

  const handleDebug = async () => {
    const result = await debugCustomerData(accountData);
    setDebugResult(result);
    setModalVisible(true);
  };

  return (
    <div>
      <button onClick={handleDebug}>Show Debug Modal</button>
      
      <DebugDataModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        originalData={accountData}
        transformedData={debugResult?.transformedData}
        onConfirmSend={(data, validation) => {
          if (validation.isValid) {
            // Send to API
            console.log('Sending data:', data);
          }
        }}
      />
    </div>
  );
}
```

## 🔧 API Reference

### Functions

#### `debugCustomerData(accountData)`
Debug mode - validate dan preview data tanpa mengirim ke API.

```js
const result = await debugCustomerData(accountData);
console.log(result);
// {
//   success: true,
//   mode: 'debug',
//   originalData: {...},
//   transformedData: {...},
//   validationResult: {...},
//   previewData: {...},
//   debugReport: {...}
// }
```

#### `previewCustomerData(accountData)`
Alias untuk `debugCustomerData()`.

#### `validateCustomerData(transformedData)`
Validasi data yang sudah ditransform.

```js
const validation = validateCustomerData(transformedData);
console.log(validation);
// {
//   isValid: true/false,
//   errors: [...],
//   warnings: [...],
//   data: {...}
// }
```

#### `transformCustomerData(accountData)`
Transform data saja tanpa validasi.

```js
const transformed = transformCustomerData(accountData);
console.log(transformed);
// {
//   customer: {...},
//   tier: [...],
//   'customer-crew': [...],
//   'beneficiary-account': {...},
//   branch: {...}
// }
```

#### `syncCustomerToExternalApi(accountData, configId, userId, accountId, debugMode)`
Sync ke external API dengan optional debug mode.

```js
// Normal mode
const result = await syncCustomerToExternalApi(accountData);

// Debug mode
const debugResult = await syncCustomerToExternalApi(accountData, null, null, null, true);
```

### Hook: `useCustomerDebug()`

```js
const {
  // State
  debugResult,
  loading,
  error,
  
  // Actions
  debugData,
  previewData,
  validateData,
  transformData,
  sendToAPI,
  clearResults,
  
  // Helpers
  canSend,
  getValidationSummary,
  
  // Computed
  hasData,
  hasErrors,
  hasValidationIssues,
  hasWarnings
} = useCustomerDebug();
```

### Components

#### `<CustomerDebugButton />`

Props:
- `accountData` - Data account untuk di-debug
- `configId` - ID konfigurasi backend ext (optional)
- `userId` - ID user (optional)
- `accountId` - ID account (optional)
- `onSuccess` - Callback saat berhasil
- `onError` - Callback saat error
- `disabled` - Disable button
- `showSendButton` - Tampilkan button send
- `buttonText` - Text button
- `buttonType` - Type button (default, primary, etc)
- `buttonSize` - Size button (small, default, large)

#### `<DebugDataModal />`

Props:
- `visible` - Modal visible
- `onClose` - Callback saat modal ditutup
- `originalData` - Data original
- `transformedData` - Data yang sudah ditransform
- `onConfirmSend` - Callback saat konfirmasi send
- `showSendButton` - Tampilkan button send di modal

## 📊 Validation Rules

### Customer Data
- ✅ Name harus diisi
- ✅ Email harus valid format (jika ada)
- ✅ MSISDN harus format +62xxxxxxxxx (jika ada)
- ✅ Address city/state harus ada minimal satu
- ⚠️ KTP harus 16 digit (jika ada)
- ⚠️ NPWP harus format valid (jika ada)

### Tier Data
- ✅ tier_type harus 'nominal' atau 'percentage'
- ✅ min_amount, max_amount, fee harus angka
- ✅ valid_from, valid_to harus format ISO8601

### Customer Crew
- ✅ Name harus diisi
- ✅ Email harus valid format (jika ada)
- ✅ MSISDN harus format valid (jika ada)

### Beneficiary Account
- ✅ firstname, lastname harus diisi
- ✅ account_number harus diisi
- ✅ bank.id harus diisi

### Branch Data
- ✅ name harus diisi
- ✅ address harus object

## 🎯 Best Practices

### 1. Always Debug First
```js
// ❌ Don't send directly
await syncCustomerToExternalApi(accountData);

// ✅ Debug first, then send
const debugResult = await debugCustomerData(accountData);
if (debugResult.validationResult.isValid) {
  await syncCustomerToExternalApi(accountData);
}
```

### 2. Handle Validation Results
```js
const result = await debugData(accountData);
const { isValid, errors, warnings } = result.validationResult;

if (!isValid) {
  console.error('Validation errors:', errors);
  // Show errors to user
  return;
}

if (warnings.length > 0) {
  console.warn('Validation warnings:', warnings);
  // Show warnings to user
}
```

### 3. Use Debug Modal for Complex Data
```jsx
<DebugDataModal
  visible={showDebug}
  originalData={accountData}
  transformedData={transformedData}
  onConfirmSend={(data, validation) => {
    if (validation.isValid) {
      // Proceed with API call
    } else {
      // Show validation errors
    }
  }}
/>
```

### 4. Monitor Data Quality
```js
const summary = getValidationSummary();
console.log('Data Quality:', {
  integrity: summary.dataIntegrity,
  errors: summary.errorCount,
  warnings: summary.warningCount
});
```

## 🔍 Debug Output Examples

### Successful Validation
```json
{
  "success": true,
  "mode": "debug",
  "validationResult": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "Customer email kosong"
    ],
    "summary": {
      "dataIntegrity": "PASS",
      "totalErrors": 0,
      "totalWarnings": 1
    }
  }
}
```

### Failed Validation
```json
{
  "success": true,
  "mode": "debug",
  "validationResult": {
    "isValid": false,
    "errors": [
      "Customer name harus diisi",
      "Beneficiary account: firstname harus diisi"
    ],
    "warnings": [],
    "summary": {
      "dataIntegrity": "FAIL",
      "totalErrors": 2,
      "totalWarnings": 0
    }
  }
}
```

## 🚨 Error Handling

```js
try {
  const result = await debugData(accountData);
  if (result.success) {
    // Handle success
  } else {
    // Handle debug failure
    console.error('Debug failed:', result.error);
  }
} catch (error) {
  // Handle unexpected error
  console.error('Unexpected error:', error);
}
```

## 📝 Tips

1. **Use Auto Debug**: Enable auto debug saat data berubah untuk immediate feedback
2. **Show Validation Summary**: Display validation summary di UI untuk user awareness
3. **Progressive Validation**: Fix critical errors first, then warnings
4. **Data Preview**: Always preview data sebelum send untuk confirmation
5. **Error Recovery**: Provide clear error messages dan recovery suggestions
