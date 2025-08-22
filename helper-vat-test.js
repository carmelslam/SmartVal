// helper-vat-test.js
// Simple test to verify helper.calculations.vat_rate is being updated correctly

console.log('🧪 Helper VAT Test loaded');

// Test function to check helper VAT status
window.testHelperVat = function() {
  console.log('🔍 Testing Helper VAT Status:');
  console.log('─────────────────────────────');
  
  // Check if helper exists
  if (typeof window.helper === 'undefined') {
    console.log('❌ window.helper not found');
    return;
  } else {
    console.log('✅ window.helper exists');
  }
  
  // Check calculations section
  if (!window.helper.calculations) {
    console.log('⚠️ window.helper.calculations not found');
    return;
  } else {
    console.log('✅ window.helper.calculations exists');
  }
  
  // Check VAT rate in helper
  const helperVat = window.helper.calculations.vat_rate;
  console.log('📊 helper.calculations.vat_rate:', helperVat);
  console.log('📊 VAT source:', window.helper.calculations.vat_rate_source || 'not set');
  console.log('📊 Last updated:', window.helper.calculations.vat_rate_updated || 'never');
  
  // Check helper VAT function
  if (typeof window.getHelperVatRate === 'function') {
    const functionVat = window.getHelperVatRate();
    console.log('✅ getHelperVatRate() returns:', functionVat);
  } else {
    console.log('❌ getHelperVatRate function not available');
  }
  
  // Check admin update function
  if (typeof window.setHelperVatRateFromAdmin === 'function') {
    console.log('✅ setHelperVatRateFromAdmin function available');
  } else {
    console.log('❌ setHelperVatRateFromAdmin function not available');
  }
  
  // Check MathEngine
  if (typeof MathEngine !== 'undefined' && MathEngine.getVatRate) {
    console.log('✅ MathEngine.getVatRate() returns:', MathEngine.getVatRate());
  } else {
    console.log('⚠️ MathEngine not available');
  }
  
  console.log('─────────────────────────────');
  
  return {
    helper_exists: typeof window.helper !== 'undefined',
    calculations_exists: window.helper?.calculations !== undefined,
    helper_vat_rate: helperVat,
    helper_vat_source: window.helper.calculations?.vat_rate_source,
    get_function_works: typeof window.getHelperVatRate === 'function',
    set_function_works: typeof window.setHelperVatRateFromAdmin === 'function',
    mathengine_available: typeof MathEngine !== 'undefined'
  };
};

// Test function to simulate admin VAT change
window.simulateAdminVatChange = function(newRate = 17) {
  console.log(`🧪 Simulating admin VAT change to ${newRate}%...`);
  
  if (typeof window.setHelperVatRateFromAdmin === 'function') {
    const success = window.setHelperVatRateFromAdmin(newRate, 'test_admin');
    console.log(success ? '✅ Helper VAT updated successfully' : '❌ Failed to update helper VAT');
    
    // Check if it worked
    setTimeout(() => {
      console.log('🔍 Verifying change:');
      console.log('helper.calculations.vat_rate:', window.helper?.calculations?.vat_rate);
      console.log('getHelperVatRate():', window.getHelperVatRate ? window.getHelperVatRate() : 'function not available');
    }, 100);
    
    return success;
  } else {
    console.log('❌ setHelperVatRateFromAdmin function not available');
    return false;
  }
};

// Listen for VAT rate changes
window.addEventListener('vatRateChanged', function(event) {
  console.log('🎉 VAT Rate Change Event Received!');
  console.log('New VAT Rate:', event.detail.newVatRate + '%');
  console.log('Old VAT Rate:', event.detail.oldVatRate + '%');
  console.log('Source:', event.detail.source);
  console.log('Timestamp:', event.detail.timestamp);
});

// Auto-test when loaded
setTimeout(() => {
  console.log('🚀 Running automatic helper VAT test...');
  testHelperVat();
}, 1000);

console.log('🔧 Helper VAT test functions available:');
console.log('- testHelperVat() - Check current VAT status');
console.log('- simulateAdminVatChange(17) - Test admin VAT change');