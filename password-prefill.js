// Password Prefill System for User Modules
// This script automatically prefills password fields across all user modules
// NOT for admin or dev modules

console.log('🔑 Password prefill system loaded');

// Global function to prefill passwords across all modules (not admin/dev)
window.prefillUserPassword = function() {
  // Skip if this is an admin or dev module
  if (window.location.pathname.includes('admin') || 
      window.location.pathname.includes('dev') ||
      document.title.includes('Admin') ||
      document.title.includes('Dev')) {
    console.log('🔑 Skipping password prefill - Admin/Dev module detected');
    return;
  }
  
  const prefillPassword = sessionStorage.getItem('prefillPassword');
  
  if (prefillPassword) {
    // Find all password inputs in the page (common IDs used across modules)
    const passwordSelectors = [
      '#passwordInput',
      '#password',
      '#platePassword',
      '#casePassword',
      '#accessPassword',
      'input[type="password"]',
      'input[type="text"][placeholder*="סיסמה"]',
      'input[type="text"][placeholder*="password"]'
    ];
    
    let filledCount = 0;
    
    passwordSelectors.forEach(selector => {
      const input = document.querySelector(selector);
      if (input && !input.value) {
        input.value = prefillPassword;
        filledCount++;
        console.log(`🔑 Password prefilled for selector: ${selector}`);
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
});

// Also run when page becomes visible (in case user switches tabs)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    setTimeout(() => {
      window.prefillUserPassword();
    }, 100);
  }
});

// Export for manual use
window.passwordPrefill = {
  prefillUserPassword: window.prefillUserPassword,
  storeMainGatePassword: window.storeMainGatePassword
};