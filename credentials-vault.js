// 🔐 Credentials Vault for In-System Browser Access
// Provides secure credential management for third-party portal integration

export const dev_credentials = {
  carPart: {
    username: "ירון כיוף",
    password: "8881",
    url: "https://www.car-part.co.il/Include/Generic/AccessSystem.jsp"
  },
  leviItzhak: {
    username: "s-yaronc",
    password: "1417",
    url: "https://portal.levi-itzhak.co.il"
  }
};

// Auto-fill login function for detected portals
export function autofillLogin(portal) {
  const creds = dev_credentials[portal];
  if (!creds) {
    console.warn(`Credentials not found for portal: ${portal}`);
    return false;
  }

  try {
    // Common username field selectors
    const usernameField = document.querySelector(
      'input[name="username"], input[name="user"], input[type="text"], input[id*="user"], input[id*="login"]'
    );
    
    // Common password field selectors
    const passwordField = document.querySelector(
      'input[name="password"], input[type="password"], input[id*="pass"]'
    );

    if (usernameField && passwordField) {
      usernameField.value = creds.username;
      passwordField.value = creds.password;
      
      // Trigger change events to ensure forms recognize the input
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log(`✅ Auto-filled credentials for ${portal}`);
      return true;
    } else {
      console.warn(`Login fields not found for ${portal}`);
      return false;
    }
  } catch (error) {
    console.error(`Error auto-filling ${portal} credentials:`, error);
    return false;
  }
}

// Detect portal from URL and auto-fill if configured
export function detectAndFillPortal(url = window.location.href) {
  let detectedPortal = null;
  
  if (url.includes('car-part.co.il')) {
    detectedPortal = 'carPart';
  } else if (url.includes('levi-itzhak.co.il')) {
    detectedPortal = 'leviItzhak';
  }
  
  if (detectedPortal) {
    // Wait for page load and form rendering
    setTimeout(() => {
      autofillLogin(detectedPortal);
    }, 1000);
    
    return detectedPortal;
  }
  
  return null;
}

// Initialize auto-detection when module loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    detectAndFillPortal();
  });
}

export default { dev_credentials, autofillLogin, detectAndFillPortal };