import { helper, getVehicleData, getDamageData, getValuationData, getFinancialData } from './helper.js';

// Example: On load, populate all forms from helper
window.forcePopulateFields = function() {
  // Use helper as single source of truth
  const vehicle = getVehicleData();
  // ...populate UI fields from vehicle, etc...
};

// 🔄 Force Form Population - Ensures forms are populated from helper on page load
// This addresses the issue where data is in helper but forms are empty

class ForceFormPopulator {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 500;
    
    console.log('🔄 ForceFormPopulator: Initializing...');
    this.init();
  }

  init() {
    // Wait for DOM and all scripts to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.startForcePopulation();
      });
    } else {
      this.startForcePopulation();
    }
  }

  startForcePopulation() {
    console.log('🔄 Starting force form population...');
    
    // Run immediately
    this.populateFormsFromHelper();
    
    // Run again after short delay to ensure all scripts are loaded
    setTimeout(() => this.populateFormsFromHelper(), 500);
    
    // Run again after longer delay as fallback
    setTimeout(() => this.populateFormsFromHelper(), 2000);
    
    // Set up periodic refresh every 10 seconds as safety net
    setInterval(() => {
      this.populateFormsFromHelper(true);
    }, 10000);
  }

  populateFormsFromHelper(isPeriodicCheck = false) {
    try {
      if (!isPeriodicCheck) {
        console.log(`🔄 Force populating forms (attempt ${this.retryCount + 1}/${this.maxRetries})`);
      }
      
      // Get helper data
      const helperData = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      if (!helperData || Object.keys(helperData).length === 0) {
        if (!isPeriodicCheck) {
          console.log('⚠️ No helper data found, trying alternative sources...');
          this.tryAlternativeDataSources();
        }
        return;
      }

      if (!isPeriodicCheck) {
        console.log('📊 Helper data found:', {
          keys: Object.keys(helperData),
          vehicle: helperData.vehicle,
          meta: helperData.meta,
          stakeholders: helperData.stakeholders
        });
      }

      // Define comprehensive field mappings
      const fieldMappings = this.createFieldMappings(helperData);
      
      let populatedCount = 0;
      let fieldsFound = 0;
      
      // Populate each field
      Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        
        if (element) {
          fieldsFound++;
          
          // Only populate if field is empty and we have a value
          if (value && (!element.value || element.value.trim() === '')) {
            element.value = value;
            
            // Trigger change event
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            populatedCount++;
            
            if (!isPeriodicCheck) {
              console.log(`  ✅ Populated ${fieldId}: ${value}`);
            }
          }
        }
      });

      if (!isPeriodicCheck) {
        console.log(`✅ Force population complete: ${populatedCount}/${fieldsFound} fields populated`);
      } else if (populatedCount > 0) {
        console.log(`🔄 Periodic check: populated ${populatedCount} empty fields`);
      }

      // If we successfully populated fields, we can stop retrying
      if (populatedCount > 0) {
        this.retryCount = this.maxRetries;
      }

    } catch (error) {
      console.error('❌ Force form population failed:', error);
      
      // Retry if we haven't exceeded max attempts
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => {
          this.populateFormsFromHelper();
        }, this.retryDelay * this.retryCount);
      }
    }
  }

  createFieldMappings(helperData) {
    // Create comprehensive field mappings from helper data
    const mappings = {};
    
    // Vehicle fields
    if (helperData.vehicle) {
      mappings.plate = helperData.vehicle.plate;
      mappings.manufacturer = helperData.vehicle.manufacturer;
      mappings.model = helperData.vehicle.model;
      mappings.year = helperData.vehicle.year;
      mappings.chassis = helperData.vehicle.chassis;
      mappings.km = helperData.vehicle.km;
      mappings.odo = helperData.vehicle.km; // Alternative field name
      mappings.owner = helperData.vehicle.owner;
    }

    // Meta fields
    if (helperData.meta) {
      if (!mappings.plate) mappings.plate = helperData.meta.plate;
      mappings.office_code = helperData.meta.office_code;
    }

    // Car details (fallback)
    if (helperData.car_details) {
      Object.keys(helperData.car_details).forEach(key => {
        if (!mappings[key]) {
          mappings[key] = helperData.car_details[key];
        }
      });
    }

    // Stakeholder fields
    if (helperData.stakeholders) {
      if (helperData.stakeholders.owner) {
        if (!mappings.owner) mappings.owner = helperData.stakeholders.owner.name;
        mappings.ownerPhone = helperData.stakeholders.owner.phone;
        mappings.ownerAddress = helperData.stakeholders.owner.address;
      }
      
      if (helperData.stakeholders.garage) {
        mappings.garageName = helperData.stakeholders.garage.name;
        mappings.garagePhone = helperData.stakeholders.garage.phone;
        mappings.garageEmail = helperData.stakeholders.garage.email;
      }
      
      if (helperData.stakeholders.insurance) {
        mappings.insuranceCompany = helperData.stakeholders.insurance.company;
        mappings.insuranceEmail = helperData.stakeholders.insurance.email;
        
        if (helperData.stakeholders.insurance.agent) {
          mappings.agentName = helperData.stakeholders.insurance.agent.name;
          mappings.agentPhone = helperData.stakeholders.insurance.agent.phone;
          mappings.agentEmail = helperData.stakeholders.insurance.agent.email;
        }
      }
    }

    // Case info fields
    if (helperData.case_info) {
      mappings.damageDate = helperData.case_info.damage_date;
      mappings.damageType = helperData.case_info.damage_type;
    }

    // Remove empty values
    Object.keys(mappings).forEach(key => {
      if (!mappings[key] || mappings[key] === '' || mappings[key] === '-') {
        delete mappings[key];
      }
    });

    return mappings;
  }

  tryAlternativeDataSources() {
    console.log('🔍 Trying alternative data sources...');
    
    // Try makeCarData
    try {
      const makeCarData = JSON.parse(sessionStorage.getItem('makeCarData') || '{}');
      if (Object.keys(makeCarData).length > 0) {
        console.log('📊 Found makeCarData:', makeCarData);
        this.populateFromAlternativeData(makeCarData);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse makeCarData:', e);
    }

    // Try carData
    try {
      const carData = JSON.parse(sessionStorage.getItem('carData') || '{}');
      if (Object.keys(carData).length > 0) {
        console.log('📊 Found carData:', carData);
        this.populateFromAlternativeData(carData);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse carData:', e);
    }

    console.log('⚠️ No alternative data sources found');
  }

  populateFromAlternativeData(data) {
    console.log('🔄 Populating from alternative data source...');
    
    const directMappings = {
      plate: data.plate || data.מספר_רכב || data['מס\' רכב'] || data["מס' רכב"],
      manufacturer: data.manufacturer || data.יצרן || data['שם היצרן'],
      model: data.model || data.דגם,
      year: data.year || data['שנת ייצור'] || data['שנת יצור'],
      owner: data.owner || data['שם בעל הרכב'] || data.בעלים,
      chassis: data.chassis || data['מספר שילדה'],
      office_code: data.office_code || data['קוד משרד התחבורה']
    };

    let populatedCount = 0;
    Object.entries(directMappings).forEach(([fieldId, value]) => {
      if (value) {
        const element = document.getElementById(fieldId);
        if (element && (!element.value || element.value.trim() === '')) {
          element.value = value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          populatedCount++;
          console.log(`  ✅ Populated ${fieldId}: ${value}`);
        }
      }
    });

    console.log(`✅ Alternative data population: ${populatedCount} fields populated`);
  }

  // Public method to manually trigger population
  forcePopulate() {
    console.log('🔄 Manual force populate triggered');
    this.populateFormsFromHelper();
  }
}

// Create global instance
const forcePopulator = new ForceFormPopulator();

// Make available globally
window.forcePopulator = forcePopulator;
window.forcePopulateForms = () => forcePopulator.forcePopulate();

console.log('🚀 Force Form Populator loaded and active');