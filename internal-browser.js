(function () {
  if (document.getElementById("internalBrowser")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #internalBrowser {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 99999;
      display: none;
      flex-direction: column;
    }
    .browser-header {
      background: #2c3e50;
      color: white;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: sans-serif;
      direction: rtl;
      min-height: 50px;
    }
    .browser-title {
      font-size: 16px;
      font-weight: bold;
      flex: 1;
      text-align: center;
    }
    .browser-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .browser-btn {
      background: #34495e;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
    }
    .browser-btn:hover {
      background: #4a6741;
    }
    .browser-btn.close {
      background: #e74c3c;
    }
    .browser-btn.close:hover {
      background: #c0392b;
    }
    .browser-url-bar {
      background: #ecf0f1;
      padding: 8px 15px;
      border-bottom: 1px solid #bdc3c7;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .browser-url {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      font-size: 14px;
      text-align: left;
      direction: ltr;
    }
    .browser-go-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    .browser-content {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    .browser-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }
    .browser-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #7f8c8d;
      font-family: sans-serif;
      direction: rtl;
    }
    .browser-status {
      background: #f8f9fa;
      padding: 5px 15px;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #dee2e6;
      text-align: right;
      direction: rtl;
    }
    .credentials-popup {
      position: absolute;
      top: 80px;
      right: 20px;
      max-width: 350px;
      background: #2c3e50;
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: monospace;
      font-size: 14px;
      z-index: 100000;
      direction: rtl;
      display: none;
    }
    .credentials-popup h4 {
      margin: 0 0 10px 0;
      color: #3498db;
      font-size: 16px;
    }
    .credential-field {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .credential-field .label {
      color: #bdc3c7;
    }
    .credential-field .value {
      color: #e74c3c;
      font-weight: bold;
      cursor: pointer;
    }
    .auto-fill-btn {
      background: #27ae60;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      width: 100%;
      font-weight: bold;
    }
    .session-warning {
      background: #f39c12;
      color: white;
      padding: 8px 15px;
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      direction: rtl;
    }
  `;
  document.head.appendChild(style);

  const browser = document.createElement("div");
  browser.id = "internalBrowser";
  browser.innerHTML = `
    <div class="browser-header">
      <div class="browser-controls">
        <button class="browser-btn" onclick="browserGoBack()">◀ חזור</button>
        <button class="browser-btn" onclick="browserRefresh()">🔄 רענן</button>
        <button class="browser-btn" onclick="showCredentials()">🔑 פרטי גישה</button>
      </div>
      <div class="browser-title" id="browserTitle">דפדפן מובנה</div>
      <div class="browser-controls">
        <button class="browser-btn" onclick="minimizeBrowser()">📱 מזער</button>
        <button class="browser-btn close" onclick="closeBrowser()">✕ סגור</button>
      </div>
    </div>
    
    <div class="session-warning" id="sessionWarning" style="display: none;">
      ⚠️ הפעלת הדפדפן המובנה תשמור על המושב שלך פעיל
    </div>
    
    <div class="browser-url-bar">
      <input type="text" class="browser-url" id="browserUrl" placeholder="הזן כתובת אתר..." />
      <button class="browser-go-btn" onclick="navigateTo()">עבור</button>
    </div>
    
    <div class="browser-content">
      <div class="browser-loading" id="browserLoading">
        <div style="font-size: 20px; margin-bottom: 10px;">🔄</div>
        <div>טוען אתר...</div>
      </div>
      <iframe class="browser-iframe" id="browserIframe" sandbox="allow-scripts allow-forms allow-popups allow-top-navigation" data-security-fixed="true"></iframe>
    </div>
    
    <div class="browser-status" id="browserStatus">
      מוכן
    </div>
    
    <div class="credentials-popup" id="credentialsPopup">
      <h4>פרטי גישה</h4>
      <div id="credentialsList"></div>
      <button class="auto-fill-btn" onclick="autoFillCredentials()">מלא אוטומטית</button>
      <button class="browser-btn" onclick="hideCredentials()" style="margin-top: 10px; width: 100%;">סגור</button>
    </div>
  `;
  
  // ✅ FIXED: Check if document.body exists before appending
  if (document.body) {
    document.body.appendChild(browser);
  } else {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(browser);
    });
  }

  // Global variables
  let currentSite = null;
  let sessionKeepAlive = null;
  let isMinimized = false;
  let originalUrl = '';

  // Site configurations with secure credential vault integration
  const siteConfigs = {
    'car-part.co.il': {
      name: 'Car Part - חלקי רכב',
      url: 'https://www.car-part.co.il',
      credentialKey: 'car_part_credentials', // Reference to vault
      autoLogin: true,
      loginSelectors: {
        usernameField: 'input[name="email"], input[type="email"], #email',
        passwordField: 'input[name="password"], input[type="password"], #password',
        submitButton: 'button[type="submit"], input[type="submit"], .login-button'
      }
    },
    'portal.levi-itzhak.co.il': {
      name: 'פורטל לוי יצחק',
      url: 'https://portal.levi-itzhak.co.il/levicars/',
      credentialKey: 'levi_portal_credentials', // Reference to vault
      autoLogin: true,
      loginSelectors: {
        usernameField: '#username, input[name="username"]',
        passwordField: '#password, input[name="password"]',
        submitButton: '#login-btn, button[type="submit"]'
      }
    }
  };

  // Secure credentials vault
  const credentialsVault = {
    async getCredentials(credentialKey) {
      try {
        // Try to get from secure sessionStorage first
        const stored = sessionStorage.getItem(`vault_${credentialKey}`);
        if (stored) {
          const decrypted = await this.decryptCredentials(stored);
          if (decrypted) return decrypted;
        }
        
        // Fallback to default credentials if vault is empty
        const defaultCredentials = await this.getDefaultCredentials(credentialKey);
        if (defaultCredentials) {
          // Store in vault for next time
          await this.storeCredentials(credentialKey, defaultCredentials);
          return defaultCredentials;
        }
        
        throw new Error('No credentials available');
      } catch (error) {
        console.error('Error getting credentials:', error);
        throw error;
      }
    },

    async storeCredentials(credentialKey, credentials) {
      try {
        const encrypted = await this.encryptCredentials(credentials);
        sessionStorage.setItem(`vault_${credentialKey}`, encrypted);
        console.log(`Credentials stored for ${credentialKey}`);
      } catch (error) {
        console.error('Error storing credentials:', error);
      }
    },

    async encryptCredentials(credentials) {
      // Use the same encryption as auth.js
      if (typeof encryptPassword === 'function') {
        return await encryptPassword(JSON.stringify(credentials));
      }
      // Fallback to base64 encoding (not secure, but better than plain text)
      return btoa(JSON.stringify(credentials));
    },

    async decryptCredentials(encryptedData) {
      try {
        // Use the same decryption as auth.js
        if (typeof decryptPassword === 'function') {
          const decrypted = await decryptPassword(encryptedData);
          return JSON.parse(decrypted);
        }
        // Fallback to base64 decoding
        return JSON.parse(atob(encryptedData));
      } catch (error) {
        console.error('Decryption failed:', error);
        return null;
      }
    },

    async getDefaultCredentials(credentialKey) {
      // Default credentials - in production, these would come from a secure server
      const defaults = {
        car_part_credentials: {
          username: 'yaronkayouf@gmail.com',
          password: 'YK123456!'
        },
        levi_portal_credentials: {
          username: 'yaronkayouf@gmail.com', 
          password: 'YK123456!'
        }
      };
      
      return defaults[credentialKey] || null;
    },

    async updateCredentials(credentialKey, newCredentials) {
      await this.storeCredentials(credentialKey, newCredentials);
      updateStatus(`Credentials updated for ${credentialKey}`);
    }
  };

  // Global functions
  window.openInternalBrowser = function(site, purpose = '') {
    const config = siteConfigs[site];
    if (!config) {
      alert(`אתר ${site} לא נתמך במערכת`);
      return;
    }

    currentSite = site;
    originalUrl = window.location.href;
    
    // Update browser title and URL
    document.getElementById('browserTitle').textContent = config.name;
    document.getElementById('browserUrl').value = config.url;
    
    // Show browser
    document.getElementById('internalBrowser').style.display = 'flex';
    document.getElementById('sessionWarning').style.display = 'block';
    
    // Start session keep-alive
    startSessionKeepAlive();
    
    // Load the site
    loadSite(config.url);
    
    // Update status
    updateStatus(`נטען ${config.name}...`);
    
    setTimeout(() => {
      document.getElementById('sessionWarning').style.display = 'none';
    }, 3000);
  };

  window.closeBrowser = function() {
    if (confirm('האם אתה בטוח שברצונך לסגור את הדפדפן המובנה?')) {
      document.getElementById('internalBrowser').style.display = 'none';
      stopSessionKeepAlive();
      currentSite = null;
      
      // Clear iframe
      document.getElementById('browserIframe').src = 'about:blank';
      updateStatus('מוכן');
    }
  };

  window.minimizeBrowser = function() {
    const browser = document.getElementById('internalBrowser');
    if (isMinimized) {
      browser.style.display = 'flex';
      isMinimized = false;
      document.querySelector('.browser-btn').textContent = '📱 מזער';
    } else {
      browser.style.display = 'none';
      isMinimized = true;
      
      // Create minimized indicator
      if (!document.getElementById('browserMinimized')) {
        const indicator = document.createElement('div');
        indicator.id = 'browserMinimized';
        indicator.innerHTML = '🌐 דפדפן מזוער';
        indicator.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #2c3e50;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          z-index: 9999;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        indicator.onclick = function() {
          minimizeBrowser();
          this.remove();
        };
        document.body.appendChild(indicator);
      }
    }
  };

  window.browserGoBack = function() {
    const iframe = document.getElementById('browserIframe');
    try {
      iframe.contentWindow.history.back();
    } catch (e) {
      console.log('Cannot access iframe history');
    }
  };

  window.browserRefresh = function() {
    const iframe = document.getElementById('browserIframe');
    iframe.src = iframe.src;
    updateStatus('מרענן...');
  };

  window.navigateTo = function() {
    const url = document.getElementById('browserUrl').value.trim();
    if (!url) return;
    
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }
    
    loadSite(fullUrl);
  };

  window.showCredentials = async function() {
    if (!currentSite || !siteConfigs[currentSite]) {
      alert('אין פרטי גישה זמינים לאתר זה');
      return;
    }

    const config = siteConfigs[currentSite];
    const popup = document.getElementById('credentialsPopup');
    const list = document.getElementById('credentialsList');
    
    try {
      // Get credentials from vault
      const credentials = await credentialsVault.getCredentials(config.credentialKey);
      
      list.innerHTML = `
        <div class="credential-field">
          <span class="label">שם משתמש:</span>
          <span class="value" onclick="copyToClipboard('${credentials.username}')">${credentials.username}</span>
        </div>
        <div class="credential-field">
          <span class="label">סיסמה:</span>
          <span class="value" onclick="copyToClipboard('${credentials.password}')">${credentials.password}</span>
        </div>
        <div class="credential-field" style="margin-top: 10px;">
          <button onclick="editCredentials('${config.credentialKey}')" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">ערוך פרטי גישה</button>
        </div>
      `;
      
      popup.style.display = 'block';
    } catch (error) {
      alert(`שגיאה בטעינת פרטי גישה: ${error.message}`);
    }
  };

  window.hideCredentials = function() {
    document.getElementById('credentialsPopup').style.display = 'none';
  };

  window.autoFillCredentials = async function() {
    if (!currentSite || !siteConfigs[currentSite]) return;
    
    const config = siteConfigs[currentSite];
    const iframe = document.getElementById('browserIframe');
    
    try {
      // Get credentials from vault
      const credentials = await credentialsVault.getCredentials(config.credentialKey);
      
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Validate iframe access and check for cross-origin restrictions
      if (!doc) {
        throw new Error('Cannot access iframe document - likely cross-origin restriction');
      }
      
      const selectors = config.loginSelectors;
      
      // Find and fill username field
      const usernameField = doc.querySelector(selectors.usernameField);
      if (usernameField) {
        usernameField.value = credentials.username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Find and fill password field
      const passwordField = doc.querySelector(selectors.passwordField);
      if (passwordField) {
        passwordField.value = credentials.password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      updateStatus('פרטי הגישה מולאו אוטומטית');
      hideCredentials();
      
      // Auto-submit if configured
      if (config.autoLogin) {
        setTimeout(() => {
          const submitButton = doc.querySelector(selectors.submitButton);
          if (submitButton) {
            submitButton.click();
            updateStatus('מתחבר אוטומטית...');
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('Auto-fill error:', error);
      
      // Provide specific error handling for different error types
      if (error.name === 'SecurityError' || error.message.includes('cross-origin')) {
        updateStatus('מילוי אוטומטי חסום - גישה ידנית נדרשת');
        showCredentialsPopup(config.credentials);
      } else {
        updateStatus('שגיאה במילוי אוטומטי - נסה ידנית');
        alert('לא ניתן למלא אוטומטית. נסה למלא ידנית.');
      }
    }
  };

  // Helper functions
  function loadSite(url) {
    const iframe = document.getElementById('browserIframe');
    const loading = document.getElementById('browserLoading');
    
    loading.style.display = 'block';
    iframe.style.display = 'none';
    
    iframe.onload = function() {
      loading.style.display = 'none';
      iframe.style.display = 'block';
      updateStatus(`נטען בהצלחה: ${url}`);
      
      // Update URL bar
      document.getElementById('browserUrl').value = url;
      
      // Auto-fill credentials if this is a login page
      if (currentSite && siteConfigs[currentSite] && siteConfigs[currentSite].autoLogin) {
        setTimeout(() => {
          checkForLoginForm();
        }, 2000);
      }
    };
    
    iframe.onerror = function() {
      loading.style.display = 'none';
      iframe.style.display = 'block';
      updateStatus('שגיאה בטעינת האתר');
    };
    
    iframe.src = url;
    updateStatus(`טוען ${url}...`);
  }

  function checkForLoginForm() {
    if (!currentSite || !siteConfigs[currentSite]) return;
    
    const config = siteConfigs[currentSite];
    const iframe = document.getElementById('browserIframe');
    
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const usernameField = doc.querySelector(config.loginSelectors.usernameField);
      const passwordField = doc.querySelector(config.loginSelectors.passwordField);
      
      if (usernameField && passwordField) {
        // Show credentials popup automatically
        setTimeout(() => {
          showCredentials();
        }, 500);
      }
    } catch (error) {
      // Cross-origin restrictions - this is expected for external sites
      console.log('Cannot check for login form due to cross-origin restrictions');
    }
  }

  function startSessionKeepAlive() {
    // Keep session alive by pinging the system every 5 minutes
    sessionKeepAlive = setInterval(() => {
      try {
        // Validate session before attempting to keep alive
        if (!validateSession()) {
          console.log('Session invalid, stopping keep-alive');
          stopSessionKeepAlive();
          return;
        }
        
        // Check if helper exists and has keepSessionAlive function
        if (typeof helper !== 'undefined' && typeof helper.keepSessionAlive === 'function') {
          helper.keepSessionAlive();
        } else {
          // Fallback: touch sessionStorage with validation
          const auth = sessionStorage.getItem('auth');
          if (auth && auth.length > 0) {
            sessionStorage.setItem('lastActivity', new Date().toISOString());
            console.log('Session keep-alive: sessionStorage updated');
          }
        }
      } catch (error) {
        console.error('Session keep-alive error:', error);
      }
    }, 300000); // 5 minutes
  }

  function stopSessionKeepAlive() {
    if (sessionKeepAlive) {
      clearInterval(sessionKeepAlive);
      sessionKeepAlive = null;
    }
  }

  function validateSession() {
    try {
      const auth = sessionStorage.getItem('auth');
      if (!auth || auth.length === 0) {
        return false;
      }
      
      // Check if session is not too old (max 24 hours)
      const lastActivity = sessionStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeDiff = Date.now() - new Date(lastActivity).getTime();
        const hoursOld = timeDiff / (1000 * 60 * 60);
        if (hoursOld > 24) {
          console.log('Session expired (older than 24 hours)');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Credential management functions
  window.editCredentials = async function(credentialKey) {
    try {
      const credentials = await credentialsVault.getCredentials(credentialKey);
      
      const newUsername = prompt('שם משתמש חדש:', credentials.username);
      if (newUsername === null) return; // User cancelled
      
      const newPassword = prompt('סיסמה חדשה:', credentials.password);
      if (newPassword === null) return; // User cancelled
      
      const updatedCredentials = {
        username: newUsername,
        password: newPassword
      };
      
      await credentialsVault.updateCredentials(credentialKey, updatedCredentials);
      alert('✅ פרטי הגישה עודכנו בהצלחה');
      
      // Refresh credentials display
      hideCredentials();
      setTimeout(() => showCredentials(), 100);
      
    } catch (error) {
      alert(`❌ שגיאה בעדכון פרטי גישה: ${error.message}`);
    }
  };

  function updateStatus(message) {
    document.getElementById('browserStatus').textContent = message;
  }

  function showCredentialsPopup(credentials) {
    const popup = document.createElement('div');
    popup.id = 'credentialsPopup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #007bff;
      border-radius: 10px;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
      <h3 style="margin-top: 0; color: #007bff;">פרטי כניסה לאתר</h3>
      <p><strong>שם משתמש:</strong> ${credentials.username}</p>
      <p><strong>סיסמה:</strong> ${credentials.password}</p>
      <p style="font-size: 14px; color: #666;">העתק את הפרטים והזן אותם באתר ידנית</p>
      <div style="text-align: center; margin-top: 15px;">
        <button onclick="copyToClipboard('${credentials.username}')" style="margin: 5px; padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">העתק שם משתמש</button>
        <button onclick="copyToClipboard('${credentials.password}')" style="margin: 5px; padding: 8px 15px; background: #ffc107; color: black; border: none; border-radius: 5px; cursor: pointer;">העתק סיסמה</button>
        <button onclick="document.getElementById('credentialsPopup').remove()" style="margin: 5px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">סגור</button>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Auto-close after 30 seconds
    setTimeout(() => {
      if (document.getElementById('credentialsPopup')) {
        popup.remove();
      }
    }, 30000);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      updateStatus('הועתק ללוח');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      updateStatus('הועתק ללוח');
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    const browser = document.getElementById('internalBrowser');
    if (browser.style.display !== 'flex') return;
    
    // Escape to close
    if (e.key === 'Escape') {
      closeBrowser();
    }
    
    // F5 to refresh
    if (e.key === 'F5') {
      e.preventDefault();
      browserRefresh();
    }
    
    // Alt+Left for back
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      browserGoBack();
    }
  });

  // Prevent browser from closing accidentally
  window.addEventListener('beforeunload', function(e) {
    const browser = document.getElementById('internalBrowser');
    if (browser.style.display === 'flex') {
      e.preventDefault();
      e.returnValue = 'יש לך דפדפן מובנה פתוח. האם אתה בטוח שברצונך לעזוב?';
      return e.returnValue;
    }
  });

  // Global browser button removed - functionality moved to selection page

  // Browser menu function
  window.showBrowserMenu = function() {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 20px;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-family: sans-serif;
      direction: rtl;
      min-width: 280px;
    `;
    
    menu.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 15px; color: #2c3e50; font-size: 16px;">בחר אתר לפתיחה:</div>
      <button onclick="openInternalBrowser('car-part.co.il'); this.parentElement.remove();" style="width: 100%; padding: 12px; margin-bottom: 8px; border: none; background: #28a745; color: white; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500;">
        🔧 Car Part - חלקי רכב
      </button>
      <button onclick="openInternalBrowser('portal.levi-itzhak.co.il'); this.parentElement.remove();" style="width: 100%; padding: 12px; margin-bottom: 8px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500;">
        📊 פורטל לוי יצחק
      </button>
      <button onclick="this.parentElement.remove();" style="width: 100%; padding: 10px; border: 1px solid #ccc; background: white; color: #666; border-radius: 6px; cursor: pointer; font-size: 14px;">
        ביטול
      </button>
    `;
    
    // ✅ FIXED: Check if document.body exists before appending
    if (document.body) {
      document.body.appendChild(menu);
    } else {
      console.warn('⚠️ document.body not available for browser menu');
      return;
    }
    
    // Remove menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function removeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', removeMenu);
        }
      });
    }, 100);
  };

})();