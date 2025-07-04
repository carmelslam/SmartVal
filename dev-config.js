// dev-config.js — Development Configuration Management

import { sendToWebhook } from './webhook.js';

class DevConfigManager {
  constructor() {
    this.configKey = 'dev_system_config';
    this.vaultKey = 'vault_config';
    this.defaultConfig = this.getDefaultConfig();
    this.currentConfig = {};
  }

  getDefaultConfig() {
    return {
      webhooks: {
        makecom_base_url: 'https://hook.integromat.com',
        webhook_timeout: 30,
        expertise_webhook: '/expertise-export',
        final_report_webhook: '/final-report',
        estimate_webhook: '/estimate-report',
        admin_hub_webhook: '/admin-verify'
      },
      api_keys: {
        cloudinary: {
          cloud_name: '',
          api_key: '',
          api_secret: '',
          upload_preset: 'unsigned_preset'
        },
        ocr: {
          api_key: '',
          endpoint: 'https://api.ocr.space/parse/image'
        }
      },
      system: {
        debug_mode: false,
        test_mode: false,
        backup_days: 7,
        max_file_size: 50,
        default_language: 'he',
        timezone: 'Asia/Jerusalem',
        auto_save: true,
        session_timeout: 30,
        default_vat: 18  // System default VAT rate (controlled by admin hub)
      },
      text_overrides: {
        enabled: false,
        active_version: 'production',
        custom_texts: {
          private_expert: '',
          estimate_loss: '',
          estimate_total: '',
          global_expert: '',
          total_loss: '',
          damaged_sale: ''
        }
      },
      security: {
        enable_logging: true,
        log_level: 'info',
        encrypt_storage: false,
        require_2fa: false
      }
    };
  }

  async loadConfiguration() {
    try {
      // Load from localStorage first
      const stored = localStorage.getItem(this.configKey);
      if (stored) {
        this.currentConfig = JSON.parse(stored);
      } else {
        this.currentConfig = { ...this.defaultConfig };
      }

      // Load from vault if available
      await this.loadFromVault();
      
      // Update UI with loaded config
      this.updateUIFromConfig();
      this.updateConfigPreview();
      
      console.log('✅ Configuration loaded successfully');
      return this.currentConfig;
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.currentConfig = { ...this.defaultConfig };
      this.updateUIFromConfig();
    }
  }

  async saveConfiguration() {
    try {
      // Collect data from UI
      this.collectConfigFromUI();
      
      // Validate configuration
      if (!this.validateConfig()) {
        throw new Error('Configuration validation failed');
      }

      // Save to localStorage
      localStorage.setItem(this.configKey, JSON.stringify(this.currentConfig));
      
      // Save to vault
      await this.saveToVault();
      
      // Update preview
      this.updateConfigPreview();
      
      // Apply configuration changes
      await this.applyConfiguration();
      
      window.showAlert('הגדרות נשמרו בהצלחה', 'success');
      console.log('✅ Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      window.showAlert('שגיאה בשמירת ההגדרות: ' + error.message, 'error');
    }
  }

  collectConfigFromUI() {
    // Webhooks
    this.currentConfig.webhooks = {
      makecom_base_url: document.getElementById('makecom-base-url').value || this.defaultConfig.webhooks.makecom_base_url,
      webhook_timeout: parseInt(document.getElementById('webhook-timeout').value) || this.defaultConfig.webhooks.webhook_timeout,
      expertise_webhook: document.getElementById('expertise-webhook').value || this.defaultConfig.webhooks.expertise_webhook,
      final_report_webhook: document.getElementById('final-report-webhook').value || this.defaultConfig.webhooks.final_report_webhook,
      estimate_webhook: document.getElementById('estimate-webhook').value || this.defaultConfig.webhooks.estimate_webhook
    };

    // API Keys
    this.currentConfig.api_keys = {
      cloudinary: {
        cloud_name: document.getElementById('cloudinary-cloud-name').value,
        api_key: document.getElementById('cloudinary-api-key').value,
        api_secret: document.getElementById('cloudinary-api-secret').value,
        upload_preset: document.getElementById('cloudinary-upload-preset').value
      },
      ocr: {
        api_key: document.getElementById('ocr-api-key').value,
        endpoint: document.getElementById('ocr-endpoint').value
      }
    };

    // System Settings
    this.currentConfig.system = {
      debug_mode: document.getElementById('debug-mode').checked,
      test_mode: document.getElementById('test-mode').checked,
      backup_days: parseInt(document.getElementById('backup-days').value) || this.defaultConfig.system.backup_days,
      max_file_size: parseInt(document.getElementById('max-file-size').value) || this.defaultConfig.system.max_file_size,
      default_language: document.getElementById('default-language').value,
      timezone: document.getElementById('timezone').value,
      auto_save: true,
      session_timeout: 30
    };

    // Text Overrides
    this.currentConfig.text_overrides = {
      enabled: document.getElementById('enable-text-override').checked,
      active_version: document.getElementById('active-text-version').value,
      custom_texts: {
        private_expert: document.getElementById('private-expert-text').value,
        estimate_loss: document.getElementById('estimate-loss-text').value,
        estimate_total: document.getElementById('estimate-total-text').value,
        global_expert: '',
        total_loss: '',
        damaged_sale: ''
      }
    };
  }

  updateUIFromConfig() {
    // Webhooks
    document.getElementById('makecom-base-url').value = this.currentConfig.webhooks?.makecom_base_url || '';
    document.getElementById('webhook-timeout').value = this.currentConfig.webhooks?.webhook_timeout || 30;
    document.getElementById('expertise-webhook').value = this.currentConfig.webhooks?.expertise_webhook || '';
    document.getElementById('final-report-webhook').value = this.currentConfig.webhooks?.final_report_webhook || '';
    document.getElementById('estimate-webhook').value = this.currentConfig.webhooks?.estimate_webhook || '';

    // API Keys
    document.getElementById('cloudinary-cloud-name').value = this.currentConfig.api_keys?.cloudinary?.cloud_name || '';
    document.getElementById('cloudinary-api-key').value = this.currentConfig.api_keys?.cloudinary?.api_key || '';
    document.getElementById('cloudinary-api-secret').value = this.currentConfig.api_keys?.cloudinary?.api_secret || '';
    document.getElementById('cloudinary-upload-preset').value = this.currentConfig.api_keys?.cloudinary?.upload_preset || '';
    document.getElementById('ocr-api-key').value = this.currentConfig.api_keys?.ocr?.api_key || '';
    document.getElementById('ocr-endpoint').value = this.currentConfig.api_keys?.ocr?.endpoint || '';

    // System Settings
    document.getElementById('debug-mode').checked = this.currentConfig.system?.debug_mode || false;
    document.getElementById('test-mode').checked = this.currentConfig.system?.test_mode || false;
    document.getElementById('backup-days').value = this.currentConfig.system?.backup_days || 7;
    document.getElementById('max-file-size').value = this.currentConfig.system?.max_file_size || 50;
    document.getElementById('default-language').value = this.currentConfig.system?.default_language || 'he';
    document.getElementById('timezone').value = this.currentConfig.system?.timezone || 'Asia/Jerusalem';

    // Text Overrides
    document.getElementById('enable-text-override').checked = this.currentConfig.text_overrides?.enabled || false;
    document.getElementById('active-text-version').value = this.currentConfig.text_overrides?.active_version || 'production';
    document.getElementById('private-expert-text').value = this.currentConfig.text_overrides?.custom_texts?.private_expert || '';
    document.getElementById('estimate-loss-text').value = this.currentConfig.text_overrides?.custom_texts?.estimate_loss || '';
    document.getElementById('estimate-total-text').value = this.currentConfig.text_overrides?.custom_texts?.estimate_total || '';
  }

  validateConfig() {
    // Validate webhook URLs
    const webhooks = this.currentConfig.webhooks;
    if (webhooks.makecom_base_url && !this.isValidURL(webhooks.makecom_base_url)) {
      throw new Error('Make.com Base URL is not valid');
    }

    // Validate timeout
    if (webhooks.webhook_timeout < 5 || webhooks.webhook_timeout > 120) {
      throw new Error('Webhook timeout must be between 5 and 120 seconds');
    }

    // Validate file size
    const maxSize = this.currentConfig.system.max_file_size;
    if (maxSize < 1 || maxSize > 500) {
      throw new Error('Max file size must be between 1 and 500 MB');
    }

    // Validate backup days
    const backupDays = this.currentConfig.system.backup_days;
    if (backupDays < 1 || backupDays > 30) {
      throw new Error('Backup days must be between 1 and 30');
    }

    return true;
  }

  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  async loadFromVault() {
    try {
      const vaultConfig = localStorage.getItem(this.vaultKey);
      if (vaultConfig) {
        const parsed = JSON.parse(vaultConfig);
        // Merge vault config with current config
        this.currentConfig = { ...this.currentConfig, ...parsed };
      }
    } catch (error) {
      console.error('Error loading from vault:', error);
    }
  }

  async saveToVault() {
    try {
      localStorage.setItem(this.vaultKey, JSON.stringify(this.currentConfig));
    } catch (error) {
      console.error('Error saving to vault:', error);
      throw error;
    }
  }

  async applyConfiguration() {
    try {
      // Apply debug mode
      if (this.currentConfig.system.debug_mode) {
        console.log('🔧 Debug mode enabled');
        window.DEBUG_MODE = true;
      }

      // Apply test mode
      if (this.currentConfig.system.test_mode) {
        console.log('🧪 Test mode enabled');
        window.TEST_MODE = true;
      }

      // Update webhook configurations
      if (window.WEBHOOKS) {
        Object.assign(window.WEBHOOKS, this.currentConfig.webhooks);
      }

      // Apply text overrides
      if (this.currentConfig.text_overrides.enabled) {
        await this.applyTextOverrides();
      }

      console.log('✅ Configuration applied successfully');
    } catch (error) {
      console.error('Error applying configuration:', error);
      throw error;
    }
  }

  async applyTextOverrides() {
    try {
      if (!window.vaultTexts) {
        window.vaultTexts = {};
      }

      const customTexts = this.currentConfig.text_overrides.custom_texts;
      
      if (customTexts.private_expert) {
        window.vaultTexts.private = { text: customTexts.private_expert };
      }
      
      if (customTexts.estimate_loss) {
        window.vaultTexts.estimate_אובדן_להלכה = { text: customTexts.estimate_loss };
      }
      
      if (customTexts.estimate_total) {
        window.vaultTexts.estimate_טוטלוס = { text: customTexts.estimate_total };
      }

      console.log('✅ Text overrides applied');
    } catch (error) {
      console.error('Error applying text overrides:', error);
    }
  }

  async testWebhook() {
    const resultDiv = document.getElementById('webhook-test-result');
    resultDiv.textContent = 'Testing webhook connection...';
    
    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'dev-module'
      };

      const response = await fetch(this.currentConfig.webhooks.makecom_base_url + '/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        timeout: this.currentConfig.webhooks.webhook_timeout * 1000
      });

      if (response.ok) {
        const result = await response.text();
        resultDiv.textContent = `✅ Success: ${result}`;
        resultDiv.style.color = 'green';
        window.showAlert('בדיקת Webhook הצליחה', 'success');
      } else {
        resultDiv.textContent = `❌ Error: ${response.status} ${response.statusText}`;
        resultDiv.style.color = 'red';
        window.showAlert('בדיקת Webhook נכשלה', 'error');
      }
    } catch (error) {
      resultDiv.textContent = `❌ Error: ${error.message}`;
      resultDiv.style.color = 'red';
      window.showAlert('שגיאה בבדיקת Webhook: ' + error.message, 'error');
    }
  }

  exportConfig() {
    try {
      const configBlob = new Blob([JSON.stringify(this.currentConfig, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(configBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      window.showAlert('הגדרות יוצאו בהצלחה', 'success');
    } catch (error) {
      window.showAlert('שגיאה ביצוא ההגדרות: ' + error.message, 'error');
    }
  }

  async importConfig() {
    const fileInput = document.getElementById('config-import');
    const file = fileInput.files[0];
    
    if (!file) {
      window.showAlert('אנא בחר קובץ הגדרות', 'warning');
      return;
    }

    try {
      const text = await file.text();
      const importedConfig = JSON.parse(text);
      
      // Validate imported config structure
      if (!this.validateImportedConfig(importedConfig)) {
        throw new Error('Invalid configuration file structure');
      }
      
      this.currentConfig = importedConfig;
      this.updateUIFromConfig();
      this.updateConfigPreview();
      
      window.showAlert('הגדרות יובאו בהצלחה - אנא שמור כדי להפעיל', 'success');
    } catch (error) {
      window.showAlert('שגיאה בייבוא ההגדרות: ' + error.message, 'error');
    }
  }

  validateImportedConfig(config) {
    const requiredSections = ['webhooks', 'api_keys', 'system', 'text_overrides'];
    return requiredSections.every(section => config.hasOwnProperty(section));
  }

  resetToDefaults() {
    if (confirm('האם אתה בטוח שברצונך לאפס את כל ההגדרות לברירת המחדל?')) {
      this.currentConfig = { ...this.defaultConfig };
      this.updateUIFromConfig();
      this.updateConfigPreview();
      window.showAlert('הגדרות אופסו לברירת המחדל', 'warning');
    }
  }

  updateConfigPreview() {
    const previewContent = document.getElementById('config-preview-content');
    if (previewContent) {
      previewContent.textContent = JSON.stringify(this.currentConfig, null, 2);
    }
  }

  getConfig() {
    return this.currentConfig;
  }

  getConfigValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.currentConfig);
  }

  setConfigValue(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.currentConfig);
    target[lastKey] = value;
  }
}

// Initialize the configuration manager
const configManager = new DevConfigManager();

// Expose functions to global scope
window.testWebhook = () => configManager.testWebhook();
window.saveConfiguration = () => configManager.saveConfiguration();
window.loadConfiguration = () => configManager.loadConfiguration();
window.exportConfig = () => configManager.exportConfig();
window.importConfig = () => configManager.importConfig();
window.resetToDefaults = () => configManager.resetToDefaults();
window.updateConfigPreview = () => configManager.updateConfigPreview();

// Expose config manager globally
window.devConfig = configManager;

console.log('✅ dev-config.js loaded successfully');