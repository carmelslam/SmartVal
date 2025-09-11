// 🔄 Data Flow Standardization Module
// Unifies data structures across the entire system

// ============================================================================
// UNIFIED DATA SCHEMA DEFINITIONS
// ============================================================================

export const UNIFIED_SCHEMAS = {
  // Vehicle Information - Single Source of Truth
  vehicle: {
    // Basic Vehicle Info
    plate: '',
    manufacturer: '',
    model: '',
    model_code: '',
    model_type: '',
    trim: '',
    year: '',
    chassis: '',
    
    // Technical Specs
    engine_volume: '',
    fuel_type: '',
    transmission: '',
    is_automatic: false,
    drive_type: '',
    km: '',
    
    // Registration & Legal
    office_code: '',
    ownership_type: '',
    registration_date: '',
    category: '',
    
    // Business Data
    features: '',
    condition: '',
    market_value: 0,
    
    // Timestamps
    created_at: '',
    updated_at: ''
  },

  // Case Management - Meta Information
  case_info: {
    case_id: '',
    plate: '',
    status: 'active',
    
    // Dates
    damage_date: '',
    inspection_date: '',
    submission_date: '',
    created_at: '',
    
    // Location & Context
    inspection_location: '',
    damage_type: '',
    
    // Report Configuration - Dynamic based on current stage
    report_type: '',           // Empty for expertise stage
    report_type_display: ''    // Empty for expertise stage
  },

  // Client & Stakeholder Information
  stakeholders: {
    // Vehicle Owner
    owner: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    
    // Garage Information
    garage: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    },
    
    // Insurance Details
    insurance: {
      company: '',
      email: '',
      policy_number: '',
      claim_number: '',
      agent: {
        name: '',
        phone: '',
        email: ''
      }
    }
  },

  // Damage Assessment - Unified Structure
  damage_assessment: {
    // Global Damage Info
    summary: {
      total_damage_amount: 0,
      damage_percentage: 0,
      is_total_loss: false,
      classification: '', // 'repairable', 'total_loss', 'write_off'
      assessment_notes: ''
    },
    
    // Damage Centers (Unified from damage_blocks and damage_centers)
    centers: [
      // {
      //   id: '',
      //   location: '', // 'front', 'rear', 'left_front', etc.
      //   description: '',
      //   severity: '', // 'light', 'medium', 'severe'
      //   
      //   parts: [
      //     {
      //       name: '',
      //       description: '',
      //       part_number: '',
      //       source: '', // 'original', 'aftermarket', 'used'
      //       condition: '', // 'new', 'repair', 'replace'
      //       price: 0,
      //       currency: 'ILS',
      //       supplier: ''
      //     }
      //   ],
      //   
      //   repairs: [
      //     {
      //       name: '',
      //       description: '',
      //       type: '', // 'paint', 'mechanical', 'electrical', etc.
      //       cost: 0,
      //       hours: 0,
      //       notes: ''
      //     }
      //   ],
      //   
      //   works: [
      //     {
      //       type: '',
      //       description: '',
      //       notes: '',
      //       required: true
      //     }
      //   ],
      //   
      //   depreciation: {
      //     percentage: 0,
      //     amount: 0,
      //     reason: ''
      //   }
      // }
    ]
  },

  // Vehicle Valuation - Unified Levi Data
  valuation: {
    // Source Information
    source: '', // 'levi_yitzhak', 'manual', 'other'
    report_date: '',
    valuation_date: '',
    
    // Base Valuation
    base_price: 0,
    final_price: 0,
    currency: 'ILS',
    
    // Market Analysis
    market_conditions: '',
    comparable_vehicles: [],
    
    // Adjustments
    adjustments: {
      registration: { percent: 0, amount: 0, reason: '' },
      mileage: { percent: 0, amount: 0, reason: '' },
      condition: { percent: 0, amount: 0, reason: '' },
      ownership_history: { percent: 0, amount: 0, reason: '' },
      features: { percent: 0, amount: 0, reason: '' },
      market_factors: { percent: 0, amount: 0, reason: '' }
    },
    
    // Depreciation
    depreciation: {
      global_percentage: 0,
      global_amount: 0,
      work_days_impact: 0,
      total_depreciation: 0
    }
  },

  // Financial Calculations - Unified Structure
  financials: {
    // Cost Breakdown
    costs: {
      parts_total: 0,
      repairs_total: 0,
      works_total: 0,
      subtotal: 0
    },
    
    // Fees
    fees: {
      photography: { count: 0, unit_price: 0, total: 0 },
      office: { fixed_fee: 0, percentage: 0, total: 0 },
      travel: { count: 0, unit_price: 0, total: 0 },
      assessment: { hours: 0, hourly_rate: 0, total: 0 },
      subtotal: 0
    },
    
    // Taxes
    taxes: {
      vat_percentage: 18,
      vat_amount: 0
    },
    
    // Final Totals
    totals: {
      before_tax: 0,
      after_tax: 0,
      total_compensation: 0,
      salvage_value: 0,
      net_settlement: 0
    },
    
    // Calculation Metadata
    calculation_date: '',
    calculation_method: '',
    overrides: []
  },

  // Parts Search Results - Enhanced Structure
  parts_search: {
    // Search history and context
    search_history: [
      // {
      //   query: { plate: '', manufacturer: '', model: '', part_group: '', part_name: '', free_query: '' },
      //   timestamp: '',
      //   results_count: 0
      // }
    ],
    
    // All search results (including unselected)
    all_results: [
      // {
      //   name: '',
      //   description: '',
      //   price: 0,
      //   source: '',
      //   supplier: '',
      //   selected: false,
      //   search_timestamp: '',
      //   search_query: {},
      //   used_in_center: null,
      //   selected_timestamp: ''
      // }
    ],
    
    // Currently selected parts (for backward compatibility)
    results: [],
    
    // Summary statistics
    summary: {
      total_searches: 0,
      total_results: 0,
      selected_count: 0,
      last_search: ''
    }
  },

  // Document Management
  documents: {
    images: [],
    invoices: [],
    reports: [],
    pdfs: [],
    other_files: []
  },

  // System Metadata
  system: {
    version: '1.0.0',
    last_updated: '',
    processing_history: [],
    validation_status: {
      vehicle: false,
      damage: false,
      valuation: false,
      financials: false
    },
    
    // Integration Status
    integrations: {
      levi_processed: false,
      invoices_processed: false,
      images_uploaded: false,
      estimate_generated: false
    }
  }
};

// ============================================================================
// DATA MIGRATION & STANDARDIZATION FUNCTIONS
// ============================================================================

export class DataFlowStandardizer {
  constructor() {
    this.migrationLog = [];
    this.validationErrors = [];
  }

  // Main standardization function
  standardizeHelper(oldHelper) {
    this.log('Starting data standardization process');
    
    const standardized = this.createEmptyStandardSchema();
    
    try {
      // Migrate vehicle data
      this.migrateVehicleData(oldHelper, standardized);
      
      // Migrate case information
      this.migrateCaseInfo(oldHelper, standardized);
      
      // Migrate stakeholder data
      this.migrateStakeholderData(oldHelper, standardized);
      
      // Migrate damage assessment
      this.migrateDamageAssessment(oldHelper, standardized);
      
      // Migrate valuation data
      this.migrateValuationData(oldHelper, standardized);
      
      // Migrate financial data
      this.migrateFinancialData(oldHelper, standardized);
      
      // Migrate documents
      this.migrateDocuments(oldHelper, standardized);
      
      // Migrate parts search data
      this.migratePartsSearchData(oldHelper, standardized);
      
      // Set system metadata
      this.setSystemMetadata(standardized);
      
      this.log('Data standardization completed successfully');
      return standardized;
      
    } catch (error) {
      this.log(`Standardization error: ${error.message}`, 'error');
      throw error;
    }
  }

  createEmptyStandardSchema() {
    return JSON.parse(JSON.stringify(UNIFIED_SCHEMAS));
  }

  migrateVehicleData(oldHelper, standardized) {
    this.log('Migrating vehicle data');
    
    // Merge from multiple sources: vehicle, car_details, meta
    const sources = [
      oldHelper.vehicle || {},
      oldHelper.car_details || {},
      oldHelper.meta || {}
    ];
    
    const vehicle = standardized.vehicle;
    
    // Basic vehicle info
    const rawPlate = this.getFirstValid(sources, ['plate', 'plate_number']) || '';
    vehicle.plate = rawPlate ? String(rawPlate).replace(/[-\s]/g, '') : '';  // CRITICAL FIX: Standardize plate
    vehicle.manufacturer = this.getFirstValid(sources, ['manufacturer']) || '';
    vehicle.model = this.getFirstValid(sources, ['model']) || '';
    vehicle.model_code = this.getFirstValid(sources, ['model_code']) || '';
    vehicle.model_type = this.getFirstValid(sources, ['model_type']) || '';
    vehicle.trim = this.getFirstValid(sources, ['trim']) || '';
    vehicle.year = this.getFirstValid(sources, ['year']) || '';
    vehicle.chassis = this.getFirstValid(sources, ['chassis']) || '';
    
    // Technical specs
    vehicle.engine_volume = this.getFirstValid(sources, ['engine_volume']) || '';
    vehicle.fuel_type = this.getFirstValid(sources, ['fuel_type']) || '';
    vehicle.transmission = this.getFirstValid(sources, ['transmission']) || '';
    vehicle.is_automatic = this.getFirstValid(sources, ['is_automatic']) || false;
    vehicle.drive_type = this.getFirstValid(sources, ['drive_type', 'drive']) || '';
    vehicle.km = this.getFirstValid(sources, ['km', 'odo']) || '';
    
    // Registration & legal
    vehicle.office_code = this.getFirstValid(sources, ['office_code']) || '';
    vehicle.ownership_type = this.getFirstValid(sources, ['ownership_type', 'ownership']) || '';
    vehicle.registration_date = this.getFirstValid(sources, ['registration_date']) || '';
    vehicle.category = this.getFirstValid(sources, ['category']) || '';
    
    // Business data
    vehicle.features = this.getFirstValid(sources, ['features']) || '';
    vehicle.market_value = this.getFirstValid(sources, ['market_value', 'base_price']) || 0;
    
    // Set timestamps
    vehicle.updated_at = new Date().toISOString();
    
    this.log(`Vehicle data migrated: ${vehicle.plate} ${vehicle.manufacturer} ${vehicle.model}`);
  }

  migrateCaseInfo(oldHelper, standardized) {
    this.log('Migrating case information');
    
    const meta = oldHelper.meta || {};
    const caseInfo = standardized.case_info;
    
    const rawCasePlate = meta.plate || 'UNKNOWN';
    const standardizedCasePlate = rawCasePlate ? String(rawCasePlate).replace(/[-\s]/g, '') : 'UNKNOWN';  // CRITICAL FIX: Standardize plate
    caseInfo.case_id = meta.case_id || `YC-${standardizedCasePlate}-${new Date().getFullYear()}`;
    caseInfo.plate = standardizedCasePlate;
    caseInfo.status = meta.status || 'active';
    
    // Dates
    // CRITICAL FIX: damage_date should NEVER be auto-populated from case opening
    caseInfo.damage_date = '';  // Always empty until user enters in general info
    caseInfo.inspection_date = meta.inspection_date || '';
    caseInfo.submission_date = meta.submission_date || '';
    caseInfo.created_at = meta.created_at || new Date().toISOString();
    
    // Location & context
    caseInfo.inspection_location = meta.inspection_location || meta.location || '';
    caseInfo.damage_type = meta.damage_type || meta.damageType || '';
    
    // Report configuration
    // CRITICAL FIX: report_type should be dynamic based on current stage
    caseInfo.report_type = meta.report_type || '';        // Empty for expertise stage
    caseInfo.report_type_display = meta.report_type_display || '';  // Empty for expertise stage
    
    this.log(`Case info migrated: ${caseInfo.case_id}`);
  }

  migrateStakeholderData(oldHelper, standardized) {
    this.log('Migrating stakeholder data');
    
    const meta = oldHelper.meta || {};
    const client = oldHelper.client || {};
    const stakeholders = standardized.stakeholders;
    
    // Owner information
    stakeholders.owner.name = meta.owner_name || client.name || '';
    stakeholders.owner.address = meta.address || client.address || '';
    stakeholders.owner.phone = meta.phone || meta.ownerPhone || client.phone_number || '';
    stakeholders.owner.email = meta.owner_email || '';
    
    // Garage information
    stakeholders.garage.name = meta.garage || meta.garageName || '';
    stakeholders.garage.phone = meta.garage_phone || meta.garagePhone || '';
    stakeholders.garage.email = meta.garage_email || meta.garageEmail || '';
    
    // Insurance information
    stakeholders.insurance.company = meta.insurance_company || client.insurance_company || '';
    stakeholders.insurance.email = meta.insurance_email || client.insurance_email || '';
    stakeholders.insurance.agent.name = meta.insurance_agent || client.insurance_agent || '';
    stakeholders.insurance.agent.phone = meta.insurance_agent_phone || client.insurance_agent_phone || '';
    stakeholders.insurance.agent.email = meta.insurance_agent_email || client.insurance_agent_email || '';
    
    this.log('Stakeholder data migrated');
  }

  migrateDamageAssessment(oldHelper, standardized) {
    this.log('Migrating damage assessment data');
    
    const expertise = oldHelper.expertise || {};
    const damageAssessment = standardized.damage_assessment;
    
    // Migrate damage summary
    const calculations = expertise.calculations || {};
    damageAssessment.summary.total_damage_amount = parseFloat(calculations.total_damage) || 0;
    damageAssessment.summary.damage_percentage = parseFloat(calculations.damage_percent) || 0;
    damageAssessment.summary.assessment_notes = expertise.description || '';
    
    // Migrate damage centers (from both damage_blocks and damage_centers)
    const damageBlocks = expertise.damage_blocks || [];
    const damageCenters = oldHelper.damage_centers || [];
    
    // Combine and standardize damage centers
    const allCenters = [...damageBlocks, ...damageCenters];
    
    damageAssessment.centers = allCenters.map((center, index) => {
      return {
        id: `center_${index + 1}`,
        location: center.center || center.location || '',
        description: center.description || '',
        severity: center.severity || 'medium',
        
        parts: (center.parts || []).map(part => ({
          name: part.name || '',
          description: part.description || part.desc || '',
          part_number: part.part_number || part.oem_code || '',
          source: part.source || 'aftermarket',
          condition: part.condition || 'replace',
          price: parseFloat(part.price) || 0,
          currency: 'ILS',
          supplier: part.supplier || ''
        })),
        
        repairs: (center.repairs || []).map(repair => ({
          name: repair.name || '',
          description: repair.description || repair.desc || '',
          type: repair.type || 'general',
          cost: parseFloat(repair.cost) || 0,
          hours: parseFloat(repair.hours) || 0,
          notes: repair.notes || ''
        })),
        
        works: (center.works || []).map(work => ({
          type: work.type || '',
          description: work.description || work.note || '',
          notes: work.notes || '',
          required: work.required !== false
        })),
        
        depreciation: {
          percentage: parseFloat(center.depreciation) || 0,
          amount: parseFloat(center.depreciation_amount) || 0,
          reason: center.depreciation_reason || ''
        }
      };
    });
    
    this.log(`Damage assessment migrated: ${damageAssessment.centers.length} centers`);
  }

  migrateValuationData(oldHelper, standardized) {
    this.log('Migrating valuation data');
    
    const leviSummary = oldHelper.levisummary || {};
    const leviReport = oldHelper.expertise?.levi_report || {};
    const valuation = standardized.valuation;
    
    // 🚨 CRITICAL FIX: Correct levisummary values from raw webhook data if they're "₪0"
    const correctedLeviSummary = this.correctLeviSummaryValues(leviSummary, oldHelper);
    
    // Merge both sources
    const leviData = { ...leviReport, ...correctedLeviSummary };
    
    valuation.source = leviData.source || 'levi_yitzhak';
    valuation.report_date = leviData.report_date || '';
    valuation.valuation_date = leviData.valuation_date || new Date().toISOString().split('T')[0];
    
    // Pricing
    valuation.base_price = parseFloat(leviData.base_price) || 0;
    valuation.final_price = parseFloat(leviData.final_price) || 0;
    valuation.currency = 'ILS';
    
    // Adjustments
    const adjustments = leviData.adjustments || {};
    Object.keys(valuation.adjustments).forEach(key => {
      const adjustment = adjustments[key] || {};
      valuation.adjustments[key] = {
        percent: parseFloat(adjustment.percent) || 0,
        amount: parseFloat(adjustment.value || adjustment.amount) || 0,
        reason: adjustment.reason || adjustment.type || adjustment.description || ''
      };
    });
    
    // Depreciation
    const depreciation = oldHelper.expertise?.depreciation || {};
    valuation.depreciation.global_percentage = parseFloat(depreciation.global_percent) || 0;
    valuation.depreciation.global_amount = parseFloat(depreciation.global_amount) || 0;
    valuation.depreciation.work_days_impact = parseFloat(depreciation.work_days) || 0;
    
    this.log(`Valuation data migrated: ${valuation.base_price} -> ${valuation.final_price}`);
  }

  // 🚨 NEW: Fix levisummary values that are incorrectly set to "₪0"
  correctLeviSummaryValues(leviSummary, helper) {
    this.log('Correcting leviSummary values from raw webhook data');
    
    // Look for raw webhook data that contains the actual values
    const rawWebhookKeys = Object.keys(helper).filter(key => 
      key.startsWith('raw_webhook_data.SUBMIT_LEVI_REPORT_')
    );
    
    if (rawWebhookKeys.length === 0) {
      this.log('No raw webhook data found, returning original leviSummary');
      return leviSummary;
    }
    
    // Get the most recent webhook data
    const latestWebhookKey = rawWebhookKeys.sort().pop();
    const rawWebhookData = helper[latestWebhookKey];
    
    if (!rawWebhookData || !rawWebhookData.data) {
      this.log('Raw webhook data has no data field, returning original leviSummary');
      return leviSummary;
    }
    
    const rawData = rawWebhookData.data;
    this.log('Found raw webhook data:', rawData);
    
    // Create corrected copy
    const corrected = JSON.parse(JSON.stringify(leviSummary));
    
    // Check if adjustments have "₪0" values and try to extract correct values from raw data
    if (corrected.adjustments) {
      Object.keys(corrected.adjustments).forEach(adjustmentType => {
        const adjustment = corrected.adjustments[adjustmentType];
        
        // If amount or cumulative is "₪0", try to extract from raw data
        if (adjustment.amount === '₪0' || adjustment.cumulative === '₪0') {
          const correctedValues = this.extractAdjustmentValues(adjustmentType, rawData);
          
          if (correctedValues.amount && correctedValues.amount !== '₪0') {
            adjustment.amount = correctedValues.amount;
            this.log(`Corrected ${adjustmentType} amount: ${correctedValues.amount}`);
          }
          
          if (correctedValues.cumulative && correctedValues.cumulative !== '₪0') {
            adjustment.cumulative = correctedValues.cumulative;
            this.log(`Corrected ${adjustmentType} cumulative: ${correctedValues.cumulative}`);
          }
        }
      });
    }
    
    return corrected;
  }
  
  // Extract adjustment values from raw Hebrew webhook text
  extractAdjustmentValues(adjustmentType, rawData) {
    const result = { amount: null, cumulative: null };
    
    // Convert raw data to string for text parsing
    const text = JSON.stringify(rawData);
    
    // Define Hebrew field mappings
    const fieldMappings = {
      features: {
        amount: /ערך ש״ח מאפיינים[:\s]*([₪\s\d,.-]+)/i,
        cumulative: /שווי מצטבר מאפיינים[:\s]*([₪\s\d,.-]+)/i
      },
      registration: {
        amount: /ערך ש״ח עליה לכביש[:\s]*([₪\s\d,.-]+)/i,
        cumulative: /שווי מצטבר עליה לכביש[:\s]*([₪\s\d,.-]+)/i
      },
      ownership_type: {
        amount: /ערך ש״ח בעלות[:\s]*([₪\s\d,.-]+)/i,
        cumulative: /שווי מצטבר בעלות[:\s]*([₪\s\d,.-]+)/i
      },
      mileage: {
        amount: /ערך ש״ח מס ק״מ[:\s]*([₪\s\d,.-]+)/i,
        cumulative: /שווי מצטבר מס ק״מ[:\s]*([₪\s\d,.-]+)/i
      },
      ownership_history: {
        amount: /ערך ש״ח מספר בעלים[:\s]*([₪\s\d,.-]+)/i,
        cumulative: /שווי מצטבר מספר בעלים[:\s]*([₪\s\d,.-]+)/i
      }
    };
    
    const patterns = fieldMappings[adjustmentType];
    if (!patterns) {
      return result;
    }
    
    // Extract amount
    const amountMatch = text.match(patterns.amount);
    if (amountMatch && amountMatch[1]) {
      result.amount = amountMatch[1].trim();
    }
    
    // Extract cumulative
    const cumulativeMatch = text.match(patterns.cumulative);
    if (cumulativeMatch && cumulativeMatch[1]) {
      result.cumulative = cumulativeMatch[1].trim();
    }
    
    return result;
  }

  migrateFinancialData(oldHelper, standardized) {
    this.log('Migrating financial data');
    
    const invoice = oldHelper.invoice || {};
    const fees = oldHelper.fees || {};
    const calculations = oldHelper.expertise?.calculations || {};
    const financials = standardized.financials;
    
    // Cost breakdown
    financials.costs.parts_total = parseFloat(invoice.total_parts) || 0;
    financials.costs.repairs_total = parseFloat(invoice.total_repairs) || 0;
    financials.costs.works_total = parseFloat(invoice.total_works) || 0;
    financials.costs.subtotal = parseFloat(invoice.subtotal) || 0;
    
    // Fees
    financials.fees.photography.total = parseFloat(fees.photos) || 0;
    financials.fees.office.total = parseFloat(fees.office) || 0;
    financials.fees.travel.total = parseFloat(fees.travel) || 0;
    financials.fees.subtotal = parseFloat(fees.subtotal) || 0;
    
    // Taxes
    financials.taxes.vat_percentage = parseFloat(fees.vat_percent) || 18;
    financials.taxes.vat_amount = parseFloat(invoice.vat) || 0;
    
    // Totals
    financials.totals.before_tax = parseFloat(calculations.subtotal) || 0;
    financials.totals.after_tax = parseFloat(calculations.grand_total) || parseFloat(invoice.total) || 0;
    financials.totals.total_compensation = parseFloat(calculations.total_compensation) || 0;
    
    financials.calculation_date = new Date().toISOString();
    
    this.log('Financial data migrated');
  }

  migrateDocuments(oldHelper, standardized) {
    this.log('Migrating document data');
    
    const documents = standardized.documents;
    
    // Images
    documents.images = oldHelper.images || [];
    
    // Invoices
    documents.invoices = oldHelper.invoices || [];
    
    // Other documents
    documents.reports = [];
    documents.pdfs = [];
    documents.other_files = [];
    
    this.log(`Documents migrated: ${documents.images.length} images, ${documents.invoices.length} invoices`);
  }

  migratePartsSearchData(oldHelper, standardized) {
    this.log('Migrating parts search data');
    
    const partsSearch = standardized.parts_search;
    const oldPartsSearch = oldHelper.parts_search || {};
    
    // Migrate search history
    partsSearch.search_history = oldPartsSearch.search_history || [];
    
    // Migrate all results (enhanced structure)
    partsSearch.all_results = oldPartsSearch.all_results || [];
    
    // Migrate legacy results to all_results if not present
    if (partsSearch.all_results.length === 0 && oldPartsSearch.results) {
      partsSearch.all_results = oldPartsSearch.results.map(result => ({
        name: result.name || '',
        description: result.description || result.desc || '',
        price: parseFloat(result.price) || 0,
        source: result.source || '',
        supplier: result.supplier || '',
        selected: true, // Legacy results were selected
        search_timestamp: result.timestamp || new Date().toISOString(),
        search_query: {},
        used_in_center: null,
        selected_timestamp: result.timestamp || new Date().toISOString()
      }));
    }
    
    // Maintain backward compatibility
    partsSearch.results = oldPartsSearch.results || [];
    
    // Migrate summary
    partsSearch.summary = {
      total_searches: oldPartsSearch.summary?.total_searches || partsSearch.search_history.length,
      total_results: oldPartsSearch.summary?.total_results || partsSearch.all_results.length,
      selected_count: oldPartsSearch.summary?.selected_count || partsSearch.results.length,
      last_search: oldPartsSearch.summary?.last_search || oldPartsSearch.summary?.last_updated || ''
    };
    
    this.log(`Parts search data migrated: ${partsSearch.all_results.length} total results, ${partsSearch.results.length} selected`);
  }

  setSystemMetadata(standardized) {
    const system = standardized.system;
    
    system.version = '1.0.0';
    system.last_updated = new Date().toISOString();
    system.processing_history = this.migrationLog.slice();
    
    // Set validation status based on data availability
    system.validation_status.vehicle = !!standardized.vehicle.plate;
    system.validation_status.damage = standardized.damage_assessment.centers.length > 0;
    system.validation_status.valuation = !!standardized.valuation.final_price;
    system.validation_status.financials = !!standardized.financials.totals.after_tax;
    
    // Set integration status
    system.integrations.levi_processed = !!standardized.valuation.final_price;
    system.integrations.invoices_processed = standardized.documents.invoices.length > 0;
    system.integrations.images_uploaded = standardized.documents.images.length > 0;
    
    this.log('System metadata set');
  }

  // Helper functions
  getFirstValid(sources, fieldNames) {
    for (const source of sources) {
      for (const fieldName of fieldNames) {
        if (source[fieldName] !== undefined && source[fieldName] !== null && source[fieldName] !== '') {
          return source[fieldName];
        }
      }
    }
    return null;
  }

  log(message, type = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    
    this.migrationLog.push(logEntry);
    
    if (type === 'error') {
      console.error(`[DataStandardizer] ${message}`);
    } else {
      console.log(`[DataStandardizer] ${message}`);
    }
  }

  // Validation functions
  validateStandardizedData(data) {
    this.validationErrors = [];
    
    this.validateVehicle(data.vehicle);
    this.validateCaseInfo(data.case_info);
    this.validateDamageAssessment(data.damage_assessment);
    this.validateValuation(data.valuation);
    this.validateFinancials(data.financials);
    
    return {
      isValid: this.validationErrors.length === 0,
      errors: this.validationErrors,
      warnings: []
    };
  }

  validateVehicle(vehicle) {
    if (!vehicle.plate) {
      this.validationErrors.push('Vehicle plate number is required');
    }
    if (!vehicle.manufacturer) {
      this.validationErrors.push('Vehicle manufacturer is required');
    }
    if (!vehicle.model) {
      this.validationErrors.push('Vehicle model is required');
    }
  }

  validateCaseInfo(caseInfo) {
    if (!caseInfo.case_id) {
      this.validationErrors.push('Case ID is required');
    }
    if (!caseInfo.damage_date) {
      this.validationErrors.push('Damage date is required');
    }
  }

  validateDamageAssessment(damageAssessment) {
    if (damageAssessment.centers.length === 0) {
      this.validationErrors.push('At least one damage center is required');
    }
  }

  validateValuation(valuation) {
    if (!valuation.final_price || valuation.final_price <= 0) {
      this.validationErrors.push('Valid final price is required for valuation');
    }
  }

  validateFinancials(financials) {
    // Financial validation can be added here
  }
}

// ============================================================================
// INTEGRATION FUNCTIONS
// ============================================================================

// Function to standardize existing helper data
export function standardizeHelperData(oldHelper) {
  const standardizer = new DataFlowStandardizer();
  return standardizer.standardizeHelper(oldHelper);
}

// Function to convert standardized data back to legacy format (for compatibility)
export function convertToLegacyFormat(standardizedData) {
  const legacy = {
    meta: {
      case_id: standardizedData.case_info.case_id,
      plate: standardizedData.vehicle.plate,
      damage_date: standardizedData.case_info.damage_date,
      inspection_date: standardizedData.case_info.inspection_date,
      owner_name: standardizedData.stakeholders.owner.name,
      // ... other legacy mappings
    },
    
    vehicle: {
      plate_number: standardizedData.vehicle.plate,
      manufacturer: standardizedData.vehicle.manufacturer,
      model: standardizedData.vehicle.model,
      // ... other vehicle mappings
    },
    
    car_details: {
      plate: standardizedData.vehicle.plate,
      manufacturer: standardizedData.vehicle.manufacturer,
      model: standardizedData.vehicle.model,
      // ... other car details mappings
    },
    
    expertise: {
      damage_blocks: standardizedData.damage_assessment.centers.map(center => ({
        center: center.location,
        description: center.description,
        parts: center.parts,
        repairs: center.repairs,
        works: center.works
      })),
      levi_report: {
        base_price: standardizedData.valuation.base_price,
        final_price: standardizedData.valuation.final_price,
        // ... other levi mappings
      }
    },
    
    // Add other legacy structure mappings...
  };
  
  return legacy;
}

// Function to fix levisummary values that are incorrectly "₪0"
export function fixLeviSummaryValues(helper) {
  console.log('🔧 Fixing leviSummary values from raw webhook data');
  
  if (!helper.levisummary || !helper.levisummary.adjustments) {
    console.log('No levisummary.adjustments found, nothing to fix');
    return helper;
  }
  
  // Look for raw webhook data
  const rawWebhookKeys = Object.keys(helper).filter(key => 
    key.startsWith('raw_webhook_data.SUBMIT_LEVI_REPORT_')
  );
  
  if (rawWebhookKeys.length === 0) {
    console.log('No raw webhook data found for fixing values');
    return helper;
  }
  
  // Get the most recent webhook data
  const latestWebhookKey = rawWebhookKeys.sort().pop();
  const rawWebhookData = helper[latestWebhookKey];
  
  if (!rawWebhookData || !rawWebhookData.data) {
    console.log('Raw webhook data has no data field');
    return helper;
  }
  
  const rawData = rawWebhookData.data;
  console.log('Found raw webhook data for value correction:', rawData);
  
  // Create standardizer instance to use extraction methods
  const standardizer = new DataFlowStandardizer();
  
  // Fix each adjustment that has "₪0" values
  let fixed = false;
  Object.keys(helper.levisummary.adjustments).forEach(adjustmentType => {
    const adjustment = helper.levisummary.adjustments[adjustmentType];
    
    if (adjustment.amount === '₪0' || adjustment.cumulative === '₪0') {
      const correctedValues = standardizer.extractAdjustmentValues(adjustmentType, rawData);
      
      if (correctedValues.amount && correctedValues.amount !== '₪0') {
        adjustment.amount = correctedValues.amount;
        console.log(`✅ Fixed ${adjustmentType} amount: ${correctedValues.amount}`);
        fixed = true;
      }
      
      if (correctedValues.cumulative && correctedValues.cumulative !== '₪0') {
        adjustment.cumulative = correctedValues.cumulative;
        console.log(`✅ Fixed ${adjustmentType} cumulative: ${correctedValues.cumulative}`);
        fixed = true;
      }
    }
  });
  
  if (fixed) {
    console.log('✅ leviSummary values have been corrected from raw webhook data');
  } else {
    console.log('No leviSummary values needed correction');
  }
  
  return helper;
}

// Function to update existing helper with standardized data
export function updateHelperWithStandardizedData(helper, standardizedData) {
  // Perform selective updates to maintain compatibility
  
  // Update vehicle data
  Object.assign(helper.vehicle, {
    plate_number: standardizedData.vehicle.plate,
    manufacturer: standardizedData.vehicle.manufacturer,
    model: standardizedData.vehicle.model,
    year: standardizedData.vehicle.year,
    km: standardizedData.vehicle.km
  });
  
  // Update meta data
  Object.assign(helper.meta, {
    plate: standardizedData.vehicle.plate,
    case_id: standardizedData.case_info.case_id,
    damage_date: standardizedData.case_info.damage_date,
    inspection_date: standardizedData.case_info.inspection_date
  });
  
  // Update expertise data
  if (!helper.expertise) helper.expertise = {};
  helper.expertise.damage_blocks = standardizedData.damage_assessment.centers;
  
  // Update Levi data
  helper.levisummary = {
    base_price: standardizedData.valuation.base_price,
    final_price: standardizedData.valuation.final_price,
    adjustments: standardizedData.valuation.adjustments
  };
  
  return helper;
}

console.log('✅ Data Flow Standardizer loaded');