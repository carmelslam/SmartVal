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
  /**
   * Calculate damage percentage relative to vehicle market value
   * 
   * INSURANCE INDUSTRY LOGIC:
   * - Damage % = (Total Damage Cost ÷ Market Value) × 100
   * - Used to determine if vehicle is "total loss" (usually >75-80%)
   * - Critical for insurance claim processing and vehicle classification
   * 
   * ISRAELI INSURANCE CONTEXT:
   * - Total loss threshold typically 75-80% of market value
   * - Affects salvage value calculations and claim settlements
   * - Required for legal documentation in insurance claims
   * 
   * DATA SOURCES:
   * - totalDamage: Sum of all damage center costs (parts + labor + repairs)
   * - marketValue: From Levi Yitzhak valuation or manual assessment
   * 
   * EDGE CASES:
   * - Returns 0% if market value is 0 or negative (prevents division by zero)
   * - Returns 0% if total damage is 0 or negative
   * - Results rounded to 2 decimal places for accuracy
   * 
   * BUSINESS RULES:
   * - 0-25%: Minor damage, repair recommended
   * - 25-50%: Moderate damage, economic repair analysis needed
   * - 50-75%: Major damage, consider total loss
   * - 75%+: Likely total loss, salvage procedures
   * 
   * @param {number} totalDamage - Total cost of all damage (parts + labor + repairs)
   * @param {number} marketValue - Current market value of vehicle
   * @returns {number} Damage percentage (0-100+), rounded to 2 decimals
   * 
   * @example
   * // Minor damage scenario
   * const damage1 = MathEngine.computeDamagePercentage(5000, 50000);  // Returns: 10.00%
   * 
   * // Total loss scenario  
   * const damage2 = MathEngine.computeDamagePercentage(40000, 50000); // Returns: 80.00%
   * 
   * // Edge case: no market value
   * const damage3 = MathEngine.computeDamagePercentage(5000, 0);      // Returns: 0.00%
   */
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

  /**
   * Calculate total cost for a single damage center
   * 
   * BUSINESS LOGIC:
   * - Parts: Sum of all selected parts prices (from parts search or manual entry)
   * - Repairs: Sum of all repair work costs (bodywork, paint, structural fixes)
   * - Works: Sum of all labor costs (removal, installation, alignment)
   * 
   * VAT HANDLING:
   * - This function returns subtotal WITHOUT VAT
   * - VAT is applied separately using calculateVatAmount() or applyVAT()
   * - Current VAT rate sourced from admin hub → helper → session → default (18%)
   * 
   * DATA SOURCES:
   * - Parts: From parts search webhook results or manual part entries
   * - Repairs: From repairs module (bodywork, structural, cosmetic)
   * - Works: From works module (labor hours × hourly rates)
   * 
   * EDGE CASES:
   * - Empty arrays default to ₪0 cost
   * - Invalid/missing prices treated as ₪0
   * - Results rounded to 2 decimal places for currency accuracy
   * 
   * INTEGRATION POINTS:
   * - Used by wizard summary calculations in damage-centers-wizard.html
   * - Feeds into final report totals in estimate/final report builders
   * - Referenced by depreciation calculations in depreciation module
   * - Drives real-time subtotal updates in wizard interface
   * 
   * @param {Object} damageCenter - Damage center with parts[], repairs[], works[] arrays
   * @returns {number} Total cost before VAT, rounded to 2 decimal places
   * 
   * @example
   * // Damage center with mixed costs
   * const center = {
   *   parts: [{price: 150}, {price: 75}],      // ₪225 parts total
   *   repairs: [{cost: 300}, {cost: 200}],     // ₪500 repairs total  
   *   works: [{cost: 120}, {cost: 80}]         // ₪200 works total
   * };
   * // Returns: 925.00 (₪225 + ₪500 + ₪200)
   * const total = MathEngine.calculateDamageCenterTotal(center);
   */
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

  /**
   * Calculate VAT amount based on subtotal and rate
   * 
   * VAT RATE HIERARCHY (in order of priority):
   * 1. Provided vatRate parameter (function argument)
   * 2. Admin Hub VAT rate (_adminHubVatRate)
   * 3. Session storage 'globalVAT'
   * 4. Default system rate (18%)
   * 
   * ISRAELI BUSINESS CONTEXT:
   * - Standard VAT rate in Israel is 17-18%
   * - Rate can be overridden by admin for special cases
   * - Some services may be VAT-exempt (rate = 0)
   * 
   * CALCULATION METHOD:
   * - Formula: (subtotal × VAT_rate) / 100
   * - Example: ₪1000 × 18% = ₪180 VAT
   * - Result rounded to 2 decimal places
   * 
   * INTEGRATION:
   * - Used by all total calculations across the system
   * - Synchronized with admin hub VAT settings
   * - Applied to damage centers, fees, and final reports
   * 
   * @param {number} subtotal - Amount before VAT (in NIS)
   * @param {number} [vatRate] - Optional VAT rate override (0-100)
   * @returns {number} VAT amount in NIS, rounded to 2 decimals
   * 
   * @example
   * // Standard 18% VAT calculation
   * const vat = MathEngine.calculateVatAmount(1000, 18);  // Returns: 180.00
   * 
   * // Using system default rate
   * const vat2 = MathEngine.calculateVatAmount(500);      // Returns: 90.00 (if default is 18%)
   * 
   * // VAT-exempt calculation
   * const vat3 = MathEngine.calculateVatAmount(1000, 0);  // Returns: 0.00
   */
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

  // Session-only VAT rate update (does NOT update admin hub core rate)
  setSessionVatRate(rate) {
    if (typeof rate === 'number' && rate >= 0 && rate <= 100) {
      _vatRate = rate;
      // Keep admin hub cache but don't update core admin rate
      sessionStorage.setItem('globalVAT', rate);
      console.log(`🎯 Session VAT rate updated to ${rate}% (admin hub core rate preserved)`);
      
      // Update Helper only
      if (window.Helper?.updateMeta) {
        Helper.updateMeta({ global_vat: rate });
      }
      
      // Broadcast to other modules (but not admin hub)
      if (typeof window.refreshHelperVatRate === 'function') {
        window.refreshHelperVatRate();
      }
    }
  },

  // Load VAT rate from admin hub
  loadAdminHubVatRate() {
    // First, try to get VAT rate from helper data structure
    try {
      const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
      
      // Priority 1: calculations.vat_rate
      if (helper.calculations && helper.calculations.vat_rate) {
        const vatRate = parseFloat(helper.calculations.vat_rate);
        console.log('📊 Using VAT rate from calculations.vat_rate:', vatRate);
        return vatRate;
      }
      
      // Priority 2: estimate.summary.vat_rate.current
      if (helper.estimate && helper.estimate.summary && 
          helper.estimate.summary.vat_rate && 
          helper.estimate.summary.vat_rate.current !== undefined) {
        const vatRate = parseFloat(helper.estimate.summary.vat_rate.current);
        console.log('📊 Using VAT rate from estimate.summary.vat_rate.current:', vatRate);
        return vatRate;
      }
      
      // Priority 3: estimate.summary.vat_rate (direct)
      if (helper.estimate && helper.estimate.summary && helper.estimate.summary.vat_rate) {
        const vatRate = parseFloat(helper.estimate.summary.vat_rate);
        console.log('📊 Using VAT rate from estimate.summary.vat_rate:', vatRate);
        return vatRate;
      }
    } catch (e) {
      console.warn('Could not get VAT rate from helper data:', e);
    }
    
    // Check for admin hub communication methods
    if (window.parent && window.parent !== window) {
      // We're in an iframe, try to communicate with parent (admin hub)
      try {
        // Check if we have a stored VAT rate to avoid the timeout
        const storedVat = sessionStorage.getItem('globalVAT');
        if (storedVat) {
          console.log('📊 Using stored VAT rate instead of parent communication:', storedVat);
          return parseFloat(storedVat);
        }
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

  /**
   * Comprehensive calculation engine for all report values
   * 
   * MASTER CALCULATION WORKFLOW:
   * 1. Damage percentage calculation (damage ÷ market value)
   * 2. Fee calculations (travel + media + office + VAT)
   * 3. Total compensation (damage - depreciation + fees)
   * 4. VAT application across all components
   * 5. Final totals and breakdowns for reports
   * 
   * ISRAELI INSURANCE/LEGAL CONTEXT:
   * - Follows Israeli insurance claim calculation standards
   * - Supports both private and company VAT scenarios
   * - Handles שבח (capital gains) adjustments for vehicle valuations
   * - Provides complete audit trail for legal documentation
   * 
   * VALUE HIERARCHY:
   * - vehicleValueGross: Pure vehicle value (for damage %)
   * - marketValue: Market value after adjustments (for final calculations)
   * - Damage centers total becomes baseDamage input
   * 
   * COMPLEX BUSINESS LOGIC:
   * - Depreciation reduces final compensation
   * - Fees add to total but have separate VAT treatment
   * - Different VAT rates may apply to different components
   * - Results used across estimate, final, and legal reports
   * 
   * @param {Object} params - Calculation parameters
   * @param {number} params.baseDamage - Total damage from all centers
   * @param {number} params.depreciation - Depreciation amount to subtract
   * @param {Object} params.fees - Fee object {travel_fee, media_fee, office_fee}
   * @param {number} params.marketValue - Current market value (post-adjustments)
   * @param {number} params.vehicleValueGross - Original vehicle value (pre-adjustments)
   * @param {number} params.shavehPercent - Capital gains percentage for calculation
   * @param {number} params.vatRate - VAT rate override (optional)
   * @returns {Object} Comprehensive calculation results with all breakdowns
   * 
   * @example
   * // Complete damage calculation
   * const results = MathEngine.calculateAll({
   *   baseDamage: 15000,      // From damage centers total
   *   depreciation: 2000,     // Calculated depreciation
   *   fees: {                 // Assessor fees
   *     travel_fee: 200,
   *     media_fee: 150,
   *     office_fee: 300
   *   },
   *   marketValue: 45000,     // After Levi adjustments
   *   vehicleValueGross: 50000, // Before adjustments
   *   shavehPercent: 5,       // Capital gains
   *   vatRate: 18             // VAT rate
   * });
   * // Returns: Complete breakdown with damage_percent, totals, VAT, etc.
   */
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
