/**
 * Estimate Report Coordination Module
 * Coordinates the estimate workflow with existing systems (helper.js, math.js, vault-loader.js, validation.js)
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { helper, updateHelper, getVehicleData, getDamageData } from './helper.js';
import { MathEngine } from './math.js';
import { loadLegalText } from './vault-loader.js';
import { validateData } from './validation.js';
import { sendToWebhook } from './webhook.js';

class EstimateReportCoordinator {
  constructor() {
    this.estimateData = {
      type: 'אובדן_להלכה', // Default estimate type
      damage_sections: [],
      calculations: {},
      legal_text: '',
      notes: '',
      validation: {},
      timestamp: null
    };
    
    this.isInitialized = false;
    console.log('🧮 Estimate Report Coordinator initialized');
  }

  /**
   * Initialize the estimate workflow with existing data
   */
  async initialize() {
    try {
      console.log('🔄 Initializing estimate workflow...');
      
      // Load existing helper data
      const helperData = sessionStorage.getItem('helper');
      if (!helperData) {
        throw new Error('No helper data found in session storage');
      }
      
      const helper = JSON.parse(helperData);
      
      // Extract damage sections from expertise data
      if (helper.damage_sections) {
        this.estimateData.damage_sections = helper.damage_sections;
        console.log('✅ Loaded damage sections:', this.estimateData.damage_sections.length);
      }
      
      // Calculate base damage total
      await this.calculateEstimateTotals();
      
      // Load default legal text
      await this.loadEstimateLegalText();
      
      // Validate initial data
      this.validateEstimateData();
      
      this.isInitialized = true;
      console.log('✅ Estimate workflow initialized successfully');
      
      return this.estimateData;
      
    } catch (error) {
      console.error('❌ Error initializing estimate workflow:', error);
      throw error;
    }
  }

  /**
   * Set the estimate type and load corresponding legal text
   * @param {string} type - Estimate type ('אובדן_להלכה' or 'טוטלוס')
   */
  async setEstimateType(type) {
    if (!['אובדן_להלכה', 'טוטלוס'].includes(type)) {
      throw new Error(`Invalid estimate type: ${type}`);
    }
    
    this.estimateData.type = type;
    
    // Load legal text for this estimate type
    await this.loadEstimateLegalText(type);
    
    // Update helper with estimate type
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.estimate_type = type;
    sessionStorage.setItem('helper', JSON.stringify(helper));
    
    console.log('📝 Estimate type set to:', type);
    return this.estimateData;
  }

  /**
   * Calculate estimate totals using existing math engine
   */
  async calculateEstimateTotals() {
    try {
      let baseDamage = 0;
      
      // Calculate total from damage sections
      if (this.estimateData.damage_sections && this.estimateData.damage_sections.length > 0) {
        baseDamage = this.estimateData.damage_sections.reduce((total, section) => {
          const sectionTotal = (section.works_total || 0) + 
                              (section.parts_total || 0) + 
                              (section.repairs_total || 0);
          return total + sectionTotal;
        }, 0);
      }
      
      // Get VAT rate from math engine
      const vatRate = window.getHelperVatRate ? window.getHelperVatRate() : MathEngine.getVatRate();
      const vatAmount = Math.round(baseDamage * vatRate / 100);
      const totalEstimate = baseDamage + vatAmount;
      
      // Store calculations
      this.estimateData.calculations = {
        base_damage: baseDamage,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_estimate: totalEstimate,
        calculated_at: new Date().toISOString()
      };
      
      console.log('💰 Estimate calculations updated:', this.estimateData.calculations);
      return this.estimateData.calculations;
      
    } catch (error) {
      console.error('❌ Error calculating estimate totals:', error);
      // Fallback calculation with default VAT
      const vatRate = 18;
      const vatAmount = Math.round((this.estimateData.base_damage || 0) * vatRate / 100);
      const totalEstimate = (this.estimateData.base_damage || 0) + vatAmount;
      
      this.estimateData.calculations = {
        base_damage: this.estimateData.base_damage || 0,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_estimate: totalEstimate,
        calculated_at: new Date().toISOString()
      };
      
      return this.estimateData.calculations;
    }
  }

  /**
   * Load legal text for estimate type using vault loader
   * @param {string} type - Estimate type
   */
  async loadEstimateLegalText(type = null) {
    try {
      const estimateType = type || this.estimateData.type;
      const legalTextKey = `estimate_${estimateType}`;
      
      const legalText = await loadLegalText(legalTextKey);
      this.estimateData.legal_text = legalText || 'טקסט משפטי לא זמין';
      
      console.log('📋 Legal text loaded for estimate type:', estimateType);
      return this.estimateData.legal_text;
      
    } catch (error) {
      console.error('❌ Error loading legal text:', error);
      this.estimateData.legal_text = 'שגיאה בטעינת הטקסט המשפטי';
      return this.estimateData.legal_text;
    }
  }

  /**
   * Validate estimate data using existing validation system
   */
  validateEstimateData() {
    try {
      const validation = {
        car_details: false,
        damage_sections: false,
        calculations: false,
        legal_text: false,
        overall: false
      };

      // Validate car details
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      validation.car_details = !!(helper.car_details?.manufacturer && helper.meta?.plate);

      // Validate damage sections
      validation.damage_sections = this.estimateData.damage_sections.length > 0;

      // Validate calculations
      validation.calculations = !!(this.estimateData.calculations.total_estimate > 0);

      // Validate legal text
      validation.legal_text = !!(this.estimateData.legal_text && 
                                this.estimateData.legal_text !== 'טקסט משפטי לא זמין');

      // Overall validation
      validation.overall = validation.car_details && 
                          validation.damage_sections && 
                          validation.calculations && 
                          validation.legal_text;

      this.estimateData.validation = validation;
      
      console.log('✓ Estimate validation completed:', validation);
      return validation;
      
    } catch (error) {
      console.error('❌ Error validating estimate data:', error);
      return { overall: false, error: error.message };
    }
  }

  /**
   * Add additional notes to the estimate
   * @param {string} notes - Additional notes
   */
  addNotes(notes) {
    this.estimateData.notes = notes || '';
    
    // Update helper with notes
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.estimate_notes = notes;
    sessionStorage.setItem('helper', JSON.stringify(helper));
    
    console.log('📝 Estimate notes updated');
    return this.estimateData.notes;
  }

  /**
   * Export estimate data for report generation
   */
  exportEstimateData() {
    try {
      // Update helper with all estimate data
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      helper.estimate_data = {
        ...this.estimateData,
        completed: this.estimateData.validation.overall,
        exported_at: new Date().toISOString()
      };
      
      // Store updated helper
      sessionStorage.setItem('helper', JSON.stringify(helper));
      
      console.log('📤 Estimate data exported to helper');
      return helper.estimate_data;
      
    } catch (error) {
      console.error('❌ Error exporting estimate data:', error);
      throw error;
    }
  }

  /**
   * Generate estimate report via webhook
   */
  async generateEstimateReport() {
    try {
      if (!this.estimateData.validation.overall) {
        throw new Error('Estimate validation failed - cannot generate report');
      }
      
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      const payload = {
        type: 'estimate',
        plate: helper.meta?.plate,
        helper: helper,
        estimate_type: this.estimateData.type,
        calculations: this.estimateData.calculations,
        legal_text: this.estimateData.legal_text,
        notes: this.estimateData.notes,
        timestamp: new Date().toISOString()
      };
      
      console.log('🚀 Generating estimate report...');
      const response = await sendToWebhook('GENERATE_ESTIMATE_REPORT', payload);
      
      if (response?.success) {
        console.log('✅ Estimate report generated successfully');
        
        // Update helper with generation timestamp
        helper.estimate_data = helper.estimate_data || {};
        helper.estimate_data.generated_at = new Date().toISOString();
        helper.estimate_data.report_url = response.report_url;
        sessionStorage.setItem('helper', JSON.stringify(helper));
        
        return response;
      } else {
        throw new Error(response?.error || 'Failed to generate estimate report');
      }
      
    } catch (error) {
      console.error('❌ Error generating estimate report:', error);
      throw error;
    }
  }

  /**
   * Get current estimate data
   */
  getEstimateData() {
    return { ...this.estimateData };
  }

  /**
   * Check if coordinator is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Reset estimate data
   */
  reset() {
    this.estimateData = {
      type: 'אובדן_להלכה',
      damage_sections: [],
      calculations: {},
      legal_text: '',
      notes: '',
      validation: {},
      timestamp: null
    };
    this.isInitialized = false;
    console.log('🔄 Estimate coordinator reset');
  }
}

// Create singleton instance
const estimateCoordinator = new EstimateReportCoordinator();

// Export for use in other modules
export { EstimateReportCoordinator, estimateCoordinator };

// Make available globally for non-module scripts
window.EstimateReportCoordinator = EstimateReportCoordinator;
window.estimateCoordinator = estimateCoordinator;

console.log('📄 Estimate Report Coordinator module loaded');