# Customer Sync dengan Database Update

Sistem untuk sync customer data ke external API dan update database dengan ID yang diterima dari response.

## 🔄 **Flow Lengkap:**

### **1. Sebelum Sync:**
- Ambil data account dari database (termasuk IDs lokal)
- Transform data ke format customer command
- Validasi data dengan debug system

### **2. Sync ke External API:**
- Kirim data ke external API
- Dapat response dengan ID baru

### **3. Update Database:**
- Extract ID dari response
- Update database dengan ID external

## 📊 **Mapping Response ke Database:**

```javascript
// Response dari External API
{
  "customer": { "data": { "id": "ext-customer-123" } },
  "branch": { "data": { "id": "ext-branch-456" } },
  "tier": { 
    "data": [
      { "id": "ext-tier-789" },
      { "id": "ext-tier-101" }
    ]
  },
  "crew": {
    "data": [
      { "id": "ext-crew-202" },
      { "id": "ext-crew-303" }
    ]
  }
}

// Update ke Database:
// customer.data.id → m_account.uuid_be
// branch.data.id → m_account.uuid_be (sama dengan customer)
// tier.data[].id → m_account_package_tier.uuid_be
// crew.data[].id → m_account_pic.uuid_be
```

## 🚀 **Cara Penggunaan:**

### **Basic Usage:**
```javascript
import { syncCustomerToExternalApi } from '../utils/customerSyncUtils';

const accountData = {
  id: 'local-account-123',
  name: 'PT. Contoh',
  package_tiers: [
    { id: 'local-tier-1', min_value: 1000000 },
    { id: 'local-tier-2', min_value: 5000000 }
  ],
  pics: [
    { id: 'local-pic-1', name: 'John Doe' },
    { id: 'local-pic-2', name: 'Jane Smith' }
  ]
};

const result = await syncCustomerToExternalApi(
  accountData, 
  null, // configId (optional)
  'user-123', // userId
  'account-456', // accountId
  false // debugMode
);

console.log('Sync Result:', result);
// {
//   success: true,
//   response: { /* external API response */ },
//   customerData: { /* transformed data */ },
//   processingResult: { /* database update results */ }
// }
```

### **Dengan Debug Mode:**
```javascript
// Debug dulu sebelum sync
const debugResult = await syncCustomerToExternalApi(
  accountData, 
  null, 
  'user-123', 
  'account-456', 
  true // debugMode = true
);

if (debugResult.validationResult.isValid) {
  // Sync ke external API
  const syncResult = await syncCustomerToExternalApi(
    accountData, 
    null, 
    'user-123', 
    'account-456', 
    false // debugMode = false
  );
}
```

## 🔧 **API Functions yang Digunakan:**

### **1. updateAccount()**
```javascript
// Update m_account.uuid_be
await accountApi.updateAccount(accountId, {
  uuid_be: externalCustomerId,
  updated_by: userId
});
```

### **2. updatePackageTier()**
```javascript
// Update m_account_package_tier.uuid_be
await updatePackageTier(tierId, {
  uuid_be: externalTierId,
  updated_by: userId
});
```

### **3. updateAccountPIC()**
```javascript
// Update m_account_pic.uuid_be
await updateAccountPIC(picId, {
  uuid_be: externalCrewId,
  updated_by: userId
});
```

## 📝 **Response Processing:**

### **Success Response:**
```javascript
{
  success: true,
  updatedRecords: [
    {
      success: true,
      type: 'customer',
      accountId: 'local-account-123',
      uuidBe: 'ext-customer-123',
      updatedAt: '2024-01-15T10:30:00.000Z'
    },
    {
      success: true,
      type: 'tier',
      updatedCount: 2,
      failedCount: 0,
      details: [
        { success: true, tierId: 'local-tier-1', uuidBe: 'ext-tier-789' },
        { success: true, tierId: 'local-tier-2', uuidBe: 'ext-tier-101' }
      ]
    },
    {
      success: true,
      type: 'crew',
      updatedCount: 2,
      failedCount: 0,
      details: [
        { success: true, picId: 'local-pic-1', uuidBe: 'ext-crew-202' },
        { success: true, picId: 'local-pic-2', uuidBe: 'ext-crew-303' }
      ]
    }
  ],
  errors: [],
  summary: {
    totalUpdated: 3,
    totalErrors: 0
  }
}
```

### **Partial Success Response:**
```javascript
{
  success: false,
  updatedRecords: [
    {
      success: true,
      type: 'customer',
      accountId: 'local-account-123',
      uuidBe: 'ext-customer-123'
    }
  ],
  errors: [
    'Failed to update tier UUID: Database connection error',
    'Failed to update crew UUID: Invalid PIC ID'
  ],
  summary: {
    totalUpdated: 1,
    totalErrors: 2
  }
}
```

## ⚠️ **Error Handling:**

### **1. External API Error:**
```javascript
{
  success: false,
  error: 'External API Error: Invalid data format',
  details: { /* external API error details */ },
  customerData: { /* transformed data for debugging */ }
}
```

### **2. Database Update Error:**
```javascript
{
  success: true,
  response: { /* successful external API response */ },
  processingResult: {
    success: false,
    error: 'Database connection failed',
    updatedRecords: [],
    errors: ['Failed to update account UUID']
  }
}
```

### **3. Partial Update Success:**
```javascript
{
  success: true,
  response: { /* successful external API response */ },
  processingResult: {
    success: false, // Ada beberapa update yang gagal
    updatedRecords: [ /* successful updates */ ],
    errors: [ /* failed updates */ ],
    summary: {
      totalUpdated: 2,
      totalErrors: 1
    }
  }
}
```

## 🔍 **Debug & Monitoring:**

### **Console Logs:**
```
🔄 Starting customer sync to external API...
📤 Sending customer data to external API: { configId: '...', customerName: '...' }
✅ Customer sync completed successfully: { /* response */ }
🔄 Processing external API response for database updates...
👤 Processing customer response: ext-customer-123
✅ Customer UUID updated successfully: { accountId: '...', uuidBe: '...' }
📊 Processing tier response: { /* tier data */ }
✅ Tier updates completed: { total: 2, successful: 2, failed: 0 }
👥 Processing crew response: { /* crew data */ }
✅ Crew updates completed: { total: 2, successful: 2, failed: 0 }
✅ Database updates completed: { /* processing result */ }
```

### **Monitoring Database Updates:**
```javascript
const result = await syncCustomerToExternalApi(accountData, null, userId, accountId);

if (result.processingResult) {
  console.log('Database Update Summary:', {
    customerUpdated: result.processingResult.updatedRecords.find(r => r.type === 'customer')?.success,
    tiersUpdated: result.processingResult.updatedRecords.find(r => r.type === 'tier')?.updatedCount,
    crewsUpdated: result.processingResult.updatedRecords.find(r => r.type === 'crew')?.updatedCount,
    totalErrors: result.processingResult.summary.totalErrors
  });
}
```

## 🎯 **Best Practices:**

### **1. Always Check Processing Result:**
```javascript
const result = await syncCustomerToExternalApi(accountData, null, userId, accountId);

if (result.success) {
  if (result.processingResult?.success) {
    // All database updates successful
    console.log('✅ Complete sync successful');
  } else {
    // Some database updates failed
    console.warn('⚠️ External sync successful but some database updates failed');
    console.log('Failed updates:', result.processingResult.errors);
  }
} else {
  // External API sync failed
  console.error('❌ External sync failed:', result.error);
}
```

### **2. Handle Partial Success:**
```javascript
const result = await syncCustomerToExternalApi(accountData, null, userId, accountId);

if (result.success && result.processingResult) {
  const { updatedRecords, errors } = result.processingResult;
  
  // Check what was updated successfully
  const customerUpdate = updatedRecords.find(r => r.type === 'customer');
  const tierUpdate = updatedRecords.find(r => r.type === 'tier');
  const crewUpdate = updatedRecords.find(r => r.type === 'crew');
  
  if (customerUpdate?.success) {
    console.log('✅ Customer UUID updated:', customerUpdate.uuidBe);
  }
  
  if (tierUpdate?.updatedCount > 0) {
    console.log(`✅ ${tierUpdate.updatedCount} tiers updated`);
  }
  
  if (crewUpdate?.updatedCount > 0) {
    console.log(`✅ ${crewUpdate.updatedCount} crew members updated`);
  }
  
  // Handle errors
  if (errors.length > 0) {
    console.error('Failed updates:', errors);
    // Show user notification or retry logic
  }
}
```

### **3. Retry Failed Updates:**
```javascript
const retryFailedUpdates = async (processingResult, accountData, userId) => {
  const failedUpdates = processingResult.errors;
  
  for (const error of failedUpdates) {
    console.log('Retrying failed update:', error);
    // Implement retry logic based on error type
  }
};
```

## 📋 **Checklist:**

- [ ] Account data memiliki ID lokal yang valid
- [ ] Package tiers memiliki ID lokal
- [ ] PICs memiliki ID lokal
- [ ] External API response memiliki ID yang sesuai
- [ ] Database update berhasil untuk semua entity
- [ ] Error handling untuk partial success
- [ ] Logging untuk monitoring dan debugging

---

**Sistem ini memastikan sinkronisasi yang lengkap antara external API dan database lokal, dengan error handling yang komprehensif dan monitoring yang detail.** 🚀
