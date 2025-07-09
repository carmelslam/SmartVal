// 🌍 Environment Configuration Manager
// Secure configuration management with environment variable support

class EnvironmentConfig {
  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfiguration();
    this.secureKeys = new Set([
      'API_KEY',
      'SECRET_KEY',
      'WEBHOOK_SECRET',
      'DATABASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ]);
    
    this.initializeEnvironment();
  }

  detectEnvironment() {
    // Detect environment based on URL and other indicators
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    } else {
      return 'production';
    }
  }

  loadConfiguration() {
    const baseConfig = {
      development: {
        API_BASE_URL: 'http://localhost:3000/api',
        CLOUDINARY_CLOUD_NAME: 'demo',
        CLOUDINARY_UPLOAD_PRESET: 'development',
        WEBHOOK_BASE_URL: 'https://hook.eu2.make.com/development',
        DEBUG_MODE: true,
        CACHE_DURATION: 300000, // 5 minutes
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        RATE_LIMIT_REQUESTS: 1000,
        RATE_LIMIT_WINDOW: 60000,
        ENABLE_ANALYTICS: false,
        ENABLE_ERROR_REPORTING: true,
        LOG_LEVEL: 'debug'
      },
      staging: {
        API_BASE_URL: 'https://yaron-cayouf-portal.netlify.app/api',
        CLOUDINARY_CLOUD_NAME: 'yaronkayouf-staging',
        CLOUDINARY_UPLOAD_PRESET: 'yaron_staging',
        WEBHOOK_BASE_URL: 'https://hook.eu2.make.com/staging',
        DEBUG_MODE: false,
        CACHE_DURATION: 600000, // 10 minutes
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        RATE_LIMIT_REQUESTS: 500,
        RATE_LIMIT_WINDOW: 60000,
        ENABLE_ANALYTICS: true,
        ENABLE_ERROR_REPORTING: true,
        LOG_LEVEL: 'info'
      },
      production: {
        API_BASE_URL: 'https://yaron-cayouf-portal.netlify.app/api',
        CLOUDINARY_CLOUD_NAME: 'yaronkayouf',
        CLOUDINARY_UPLOAD_PRESET: 'yaron_production',
        WEBHOOK_BASE_URL: 'https://hook.eu2.make.com',
        DEBUG_MODE: false,
        CACHE_DURATION: 1800000, // 30 minutes
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        RATE_LIMIT_REQUESTS: 100,
        RATE_LIMIT_WINDOW: 60000,
        ENABLE_ANALYTICS: true,
        ENABLE_ERROR_REPORTING: true,
        LOG_LEVEL: 'error'
      }
    };

    // Webhook configurations by environment
    const webhookConfigs = {
      development: {
        WEBHOOK_CAR_DETAILS: 'https://hook.eu2.make.com/dev/car-details',
        WEBHOOK_DAMAGE_ASSESSMENT: 'https://hook.eu2.make.com/dev/damage-assessment',
        WEBHOOK_IMAGE_UPLOAD: 'https://hook.eu2.make.com/dev/image-upload',
        WEBHOOK_PARTS_SUGGEST: 'https://hook.eu2.make.com/dev/parts-suggest',
        WEBHOOK_OCR_INVOICES: 'https://hook.eu2.make.com/dev/ocr-invoices',
        WEBHOOK_LEVI_INTEGRATION: 'https://hook.eu2.make.com/dev/levi-integration',
        WEBHOOK_FINAL_REPORT: 'https://hook.eu2.make.com/dev/final-report'
      },
      staging: {
        WEBHOOK_CAR_DETAILS: 'https://hook.eu2.make.com/staging/car-details',
        WEBHOOK_DAMAGE_ASSESSMENT: 'https://hook.eu2.make.com/staging/damage-assessment',
        WEBHOOK_IMAGE_UPLOAD: 'https://hook.eu2.make.com/staging/image-upload',
        WEBHOOK_PARTS_SUGGEST: 'https://hook.eu2.make.com/staging/parts-suggest',
        WEBHOOK_OCR_INVOICES: 'https://hook.eu2.make.com/staging/ocr-invoices',
        WEBHOOK_LEVI_INTEGRATION: 'https://hook.eu2.make.com/staging/levi-integration',
        WEBHOOK_FINAL_REPORT: 'https://hook.eu2.make.com/staging/final-report'
      },
      production: {
        WEBHOOK_CAR_DETAILS: 'https://hook.eu2.make.com/j6pthdat7i8y0q9y06gbzgg13kkh4dh9',
        WEBHOOK_DAMAGE_ASSESSMENT: 'https://hook.eu2.make.com/damage-assessment-prod',
        WEBHOOK_IMAGE_UPLOAD: 'https://hook.eu2.make.com/image-upload-prod',
        WEBHOOK_PARTS_SUGGEST: 'https://hook.eu2.make.com/parts-suggest-prod',
        WEBHOOK_OCR_INVOICES: 'https://hook.eu2.make.com/ocr-invoices-prod',
        WEBHOOK_LEVI_INTEGRATION: 'https://hook.eu2.make.com/levi-integration-prod',
        WEBHOOK_FINAL_REPORT: 'https://hook.eu2.make.com/final-report-prod'
      }
    };

    // Merge base config with webhooks
    const envConfig = {
      ...baseConfig[this.environment],
      ...webhookConfigs[this.environment]
    };

    // Override with environment variables if available
    return this.mergeEnvironmentVariables(envConfig);
  }

  mergeEnvironmentVariables(config) {
    // Check for browser environment variables (if supported)
    if (typeof process !== 'undefined' && process.env) {
      Object.keys(config).forEach(key => {
        if (process.env[key]) {
          config[key] = process.env[key];
        }
      });
    }

    // Check for custom window.env object (set by server-side rendering or build process)
    if (window.env) {
      Object.keys(config).forEach(key => {
        if (window.env[key]) {
          config[key] = window.env[key];
        }
      });
    }

    // Check for meta tags with environment variables
    const metaTags = document.querySelectorAll('meta[name^="env:"]');
    metaTags.forEach(meta => {
      const key = meta.name.replace('env:', '').toUpperCase();
      const value = meta.content;
      if (key && value) {
        config[key] = value;
      }
    });

    return config;
  }

  initializeEnvironment() {
    // Set global configuration
    window.ENV = this.environment;
    window.CONFIG = this.getPublicConfig();
    
    // Initialize webhooks object for backward compatibility
    window.webhooks = this.getWebhookConfig();
    
    // Log environment info (but not sensitive data)
    if (this.config.DEBUG_MODE) {
      console.log('🌍 Environment:', this.environment);
      console.log('🔧 Public Config:', this.getPublicConfig());
    }
    
    // Validate required configuration
    this.validateConfiguration();
    
    // Setup environment-specific features
    this.setupEnvironmentFeatures();
  }

  getPublicConfig() {
    // Return configuration without sensitive keys
    const publicConfig = {};
    
    Object.keys(this.config).forEach(key => {
      if (!this.secureKeys.has(key) && !this.isSecureKey(key)) {
        publicConfig[key] = this.config[key];
      }
    });
    
    return publicConfig;
  }

  getSecureConfig() {
    // Return only secure configuration (for server-side use)
    const secureConfig = {};
    
    Object.keys(this.config).forEach(key => {
      if (this.secureKeys.has(key) || this.isSecureKey(key)) {
        secureConfig[key] = this.config[key];
      }
    });
    
    return secureConfig;
  }

  isSecureKey(key) {
    const securePatterns = [
      /secret/i,
      /key$/i,
      /password/i,
      /token$/i,
      /credential/i,
      /private/i
    ];
    
    return securePatterns.some(pattern => pattern.test(key));
  }

  getWebhookConfig() {
    // Return webhook configuration for backward compatibility
    const webhooks = {};
    
    Object.keys(this.config).forEach(key => {
      if (key.startsWith('WEBHOOK_')) {
        const webhookName = key.replace('WEBHOOK_', '').toLowerCase();
        webhooks[webhookName] = this.config[key];
      }
    });
    
    return webhooks;
  }

  validateConfiguration() {
    const requiredKeys = [
      'API_BASE_URL',
      'CLOUDINARY_CLOUD_NAME',
      'WEBHOOK_CAR_DETAILS',
      'WEBHOOK_DAMAGE_ASSESSMENT'
    ];
    
    const missingKeys = requiredKeys.filter(key => !this.config[key]);
    
    if (missingKeys.length > 0) {
      console.error('❌ Missing required configuration keys:', missingKeys);
      
      if (this.environment === 'production') {
        throw new Error(`Missing required configuration: ${missingKeys.join(', ')}`);
      }
    }
    
    // Validate webhook URLs
    Object.keys(this.config).forEach(key => {
      if (key.startsWith('WEBHOOK_')) {
        const url = this.config[key];
        if (!this.isValidURL(url)) {
          console.warn(`⚠️ Invalid webhook URL for ${key}: ${url}`);
        }
      }
    });
  }

  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  setupEnvironmentFeatures() {
    // Development-specific features
    if (this.environment === 'development') {
      this.setupDevelopmentFeatures();
    }
    
    // Production-specific features
    if (this.environment === 'production') {
      this.setupProductionFeatures();
    }
    
    // Setup error reporting
    if (this.config.ENABLE_ERROR_REPORTING) {
      this.setupErrorReporting();
    }
    
    // Setup analytics
    if (this.config.ENABLE_ANALYTICS) {
      this.setupAnalytics();
    }
  }

  setupDevelopmentFeatures() {
    // Add development tools
    window.DEV_TOOLS = {
      config: this.config,
      environment: this.environment,
      clearStorage: () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🗑️ Storage cleared');
      },
      exportData: () => {
        const data = {
          helper: JSON.parse(localStorage.getItem('helper') || '{}'),
          session: Object.fromEntries(
            Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])
          )
        };
        console.log('📊 Exported data:', data);
        return data;
      },
      resetToDefaults: () => {
        this.resetConfiguration();
      }
    };
    
    // Add debug styles
    const debugStyles = document.createElement('style');
    debugStyles.textContent = `
      body::before {
        content: "🚧 DEVELOPMENT MODE";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        text-align: center;
        padding: 5px;
        font-size: 12px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
      }
      body {
        padding-top: 30px !important;
      }
    `;
    document.head.appendChild(debugStyles);
    
    console.log('🚧 Development mode enabled');
    console.log('🔧 DEV_TOOLS available in window.DEV_TOOLS');
  }

  setupProductionFeatures() {
    // Disable console in production (optional)
    if (!this.config.DEBUG_MODE) {
      const noop = () => {};
      console.log = noop;
      console.warn = noop;
      console.info = noop;
      
      // Keep console.error for critical issues
    }
    
    // Add production security headers
    const securityMeta = document.createElement('meta');
    securityMeta.httpEquiv = 'X-Content-Type-Options';
    securityMeta.content = 'nosniff';
    document.head.appendChild(securityMeta);
    
    // Disable right-click in production (optional)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    console.log('🚀 Production mode enabled');
  }

  setupErrorReporting() {
    window.addEventListener('error', (event) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null,
        timestamp: new Date(),
        environment: this.environment,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      this.sendErrorReport(errorInfo);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const errorInfo = {
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
        timestamp: new Date(),
        environment: this.environment,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      this.sendErrorReport(errorInfo);
    });
  }

  sendErrorReport(errorInfo) {
    // Only send in staging/production
    if (this.environment === 'development') {
      console.error('💥 Error Report:', errorInfo);
      return;
    }
    
    // Send to error reporting service
    fetch(this.config.API_BASE_URL + '/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorInfo)
    }).catch(err => {
      console.error('Failed to send error report:', err);
    });
  }

  setupAnalytics() {
    // Basic analytics setup
    const analyticsScript = document.createElement('script');
    analyticsScript.async = true;
    analyticsScript.src = 'https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID';
    document.head.appendChild(analyticsScript);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_TRACKING_ID');
    
    window.gtag = gtag;
  }

  // Public API methods
  get(key) {
    return this.config[key];
  }

  getEnvironment() {
    return this.environment;
  }

  isProduction() {
    return this.environment === 'production';
  }

  isDevelopment() {
    return this.environment === 'development';
  }

  isStaging() {
    return this.environment === 'staging';
  }

  getWebhookURL(name) {
    const key = `WEBHOOK_${name.toUpperCase()}`;
    return this.config[key];
  }

  updateConfig(updates) {
    Object.assign(this.config, updates);
    window.CONFIG = this.getPublicConfig();
    window.webhooks = this.getWebhookConfig();
  }

  resetConfiguration() {
    this.config = this.loadConfiguration();
    this.initializeEnvironment();
    console.log('🔄 Configuration reset to defaults');
  }

  exportConfiguration() {
    return {
      environment: this.environment,
      publicConfig: this.getPublicConfig(),
      timestamp: new Date()
    };
  }

  // Security helper methods
  sanitizeConfigForLogging(config) {
    const sanitized = {};
    
    Object.keys(config).forEach(key => {
      if (this.isSecureKey(key)) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = config[key];
      }
    });
    
    return sanitized;
  }

  validateEnvironmentIntegrity() {
    // Check if environment has been tampered with
    const expectedEnv = this.detectEnvironment();
    
    if (this.environment !== expectedEnv) {
      console.warn('⚠️ Environment mismatch detected');
      return false;
    }
    
    return true;
  }
}

// Initialize environment configuration
const environmentConfig = new EnvironmentConfig();

// Export for global use
window.EnvironmentConfig = EnvironmentConfig;
window.environmentConfig = environmentConfig;

export { EnvironmentConfig, environmentConfig };