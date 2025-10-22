// Password Prefill System for User Modules
// Updated for Supabase Authentication
// This script validates Supabase auth session - NO MORE PASSWORD PREFILLING
// Password-based security replaced with session-based authentication

console.log('🔑 Auth validation system loaded (Supabase)');

// Global function to validate Supabase authentication
window.prefillUserPassword = function() {
  // Skip if this is an admin or dev module
  if (window.location.pathname.includes('admin') || 
      window.location.pathname.includes('dev') ||
      document.title.includes('Admin') ||
      document.title.includes('Dev')) {
    console.log('🔑 Skipping auth check - Admin/Dev module detected');
    return;
  }
  
  console.log('🔐 Checking Supabase authentication...');
  
  // Check for Supabase auth session
  const authData = sessionStorage.getItem('auth');
  
  if (authData) {
    try {
      const auth = JSON.parse(authData);
      if (auth.user && auth.session) {
        console.log('✅ Valid Supabase session found for:', auth.user.email);
        return; // User is authenticated, allow access
      }
    } catch (e) {
      console.error('❌ Error parsing auth data:', e);
    }
  }
  
  // FALLBACK: Check for old password system (for backwards compatibility during migration)
  const prefillPassword = sessionStorage.getItem('prefillPassword') || 
                          sessionStorage.getItem('mainGatePassword') || 
                          sessionStorage.getItem('originalPassword');
  
  if (prefillPassword) {
    console.log('⚠️ Using legacy password system (deprecated)');
    // Allow old system to work during transition
    // Find all password inputs in the page (common IDs used across modules)
    const passwordSelectors = [
      '#passwordInput',
      '#password',
      '#pass',  // Added for Levi upload form
      '#platePassword',
      '#casePassword',
      '#accessPassword',
      '#builderPasswordInput',  // Added for final-report-builder
      'input[type="password"]',
      'input[type="text"][placeholder*="סיסמה"]',
      'input[type="text"][placeholder*="password"]'
    ];
    
    let filledCount = 0;
    
    passwordSelectors.forEach(selector => {
      const input = document.querySelector(selector);
      if (input && !input.value) {
        // Special handling for builderPasswordInput - user expects to see actual password
        if (input.id === 'builderPasswordInput') {
          input.value = prefillPassword;
          console.log(`🔑 Password prefilled (visible) for selector: ${selector}`);
        } else {
          // Create masked display but store actual password for other fields
          const maskedPassword = '*'.repeat(prefillPassword.length);
          input.value = maskedPassword;
          
          // Store the actual password as a data attribute for form submission
          input.setAttribute('data-actual-password', prefillPassword);
          console.log(`🔑 Password prefilled (masked) for selector: ${selector}`);
        }
        
        // Handle form submission to use actual password (only for masked fields)
        if (input.id !== 'builderPasswordInput') {
          const form = input.closest('form');
          if (form && !form.hasAttribute('data-password-handler-added')) {
            form.setAttribute('data-password-handler-added', 'true');
            const maskedPassword = '*'.repeat(prefillPassword.length);
            form.addEventListener('submit', function(e) {
              // Replace masked password with actual password before submission
              if (input.value === maskedPassword) {
                input.value = prefillPassword;
              }
            });
          }
        }
        
        filledCount++;
      }
    });
    
    if (filledCount > 0) {
      console.log(`🔑 Password prefilled in ${filledCount} fields`);
    }
  } else {
    console.log('🔑 No password found for prefilling');
  }
};

// Store password from main gate login
window.storeMainGatePassword = function() {
  // Check for main gate password in sessionStorage (various possible keys)
  const possiblePasswordKeys = [
    'mainGatePassword',
    'userPassword', 
    'loginPassword',
    'password',
    'auth_password'
  ];
  
  let mainGatePassword = null;
  
  // Find the password from possible storage keys
  for (const key of possiblePasswordKeys) {
    const stored = sessionStorage.getItem(key);
    if (stored) {
      mainGatePassword = stored;
      console.log(`🔑 Found password in sessionStorage key: ${key}`);
      break;
    }
  }
  
  // Also check if password was passed via URL parameters (for some workflows)
  const urlParams = new URLSearchParams(window.location.search);
  const urlPassword = urlParams.get('password');
  if (urlPassword) {
    mainGatePassword = urlPassword;
    console.log('🔑 Found password in URL parameters');
  }
  
  if (mainGatePassword) {
    // Store the password for other modules to use
    sessionStorage.setItem('prefillPassword', mainGatePassword);
    console.log('🔑 Main gate password stored for prefilling');
    
    // Immediately prefill current page
    setTimeout(() => {
      window.prefillUserPassword();
    }, 100);
  }
};

// Auto-run on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔑 Password prefill system initializing');
  
  // Store password from main gate if available
  window.storeMainGatePassword();
  
  // Wait a bit for page to fully load, then prefill
  setTimeout(() => {
    window.prefillUserPassword();
  }, 500);
  
  // Also run immediately after DOM is ready
  window.prefillUserPassword();
});

// Also run when page becomes visible (in case user switches tabs)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    setTimeout(() => {
      window.prefillUserPassword();
    }, 100);
  }
});

// Test function for manual debugging
window.testPasswordPrefill = function() {
  console.log('🔑 Testing password prefill system...');
  
  // Set a test password
  sessionStorage.setItem('prefillPassword', 'test123');
  console.log('🔑 Test password stored:', sessionStorage.getItem('prefillPassword'));
  
  // Run prefill
  window.prefillUserPassword();
  
  // Check if password field was filled
  const passwordInput = document.getElementById('passwordInput');
  if (passwordInput) {
    console.log('🔑 Password field value (should be masked):', passwordInput.value);
    console.log('🔑 Actual password stored:', passwordInput.getAttribute('data-actual-password'));
    console.log('🔑 Password field found:', !!passwordInput);
  } else {
    console.log('🔑 Password field not found');
  }
  
  // List all possible password fields
  const allPasswordFields = document.querySelectorAll('input[type="password"], input[type="text"][placeholder*="סיסמה"], input[type="text"][placeholder*="password"]');
  console.log('🔑 All password fields found:', allPasswordFields.length);
  allPasswordFields.forEach((field, index) => {
    console.log(`🔑 Field ${index + 1}:`, field.id || field.name || field.placeholder, 'Masked Value:', field.value, 'Actual:', field.getAttribute('data-actual-password'));
  });
};

// Export for manual use
window.passwordPrefill = {
  prefillUserPassword: window.prefillUserPassword,
  storeMainGatePassword: window.storeMainGatePassword,
  testPasswordPrefill: window.testPasswordPrefill
};