// 🚨 Comprehensive Error Handler
import { environmentConfig } from './environment-config.js';
import { securityManager } from './security-manager.js';

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.errorCounts = new Map();
    this.maxErrors = 100;
    this.notificationQueue = [];
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    
    this.errorTypes = {
      NETWORK: 'network',
      VALIDATION: 'validation',
      AUTHENTICATION: 'authentication',
      PERMISSION: 'permission',
      DATA: 'data',
      UI: 'ui',
      SECURITY: 'security',
      SYSTEM: 'system',
      WEBHOOK: 'webhook',
      FILE: 'file'
    };
    
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    this.initializeErrorHandling();
  }

  initializeErrorHandling() {
    this.setupGlobalErrorHandlers();
    this.setupPromiseRejectionHandler();
    this.setupNetworkErrorHandler();
    this.setupUIErrorHandler();
    this.injectErrorStyles();
  }

  setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.handleError({
        type: this.errorTypes.SYSTEM,
        severity: this.severityLevels.HIGH,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : null,
        timestamp: new Date()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: this.errorTypes.SYSTEM,
        severity: this.severityLevels.HIGH,
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
        stack: event.reason && event.reason.stack ? event.reason.stack : null,
        timestamp: new Date()
      });
    });
  }

  setupPromiseRejectionHandler() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.handleError({
            type: this.errorTypes.NETWORK,
            severity: this.getSeverityForHttpStatus(response.status),
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date()
          });
        }
        
        return response;
      } catch (error) {
        this.handleError({
          type: this.errorTypes.NETWORK,
          severity: this.severityLevels.HIGH,
          message: `Network request failed: ${error.message}`,
          url: args[0],
          originalError: error,
          stack: error.stack,
          timestamp: new Date()
        });
        throw error;
      }
    };
  }

  setupNetworkErrorHandler() {
    // Monitor network status
    window.addEventListener('online', () => {
      this.showNotification('חיבור לאינטרנט חודש', 'success');
      this.retryFailedRequests();
    });

    window.addEventListener('offline', () => {
      this.handleError({
        type: this.errorTypes.NETWORK,
        severity: this.severityLevels.MEDIUM,
        message: 'אין חיבור לאינטרנט',
        timestamp: new Date()
      });
    });
  }

  setupUIErrorHandler() {
    // Monitor for UI errors
    document.addEventListener('click', (event) => {
      if (event.target.matches('[data-error-prone]')) {
        try {
          // Monitor for potential UI errors
        } catch (error) {
          this.handleError({
            type: this.errorTypes.UI,
            severity: this.severityLevels.LOW,
            message: `UI interaction error: ${error.message}`,
            element: event.target.tagName,
            elementId: event.target.id,
            originalError: error,
            timestamp: new Date()
          });
        }
      }
    });
  }

  handleError(errorInfo) {
    // Enhance error info
    errorInfo.id = this.generateErrorId();
    errorInfo.userAgent = navigator.userAgent;
    errorInfo.url = window.location.href;
    errorInfo.userId = sessionStorage.getItem('auth') || 'anonymous';
    errorInfo.environment = environmentConfig.getEnvironment();
    
    // Add to error collection
    this.errors.push(errorInfo);
    
    // Update error counts
    const errorKey = `${errorInfo.type}:${errorInfo.message}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // Clean up old errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
    
    // Log to console
    this.logError(errorInfo);
    
    // Show user notification if appropriate
    if (this.shouldShowUserNotification(errorInfo)) {
      this.showUserNotification(errorInfo);
    }
    
    // Send to external services
    this.reportError(errorInfo);
    
    // Attempt recovery if possible
    this.attemptRecovery(errorInfo);
    
    // Log security event if security-related
    if (errorInfo.type === this.errorTypes.SECURITY) {
      securityManager.logSecurityEvent('security_error', errorInfo);
    }
  }

  generateErrorId() {
    return 'err_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getSeverityForHttpStatus(status) {
    if (status >= 500) return this.severityLevels.HIGH;
    if (status >= 400) return this.severityLevels.MEDIUM;
    return this.severityLevels.LOW;
  }

  logError(errorInfo) {
    const logLevel = environmentConfig.get('LOG_LEVEL') || 'error';
    
    if (logLevel === 'debug' || errorInfo.severity === this.severityLevels.CRITICAL) {
      console.error('🚨 Error:', errorInfo);
    } else if (logLevel === 'info' && errorInfo.severity === this.severityLevels.HIGH) {
      console.warn('⚠️ Warning:', errorInfo);
    }
  }

  shouldShowUserNotification(errorInfo) {
    // Don't spam users with notifications
    const recentSimilarErrors = this.errors.filter(err => 
      err.type === errorInfo.type && 
      err.message === errorInfo.message &&
      Date.now() - err.timestamp.getTime() < 60000 // Last minute
    ).length;
    
    if (recentSimilarErrors > 3) return false;
    
    // Show notifications for user-facing errors
    const userFacingTypes = [
      this.errorTypes.NETWORK,
      this.errorTypes.AUTHENTICATION,
      this.errorTypes.PERMISSION,
      this.errorTypes.FILE
    ];
    
    return userFacingTypes.includes(errorInfo.type) || 
           errorInfo.severity === this.severityLevels.CRITICAL;
  }

  showUserNotification(errorInfo) {
    const message = this.getUserFriendlyMessage(errorInfo);
    const actions = this.getErrorActions(errorInfo);
    
    this.showNotification(message, this.getNotificationType(errorInfo.severity), actions);
  }

  getUserFriendlyMessage(errorInfo) {
    const messages = {
      [this.errorTypes.NETWORK]: 'בעיה בחיבור לשרת. אנא נסה שוב.',
      [this.errorTypes.AUTHENTICATION]: 'בעיה באימות. אנא התחבר מחדש.',
      [this.errorTypes.PERMISSION]: 'אין הרשאה לביצוע פעולה זו.',
      [this.errorTypes.VALIDATION]: 'נתונים לא תקינים. אנא בדוק את המידע שהוזן.',
      [this.errorTypes.FILE]: 'בעיה בעיבוד הקובץ. אנא נסה קובץ אחר.',
      [this.errorTypes.WEBHOOK]: 'בעיה בשליחת הנתונים. אנא נסה שוב.',
      [this.errorTypes.DATA]: 'בעיה בעיבוד הנתונים.',
      [this.errorTypes.UI]: 'בעיה בממשק המשתמש.',
      [this.errorTypes.SECURITY]: 'בעיית אבטחה זוהתה.',
      [this.errorTypes.SYSTEM]: 'שגיאת מערכת.'
    };
    
    return messages[errorInfo.type] || 'אירעה שגיאה לא צפויה.';
  }

  getNotificationType(severity) {
    const typeMap = {
      [this.severityLevels.LOW]: 'info',
      [this.severityLevels.MEDIUM]: 'warning',
      [this.severityLevels.HIGH]: 'error',
      [this.severityLevels.CRITICAL]: 'error'
    };
    
    return typeMap[severity] || 'error';
  }

  getErrorActions(errorInfo) {
    const actions = [];
    
    if (errorInfo.type === this.errorTypes.NETWORK) {
      actions.push({
        text: 'נסה שוב',
        action: () => this.retryLastAction(errorInfo)
      });
    }
    
    if (errorInfo.type === this.errorTypes.AUTHENTICATION) {
      actions.push({
        text: 'התחבר מחדש',
        action: () => window.location.href = 'index.html'
      });
    }
    
    if (errorInfo.severity === this.severityLevels.CRITICAL) {
      actions.push({
        text: 'רענן דף',
        action: () => window.location.reload()
      });
    }
    
    return actions;
  }

  showNotification(message, type = 'error', actions = []) {
    const notification = this.createNotificationElement(message, type, actions);
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    const delay = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, delay);
    
    // Add to queue for management
    this.notificationQueue.push(notification);
    this.manageNotificationQueue();
  }

  createNotificationElement(message, type, actions) {
    const notification = document.createElement('div');
    notification.className = `error-notification error-notification-${type}`;
    
    const icon = this.getNotificationIcon(type);
    
    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-notification-icon">${icon}</div>
        <div class="error-notification-message">${message}</div>
        <div class="error-notification-actions">
          ${actions.map(action => 
            `<button class="error-notification-button" onclick="${action.action}">${action.text}</button>`
          ).join('')}
          <button class="error-notification-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
      </div>
    `;
    
    return notification;
  }

  getNotificationIcon(type) {
    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    
    return icons[type] || '⚠️';
  }

  manageNotificationQueue() {
    // Keep max 3 notifications visible
    if (this.notificationQueue.length > 3) {
      const oldestNotification = this.notificationQueue.shift();
      if (oldestNotification.parentNode) {
        oldestNotification.remove();
      }
    }
  }

  reportError(errorInfo) {
    // Don't report in development unless it's critical
    if (environmentConfig.isDevelopment() && errorInfo.severity !== this.severityLevels.CRITICAL) {
      return;
    }
    
    // Send to external error reporting service
    const reportData = {
      ...errorInfo,
      sessionData: this.getSessionData(),
      browserInfo: this.getBrowserInfo(),
      performanceInfo: this.getPerformanceInfo()
    };
    
    // Use webhook or API endpoint for error reporting
    const errorReportingUrl = environmentConfig.get('ERROR_REPORTING_URL') || 
                             environmentConfig.getWebhookURL('error_reporting');
    
    if (errorReportingUrl) {
      fetch(errorReportingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      }).catch(err => {
        console.error('Failed to report error:', err);
      });
    }
  }

  getSessionData() {
    return {
      userId: sessionStorage.getItem('auth'),
      sessionDuration: Date.now() - (parseInt(sessionStorage.getItem('loginTime')) || Date.now()),
      currentPage: window.location.pathname,
      userAgent: navigator.userAgent,
      language: navigator.language
    };
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: screen.colorDepth,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  getPerformanceInfo() {
    if (!performance) return {};
    
    return {
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing ? {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType ? 
          performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime : null
      } : null
    };
  }

  attemptRecovery(errorInfo) {
    const recoveryStrategies = {
      [this.errorTypes.NETWORK]: () => this.recoverFromNetworkError(errorInfo),
      [this.errorTypes.AUTHENTICATION]: () => this.recoverFromAuthError(errorInfo),
      [this.errorTypes.DATA]: () => this.recoverFromDataError(errorInfo),
      [this.errorTypes.UI]: () => this.recoverFromUIError(errorInfo)
    };
    
    const recoveryStrategy = recoveryStrategies[errorInfo.type];
    if (recoveryStrategy) {
      setTimeout(() => {
        try {
          recoveryStrategy();
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }, 1000);
    }
  }

  recoverFromNetworkError(errorInfo) {
    // Store failed request for retry
    if (errorInfo.url) {
      this.storeFailedRequest(errorInfo);
    }
    
    // Check network status
    if (navigator.onLine) {
      // Network is available, might be a temporary issue
      this.scheduleRetry(errorInfo);
    }
  }

  recoverFromAuthError(errorInfo) {
    // Try to refresh authentication
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) {
      this.attemptTokenRefresh();
    } else {
      // Redirect to login
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 3000);
    }
  }

  recoverFromDataError(errorInfo) {
    // Try to restore from backup data
    this.restoreFromBackup();
  }

  recoverFromUIError(errorInfo) {
    // Try to refresh the problematic UI element
    if (errorInfo.elementId) {
      const element = document.getElementById(errorInfo.elementId);
      if (element) {
        this.refreshUIElement(element);
      }
    }
  }

  storeFailedRequest(errorInfo) {
    const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
    failedRequests.push({
      url: errorInfo.url,
      timestamp: errorInfo.timestamp,
      errorId: errorInfo.id
    });
    
    // Keep only last 10 failed requests
    if (failedRequests.length > 10) {
      failedRequests.splice(0, failedRequests.length - 10);
    }
    
    localStorage.setItem('failedRequests', JSON.stringify(failedRequests));
  }

  scheduleRetry(errorInfo) {
    const retryKey = errorInfo.url || errorInfo.id;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    
    if (currentAttempts < this.maxRetries) {
      const delay = Math.pow(2, currentAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        this.retryLastAction(errorInfo);
        this.retryAttempts.set(retryKey, currentAttempts + 1);
      }, delay);
    }
  }

  retryLastAction(errorInfo) {
    // Implement retry logic based on error type
    if (errorInfo.url) {
      // Retry network request
      fetch(errorInfo.url)
        .then(response => {
          if (response.ok) {
            this.showNotification('הפעולה הצליחה לאחר ניסיון חוזר', 'success');
          }
        })
        .catch(err => {
          console.error('Retry failed:', err);
        });
    }
  }

  retryFailedRequests() {
    const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
    
    failedRequests.forEach(request => {
      fetch(request.url)
        .then(response => {
          if (response.ok) {
            this.removeFailedRequest(request);
          }
        })
        .catch(err => {
          console.error('Failed request retry failed:', err);
        });
    });
  }

  removeFailedRequest(request) {
    const failedRequests = JSON.parse(localStorage.getItem('failedRequests') || '[]');
    const updatedRequests = failedRequests.filter(r => r.errorId !== request.errorId);
    localStorage.setItem('failedRequests', JSON.stringify(updatedRequests));
  }

  attemptTokenRefresh() {
    // Implement token refresh logic
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        sessionStorage.setItem('auth', data.token);
        this.showNotification('האימות חודש בהצלחה', 'success');
      } else {
        throw new Error('Token refresh failed');
      }
    })
    .catch(err => {
      this.handleError({
        type: this.errorTypes.AUTHENTICATION,
        severity: this.severityLevels.HIGH,
        message: 'Token refresh failed',
        originalError: err,
        timestamp: new Date()
      });
    });
  }

  restoreFromBackup() {
    // Try to restore from localStorage backup
    const backup = localStorage.getItem('dataBackup');
    if (backup) {
      try {
        const backupData = JSON.parse(backup);
        sessionStorage.setItem('helper', JSON.stringify(backupData));
        this.showNotification('נתונים שוחזרו מגיבוי', 'success');
      } catch (err) {
        console.error('Backup restore failed:', err);
      }
    }
  }

  refreshUIElement(element) {
    // Try to refresh a specific UI element
    const originalDisplay = element.style.display;
    element.style.display = 'none';
    
    setTimeout(() => {
      element.style.display = originalDisplay;
    }, 100);
  }

  // Public API methods
  createError(type, severity, message, additionalInfo = {}) {
    return this.handleError({
      type,
      severity,
      message,
      ...additionalInfo,
      timestamp: new Date()
    });
  }

  getErrors(type = null, severity = null) {
    let filteredErrors = this.errors;
    
    if (type) {
      filteredErrors = filteredErrors.filter(err => err.type === type);
    }
    
    if (severity) {
      filteredErrors = filteredErrors.filter(err => err.severity === severity);
    }
    
    return filteredErrors;
  }

  getErrorSummary() {
    const summary = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      recentErrors: this.errors.slice(-10)
    };
    
    // Count by type
    Object.values(this.errorTypes).forEach(type => {
      summary.byType[type] = this.errors.filter(err => err.type === type).length;
    });
    
    // Count by severity
    Object.values(this.severityLevels).forEach(severity => {
      summary.bySeverity[severity] = this.errors.filter(err => err.severity === severity).length;
    });
    
    return summary;
  }

  clearErrors() {
    this.errors = [];
    this.errorCounts.clear();
    this.retryAttempts.clear();
    localStorage.removeItem('failedRequests');
  }

  exportErrors() {
    return {
      errors: this.errors,
      errorCounts: Object.fromEntries(this.errorCounts),
      retryAttempts: Object.fromEntries(this.retryAttempts),
      timestamp: new Date()
    };
  }

  injectErrorStyles() {
    const styles = document.createElement('style');
    styles.id = 'error-handler-styles';
    styles.textContent = `
      .error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        z-index: 10000;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        animation: slideInRight 0.3s ease-out;
      }
      
      .error-notification-error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
      
      .error-notification-warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
      }
      
      .error-notification-info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
      }
      
      .error-notification-success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }
      
      .error-notification-content {
        padding: 15px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      
      .error-notification-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      
      .error-notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .error-notification-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .error-notification-button {
        background: rgba(0,0,0,0.1);
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .error-notification-button:hover {
        background: rgba(0,0,0,0.2);
      }
      
      .error-notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }
      
      .error-notification-close:hover {
        background: rgba(0,0,0,0.1);
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @media (max-width: 768px) {
        .error-notification {
          left: 10px;
          right: 10px;
          max-width: none;
        }
        
        .error-notification-content {
          flex-direction: column;
        }
        
        .error-notification-actions {
          justify-content: flex-end;
          margin-top: 10px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize error handler
const errorHandler = new ErrorHandler();

// Export for global use
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;

export { ErrorHandler, errorHandler };