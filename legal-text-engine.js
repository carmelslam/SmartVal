/**
 * LEGAL TEXT ENGINE - CENTRALIZED VAULT CONNECTION
 * 
 * This engine connects the legal texts logic.md vault to all builders
 * Changes in the vault automatically reflect in reports
 * Used by: Final Report Builder, Estimate Builder, and future modules
 */

class LegalTextEngine {
  constructor() {
    this.vaultPath = 'final report legal texts vault.md';
    this.cachedTexts = null;
    this.lastModified = null;
    this.placeholderPattern = /%[^%]+%/g;
    
    console.log('🏗️ Legal Text Engine initialized');
  }

  /**
   * Load legal texts from the vault file
   * @returns {Promise<Object>} Legal texts object
   */
  async loadFromVault() {
    try {
      console.log('📁 Loading legal texts from vault:', this.vaultPath);
      
      const response = await fetch(this.vaultPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch vault file: ${response.status}`);
      }
      
      const content = await response.text();
      
      // Extract JSON structure from markdown
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (!jsonMatch) {
        throw new Error('Could not find JSON structure in legal texts vault');
      }
      
      const vaultData = JSON.parse(jsonMatch[1]);
      console.log('✅ Vault data loaded:', Object.keys(vaultData));
      
      // Map vault keys to standardized keys for all builders
      const legalTexts = {
        // Final Report Types
        'private': vaultData.private?.text || '',
        'global': vaultData.global?.text || '',
        'total_loss': vaultData.total_loss?.text || '',
        'damaged_sale': vaultData.damaged_sale?.text || '',
        'legal_loss': vaultData['estimate_אובדן_להלכה']?.text || '',  // Use estimate version for now
        
        // Estimate Types
        'estimate_legal_loss': vaultData['estimate_אובדן_להלכה']?.text || '',
        'estimate_total_loss': vaultData['estimate_טוטלוס']?.text || '',
        
        // Additional vault data
        'assessor_credentials': vaultData.assessor_credentials?.text || '',
        'fees_disclaimer': vaultData.fees_desclaimer?.text || ''
      };
      
      // Cache the texts
      this.cachedTexts = {
        ...legalTexts,
        vaultData: vaultData  // Store original vault data for attachments
      };
      this.lastModified = new Date();
      
      console.log('✅ Legal texts cached successfully');
      return legalTexts;
      
    } catch (error) {
      console.error('❌ Error loading legal texts from vault:', error);
      
      // Return fallback error texts
      const errorText = 'שגיאה בטעינת טקסט משפטי - אנא בדוק את קובץ הכספת';
      return {
        'private': errorText,
        'global': errorText, 
        'total_loss': errorText,
        'damaged_sale': errorText,
        'legal_loss': errorText,
        'estimate_legal_loss': errorText,
        'estimate_total_loss': errorText,
        'assessor_credentials': errorText,
        'fees_disclaimer': errorText
      };
    }
  }

  /**
   * Get legal text for a specific type with UI mapping
   * @param {string} uiType - Type from UI dropdown (Hebrew)
   * @param {string} context - 'final_report' or 'estimate'
   * @returns {Promise<string>} Legal text
   */
  async getTextForType(uiType, context = 'final_report') {
    const texts = await this.loadFromVault();
    
    // Map UI dropdown values to vault keys
    const typeMapping = this.getTypeMapping(context);
    const vaultKey = typeMapping[uiType] || typeMapping['default'];
    
    const legalText = texts[vaultKey] || 'טקסט משפטי לא נמצא';
    
    console.log(`📄 Retrieved text for ${uiType} (${context}) → ${vaultKey}:`, 
                legalText ? 'Found' : 'Not found');
    
    return legalText;
  }

  /**
   * Get assessor credentials text
   * @returns {Promise<string>} Assessor credentials text
   */
  async getAssessorCredentials() {
    const texts = await this.loadFromVault();
    const credentialsText = texts['assessor_credentials'] || 'טקסט נתוני שמאי לא נמצא';
    
    console.log('👨‍💼 Retrieved assessor credentials:', credentialsText ? 'Found' : 'Not found');
    return credentialsText;
  }

  /**
   * Get fees disclaimer text
   * @returns {Promise<string>} Fees disclaimer text
   */
  async getFeesDisclaimer() {
    const texts = await this.loadFromVault();
    const feesText = texts['fees_disclaimer'] || 'טקסט תעריפים לא נמצא';
    
    console.log('💰 Retrieved fees disclaimer:', feesText ? 'Found' : 'Not found');
    return feesText;
  }

  /**
   * Get mapping between UI types and vault keys
   * @param {string} context - 'final_report' or 'estimate'
   * @returns {Object} Mapping object
   */
  getTypeMapping(context = 'final_report') {
    if (context === 'estimate') {
      return {
        'אומדן אובדן להלכה': 'estimate_legal_loss',
        'אומדן טוטלוס': 'estimate_total_loss',
        'אומדן ראשוני - אובדן להלכה': 'estimate_legal_loss',
        'אומדן ראשוני - טוטלוס': 'estimate_total_loss',
        'default': 'estimate_legal_loss'
      };
    }
    
    // Final report mapping (default)
    return {
      'חוות דעת פרטית': 'private',
      'חוות דעת גלובלית': 'global', 
      'חוות דעת טוטלוסט': 'total_loss',
      'חוות דעת מכירה מצבו הניזוק': 'damaged_sale',
      'חוות דעת אובדן להלכה': 'legal_loss',
      'default': 'private'
    };
  }

  /**
   * Replace placeholders in legal text with actual values
   * @param {string} text - Legal text with placeholders
   * @param {Object} values - Values to replace placeholders
   * @returns {string} Text with replaced placeholders
   */
  replacePlaceholders(text, values = {}) {
    // First, decode escaped characters from JSON
    let processedText = text
      .replace(/\\n/g, '\n')     // Convert \n to actual newlines
      .replace(/\\t/g, '\t')     // Convert \t to actual tabs
      .replace(/\\"/g, '"')      // Convert \" to actual quotes
      .replace(/\\\\/g, '\\');   // Convert \\ to actual backslash
    
    // Standard placeholder mapping
    const defaultPlaceholders = {
      '%מספר_רכב%': values.plate || '[מספר רכב]',
      '%תוצרת%': values.manufacturer || '[תוצרת]',
      '%דגם%': values.model || '[דגם]',
      '%שנה%': values.year || '[שנה]',
      '%בעל_רכב%': values.ownerName || '[שם בעל הרכב]',
      '%קוד_דגם%': values.modelCode || '[קוד דגם]',
      '%אחוז_נזק%': values.damagePercent || '[אחוז נזק]',
      '%ירידת_ערך%': values.depreciation || '[ירידת ערך]',
      '%מוקדי_נזק%': values.damageCenters || '[מספר מוקדים]',
      '%מספר_מוקדים%': values.damageCenters || '[מספר מוקדים]',
      '%ימי_מוסך%': values.garageDays || '[ימי מוסך]',
      '%שווי_רכב%': values.carValue || '[שווי רכב]',
      '%שווי_שרידים%': values.salvageValue || '[שווי שרידים]',
      '%שווי_פיצוי%': values.compensation || '[שווי פיצוי]',
      '%מחיר_מכירה%': values.salePrice || '[מחיר מכירה]',
      '%שיטת_תשלום%': values.paymentMethod || '[שיטת תשלום]'
    };
    
    // Merge with custom values
    const allPlaceholders = { ...defaultPlaceholders, ...values };
    
    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(allPlaceholders)) {
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedText = processedText.replace(regex, value);
    }
    
    console.log('🔄 Placeholders replaced in legal text');
    return processedText;
  }

  /**
   * Get vault key for a specific report type
   * @param {string} reportType - Report type identifier
   * @returns {string} Vault key
   */
  getVaultKey(reportType) {
    const mapping = {
      'חוות דעת פרטית': 'private',
      'חוות דעת גלובלית': 'global', 
      'חוות דעת טוטלוסט': 'total_loss',
      'חוות דעת מכירה מצבו הניזוק': 'damaged_sale',
      'חוות דעת אובדן להלכה': 'estimate_אובדן_להלכה'  // Use estimate version for now
    };
    
    return mapping[reportType] || 'private';
  }

  /**
   * Get attachments for a specific report type
   * @param {string} reportType - Report type identifier
   * @returns {Promise<string>} Attachments text
   */
  async getAttachments(reportType) {
    try {
      console.log(`📎 getAttachments called with reportType: "${reportType}"`);
      
      await this.loadFromVault();
      
      const vaultKey = this.getVaultKey(reportType);
      console.log(`📎 Vault key for "${reportType}" is: "${vaultKey}"`);
      
      const vaultData = this.cachedTexts?.vaultData || {};
      console.log('📎 Available attachment keys:', vaultData.attachments ? Object.keys(vaultData.attachments) : 'No attachments section');
      
      let attachments = '';
      
      // Check if we have the new attachments section
      if (vaultData.attachments) {
        attachments = vaultData.attachments[vaultKey] || '';
        console.log(`📎 Found attachments for ${vaultKey}:`, attachments ? 'Yes' : 'No');
      }
      
      // Final fallback to default attachments
      if (!attachments) {
        console.log('📎 Using fallback attachments');
        attachments = '**לוטה**\nתצלומי הרכב הניזוק\nחשבוניות תיקון\nערך רכב ממוחשב\nצילום רישיון הרכב\nחשכ"ט';
      }
      
      // Decode escaped characters from JSON
      attachments = attachments
        .replace(/\\n/g, '\n')     // Convert \n to actual newlines
        .replace(/\\t/g, '\t')     // Convert \t to actual tabs
        .replace(/\\"/g, '"')      // Convert \" to actual quotes
        .replace(/\\\\/g, '\\');   // Convert \\ to actual backslash
      
      console.log(`📎 Returning attachments for ${reportType} (${vaultKey}):`, attachments.substring(0, 50) + '...');
      return attachments;
    } catch (error) {
      console.error('❌ Error loading attachments:', error);
      return '**לוטה**\nתצלומי הרכב הניזוק\nחשבוניות תיקון\nערך רכב ממוחשב\nצילום רישיון הרכב\nחשכ"ט';
    }
  }

  /**
   * Get legal text with placeholders replaced
   * @param {string} uiType - Type from UI dropdown
   * @param {Object} values - Values for placeholders
   * @param {string} context - 'final_report' or 'estimate'
   * @returns {Promise<string>} Processed legal text
   */
  async getProcessedText(uiType, values = {}, context = 'final_report') {
    const rawText = await this.getTextForType(uiType, context);
    return this.replacePlaceholders(rawText, values);
  }

  /**
   * Get complete report text with legal text + assessor credentials
   * @param {string} uiType - Type from UI dropdown
   * @param {Object} values - Values for placeholders
   * @param {string} context - 'final_report' or 'estimate'
   * @param {boolean} includeCredentials - Whether to include assessor credentials
   * @param {boolean} includeFeesDisclaimer - Whether to include fees disclaimer
   * @returns {Promise<string>} Complete processed report text
   */
  async getCompleteReportText(uiType, values = {}, context = 'final_report', includeCredentials = true, includeFeesDisclaimer = false) {
    let completeText = '';
    
    // Get main legal text
    const legalText = await this.getProcessedText(uiType, values, context);
    completeText += legalText;
    
    // Add assessor credentials if requested
    if (includeCredentials) {
      const credentials = await this.getAssessorCredentials();
      const processedCredentials = this.replacePlaceholders(credentials, values);
      completeText += '\n\n---\n\n' + processedCredentials;
    }
    
    // Add fees disclaimer if requested
    if (includeFeesDisclaimer) {
      const feesDisclaimer = await this.getFeesDisclaimer();
      const processedFees = this.replacePlaceholders(feesDisclaimer, values);
      completeText += '\n\n---\n\n' + processedFees;
    }
    
    console.log('📋 Complete report text assembled with:', {
      legalText: !!legalText,
      credentials: includeCredentials,
      fees: includeFeesDisclaimer
    });
    
    return completeText;
  }

  /**
   * Get all available legal text types for a context
   * @param {string} context - 'final_report' or 'estimate'
   * @returns {Array} Array of available types
   */
  getAvailableTypes(context = 'final_report') {
    const mapping = this.getTypeMapping(context);
    return Object.keys(mapping).filter(key => key !== 'default');
  }

  /**
   * Force refresh of cached texts
   * @returns {Promise<Object>} Fresh legal texts
   */
  async refresh() {
    console.log('🔄 Forcing refresh of legal texts cache');
    this.cachedTexts = null;
    return await this.loadFromVault();
  }

  /**
   * Get vault file status and info
   * @returns {Object} Vault status information
   */
  getVaultStatus() {
    return {
      vaultPath: this.vaultPath,
      cached: !!this.cachedTexts,
      lastModified: this.lastModified,
      availableTypes: this.cachedTexts ? Object.keys(this.cachedTexts) : [],
      hasCredentials: this.cachedTexts && !!this.cachedTexts.assessor_credentials,
      hasFeesDisclaimer: this.cachedTexts && !!this.cachedTexts.fees_disclaimer
    };
  }

  /**
   * Convenience method to populate credentials in a textarea element
   * @param {string} elementId - ID of the textarea element
   * @param {Object} values - Values for placeholder replacement
   */
  async populateCredentialsElement(elementId, values = {}) {
    try {
      const credentials = await this.getAssessorCredentials();
      const processedCredentials = this.replacePlaceholders(credentials, values);
      
      const element = document.getElementById(elementId);
      if (element) {
        element.value = processedCredentials;
        console.log('✅ Credentials populated in element:', elementId);
      } else {
        console.error('❌ Element not found:', elementId);
      }
    } catch (error) {
      console.error('❌ Error populating credentials:', error);
    }
  }

  /**
   * Convenience method to populate fees disclaimer in a textarea element
   * @param {string} elementId - ID of the textarea element
   * @param {Object} values - Values for placeholder replacement
   */
  async populateFeesElement(elementId, values = {}) {
    try {
      const feesDisclaimer = await this.getFeesDisclaimer();
      const processedFees = this.replacePlaceholders(feesDisclaimer, values);
      
      const element = document.getElementById(elementId);
      if (element) {
        element.value = processedFees;
        console.log('✅ Fees disclaimer populated in element:', elementId);
      } else {
        console.error('❌ Element not found:', elementId);
      }
    } catch (error) {
      console.error('❌ Error populating fees disclaimer:', error);
    }
  }
}

// Create global instance
window.LegalTextEngine = new LegalTextEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LegalTextEngine;
}

console.log('✅ Legal Text Engine loaded and ready');