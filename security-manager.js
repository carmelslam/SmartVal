// 🔒 Security Manager - Comprehensive Security Layer
import { helper, updateHelper } from './helper.js';
import { WEBHOOK_URLS } from './webhook.js';

class SecurityManager {
  constructor() {
    this.securityConfig = {
      sessionTimeout: 15 * 60 * 1000, // 15 minutes of inactivity
      autoLogoutEnabled: true, // Set to false to disable auto-logout completely
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      allowedFileTypes: {
        images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      },
      maxFileSize: {
        images: 10 * 1024 * 1024, // 10MB
        documents: 20 * 1024 * 1024, // 20MB
        spreadsheets: 5 * 1024 * 1024 // 5MB
      },
      csrfTokens: new Map(),
      rateLimiting: new Map(),
      securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    };
    
    this.auditLog = [];
    this.securityEvents = [];
    
    // Initialize direct references for easier access
    this.csrfTokens = this.securityConfig.csrfTokens;
    this.rateLimiting = this.securityConfig.rateLimiting;
    
    this.initializeSecurity();
  }

  initializeSecurity() {
    this.setupCSRFProtection();
    this.setupInputSanitization();
    this.setupRateLimiting();
    this.setupSecureHeaders();
    this.setupSessionManagement();
    this.setupSecurityEventHandlers();
    this.startSecurityMonitoring();
  }

  // CSRF Protection
  setupCSRFProtection() {
    // Generate CSRF token for session
    const csrfToken = this.generateCSRFToken();
    sessionStorage.setItem('csrfToken', csrfToken);
    this.csrfTokens.set(sessionStorage.getItem('auth') || 'anonymous', csrfToken);
    
    // Add CSRF token to all forms
    this.addCSRFTokenToForms();
    
    // Intercept all AJAX requests to add CSRF token
    this.interceptAjaxRequests();
  }

  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  addCSRFTokenToForms() {
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (!form.querySelector('input[name="csrf_token"]')) {
          const csrfInput = document.createElement('input');
          csrfInput.type = 'hidden';
          csrfInput.name = 'csrf_token';
          csrfInput.value = sessionStorage.getItem('csrfToken');
          form.appendChild(csrfInput);
        }
      });
    });
  }

  interceptAjaxRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      // Check if this is an external request that shouldn't have CSRF token
      const urlStr = url.toString();
      const isExternalRequest = urlStr.includes('onesignal.com') || 
                               urlStr.includes('cdn.onesignal.com') ||
                               urlStr.includes('google') ||
                               urlStr.includes('make.com') ||
                               !urlStr.startsWith(window.location.origin);
      
      // Only add CSRF token for same-origin requests
      if (!isExternalRequest) {
        const csrfToken = sessionStorage.getItem('csrfToken');
        if (csrfToken) {
          options.headers = {
            ...options.headers,
            'X-CSRF-Token': csrfToken
          };
        }
        
        // Add security headers
        options.headers = {
          ...options.headers,
          ...this.securityConfig.securityHeaders
        };
      }
      
      // Log request for audit
      this.logSecurityEvent('api_request', {
        url: url,
        method: options.method || 'GET',
        timestamp: new Date()
      });
      
      return originalFetch(url, options);
    };
  }

  validateCSRFToken(token) {
    const sessionAuth = sessionStorage.getItem('auth');
    const storedToken = this.csrfTokens.get(sessionAuth);
    return token === storedToken;
  }

  // Input Sanitization
  setupInputSanitization() {
    // Add event listeners for input sanitization
    document.addEventListener('input', (event) => {
      if (event.target.matches('input, textarea')) {
        this.sanitizeInput(event.target);
      }
    });
    
    // Sanitize on form submission
    document.addEventListener('submit', (event) => {
      this.sanitizeForm(event.target);
    });
  }

  sanitizeInput(element) {
    const originalValue = element.value;
    let sanitizedValue = originalValue;
    
    // Remove potential XSS vectors
    sanitizedValue = this.removeXSSVectors(sanitizedValue);
    
    // Remove SQL injection attempts
    sanitizedValue = this.removeSQLInjection(sanitizedValue);
    
    // Validate based on input type
    sanitizedValue = this.validateInputType(sanitizedValue, element);
    
    // Update element if value changed
    if (sanitizedValue !== originalValue) {
      element.value = sanitizedValue;
      this.logSecurityEvent('input_sanitized', {
        element: element.id || element.name,
        original: originalValue,
        sanitized: sanitizedValue,
        timestamp: new Date()
      });
    }
  }

  removeXSSVectors(input) {
    if (typeof input !== 'string') return input;
    
    // Remove script tags
    input = input.replace(/<script[\s\S]*?<\/script>/gi, '');
    
    // Remove javascript: protocol
    input = input.replace(/javascript:/gi, '');
    
    // Remove on* event handlers
    input = input.replace(/on\w+\s*=\s*['"]/gi, '');
    
    // Remove potentially dangerous HTML tags
    const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}[^>]*>`, 'gi');
      input = input.replace(regex, '');
    });
    
    return input;
  }

  removeSQLInjection(input) {
    if (typeof input !== 'string') return input;
    
    // Remove common SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"])/gi,
      /(--)|(;)|(\||\/\*|\*\/)/g
    ];
    
    sqlPatterns.forEach(pattern => {
      input = input.replace(pattern, '');
    });
    
    return input;
  }

  validateInputType(input, element) {
    const inputType = element.type || element.tagName.toLowerCase();
    const dataType = element.getAttribute('data-type');
    
    switch (inputType) {
      case 'email':
        return this.validateEmail(input);
      case 'tel':
        return this.validatePhone(input);
      case 'number':
        return this.validateNumber(input);
      case 'url':
        return this.validateURL(input);
      default:
        if (dataType === 'hebrew') {
          return this.validateHebrewText(input);
        }
        return input;
    }
  }

  validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? email : '';
  }

  validatePhone(phone) {
    const phonePattern = /^[0-9\-\+\(\)\s]{10,15}$/;
    return phonePattern.test(phone) ? phone : '';
  }

  validateNumber(number) {
    const cleanNumber = number.replace(/[^\d.-]/g, '');
    return isNaN(cleanNumber) ? '' : cleanNumber;
  }

  validateURL(url) {
    try {
      new URL(url);
      return url;
    } catch {
      return '';
    }
  }

  validateHebrewText(text) {
    // Allow Hebrew characters, numbers, spaces, and basic punctuation
    const hebrewPattern = /^[\u0590-\u05FF\u200F\u200E\s\d\.,;:!?\-\(\)]+$/;
    return hebrewPattern.test(text) ? text : text.replace(/[^\u0590-\u05FF\u200F\u200E\s\d\.,;:!?\-\(\)]/g, '');
  }

  sanitizeForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type !== 'file') {
        this.sanitizeInput(input);
      }
    });
  }

  // Rate Limiting
  setupRateLimiting() {
    this.rateLimits = {
      api: { requests: 100, window: 60000 }, // 100 requests per minute
      upload: { requests: 10, window: 60000 }, // 10 uploads per minute
      login: { requests: 5, window: 300000 } // 5 login attempts per 5 minutes
    };
  }

  checkRateLimit(action, identifier = 'default') {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const limit = this.rateLimits[action];
    
    if (!limit) return true;
    
    if (!this.rateLimiting.has(key)) {
      this.rateLimiting.set(key, []);
    }
    
    const requests = this.rateLimiting.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < limit.window);
    
    if (validRequests.length >= limit.requests) {
      this.logSecurityEvent('rate_limit_exceeded', {
        action,
        identifier,
        requests: validRequests.length,
        limit: limit.requests,
        timestamp: new Date()
      });
      return false;
    }
    
    validRequests.push(now);
    this.rateLimiting.set(key, validRequests);
    return true;
  }

  // File Upload Security
  validateFileUpload(file, type = 'images') {
    const errors = [];
    
    // Check file size
    if (file.size > this.securityConfig.maxFileSize[type]) {
      errors.push(`קובץ גדול מדי. גודל מקסימלי: ${this.formatFileSize(this.securityConfig.maxFileSize[type])}`);
    }
    
    // Check file type
    if (!this.securityConfig.allowedFileTypes[type].includes(file.type)) {
      errors.push(`סוג קובץ לא נתמך: ${file.type}`);
    }
    
    // Check file name for malicious patterns
    if (this.containsMaliciousFileName(file.name)) {
      errors.push('שם קובץ לא חוקי');
    }
    
    // Check for malicious content (basic check)
    if (this.containsMaliciousContent(file)) {
      errors.push('תוכן קובץ חשוד');
    }
    
    if (errors.length > 0) {
      this.logSecurityEvent('file_upload_blocked', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        errors: errors,
        timestamp: new Date()
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  containsMaliciousFileName(fileName) {
    const maliciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.\./,
      /\//,
      /\\/
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(fileName));
  }

  containsMaliciousContent(file) {
    // This is a basic check - in production, use a proper antivirus scanner
    return file.name.includes('malware') || file.name.includes('virus');
  }

  // Session Management
  setupSessionManagement() {
    // Skip session management if auto-logout is disabled
    if (!this.securityConfig.autoLogoutEnabled) {
      console.log('🔒 Auto-logout disabled - session management skipped');
      return;
    }
    
    this.sessionTimeout = null;
    this.resetSessionTimeout();
    
    // Monitor user activity (including form inputs)
    ['click', 'keypress', 'scroll', 'mousemove', 'input', 'change', 'focus', 'blur'].forEach(event => {
      document.addEventListener(event, () => {
        this.resetSessionTimeout();
      });
    });
    
    // Check session validity on page load
    this.validateSession();
  }

  resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Update last activity time
    sessionStorage.setItem('lastActivityTime', Date.now().toString());
    
    this.sessionTimeout = setTimeout(() => {
      this.handleSessionExpiry();
    }, this.securityConfig.sessionTimeout);
  }

  handleSessionExpiry() {
    this.logSecurityEvent('session_expired', {
      timestamp: new Date()
    });
    
    alert('הפגישה פגה מטעמי אבטחה. אנא התחבר מחדש.');
    this.logout();
  }

  validateSession() {
    const auth = sessionStorage.getItem('auth');
    const lastActivityTime = sessionStorage.getItem('lastActivityTime');
    
    if (!auth) {
      this.logout();
      return false;
    }
    
    // If no lastActivityTime, set it to now (for backward compatibility)
    if (!lastActivityTime) {
      sessionStorage.setItem('lastActivityTime', Date.now().toString());
      return true;
    }
    
    const now = Date.now();
    const inactivityTime = now - parseInt(lastActivityTime);
    
    // Only logout if user has been inactive for more than timeout period
    if (inactivityTime > this.securityConfig.sessionTimeout) {
      this.handleSessionExpiry();
      return false;
    }
    
    return true;
  }

  // Restore data after login
  restoreLastCaseData() {
    const lastCaseData = localStorage.getItem('lastCaseData');
    const lastCaseTimestamp = localStorage.getItem('lastCaseTimestamp');
    
    if (lastCaseData) {
      // Only restore if no current helper data exists
      const currentHelper = sessionStorage.getItem('helper');
      if (!currentHelper || currentHelper === '{}') {
        sessionStorage.setItem('helper', lastCaseData);
        console.log('✅ Restored last case data from', lastCaseTimestamp);
        return true;
      }
    }
    return false;
  }
  
  // Clear old case data when starting new case
  startNewCase() {
    localStorage.removeItem('lastCaseData');
    localStorage.removeItem('lastCaseTimestamp');
    sessionStorage.removeItem('helper');
    
    // Clear sensitive data from memory
    if (window.helper) {
      window.helper = {};
    }
    
    this.logSecurityEvent('new_case_started', {
      timestamp: new Date()
    });
    
    console.log('✅ Started new case - previous data cleared');
  }
  
  // Convenience function to disable auto-logout
  disableAutoLogout() {
    this.securityConfig.autoLogoutEnabled = false;
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    console.log('🔒 Auto-logout disabled');
  }
  
  // Convenience function to enable auto-logout
  enableAutoLogout() {
    this.securityConfig.autoLogoutEnabled = true;
    this.setupSessionManagement();
    console.log('🔒 Auto-logout enabled');
  }

  async logout() {
    // Preserve helper data before logout
    const helperData = sessionStorage.getItem('helper');
    const plate = JSON.parse(helperData || '{}')?.meta?.plate || 'unknown';
    
    // Send helper data to Make.com if it exists
    if (helperData) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const payload = {
          type: 'logout_backup',
          plate_helper_timestamp: `${plate}_helper_${timestamp}`,
          helper_data: JSON.parse(helperData),
          logout_time: timestamp,
          reason: 'auto_logout'
        };
        
        // Send to Make.com webhook
        const webhookUrl = WEBHOOK_URLS.HELPER_EXPORT;
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Failed to send logout backup:', err));
        
        // Save to localStorage for persistence
        localStorage.setItem('lastCaseData', helperData);
        localStorage.setItem('lastCaseTimestamp', timestamp);
        
      } catch (error) {
        console.error('Error saving helper data on logout:', error);
      }
    }
    
    // Clear only auth-related session data, keep helper data
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('lastActivityTime');
    
    // Don't clear helper data - it will persist
    // sessionStorage.removeItem('helper'); // REMOVED - data should persist
    
    this.logSecurityEvent('user_logout', {
      timestamp: new Date(),
      data_preserved: !!helperData
    });
    
    // Redirect to login page
    window.location.href = 'index.html';
  }

  // Security Headers
  setupSecureHeaders() {
    // Note: These headers should ideally be set by the server
    // This is a client-side implementation for demonstration
    Object.entries(this.securityConfig.securityHeaders).forEach(([header, value]) => {
      document.documentElement.setAttribute(`data-${header.toLowerCase()}`, value);
    });
  }

  // Security Event Handling
  setupSecurityEventHandlers() {
    // Monitor for potential security threats
    document.addEventListener('contextmenu', (event) => {
      // Log right-click events (optional security measure)
      this.logSecurityEvent('context_menu', {
        element: event.target.tagName,
        timestamp: new Date()
      });
    });
    
    // Monitor for developer tools
    let devtools = {
      open: false,
      orientation: null
    };
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        if (!devtools.open) {
          devtools.open = true;
          this.logSecurityEvent('devtools_opened', {
            timestamp: new Date()
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);
    
    // Monitor for console access
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      this.logSecurityEvent('console_access', {
        args: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg)),
        timestamp: new Date()
      });
      originalConsoleLog.apply(console, args);
    };
  }

  // Security Monitoring
  startSecurityMonitoring() {
    setInterval(() => {
      this.performSecurityChecks();
    }, 60000); // Check every minute
  }

  performSecurityChecks() {
    // Check for suspicious activity
    this.checkSuspiciousActivity();
    
    // Validate current session
    this.validateSession();
    
    // Check for memory leaks
    this.checkMemoryUsage();
    
    // Clean up old security events
    this.cleanupSecurityEvents();
  }

  checkSuspiciousActivity() {
    const recentEvents = this.securityEvents.filter(event => 
      Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
    );
    
    // Check for too many failed attempts
    const failedAttempts = recentEvents.filter(event => 
      event.type === 'rate_limit_exceeded' || 
      event.type === 'file_upload_blocked'
    ).length;
    
    if (failedAttempts > 10) {
      this.logSecurityEvent('suspicious_activity_detected', {
        failedAttempts,
        timestamp: new Date()
      });
      
      // Could trigger additional security measures here
    }
  }

  checkMemoryUsage() {
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      
      if (memoryUsage > 100) { // Alert if over 100MB
        this.logSecurityEvent('high_memory_usage', {
          memoryUsage: memoryUsage.toFixed(2),
          timestamp: new Date()
        });
      }
    }
  }

  cleanupSecurityEvents() {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    this.securityEvents = this.securityEvents.filter(event => 
      now - event.timestamp.getTime() < maxAge
    );
    
    this.auditLog = this.auditLog.filter(log => 
      now - log.timestamp.getTime() < maxAge
    );
  }

  // Logging and Audit
  logSecurityEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('auth') || 'anonymous'
    };
    
    this.securityEvents.push(event);
    
    // Also log to audit log
    this.auditLog.push({
      level: 'security',
      event: type,
      details: data,
      timestamp: new Date()
    });
    
    // Log to console for debugging
    console.log('🔒 Security Event:', type, data);
    
    // Send to server for centralized logging (if available)
    this.sendSecurityEventToServer(event);
  }

  sendSecurityEventToServer(event) {
    // Only log critical security events locally (no server endpoints available on static site)
    const criticalEvents = [
      'suspicious_activity_detected',
      'rate_limit_exceeded',
      'file_upload_blocked',
      'session_expired',
      'devtools_opened'
    ];
    
    if (criticalEvents.includes(event.type)) {
      // Log critical security events to console for monitoring
      console.warn('🔒 Critical Security Event:', event.type, event);
      
      // Note: In a production environment with a backend, this would send to a security monitoring service
      // Example: SecurityService.reportEvent(event);
      // For static sites, consider integrating with external security monitoring services
    }
  }

  // Utility Methods
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Public API
  getSecurityStatus() {
    return {
      sessionValid: this.validateSession(),
      csrfTokenValid: !!sessionStorage.getItem('csrfToken'),
      recentSecurityEvents: this.securityEvents.slice(-10),
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 'N/A',
      rateLimitStatus: Object.fromEntries(this.rateLimiting),
      timestamp: new Date()
    };
  }

  generateSecurityReport() {
    const report = {
      timestamp: new Date(),
      summary: {
        totalSecurityEvents: this.securityEvents.length,
        criticalEvents: this.securityEvents.filter(e => 
          ['suspicious_activity_detected', 'rate_limit_exceeded'].includes(e.type)
        ).length,
        sessionStatus: this.validateSession() ? 'valid' : 'invalid',
        lastSecurityCheck: new Date()
      },
      events: this.securityEvents,
      auditLog: this.auditLog,
      recommendations: this.generateSecurityRecommendations()
    };
    
    return report;
  }

  generateSecurityRecommendations() {
    const recommendations = [];
    
    if (this.securityEvents.length > 100) {
      recommendations.push('בדוק את רשימת אירועי האבטחה - נראה שיש פעילות חשודה');
    }
    
    if (!this.validateSession()) {
      recommendations.push('הפגישה לא תקפה - יש להתחבר מחדש');
    }
    
    if (performance.memory && performance.memory.usedJSHeapSize / 1024 / 1024 > 100) {
      recommendations.push('שימוש גבוה בזיכרון - שקול לרענן את הדף');
    }
    
    return recommendations;
  }

  // Environment and Configuration Security
  validateEnvironment() {
    const requiredEnvVars = ['API_BASE_URL', 'CLOUDINARY_CLOUD_NAME'];
    const missingVars = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName] && !window.env?.[varName]) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      this.logSecurityEvent('missing_environment_variables', {
        missingVars,
        timestamp: new Date()
      });
    }
    
    return missingVars.length === 0;
  }

  // Content Security Policy
  setupContentSecurityPolicy() {
    // Note: CSP should be set via HTTP headers by the server
    // This is a client-side implementation for demonstration
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://res.cloudinary.com https://carmelcayouf.com;
      connect-src 'self' https://api.cloudinary.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim();
    
    document.head.appendChild(cspMeta);
  }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Export for global use
window.SecurityManager = SecurityManager;
window.securityManager = securityManager;

export { SecurityManager, securityManager };