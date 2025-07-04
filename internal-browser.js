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
      <iframe class="browser-iframe" id="browserIframe" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
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
  document.body.appendChild(browser);

  // Global variables
  let currentSite = null;
  let sessionKeepAlive = null;
  let isMinimized = false;
  let originalUrl = '';

  // Site configurations
  const siteConfigs = {
    'car-part.co.il': {
      name: 'Car Part - חלקי רכב',
      url: 'https://www.car-part.co.il',
      credentials: {
        username: 'yaronkayouf@gmail.com',
        password: 'YK123456!'
      },
      autoLogin: true,
      loginSelectors: {
        usernameField: 'input[name="email"], input[type="email"], #email',
        passwordField: 'input[name="password"], input[type="password"], #password',
        submitButton: 'button[type="submit"], input[type="submit"], .login-button'
      }
    },
    'portal.levi-itzhak.co.il': {
      name: 'פורטל לוי יצחק',
      url: 'https://portal.levi-itzhak.co.il',
      credentials: {
        username: 'yaronkayouf@gmail.com',
        password: 'YK123456!'
      },
      autoLogin: true,
      loginSelectors: {
        usernameField: '#username, input[name="username"]',
        passwordField: '#password, input[name="password"]',
        submitButton: '#login-btn, button[type="submit"]'
      }
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

  window.showCredentials = function() {
    if (!currentSite || !siteConfigs[currentSite]) {
      alert('אין פרטי גישה זמינים לאתר זה');
      return;
    }

    const config = siteConfigs[currentSite];
    const popup = document.getElementById('credentialsPopup');
    const list = document.getElementById('credentialsList');
    
    list.innerHTML = `
      <div class="credential-field">
        <span class="label">שם משתמש:</span>
        <span class="value" onclick="copyToClipboard('${config.credentials.username}')">${config.credentials.username}</span>
      </div>
      <div class="credential-field">
        <span class="label">סיסמה:</span>
        <span class="value" onclick="copyToClipboard('${config.credentials.password}')">${config.credentials.password}</span>
      </div>
    `;
    
    popup.style.display = 'block';
  };

  window.hideCredentials = function() {
    document.getElementById('credentialsPopup').style.display = 'none';
  };

  window.autoFillCredentials = function() {
    if (!currentSite || !siteConfigs[currentSite]) return;
    
    const config = siteConfigs[currentSite];
    const iframe = document.getElementById('browserIframe');
    
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const selectors = config.loginSelectors;
      
      // Find and fill username field
      const usernameField = doc.querySelector(selectors.usernameField);
      if (usernameField) {
        usernameField.value = config.credentials.username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Find and fill password field
      const passwordField = doc.querySelector(selectors.passwordField);
      if (passwordField) {
        passwordField.value = config.credentials.password;
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
      alert('לא ניתן למלא אוטומטית. נסה למלא ידנית.');
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
      if (typeof helper !== 'undefined' && helper.keepSessionAlive) {
        helper.keepSessionAlive();
      } else {
        // Fallback: touch sessionStorage
        const auth = sessionStorage.getItem('auth');
        if (auth) {
          sessionStorage.setItem('lastActivity', new Date().toISOString());
        }
      }
    }, 300000); // 5 minutes
  }

  function stopSessionKeepAlive() {
    if (sessionKeepAlive) {
      clearInterval(sessionKeepAlive);
      sessionKeepAlive = null;
    }
  }

  function updateStatus(message) {
    document.getElementById('browserStatus').textContent = message;
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

  // Add global browser access button
  if (!document.getElementById("globalBrowserBtn")) {
    const browserBtn = document.createElement("button");
    browserBtn.id = "globalBrowserBtn";
    browserBtn.innerHTML = "🌐 דפדפן";
    browserBtn.style.cssText = `
      position: fixed;
      top: 20px;
      left: 250px;
      background: #2c3e50;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      z-index: 9998;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    browserBtn.onclick = function() {
      showBrowserMenu();
    };
    document.body.appendChild(browserBtn);
  }

  // Browser menu function
  window.showBrowserMenu = function() {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 60px;
      left: 250px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 10px;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-family: sans-serif;
      direction: rtl;
      min-width: 200px;
    `;
    
    menu.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; color: #2c3e50;">בחר אתר לפתיחה:</div>
      <button onclick="openInternalBrowser('car-part.co.il'); this.parentElement.remove();" style="width: 100%; padding: 8px; margin-bottom: 5px; border: none; background: #28a745; color: white; border-radius: 4px; cursor: pointer;">
        🔧 Car Part - חלקי רכב
      </button>
      <button onclick="openInternalBrowser('portal.levi-itzhak.co.il'); this.parentElement.remove();" style="width: 100%; padding: 8px; margin-bottom: 5px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">
        📊 פורטל לוי יצחק
      </button>
      <button onclick="this.parentElement.remove();" style="width: 100%; padding: 6px; border: 1px solid #ccc; background: white; color: #666; border-radius: 4px; cursor: pointer;">
        ביטול
      </button>
    `;
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function removeMenu(e) {
        if (!menu.contains(e.target) && e.target !== document.getElementById('globalBrowserBtn')) {
          menu.remove();
          document.removeEventListener('click', removeMenu);
        }
      });
    }, 100);
  };

})();