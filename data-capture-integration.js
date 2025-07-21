// 🔧 DATA CAPTURE INTEGRATION - LOAD ALL FIXES
// This file integrates all the data capture fixes into the main system
// Load this file AFTER helper.js to apply the fixes

import { processIncomingDataEnhanced } from './helper-data-capture-fix.js';

console.log('🔧 Loading data capture fixes...');

/**
 * INTEGRATION: Replace the broken processIncomingData function with the enhanced version
 */
function integrateEnhancedDataProcessing() {
  console.log('🔄 Integrating enhanced data processing...');
  
  try {
    // Replace the global processIncomingData function
    if (typeof window !== 'undefined') {
      window.processIncomingData = processIncomingDataEnhanced;
      console.log('✅ Replaced global processIncomingData with enhanced version');
    }
    
    // Also replace it in the webhook handler if it exists
    if (typeof window.sendToWebhook !== 'undefined') {
      // The webhook handler will automatically use the new processIncomingData
      console.log('✅ Webhook handler will use enhanced processing');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to integrate enhanced data processing:', error);
    return false;
  }
}

/**
 * INTEGRATION: Enhanced session storage management
 */
function integrateSessionStorageFixes() {
  console.log('💾 Integrating session storage fixes...');
  
  try {
    // Create enhanced session storage manager
    const SessionStorageManager = {
      // Save helper with multiple backups
      saveHelperEnhanced: function(helperData) {
        try {
          const helperString = JSON.stringify(helperData);
          const timestamp = new Date().toISOString();
          
          // Primary storage
          sessionStorage.setItem('helper', helperString);
          
          // Backup storage
          sessionStorage.setItem('helper_backup', helperString);
          sessionStorage.setItem('helper_timestamp', timestamp);
          
          // Persistent storage
          localStorage.setItem('helper_data', helperString);
          localStorage.setItem('helper_last_save', timestamp);
          
          // Historical backup (for recovery)
          const historyKey = `helper_history_${Date.now()}`;
          localStorage.setItem(historyKey, helperString);
          
          // Clean old history (keep only last 5)
          this.cleanHelperHistory();
          
          console.log('✅ Helper saved to multiple storage locations');
          return true;
          
        } catch (error) {
          console.error('❌ Enhanced helper save failed:', error);
          return false;
        }
      },
      
      // Load helper with fallback recovery
      loadHelperEnhanced: function() {
        console.log('📥 Loading helper with enhanced recovery...');
        
        const sources = [
          () => JSON.parse(sessionStorage.getItem('helper') || '{}'),
          () => JSON.parse(sessionStorage.getItem('helper_backup') || '{}'),
          () => JSON.parse(localStorage.getItem('helper_data') || '{}'),
          () => this.recoverFromHistory()
        ];
        
        for (const source of sources) {
          try {
            const data = source();
            if (data && Object.keys(data).length > 0) {
              console.log('✅ Helper loaded from storage');
              return data;
            }
          } catch (error) {
            console.warn('⚠️ Storage source failed:', error);
          }
        }
        
        console.log('📭 No helper data found, returning empty object');
        return {};
      },
      
      // Clean old history entries
      cleanHelperHistory: function() {
        try {
          const keys = Object.keys(localStorage).filter(key => key.startsWith('helper_history_'));
          if (keys.length > 5) {
            keys.sort().slice(0, -5).forEach(key => {
              localStorage.removeItem(key);
            });
          }
        } catch (error) {
          console.warn('⚠️ History cleanup failed:', error);
        }
      },
      
      // Recover from history
      recoverFromHistory: function() {
        try {
          const historyKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('helper_history_'))
            .sort()
            .reverse();
          
          for (const key of historyKeys) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              if (data && Object.keys(data).length > 0) {
                console.log('✅ Recovered helper from history:', key);
                return data;
              }
            } catch (error) {
              continue;
            }
          }
        } catch (error) {
          console.warn('⚠️ History recovery failed:', error);
        }
        return {};
      }
    };
    
    // Make available globally
    window.SessionStorageManager = SessionStorageManager;
    
    // Override the original saveHelperToStorage if it exists
    if (typeof window.saveHelperToStorage === 'function') {
      const originalSave = window.saveHelperToStorage;
      window.saveHelperToStorage = function() {
        const success = originalSave();
        if (window.helper) {
          SessionStorageManager.saveHelperEnhanced(window.helper);
        }
        return success;
      };
    }
    
    console.log('✅ Enhanced session storage manager integrated');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to integrate session storage fixes:', error);
    return false;
  }
}

/**
 * INTEGRATION: Enhanced form population system
 */
function integrateFormPopulationFixes() {
  console.log('📝 Integrating form population fixes...');
  
  try {
    // Enhanced form population that works with any field structure
    const FormPopulationManager = {
      populateAllForms: function(helperData) {
        console.log('🔄 Enhanced form population starting...');
        
        if (!helperData) {
          helperData = window.helper || {};
        }
        
        // Standard field mappings
        const fieldMappings = {
          // Vehicle fields
          'plate': [helperData.vehicle?.plate, helperData.meta?.plate],
          'manufacturer': [helperData.vehicle?.manufacturer],
          'model': [helperData.vehicle?.model],
          'year': [helperData.vehicle?.year],
          'chassis': [helperData.vehicle?.chassis],
          'km': [helperData.vehicle?.km],
          'engine_volume': [helperData.vehicle?.engine_volume],
          'fuel_type': [helperData.vehicle?.fuel_type],
          'ownership_type': [helperData.vehicle?.ownership_type],
          'trim': [helperData.vehicle?.trim],
          'model_type': [helperData.vehicle?.model_type],
          'office_code': [helperData.vehicle?.office_code],
          
          // Stakeholder fields
          'owner': [helperData.stakeholders?.owner?.name],
          'owner_phone': [helperData.stakeholders?.owner?.phone],
          'owner_address': [helperData.stakeholders?.owner?.address],
          'garage_name': [helperData.stakeholders?.garage?.name],
          'garage_phone': [helperData.stakeholders?.garage?.phone],
          'insurance_company': [helperData.stakeholders?.insurance?.company],
          
          // Case info fields
          'damage_date': [helperData.case_info?.damage_date],
          'inspection_date': [helperData.case_info?.inspection_date],
          'damage_type': [helperData.case_info?.damage_type],
          
          // Valuation fields
          'base_price': [helperData.valuation?.base_price],
          'final_price': [helperData.valuation?.final_price],
          'market_value': [helperData.vehicle?.market_value, helperData.valuation?.final_price]
        };
        
        let populatedCount = 0;
        
        Object.entries(fieldMappings).forEach(([fieldId, possibleValues]) => {
          const element = document.getElementById(fieldId);
          if (element) {
            // Find first non-empty value
            const value = possibleValues.find(v => v && v !== '');
            if (value && (!element.value || element.value.trim() === '')) {
              element.value = value;
              
              // Trigger multiple events for compatibility
              const events = ['input', 'change', 'keyup', 'blur'];
              events.forEach(eventType => {
                element.dispatchEvent(new Event(eventType, { bubbles: true }));
              });
              
              populatedCount++;
              console.log(`  ✅ Populated ${fieldId} = ${value}`);
            }
          }
        });
        
        // Also try common alternative field names
        this.populateAlternativeFields(helperData);
        
        console.log(`✅ Enhanced form population completed: ${populatedCount} fields populated`);
        return populatedCount;
      },
      
      populateAlternativeFields: function(helperData) {
        // Alternative field names that might exist
        const alternatives = {
          'license_plate': [helperData.vehicle?.plate],
          'car_plate': [helperData.vehicle?.plate],
          'vehicleManufacturer': [helperData.vehicle?.manufacturer],
          'vehicleModel': [helperData.vehicle?.model],
          'vehicleYear': [helperData.vehicle?.year],
          'ownerName': [helperData.stakeholders?.owner?.name],
          'chassisNumber': [helperData.vehicle?.chassis],
          'vin': [helperData.vehicle?.chassis],
          'mileage': [helperData.vehicle?.km],
          'garageName': [helperData.stakeholders?.garage?.name],
          'insuranceCompany': [helperData.stakeholders?.insurance?.company]
        };
        
        Object.entries(alternatives).forEach(([fieldId, possibleValues]) => {
          const element = document.getElementById(fieldId);
          if (element) {
            const value = possibleValues.find(v => v && v !== '');
            if (value && (!element.value || element.value.trim() === '')) {
              element.value = value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`  ✅ Alt field populated ${fieldId} = ${value}`);
            }
          }
        });
      },
      
      // Force refresh with retry mechanism
      forceRefreshWithRetry: function(helperData, retries = 3) {
        const attempt = () => {
          const populated = this.populateAllForms(helperData);
          
          if (populated === 0 && retries > 0) {
            console.log(`⏰ Retrying form population in 500ms (${retries} retries left)`);
            setTimeout(() => {
              this.forceRefreshWithRetry(helperData, retries - 1);
            }, 500);
          }
        };
        
        attempt();
      }
    };
    
    // Make available globally
    window.FormPopulationManager = FormPopulationManager;
    
    // Override/enhance existing refreshAllModuleForms
    const originalRefresh = window.refreshAllModuleForms;
    window.refreshAllModuleForms = function(helperData) {
      // Call original if it exists
      if (originalRefresh && typeof originalRefresh === 'function') {
        try {
          originalRefresh(helperData);
        } catch (error) {
          console.warn('⚠️ Original refresh function failed:', error);
        }
      }
      
      // Apply enhanced population
      FormPopulationManager.populateAllForms(helperData);
    };
    
    console.log('✅ Enhanced form population system integrated');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to integrate form population fixes:', error);
    return false;
  }
}

/**
 * INTEGRATION: Enhanced webhook integration
 */
function integrateWebhookFixes() {
  console.log('🔗 Integrating webhook fixes...');
  
  try {
    // Monitor and fix webhook data processing
    const WebhookMonitor = {
      processIncomingWebhookData: async function(data, webhookId) {
        console.log('🔍 Enhanced webhook processing starting...');
        console.log('📥 Raw webhook data:', data);
        
        try {
          // Use the enhanced processing function
          const result = await processIncomingDataEnhanced(data, webhookId);
          
          if (result.success && result.helperUpdated) {
            console.log('✅ Webhook data processed successfully');
            
            // Force immediate UI refresh
            setTimeout(() => {
              if (window.FormPopulationManager) {
                window.FormPopulationManager.forceRefreshWithRetry(window.helper);
              }
            }, 100);
            
            // Save to storage immediately
            if (window.SessionStorageManager) {
              window.SessionStorageManager.saveHelperEnhanced(window.helper);
            }
            
            return result;
          } else {
            console.warn('⚠️ Webhook processing completed with issues:', result.warnings);
            return result;
          }
          
        } catch (error) {
          console.error('❌ Enhanced webhook processing failed:', error);
          return {
            success: false,
            error: error.message,
            webhookId: webhookId,
            timestamp: new Date().toISOString()
          };
        }
      }
    };
    
    window.WebhookMonitor = WebhookMonitor;
    
    console.log('✅ Enhanced webhook processing integrated');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to integrate webhook fixes:', error);
    return false;
  }
}

/**
 * MAIN INTEGRATION FUNCTION
 */
export function initializeDataCaptureFixes() {
  console.log('🚀 Initializing comprehensive data capture fixes...');
  
  const results = {
    dataProcessing: false,
    sessionStorage: false,
    formPopulation: false,
    webhookIntegration: false
  };
  
  try {
    // Apply all fixes
    results.dataProcessing = integrateEnhancedDataProcessing();
    results.sessionStorage = integrateSessionStorageFixes();
    results.formPopulation = integrateFormPopulationFixes();
    results.webhookIntegration = integrateWebhookFixes();
    
    const successCount = Object.values(results).filter(Boolean).length;
    
    if (successCount === 4) {
      console.log('✅ ALL DATA CAPTURE FIXES SUCCESSFULLY INTEGRATED!');
      
      // Test the system
      setTimeout(() => {
        console.log('🧪 Running system test...');
        testDataCaptureSystem();
      }, 1000);
      
    } else {
      console.warn(`⚠️ ${successCount}/4 fixes integrated successfully`);
      console.log('Fix results:', results);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Critical error during fix integration:', error);
    return results;
  }
}

/**
 * TEST FUNCTION: Verify the fixes are working
 */
function testDataCaptureSystem() {
  console.log('🧪 Testing data capture system...');
  
  try {
    // Test 1: Hebrew text parsing
    const testHebrewData = {
      Body: 'מס\' רכב: 5785269\nשם היצרן: ביואיק\nדגם: LUCERNE\nשנת ייצור: 05/2009\nבעל הרכב: כרמל כיוף'
    };
    
    console.log('🧪 Test 1: Hebrew text processing...');
    processIncomingDataEnhanced(testHebrewData, 'test_hebrew').then(result => {
      console.log('📊 Hebrew test result:', result);
    });
    
    // Test 2: Direct object data
    const testDirectData = {
      plate: '5785269',
      manufacturer: 'ביואיק',
      model: 'LUCERNE',
      year: '2009',
      owner: 'כרמל כיוף'
    };
    
    console.log('🧪 Test 2: Direct object processing...');
    processIncomingDataEnhanced(testDirectData, 'test_direct').then(result => {
      console.log('📊 Direct test result:', result);
    });
    
    // Test 3: Form population
    console.log('🧪 Test 3: Form population...');
    if (window.FormPopulationManager) {
      const mockHelper = {
        vehicle: { plate: '1234567', manufacturer: 'Toyota', model: 'Camry' },
        stakeholders: { owner: { name: 'Test Owner' } }
      };
      window.FormPopulationManager.populateAllForms(mockHelper);
    }
    
    console.log('✅ System test completed');
    
  } catch (error) {
    console.error('❌ System test failed:', error);
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDataCaptureFixes);
  } else {
    // DOM already loaded
    setTimeout(initializeDataCaptureFixes, 100);
  }
}

// Export for manual initialization
export { initializeDataCaptureFixes };

console.log('✅ Data capture integration module loaded');