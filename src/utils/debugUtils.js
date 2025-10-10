/**
 * Debug utilities untuk validasi dan preview data sebelum hit ke external API
 */

/**
 * Validasi format data customer command
 * @param {Object} data - Data yang akan divalidasi
 * @returns {Object} - Hasil validasi dengan detail error
 */
export const validateCustomerCommandData = (data) => {
  const errors = [];
  const warnings = [];
  const validatedData = { ...data };

  console.log('🔍 Starting validation for customer command data...');

  // Validasi struktur utama
  if (!data || typeof data !== 'object') {
    errors.push('Data harus berupa object');
    return { isValid: false, errors, warnings, data: validatedData };
  }

  // Validasi customer data
  if (!data.customer || typeof data.customer !== 'object') {
    errors.push('Field customer harus ada dan berupa object');
  } else {
    const customer = data.customer;
    
    // Required fields validation
    if (!customer.name || customer.name.trim() === '') {
      errors.push('Customer name harus diisi');
    }
    
    if (!customer.email || customer.email.trim() === '') {
      warnings.push('Customer email kosong');
    } else if (!isValidEmail(customer.email)) {
      errors.push('Format customer email tidak valid');
    }
    
    if (!customer.msisdn || customer.msisdn.trim() === '') {
      warnings.push('Customer MSISDN kosong');
    } else if (!isValidMSISDN(customer.msisdn)) {
      warnings.push('Format MSISDN mungkin tidak valid (harus dimulai dengan +62)');
    }
    
    // Validasi address
    if (!customer.address || typeof customer.address !== 'object') {
      errors.push('Customer address harus ada dan berupa object');
    } else {
      const address = customer.address;
      if (!address.city || address.city.trim() === '') {
        warnings.push('Customer address city kosong');
      }
      if (!address.state || address.state.trim() === '') {
        warnings.push('Customer address state/province kosong');
      }
      if (!address.country || address.country.trim() === '') {
        validatedData.customer.address.country = 'Indonesia'; // Auto-fix
        warnings.push('Customer address country kosong, menggunakan default: Indonesia');
      }
    }
    
    // Validasi KTP/NPWP
    if (customer.ktp && !isValidKTP(customer.ktp)) {
      warnings.push('Format KTP mungkin tidak valid (harus 16 digit)');
    }
    
    if (customer.npwp && !isValidNPWP(customer.npwp)) {
      warnings.push('Format NPWP mungkin tidak valid');
    }
  }

  // Validasi tier data
  if (data.tier && Array.isArray(data.tier)) {
    data.tier.forEach((tier, index) => {
      if (!tier.tier_type || !['nominal', 'percentage'].includes(tier.tier_type)) {
        errors.push(`Tier ${index + 1}: tier_type harus 'nominal' atau 'percentage'`);
      }
      
      if (tier.min_amount !== undefined && isNaN(parseFloat(tier.min_amount))) {
        errors.push(`Tier ${index + 1}: min_amount harus berupa angka`);
      }
      
      if (tier.max_amount !== undefined && isNaN(parseFloat(tier.max_amount))) {
        errors.push(`Tier ${index + 1}: max_amount harus berupa angka`);
      }
      
      if (tier.fee !== undefined && isNaN(parseFloat(tier.fee))) {
        errors.push(`Tier ${index + 1}: fee harus berupa angka`);
      }
      
      if (tier.valid_from && !isValidISO8601(tier.valid_from)) {
        errors.push(`Tier ${index + 1}: valid_from format tanggal tidak valid`);
      }
      
      if (tier.valid_to && !isValidISO8601(tier.valid_to)) {
        errors.push(`Tier ${index + 1}: valid_to format tanggal tidak valid`);
      }
    });
  }

  // Validasi customer-crew
  if (data['customer-crew'] && Array.isArray(data['customer-crew'])) {
    data['customer-crew'].forEach((crew, index) => {
      if (!crew.name || crew.name.trim() === '') {
        warnings.push(`Customer crew ${index + 1}: name kosong`);
      }
      
      if (crew.msisdn && !isValidMSISDN(crew.msisdn)) {
        warnings.push(`Customer crew ${index + 1}: format MSISDN mungkin tidak valid`);
      }
      
      if (crew.email && !isValidEmail(crew.email)) {
        errors.push(`Customer crew ${index + 1}: format email tidak valid`);
      }
      
      if (crew.ktp && !isValidKTP(crew.ktp)) {
        warnings.push(`Customer crew ${index + 1}: format KTP mungkin tidak valid`);
      }
    });
  }

  // Validasi beneficiary-account
  if (data['beneficiary-account']) {
    const beneficiary = data['beneficiary-account'];
    
    if (!beneficiary.firstname || beneficiary.firstname.trim() === '') {
      errors.push('Beneficiary account: firstname harus diisi');
    }
    
    if (!beneficiary.lastname || beneficiary.lastname.trim() === '') {
      errors.push('Beneficiary account: lastname harus diisi');
    }
    
    if (!beneficiary.account_number || beneficiary.account_number.trim() === '') {
      errors.push('Beneficiary account: account_number harus diisi');
    }
    
    if (!beneficiary.bank || !beneficiary.bank.id) {
      errors.push('Beneficiary account: bank ID harus diisi');
    }
  }

  // Validasi branch data
  if (!data.branch || typeof data.branch !== 'object') {
    errors.push('Field branch harus ada dan berupa object');
  } else {
    const branch = data.branch;
    
    if (!branch.name || branch.name.trim() === '') {
      errors.push('Branch name harus diisi');
    }
    
    if (!branch.code || branch.code.trim() === '') {
      warnings.push('Branch code kosong');
    }
    
    if (!branch.address || typeof branch.address !== 'object') {
      errors.push('Branch address harus ada dan berupa object');
    }
  }

  const isValid = errors.length === 0;
  
  console.log('✅ Validation completed:', {
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors: errors.slice(0, 5), // Log first 5 errors
    warnings: warnings.slice(0, 5) // Log first 5 warnings
  });

  return {
    isValid,
    errors,
    warnings,
    data: validatedData,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      criticalIssues: errors.filter(e => e.includes('harus')).length,
      dataIntegrity: isValid ? 'PASS' : 'FAIL'
    }
  };
};

/**
 * Format data untuk preview yang lebih mudah dibaca
 * @param {Object} data - Data yang akan diformat
 * @returns {Object} - Data yang sudah diformat untuk preview
 */
export const formatDataForPreview = (data) => {
  if (!data) return { error: 'No data provided' };

  const preview = {
    customer: {
      name: data.customer?.name || 'N/A',
      email: data.customer?.email || 'N/A',
      msisdn: data.customer?.msisdn || 'N/A',
      customer_role: data.customer?.customer_role || 'N/A',
      customer_type: data.customer?.customer_type || 'N/A',
      ktp: data.customer?.ktp ? `${data.customer.ktp.slice(0, 4)}****${data.customer.ktp.slice(-4)}` : 'N/A',
      npwp: data.customer?.npwp ? `${data.customer.npwp.slice(0, 4)}****${data.customer.npwp.slice(-4)}` : 'N/A',
      address: data.customer?.address || {}
    },
    tier: {
      count: data.tier?.length || 0,
      items: data.tier?.map(t => ({
        type: t.tier_type,
        category: t.tier_category,
        min_amount: t.min_amount,
        max_amount: t.max_amount,
        fee: t.fee,
        valid_from: t.valid_from,
        valid_to: t.valid_to
      })) || []
    },
    customerCrew: {
      count: data['customer-crew']?.length || 0,
      items: data['customer-crew']?.map(crew => ({
        name: crew.name || 'N/A',
        email: crew.email || 'N/A',
        msisdn: crew.msisdn || 'N/A',
        ktp: crew.ktp ? `${crew.ktp.slice(0, 4)}****${crew.ktp.slice(-4)}` : 'N/A'
      })) || []
    },
    beneficiaryAccount: data['beneficiary-account'] ? {
      name: `${data['beneficiary-account'].firstname || ''} ${data['beneficiary-account'].lastname || ''}`.trim(),
      account_number: data['beneficiary-account'].account_number || 'N/A',
      bank_id: data['beneficiary-account'].bank?.id || 'N/A'
    } : null,
    branch: {
      name: data.branch?.name || 'N/A',
      code: data.branch?.code || 'N/A',
      address: data.branch?.address || {}
    },
    metadata: {
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length,
      hasAutoDeduct: checkForAutoDeduct(data)
    }
  };

  return preview;
};

/**
 * Generate summary report untuk debug
 * @param {Object} originalData - Data original dari form
 * @param {Object} transformedData - Data yang sudah ditransform
 * @param {Object} validationResult - Hasil validasi
 * @returns {Object} - Summary report
 */
export const generateDebugReport = (originalData, transformedData, validationResult) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      originalDataSize: JSON.stringify(originalData).length,
      transformedDataSize: JSON.stringify(transformedData).length,
      validationStatus: validationResult.isValid ? 'PASS' : 'FAIL',
      totalIssues: validationResult.errors.length + validationResult.warnings.length
    },
    dataMapping: {
      customer: {
        name: `${originalData.name} → ${transformedData.customer?.name}`,
        email: `${originalData.email} → ${transformedData.customer?.email}`,
        phone: `${originalData.phone_no} → ${transformedData.customer?.msisdn}`
      },
      address: {
        city: `${originalData.addresses?.[0]?.city || 'N/A'} → ${transformedData.customer?.address?.city}`,
        state: `${originalData.addresses?.[0]?.province || 'N/A'} → ${transformedData.customer?.address?.state}`
      },
      pics: {
        count: `${originalData.pics?.length || 0} → ${transformedData['customer-crew']?.length || 0}`,
        owner: originalData.pics?.find(p => p.is_owner)?.name || 'N/A'
      }
    },
    validation: validationResult,
    recommendations: generateRecommendations(validationResult)
  };

  return report;
};

/**
 * Generate rekomendasi berdasarkan hasil validasi
 * @param {Object} validationResult - Hasil validasi
 * @returns {Array} - Array rekomendasi
 */
const generateRecommendations = (validationResult) => {
  const recommendations = [];
  
  if (validationResult.errors.length > 0) {
    recommendations.push('🚨 CRITICAL: Perbaiki error berikut sebelum mengirim data ke external API');
  }
  
  if (validationResult.warnings.length > 0) {
    recommendations.push('⚠️ WARNING: Pertimbangkan untuk melengkapi field yang kosong untuk data yang lebih lengkap');
  }
  
  if (validationResult.data.customer && !validationResult.data.customer.email) {
    recommendations.push('💡 Saran: Tambahkan email customer untuk komunikasi yang lebih baik');
  }
  
  if (validationResult.data['customer-crew']?.length === 0) {
    recommendations.push('💡 Saran: Pertimbangkan menambahkan customer crew untuk support');
  }
  
  if (!validationResult.data['beneficiary-account']) {
    recommendations.push('💡 Saran: Tambahkan beneficiary account untuk pembayaran');
  }
  
  return recommendations;
};

/**
 * Check for auto deduct configuration
 * @param {Object} data - Data untuk dicek
 * @returns {boolean} - True jika ada auto deduct
 */
const checkForAutoDeduct = (data) => {
  // Check in tier data
  if (data.tier && Array.isArray(data.tier)) {
    return data.tier.some(tier => 
      tier.tier_category === 'auto_deduct' || 
      tier.tier_type === 'auto_deduct'
    );
  }
  return false;
};

// Helper functions untuk validasi
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidMSISDN = (msisdn) => {
  // Format: +62xxxxxxxxx
  const msisdnRegex = /^\+62\d{9,12}$/;
  return msisdnRegex.test(msisdn);
};

const isValidKTP = (ktp) => {
  // 16 digit
  const ktpRegex = /^\d{16}$/;
  return ktpRegex.test(ktp.replace(/\D/g, ''));
};

const isValidNPWP = (npwp) => {
  // Format: XX.XXX.XXX.X-XXX.XXX
  const npwpRegex = /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/;
  return npwpRegex.test(npwp);
};

const isValidISO8601 = (dateString) => {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return iso8601Regex.test(dateString);
};

export default {
  validateCustomerCommandData,
  formatDataForPreview,
  generateDebugReport
};
