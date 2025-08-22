// math.js — Core Calculation Engine for Report Values

let _vatRate = 18; // default system VAT rate
let _adminHubVatRate = null; // VAT rate from admin hub

export const MathEngine = {
  // Core Math Functions
  round(num) {
    return Math.round((parseFloat(num) || 0) * 100) / 100;
  },

  formatCurrency(num) {
    return `${MathEngine.round(num).toLocaleString('he-IL')} ₪`;
  },

  parseNumber(value) {
    return parseFloat(value) || 0;
  },

  // Damage & Percentage Calculations
  computeDamagePercentage(totalDamage, marketValue) {
    if (!marketValue || marketValue <= 0) return 0;
    return MathEngine.round((totalDamage / marketValue) * 100);
  },

  computeNetValueAfterShaveh(marketValue, shavehPercent) {
    const shaveh = (marketValue * (shavehPercent || 0)) / 100;
    return MathEngine.round(marketValue - shaveh);
  },

  // Parts, Repairs & Works Calculations
  calculatePartsTotal(parts = []) {
    return MathEngine.round(
      parts.reduce((sum, part) => sum + MathEngine.parseNumber(part.price), 0)
    );
  },

  calculateRepairsTotal(repairs = []) {
    return MathEngine.round(
      repairs.reduce((sum, repair) => sum + MathEngine.parseNumber(repair.cost), 0)
    );
  },

  calculateWorksTotal(works = []) {
    return MathEngine.round(
      works.reduce((sum, work) => sum + MathEngine.parseNumber(work.cost), 0)
    );
  },

  calculateDamageCenterTotal(damageCenter = {}) {
    const parts = MathEngine.calculatePartsTotal(damageCenter.parts || []);
    const repairs = MathEngine.calculateRepairsTotal(damageCenter.repairs || []);
    const works = MathEngine.calculateWorksTotal(damageCenter.works || []);
    return MathEngine.round(parts + repairs + works);
  },

  calculateAllDamageCentersTotal(damageCenters = []) {
    return MathEngine.round(
      damageCenters.reduce((sum, center) => sum + MathEngine.calculateDamageCenterTotal(center), 0)
    );
  },

  // Fee Calculations
  calculateFeesSubtotal(fees = {}) {
    const travel = MathEngine.parseNumber(
      fees.travel_fee || fees.travel || fees.transport
    );
    const media = MathEngine.parseNumber(fees.media_fee || fees.photos);
    const office = MathEngine.parseNumber(fees.office_fee || fees.office);
    return MathEngine.round(travel + media + office);
  },

  calculateVatAmount(subtotal, vatRate) {
    const rate = (typeof vatRate === 'number') ? vatRate : _vatRate;
    return MathEngine.round(subtotal * rate / 100);
  },

  calculateFeesTotal(fees = {}, vatRate) {
    const subtotal = MathEngine.calculateFeesSubtotal(fees);
    const vat = MathEngine.calculateVatAmount(subtotal, vatRate);
    return MathEngine.round(subtotal + vat);
  },

  // Depreciation Calculations
  calculateDepreciationAmount(baseValue, depreciationPercent) {
    return MathEngine.round(baseValue * (MathEngine.parseNumber(depreciationPercent) / 100));
  },

  calculateGlobalDepreciation(marketValue, globalPercent) {
    return MathEngine.calculateDepreciationAmount(marketValue, globalPercent);
  },

  // Compensation Calculations
  computeTotalCompensation(totalDamage, depreciation, fees = {}) {
    const base = totalDamage - (depreciation || 0);
    const totalFees = MathEngine.calculateFeesSubtotal(fees);
    return MathEngine.round(base + totalFees);
  },

  applyVAT(value, vatRate) {
    const rate = (typeof vatRate === 'number') ? vatRate : _vatRate;
    return MathEngine.round(value * (1 + rate / 100));
  },

  // Estimate Calculations (No fees/depreciation)
  calculateEstimateTotal(baseDamage, vatRate) {
    const rate = (typeof vatRate === 'number') ? vatRate : _vatRate;
    const vat = MathEngine.calculateVatAmount(baseDamage, rate);
    return MathEngine.round(baseDamage + vat);
  },

  // Summary Calculations for different report types
  calculateDamageSummary(damageCenters = []) {
    let totalParts = 0;
    let totalRepairs = 0;
    let totalWorks = 0;

    damageCenters.forEach(center => {
      totalParts += MathEngine.calculatePartsTotal(center.parts || []);
      totalRepairs += MathEngine.calculateRepairsTotal(center.repairs || []);
      totalWorks += MathEngine.calculateWorksTotal(center.works || []);
    });

    const totalDamage = totalParts + totalRepairs + totalWorks;

    return {
      parts_total: MathEngine.round(totalParts),
      repairs_total: MathEngine.round(totalRepairs),
      works_total: MathEngine.round(totalWorks),
      total_damage_amount: MathEngine.round(totalDamage),
      damage_centers_count: damageCenters.length
    };
  },

  // VAT Management
  getVatRate() {
    // Check if admin hub VAT rate is available
    if (_adminHubVatRate !== null && _adminHubVatRate !== undefined) {
      return _adminHubVatRate;
    }
    
    // Try to load from admin hub
    try {
      const adminVat = MathEngine.loadAdminHubVatRate();
      if (adminVat !== null) {
        _adminHubVatRate = adminVat;
        return _adminHubVatRate;
      }
    } catch (e) {
      console.warn('Could not load VAT rate from admin hub:', e);
    }
    
    // Fallback to stored or default rate
    const storedVat = sessionStorage.getItem('globalVAT');
    return storedVat ? parseFloat(storedVat) : _vatRate;
  },

  setVatRate(rate) {
    if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
      _vatRate = rate;
      _adminHubVatRate = rate; // Update admin hub cache
      sessionStorage.setItem('globalVAT', rate);
      console.log(`🔄 VAT rate updated to ${rate}% in MathEngine`);
      
      // Notify admin hub if available
      try {
        MathEngine.updateAdminHubVatRate(rate);
      } catch (e) {
        console.warn('Could not update admin hub VAT rate:', e);
      }
      
      if (window.Helper?.updateMeta) {
        Helper.updateMeta({ global_vat: rate });
      }
      
      // Broadcast change to all modules
      if (typeof window.refreshHelperVatRate === 'function') {
        window.refreshHelperVatRate();
      }
    }
  },

  // Load VAT rate from admin hub
  loadAdminHubVatRate() {
    // Check for admin hub communication methods
    if (window.parent && window.parent !== window) {
      // We're in an iframe, try to communicate with parent (admin hub)
      try {
        return MathEngine.getVatRateFromParent();
      } catch (e) {
        console.warn('Could not get VAT rate from parent frame:', e);
      }
    }
    
    // Check for admin hub API
    if (typeof window.AdminHubAPI !== 'undefined') {
      try {
        return window.AdminHubAPI.getVatRate();
      } catch (e) {
        console.warn('Could not get VAT rate from AdminHubAPI:', e);
      }
    }
    
    // Check sessionStorage for admin hub data
    try {
      const adminData = sessionStorage.getItem('adminHubConfig');
      if (adminData) {
        const config = JSON.parse(adminData);
        if (config.vat_rate !== undefined) {
          return config.vat_rate;
        }
      }
    } catch (e) {
      console.warn('Could not parse admin hub config from sessionStorage:', e);
    }
    
    return null;
  },

  // Get VAT rate from parent frame (admin hub)
  getVatRateFromParent() {
    return new Promise((resolve, reject) => {
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'VAT_RATE_RESPONSE') {
          window.removeEventListener('message', messageHandler);
          resolve(event.data.vatRate);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Request VAT rate from parent
      window.parent.postMessage({ type: 'GET_VAT_RATE' }, '*');
      
      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        reject(new Error('Timeout waiting for VAT rate from admin hub'));
      }, 2000);
    });
  },

  // Update VAT rate in admin hub
  updateAdminHubVatRate(rate) {
    if (window.parent && window.parent !== window) {
      // Notify parent frame (admin hub) of VAT rate change
      window.parent.postMessage({ 
        type: 'UPDATE_VAT_RATE', 
        vatRate: rate 
      }, '*');
    }
    
    // Update admin hub API if available
    if (typeof window.AdminHubAPI !== 'undefined' && window.AdminHubAPI.setVatRate) {
      window.AdminHubAPI.setVatRate(rate);
    }
    
    // Store in sessionStorage for persistence
    try {
      const adminData = JSON.parse(sessionStorage.getItem('adminHubConfig') || '{}');
      adminData.vat_rate = rate;
      sessionStorage.setItem('adminHubConfig', JSON.stringify(adminData));
    } catch (e) {
      console.warn('Could not update admin hub config in sessionStorage:', e);
    }
  },

  // Main Calculation Engine
  calculateAll({ baseDamage, depreciation, fees, marketValue, vehicleValueGross, shavehPercent, vatRate }) {
    // Use vehicleValueGross for damage percentage if available, otherwise fallback to marketValue
    const grossValue = vehicleValueGross || marketValue;
    const damage_percent = MathEngine.computeDamagePercentage(baseDamage, grossValue);
    const total_compensation = MathEngine.computeTotalCompensation(baseDamage, depreciation, fees);
    const compensation_with_vat = MathEngine.applyVAT(total_compensation, vatRate);
    const net_value_post_shaveh = MathEngine.computeNetValueAfterShaveh(marketValue, shavehPercent);

    // Fee calculations
    const fees_subtotal = MathEngine.calculateFeesSubtotal(fees);
    const fees_vat = MathEngine.calculateVatAmount(fees_subtotal, vatRate);
    const fees_total = fees_subtotal + fees_vat;

    // Depreciation calculations
    const depreciation_amount = MathEngine.parseNumber(depreciation);
    const depreciation_percent = marketValue > 0 ? MathEngine.round((depreciation_amount / marketValue) * 100) : 0;

    return {
      // Core calculations
      damage_percent,
      total_compensation,
      compensation_with_vat,
      net_value_post_shaveh,
      market_value: MathEngine.round(marketValue),
      vehicle_value_gross: MathEngine.round(vehicleValueGross || baseDamage),
      
      // Base damage and totals
      base_damage: MathEngine.round(baseDamage),
      total_damage: MathEngine.round(baseDamage),
      
      // Fee breakdown
      fees_subtotal: MathEngine.round(fees_subtotal),
      fees_vat: MathEngine.round(fees_vat),
      fees_total: MathEngine.round(fees_total),
      
      // Depreciation
      depreciation_amount: MathEngine.round(depreciation_amount),
      depreciation_percent,
      
      // VAT
      vat_rate: vatRate || _vatRate,
      vat_amount: MathEngine.calculateVatAmount(baseDamage, vatRate),
      
      // Final totals
      subtotal: MathEngine.round(baseDamage + fees_subtotal),
      grand_total: MathEngine.round(baseDamage + fees_subtotal + MathEngine.calculateVatAmount(baseDamage + fees_subtotal, vatRate))
    };
  }
};

export const calculate = (params) => {
  return MathEngine.calculateAll(params);
};

// Initialize VAT rate from sessionStorage on module load
const savedVAT = sessionStorage.getItem('globalVAT');
if (savedVAT && !isNaN(savedVAT)) {
  _vatRate = parseFloat(savedVAT);
}

console.log(`✅ math.js loaded with comprehensive calculation engine and VAT: ${_vatRate}%`);
