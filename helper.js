// 🧠 Centralized Helper System - Enhanced Data Capture Solution
// Handles ALL data flow: Make.com webhooks, manual inputs, multilingual support

console.log('🧠 Loading enhanced helper system...');

// 🛠️ UNIVERSAL SOLUTION: Duplicate Key JSON Parser
// Handles JSON objects with duplicate keys by preserving all values
function parseJSONWithDuplicates(jsonString) {
  if (typeof jsonString !== 'string') {
    return jsonString; // Already parsed object
  }

  const duplicateValues = new Map();
  
  // Find all duplicate key instances and preserve the most meaningful value
  const keyPattern = /"([^"]+)"\s*:\s*"([^"]*)"/g;
  let match;
  
  while ((match = keyPattern.exec(jsonString)) !== null) {
    const key = match[1];
    const value = match[2];
    
    if (duplicateValues.has(key)) {
      const existing = duplicateValues.get(key);
      // Choose the longer, more meaningful value
      if (value.length > existing.length && value !== key) {
        duplicateValues.set(key, value);
        console.log(`🔄 Duplicate key "${key}": choosing longer value "${value}" over "${existing}"`);
      }
    } else {
      duplicateValues.set(key, value);
    }
  }
  
  // Parse the JSON normally
  let parsedData;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (e) {
    console.error('❌ JSON parsing failed:', e);
    return {};
  }
  
  // Restore the better values for duplicate keys
  for (const [key, value] of duplicateValues) {
    if (parsedData[key] && parsedData[key] !== value && value.length > parsedData[key].length) {
      console.log(`🔧 Restoring duplicate key "${key}": "${parsedData[key]}" → "${value}"`);
      parsedData[key] = value;
      
      // For מאפיינים specifically, also store in features_text field
      if (key === 'מאפיינים' && value !== 'מאפיינים') {
        parsedData['מאפיינים_text'] = value;
        console.log(`🚗 Preserved features text as מאפיינים_text: "${value}"`);
      }
    }
  }
  
  return parsedData;
}

// ============================================================================
// 🏗️ DAMAGE CENTERS COMPREHENSIVE MANAGEMENT SYSTEM
// ============================================================================

/**
 * Create a new damage center with comprehensive tracking
 */
window.createDamageCenter = function(location = '', description = '', sourceData = {}) {
  console.log('🏗️ Creating comprehensive damage center...');
  
  if (!window.helper || !window.helper.damage_assessment) {
    console.error('❌ Helper or damage_assessment not initialized');
    return null;
  }
  
  const centerNumber = window.helper.damage_assessment.centers.length + 1;
  const centerId = `damage_center_${Date.now()}_${centerNumber}`;
  
  // Create comprehensive damage center structure
  const newCenter = {
    // Basic identification
    id: centerId,
    number: centerNumber,
    location: location,
    description: description,
    
    // Core data
    work_items: [],
    parts_items: [],
    repairs_items: [],
    attachments: [],
    images: [],
    
    // Comprehensive calculations
    calculations: {
      works_subtotal: 0,
      parts_subtotal: 0,
      repairs_subtotal: 0,
      fees_subtotal: 0,
      subtotal_before_vat: 0,
      vat_amount: 0,
      total_with_vat: 0,
      
      // Detailed breakdown
      breakdown: {
        labor_hours: 0,
        hourly_rate: 0,
        parts_count: 0,
        repairs_count: 0
      },
      
      // Manual adjustments
      adjustments: [],
      manual_overrides: [],
      
      // Calculation metadata
      last_calculated: new Date().toISOString(),
      calculation_method: 'auto',
      calculated_by: 'system'
    },
    
    // Integration data
    integrations: {
      parts_search: {
        linked_search_sessions: [],
        auto_populated_parts: [],
        manual_parts: [],
        rejected_suggestions: []
      },
      invoices: {
        linked_invoices: [],
        matched_items: [],
        unmatched_items: []
      },
      estimates: {
        included_in_estimates: [],
        estimate_line_items: []
      }
    },
    
    // Quality and validation
    validation: {
      is_complete: false,
      is_valid: false,
      validation_errors: [],
      validation_warnings: [],
      manual_reviews: [],
      reviewed_by: '',
      review_date: '',
      approval_status: 'pending'
    },
    
    // Workflow and status
    workflow: {
      status: 'draft', // draft, in_progress, review, approved, rejected
      current_step: 1,
      completed_steps: [],
      workflow_history: [],
      assigned_to: '',
      priority: 'normal'
    },
    
    // Source and provenance
    source: {
      created_by: sourceData.created_by || 'damage_centers_wizard',
      creation_method: sourceData.creation_method || 'wizard',
      source_document: sourceData.source_document || '',
      import_batch: sourceData.import_batch || '',
      data_sources: {
        manual_input: true,
        ocr_extracted: false,
        invoice_matched: false,
        estimate_imported: false
      }
    },
    
    // Timestamps and metadata
    timestamps: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: '',
      reviewed_at: '',
      approved_at: ''
    },
    
    // Additional metadata
    metadata: {
      version: '2.0.0',
      tags: [],
      notes: [],
      flags: [],
      custom_fields: {}
    }
  };
  
  // Add to centers array
  window.helper.damage_assessment.centers.push(newCenter);
  
  // Update session management
  window.helper.damage_assessment.current_session.active_center_id = centerId;
  window.helper.damage_assessment.current_session.center_count = centerNumber;
  window.helper.damage_assessment.current_session.last_activity = new Date().toISOString();
  
  // Update statistics
  window.helper.damage_assessment.statistics.total_centers = centerNumber;
  
  // Add audit trail entry
  window.helper.damage_assessment.audit_trail.push({
    action: 'center_created',
    center_id: centerId,
    timestamp: new Date().toISOString(),
    details: { location, description },
    user: sourceData.created_by || 'system'
  });
  
  console.log(`✅ Created comprehensive damage center #${centerNumber}:`, newCenter);
  return newCenter;
};

/**
 * Update damage center with comprehensive tracking
 */
window.updateDamageCenter = function(centerId, updates = {}) {
  console.log(`🔄 Updating damage center ${centerId}:`, updates);
  
  if (!window.helper || !window.helper.damage_assessment) {
    console.error('❌ Helper or damage_assessment not initialized');
    return false;
  }
  
  const center = window.helper.damage_assessment.centers.find(c => c.id === centerId);
  if (!center) {
    console.error(`❌ Damage center ${centerId} not found`);
    return false;
  }
  
  // Store original state for audit trail
  const originalState = JSON.parse(JSON.stringify(center));
  
  // Apply updates
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      // Handle nested updates
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        center[parent] = center[parent] || {};
        center[parent][child] = updates[key];
      } else {
        center[key] = updates[key];
      }
    }
  });
  
  // Update timestamps
  center.timestamps.updated_at = new Date().toISOString();
  
  // Add audit trail entry
  window.helper.damage_assessment.audit_trail.push({
    action: 'center_updated',
    center_id: centerId,
    timestamp: new Date().toISOString(),
    changes: updates,
    previous_state: originalState,
    user: updates.updated_by || 'system'
  });
  
  // Recalculate if needed
  if (updates.work_items || updates.parts_items || updates.repairs_items) {
    window.calculateDamageCenterTotals(centerId);
  }
  
  console.log(`✅ Updated damage center ${centerId}`);
  return true;
};

/**
 * Calculate comprehensive totals for a damage center
 */
window.calculateDamageCenterTotals = function(centerId) {
  console.log(`🧮 Calculating comprehensive totals for ${centerId}`);
  
  const center = window.helper.damage_assessment.centers.find(c => c.id === centerId);
  if (!center) {
    console.error(`❌ Damage center ${centerId} not found`);
    return false;
  }
  
  // Calculate subtotals
  const worksTotal = center.work_items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  const partsTotal = center.parts_items.reduce((sum, item) => sum + (parseFloat(item.price || item.cost) || 0), 0);
  const repairsTotal = center.repairs_items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  const feesTotal = 0; // Can be extended for additional fees
  
  const subtotalBeforeVat = worksTotal + partsTotal + repairsTotal + feesTotal;
  const vatPercentage = window.helper.damage_assessment.settings.default_vat_percentage || 17;
  const vatAmount = subtotalBeforeVat * (vatPercentage / 100);
  const totalWithVat = subtotalBeforeVat + vatAmount;
  
  // Update center calculations
  center.calculations = {
    ...center.calculations,
    works_subtotal: worksTotal,
    parts_subtotal: partsTotal,
    repairs_subtotal: repairsTotal,
    fees_subtotal: feesTotal,
    subtotal_before_vat: subtotalBeforeVat,
    vat_amount: vatAmount,
    total_with_vat: totalWithVat,
    
    breakdown: {
      labor_hours: center.work_items.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0),
      hourly_rate: center.work_items.length > 0 ? worksTotal / Math.max(1, center.work_items.reduce((sum, item) => sum + (parseFloat(item.hours) || 1), 0)) : 0,
      parts_count: center.parts_items.length,
      repairs_count: center.repairs_items.length
    },
    
    last_calculated: new Date().toISOString(),
    calculation_method: 'auto',
    calculated_by: 'system'
  };
  
  // Update global totals
  window.calculateAllDamageCentersTotals();
  
  console.log(`✅ Calculated comprehensive totals for ${centerId}:`, center.calculations);
  return center.calculations;
};

/**
 * Calculate global totals across all damage centers
 */
window.calculateAllDamageCentersTotals = function() {
  console.log('🧮 Calculating global damage centers totals');
  
  if (!window.helper || !window.helper.damage_assessment) {
    return false;
  }
  
  let totalSubtotal = 0;
  let totalVat = 0;
  let totalWithVat = 0;
  let breakdownTotals = {
    total_works: 0,
    total_parts: 0,
    total_repairs: 0,
    total_fees: 0
  };
  
  const byLocation = {};
  
  window.helper.damage_assessment.centers.forEach(center => {
    if (center.workflow?.status !== 'rejected' && center.calculations) {
      totalSubtotal += center.calculations.subtotal_before_vat || 0;
      totalVat += center.calculations.vat_amount || 0;
      totalWithVat += center.calculations.total_with_vat || 0;
      
      breakdownTotals.total_works += center.calculations.works_subtotal || 0;
      breakdownTotals.total_parts += center.calculations.parts_subtotal || 0;
      breakdownTotals.total_repairs += center.calculations.repairs_subtotal || 0;
      breakdownTotals.total_fees += center.calculations.fees_subtotal || 0;
      
      // Group by location
      const location = center.location || 'Unknown';
      byLocation[location] = (byLocation[location] || 0) + (center.calculations.total_with_vat || 0);
    }
  });
  
  // Update global totals
  window.helper.damage_assessment.totals = {
    all_centers_subtotal: totalSubtotal,
    all_centers_vat: totalVat,
    all_centers_total: totalWithVat,
    breakdown: breakdownTotals,
    by_location: byLocation,
    last_calculated: new Date().toISOString(),
    calculation_method: 'auto',
    manual_overrides: window.helper.damage_assessment.totals?.manual_overrides || []
  };
  
  // Update statistics
  const activeCenters = window.helper.damage_assessment.centers.filter(c => c.workflow?.status !== 'rejected');
  window.helper.damage_assessment.statistics.avg_cost_per_center = activeCenters.length > 0 ? totalWithVat / activeCenters.length : 0;
  window.helper.damage_assessment.statistics.most_expensive_center = activeCenters.reduce((max, center) => 
    (center.calculations?.total_with_vat || 0) > (max?.calculations?.total_with_vat || 0) ? center : max, null);
  
  console.log('✅ Global damage centers totals calculated:', window.helper.damage_assessment.totals);
  return window.helper.damage_assessment.totals;
};


// ============================================================================
// 🔒 PLATE NUMBER PROTECTION SYSTEM
// ============================================================================

/**
 * Centralized plate number management system - Single source of truth
 */
window.setPlateNumber = function(plateNumber, source = 'manual', protect = false) {
  console.log(`🔢 CENTRALIZED: Setting plate number "${plateNumber}" from source: ${source}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set plate number');
    return false;
  }
  
  // Clean and validate plate number format (Israeli 7-8 digits)
  // First, remove all dashes, spaces, and non-numeric characters
  const cleanedPlate = String(plateNumber).replace(/[-\s]/g, '');
  
  // Then validate it's 7-8 digits
  const plateMatch = cleanedPlate.match(/^(\d{7,8})$/);
  if (!plateMatch) {
    console.warn(`⚠️ Invalid plate format: "${plateNumber}" → "${cleanedPlate}" - must be 7-8 digits only`);
    return false;
  }
  
  const validatedPlate = plateMatch[1];
  
  // Log the transformation if dashes were removed
  if (plateNumber !== validatedPlate) {
    console.log(`🔢 NORMALIZED: Plate "${plateNumber}" → "${validatedPlate}" (removed dashes/spaces)`);
  }
  
  // If protection is enabled, check if we should protect this plate
  if (protect) {
    window.helper.meta.original_plate = validatedPlate;
    window.helper.meta.plate_locked = true;
    window.helper.meta.plate_protection_source = source;
    console.log(`🔒 PROTECTION: Plate "${validatedPlate}" is now protected from overwrites`);
  }
  
  // SINGLE SOURCE OF TRUTH: Store plate only in meta.plate
  window.helper.meta.plate = validatedPlate;
  
  // Remove duplicate storage - these will now reference meta.plate
  delete window.helper.vehicle?.plate;
  delete window.helper.case_info?.plate;
  
  // Update case_id dynamically
  const currentYear = new Date().getFullYear();
  const dynamicCaseId = `YC-${validatedPlate}-${currentYear}`;
  window.helper.meta.case_id = dynamicCaseId;
  window.helper.case_info.case_id = dynamicCaseId;
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CENTRALIZED: Plate "${validatedPlate}" set as single source of truth`);
  return true;
};

/**
 * Get plate number from single source of truth
 */
window.getPlateNumber = function() {
  return window.helper?.meta?.plate || '';
};

/**
 * Centralized owner name management system - Single source of truth
 */
window.setOwnerName = function(ownerName, source = 'manual') {
  console.log(`👤 CENTRALIZED: Setting owner name "${ownerName}" from source: ${source}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set owner name');
    return false;
  }
  
  if (!ownerName || ownerName.trim() === '') {
    console.warn('⚠️ Empty owner name provided - keeping existing value');
    return false;
  }
  
  const cleanedName = ownerName.trim();
  
  // SINGLE SOURCE OF TRUTH: Store owner only in stakeholders.owner.name
  if (!window.helper.stakeholders) window.helper.stakeholders = {};
  if (!window.helper.stakeholders.owner) window.helper.stakeholders.owner = {};
  
  window.helper.stakeholders.owner.name = cleanedName;
  
  // Remove duplicate storage - these will now reference stakeholders.owner.name
  delete window.helper.meta?.owner_name;
  delete window.helper.car_details?.owner;
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CENTRALIZED: Owner "${cleanedName}" set as single source of truth`);
  return true;
};

/**
 * Get owner name from single source of truth
 */
window.getOwnerName = function() {
  return window.helper?.stakeholders?.owner?.name || '';
};

/**
 * Centralized owner phone management system - Single source of truth
 */
window.setOwnerPhone = function(ownerPhone, source = 'manual') {
  console.log(`📞 CENTRALIZED: Setting owner phone "${ownerPhone}" from source: ${source}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set owner phone');
    return false;
  }
  
  if (!ownerPhone || ownerPhone.trim() === '') {
    console.warn('⚠️ Empty owner phone provided - keeping existing value');
    return false;
  }
  
  const cleanedPhone = ownerPhone.trim();
  
  // VALIDATION: Prevent owner names from being assigned to phone field
  const currentOwnerName = window.helper?.stakeholders?.owner?.name;
  if (currentOwnerName && cleanedPhone === currentOwnerName) {
    console.warn('🚫 BLOCKED: Preventing owner name from being assigned to phone field:', cleanedPhone);
    return false;
  }
  
  // SINGLE SOURCE OF TRUTH: Store owner phone only in stakeholders.owner.phone
  if (!window.helper.stakeholders) window.helper.stakeholders = {};
  if (!window.helper.stakeholders.owner) window.helper.stakeholders.owner = {};
  
  window.helper.stakeholders.owner.phone = cleanedPhone;
  
  // Remove duplicate storage - these will now reference stakeholders.owner.phone
  delete window.helper.meta?.owner_phone;
  delete window.helper.car_details?.owner_phone;
  delete window.helper.general_info?.owner_phone;
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CENTRALIZED: Owner phone "${cleanedPhone}" set as single source of truth`);
  return true;
};

/**
 * Get owner phone from single source of truth
 */
window.getOwnerPhone = function() {
  return window.helper?.stakeholders?.owner?.phone || '';
};

/**
 * Centralized owner address management system - Single source of truth
 */
window.setOwnerAddress = function(ownerAddress, source = 'manual') {
  console.log(`🏠 CENTRALIZED: Setting owner address "${ownerAddress}" from source: ${source}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set owner address');
    return false;
  }
  
  if (!ownerAddress || ownerAddress.trim() === '') {
    console.warn('⚠️ Empty owner address provided - keeping existing value');
    return false;
  }
  
  const cleanedAddress = ownerAddress.trim();
  
  // SINGLE SOURCE OF TRUTH: Store owner address only in stakeholders.owner.address
  if (!window.helper.stakeholders) window.helper.stakeholders = {};
  if (!window.helper.stakeholders.owner) window.helper.stakeholders.owner = {};
  
  window.helper.stakeholders.owner.address = cleanedAddress;
  
  // Remove duplicate storage - these will now reference stakeholders.owner.address
  delete window.helper.meta?.owner_address;
  delete window.helper.car_details?.owner_address;
  delete window.helper.general_info?.owner_address;
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CENTRALIZED: Owner address "${cleanedAddress}" set as single source of truth`);
  return true;
};

/**
 * Get owner address from single source of truth
 */
window.getOwnerAddress = function() {
  return window.helper?.stakeholders?.owner?.address || '';
};

/**
 * Centralized owner email management system - Single source of truth
 */
window.setOwnerEmail = function(ownerEmail, source = 'manual') {
  console.log(`📧 CENTRALIZED: Setting owner email "${ownerEmail}" from source: ${source}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set owner email');
    return false;
  }
  
  if (!ownerEmail || ownerEmail.trim() === '') {
    console.warn('⚠️ Empty owner email provided - keeping existing value');
    return false;
  }
  
  const cleanedEmail = ownerEmail.trim();
  
  // SINGLE SOURCE OF TRUTH: Store owner email only in stakeholders.owner.email
  if (!window.helper.stakeholders) window.helper.stakeholders = {};
  if (!window.helper.stakeholders.owner) window.helper.stakeholders.owner = {};
  
  window.helper.stakeholders.owner.email = cleanedEmail;
  
  // Remove duplicate storage - these will now reference stakeholders.owner.email
  delete window.helper.meta?.owner_email;
  delete window.helper.car_details?.owner_email;
  delete window.helper.general_info?.owner_email;
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CENTRALIZED: Owner email "${cleanedEmail}" set as single source of truth`);
  return true;
};

/**
 * Get owner email from single source of truth
 */
window.getOwnerEmail = function() {
  return window.helper?.stakeholders?.owner?.email || '';
};

/**
 * Complete owner data cleanup - removes all duplicate owner references
 */
window.cleanupDuplicateOwnerData = function() {
  console.log('🧹 CLEANUP: Removing all duplicate owner data references...');
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot cleanup owner data');
    return false;
  }
  
  let cleanedCount = 0;
  
  // Remove from meta section
  if (window.helper.meta?.owner_name) {
    delete window.helper.meta.owner_name;
    cleanedCount++;
  }
  if (window.helper.meta?.owner_phone) {
    delete window.helper.meta.owner_phone;
    cleanedCount++;
  }
  if (window.helper.meta?.owner_address) {
    delete window.helper.meta.owner_address;
    cleanedCount++;
  }
  if (window.helper.meta?.owner_email) {
    delete window.helper.meta.owner_email;
    cleanedCount++;
  }
  if (window.helper.meta?.client_name) {
    delete window.helper.meta.client_name;
    cleanedCount++;
  }
  
  // Remove from car_details section
  if (window.helper.car_details?.owner) {
    delete window.helper.car_details.owner;
    cleanedCount++;
  }
  if (window.helper.car_details?.owner_name) {
    delete window.helper.car_details.owner_name;
    cleanedCount++;
  }
  if (window.helper.car_details?.owner_phone) {
    delete window.helper.car_details.owner_phone;
    cleanedCount++;
  }
  if (window.helper.car_details?.owner_address) {
    delete window.helper.car_details.owner_address;
    cleanedCount++;
  }
  if (window.helper.car_details?.owner_email) {
    delete window.helper.car_details.owner_email;
    cleanedCount++;
  }
  
  // Remove from general_info section
  if (window.helper.general_info?.owner_name) {
    delete window.helper.general_info.owner_name;
    cleanedCount++;
  }
  if (window.helper.general_info?.owner_phone) {
    delete window.helper.general_info.owner_phone;
    cleanedCount++;
  }
  
  // CRITICAL: Clean up incorrect phone data if it matches owner name
  if (window.helper.stakeholders?.owner?.phone && window.helper.stakeholders?.owner?.name) {
    const phone = window.helper.stakeholders.owner.phone;
    const name = window.helper.stakeholders.owner.name;
    if (phone === name) {
      console.log('🧹 CLEANUP: Removing owner name from phone field:', phone);
      window.helper.stakeholders.owner.phone = '';
      cleanedCount++;
      // FORCE SAVE IMMEDIATELY
      saveHelperToAllStorageLocations();
    }
  }
  
  // AGGRESSIVE: Force clear phone field if it still contains owner name
  if (window.helper.stakeholders?.owner?.phone === window.helper.stakeholders?.owner?.name) {
    console.log('🚨 FORCE CLEARING: Owner name still in phone field');
    window.helper.stakeholders.owner.phone = '';
    cleanedCount++;
    saveHelperToAllStorageLocations();
  }
  if (window.helper.general_info?.owner_address) {
    delete window.helper.general_info.owner_address;
    cleanedCount++;
  }
  if (window.helper.general_info?.owner_email) {
    delete window.helper.general_info.owner_email;
    cleanedCount++;
  }
  if (window.helper.general_info?.client_name) {
    delete window.helper.general_info.client_name;
    cleanedCount++;
  }
  
  // Remove from any other potential sections
  if (window.helper.expertise?.owner) {
    delete window.helper.expertise.owner;
    cleanedCount++;
  }
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CLEANUP: Removed ${cleanedCount} duplicate owner data references`);
  return cleanedCount;
};

/**
 * Complete vehicle data cleanup - removes all duplicate vehicle references
 */
window.cleanupDuplicateVehicleData = function() {
  console.log('🧹 CLEANUP: Removing all duplicate vehicle data references...');
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot cleanup vehicle data');
    return false;
  }
  
  let cleanedCount = 0;
  
  // Remove from meta section (keep only meta.plate as authoritative)
  if (window.helper.meta?.manufacturer) {
    delete window.helper.meta.manufacturer;
    cleanedCount++;
  }
  if (window.helper.meta?.model) {
    delete window.helper.meta.model;
    cleanedCount++;
  }
  if (window.helper.meta?.year) {
    delete window.helper.meta.year;
    cleanedCount++;
  }
  if (window.helper.meta?.chassis) {
    delete window.helper.meta.chassis;
    cleanedCount++;
  }
  if (window.helper.meta?.km) {
    delete window.helper.meta.km;
    cleanedCount++;
  }
  if (window.helper.meta?.ownership_type) {
    delete window.helper.meta.ownership_type;
    cleanedCount++;
  }
  
  // Remove from car_details section
  if (window.helper.car_details?.plate) {
    delete window.helper.car_details.plate;
    cleanedCount++;
  }
  if (window.helper.car_details?.manufacturer) {
    delete window.helper.car_details.manufacturer;
    cleanedCount++;
  }
  if (window.helper.car_details?.model) {
    delete window.helper.car_details.model;
    cleanedCount++;
  }
  if (window.helper.car_details?.year) {
    delete window.helper.car_details.year;
    cleanedCount++;
  }
  if (window.helper.car_details?.chassis) {
    delete window.helper.car_details.chassis;
    cleanedCount++;
  }
  if (window.helper.car_details?.km) {
    delete window.helper.car_details.km;
    cleanedCount++;
  }
  
  // Remove from case_info section (keep only case_info.plate reference)
  if (window.helper.case_info?.manufacturer) {
    delete window.helper.case_info.manufacturer;
    cleanedCount++;
  }
  if (window.helper.case_info?.model) {
    delete window.helper.case_info.model;
    cleanedCount++;
  }
  if (window.helper.case_info?.year) {
    delete window.helper.case_info.year;
    cleanedCount++;
  }
  
  // Remove from general_info section
  if (window.helper.general_info?.plate) {
    delete window.helper.general_info.plate;
    cleanedCount++;
  }
  if (window.helper.general_info?.manufacturer) {
    delete window.helper.general_info.manufacturer;
    cleanedCount++;
  }
  if (window.helper.general_info?.model) {
    delete window.helper.general_info.model;
    cleanedCount++;
  }
  if (window.helper.general_info?.year) {
    delete window.helper.general_info.year;
    cleanedCount++;
  }
  if (window.helper.general_info?.km) {
    delete window.helper.general_info.km;
    cleanedCount++;
  }
  
  // Remove from expertise section
  if (window.helper.expertise?.plate) {
    delete window.helper.expertise.plate;
    cleanedCount++;
  }
  if (window.helper.expertise?.manufacturer) {
    delete window.helper.expertise.manufacturer;
    cleanedCount++;
  }
  if (window.helper.expertise?.model) {
    delete window.helper.expertise.model;
    cleanedCount++;
  }
  if (window.helper.expertise?.year) {
    delete window.helper.expertise.year;
    cleanedCount++;
  }
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CLEANUP: Removed ${cleanedCount} duplicate vehicle data references`);
  return cleanedCount;
};

/**
 * Get vehicle data from single source of truth
 */
window.getVehicleData = function() {
  if (!window.helper?.vehicle) {
    return {};
  }
  
  return {
    plate: window.helper.meta?.plate || '', // Plate stays in meta as exception
    manufacturer: window.helper.vehicle.manufacturer || '',
    model: window.helper.vehicle.model || '',
    model_code: window.helper.vehicle.model_code || '',
    model_type: window.helper.vehicle.model_type || '',
    trim: window.helper.vehicle.trim || '',
    year: window.helper.vehicle.year || '',
    chassis: window.helper.vehicle.chassis || '',
    engine_volume: window.helper.vehicle.engine_volume || '',
    fuel_type: window.helper.vehicle.fuel_type || '',
    transmission: window.helper.vehicle.transmission || '',
    is_automatic: window.helper.vehicle.is_automatic || false,
    drive_type: window.helper.vehicle.drive_type || '',
    km: window.helper.vehicle.km || '',
    office_code: window.helper.vehicle.office_code || '',
    ownership_type: window.helper.vehicle.ownership_type || '',
    registration_date: window.helper.vehicle.registration_date || '',
    category: window.helper.vehicle.category || '',
    features: window.helper.vehicle.features || '',
    condition: window.helper.vehicle.condition || '',
    market_value: window.helper.vehicle.market_value || 0
  };
};

/**
 * Centralized vehicle field setter - routes all vehicle fields to helper.vehicle.*
 */
window.setVehicleField = function(fieldName, value, source = 'manual') {
  console.log(`🚗 CENTRALIZED: Setting vehicle.${fieldName} = "${value}" from source: ${source}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set vehicle field');
    return false;
  }
  
  // Initialize vehicle section if needed
  if (!window.helper.vehicle) {
    window.helper.vehicle = {};
  }
  
  // Set the field in the vehicle section
  window.helper.vehicle[fieldName] = value;
  
  // Remove any duplicate references to this field in other sections
  const sectionsToClean = ['meta', 'car_details', 'case_info', 'general_info', 'expertise'];
  let cleanedCount = 0;
  
  sectionsToClean.forEach(section => {
    if (window.helper[section] && window.helper[section][fieldName]) {
      delete window.helper[section][fieldName];
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} duplicate references to ${fieldName}`);
  }
  
  saveHelperToAllStorageLocations();
  console.log(`✅ CENTRALIZED: Vehicle field ${fieldName} set in helper.vehicle.*`);
  return true;
};

/**
 * Fix helper structure - removes misplaced sections and ensures proper organization
 */
window.fixHelperStructure = function() {
  console.log('🏗️ STRUCTURE FIX: Reorganizing helper sections to match specification...');
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot fix structure');
    return false;
  }
  
  let fixedCount = 0;
  
  // Fix misplaced estimate section (should be top-level, not under car_details)
  if (window.helper.car_details?.estimate) {
    console.log('🔧 Moving estimate from car_details to top-level');
    
    // Ensure top-level estimate exists
    if (!window.helper.estimate) {
      window.helper.estimate = {};
    }
    
    // Merge any existing data
    Object.assign(window.helper.estimate, window.helper.car_details.estimate);
    
    // Remove misplaced section
    delete window.helper.car_details.estimate;
    fixedCount++;
  }
  
  // Fix misplaced final_report section (should be top-level, not under expertise)
  if (window.helper.expertise?.final_report) {
    console.log('🔧 Moving final_report from expertise to top-level');
    
    // Ensure top-level final_report exists
    if (!window.helper.final_report) {
      window.helper.final_report = {
        type: '',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        report_sections: {
          vehicle_details: {},
          damage_assessment: {},
          valuation_calculations: {},
          depreciation: {},
          legal_disclaimer: {}
        }
      };
    }
    
    // Merge any existing data
    Object.assign(window.helper.final_report, window.helper.expertise.final_report);
    
    // Remove misplaced section
    delete window.helper.expertise.final_report;
    fixedCount++;
  }
  
  // Ensure expertise section only contains appropriate data
  if (window.helper.expertise) {
    // Keep only valid expertise fields
    const validExpertiseFields = ['damage_blocks', 'levi_report', 'field_inspection', 'photos'];
    const currentFields = Object.keys(window.helper.expertise);
    
    currentFields.forEach(field => {
      if (!validExpertiseFields.includes(field)) {
        console.log(`🧹 Removing invalid field from expertise: ${field}`);
        delete window.helper.expertise[field];
        fixedCount++;
      }
    });
  }
  
  // Ensure car_details section only contains appropriate data
  if (window.helper.car_details) {
    // Keep only valid car_details fields - most should be moved to vehicle section
    const validCarDetailsFields = ['inspection_notes', 'damage_notes'];
    const currentFields = Object.keys(window.helper.car_details);
    
    currentFields.forEach(field => {
      if (!validCarDetailsFields.includes(field)) {
        console.log(`🧹 Removing field from car_details (should be in vehicle section): ${field}`);
        delete window.helper.car_details[field];
        fixedCount++;
      }
    });
  }
  
  // Ensure all required top-level sections exist
  const requiredSections = ['estimate', 'final_report', 'expertise'];
  requiredSections.forEach(section => {
    if (!window.helper[section]) {
      console.log(`🔧 Creating missing section: ${section}`);
      
      if (section === 'estimate') {
        window.helper[section] = {
          type: '',
          legal_text: '',
          attachments: '',
          report_title: '',
          generated: false,
          generated_date: ''
        };
      } else if (section === 'final_report') {
        window.helper[section] = {
          type: '',
          legal_text: '',
          attachments: '',
          report_title: '',
          generated: false,
          generated_date: '',
          report_sections: {
            vehicle_details: {},
            damage_assessment: {},
            valuation_calculations: {},
            depreciation: {},
            legal_disclaimer: {}
          }
        };
      } else if (section === 'expertise') {
        window.helper[section] = {
          damage_blocks: [],
          levi_report: {}
        };
      }
      
      fixedCount++;
    }
  });
  
  if (fixedCount > 0) {
    saveHelperToAllStorageLocations();
    console.log(`✅ STRUCTURE FIXED: Made ${fixedCount} structural corrections`);
  } else {
    console.log('✅ Helper structure is already correct');
  }
  
  return fixedCount;
};

/**
 * Enhanced helper structure for estimate and final report sections
 */
window.enhanceEstimateSections = function() {
  console.log('📊 ENHANCE: Setting up proper estimate and final report structures...');
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot enhance sections');
    return false;
  }
  
  let enhancedCount = 0;
  
  // Enhanced estimate section with 2 types
  if (!window.helper.estimate.estimate_types) {
    window.helper.estimate.estimate_types = {
      // Type 1: Pre-work estimate
      pre_work: {
        type: 'אובדן_חלקי',
        status: 'draft',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        calculations: {}
      },
      // Type 2: Post-work estimate  
      post_work: {
        type: 'אובדן_להלכה',
        status: 'draft',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        calculations: {}
      }
    };
    enhancedCount++;
  }
  
  // Enhanced final report section with 5 types
  if (!window.helper.final_report.report_types) {
    window.helper.final_report.report_types = {
      // Type 1: Private opinion
      private_opinion: {
        type: 'חוות דעת פרטית',
        status: 'draft', 
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        report_sections: {
          vehicle_details: {},
          damage_assessment: {},
          valuation_calculations: {},
          depreciation: {},
          legal_disclaimer: {}
        }
      },
      // Type 2: Global opinion
      global_opinion: {
        type: 'חוות דעת גלובלית',
        status: 'draft',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        report_sections: {
          vehicle_details: {},
          damage_assessment: {},
          valuation_calculations: {},
          depreciation: {},
          legal_disclaimer: {}
        }
      },
      // Type 3: Damaged condition sale opinion
      damaged_sale_opinion: {
        type: 'חוות דעת מכירה מצבו הניזוק',
        status: 'draft',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        report_sections: {
          vehicle_details: {},
          damage_assessment: {},
          valuation_calculations: {},
          depreciation: {},
          legal_disclaimer: {}
        }
      },
      // Type 4: Total loss opinion
      total_loss_opinion: {
        type: 'חוות דעת טוטלוסט',
        status: 'draft',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        report_sections: {
          vehicle_details: {},
          damage_assessment: {},
          valuation_calculations: {},
          depreciation: {},
          legal_disclaimer: {}
        }
      },
      // Type 5: Legal total loss opinion
      legal_total_loss: {
        type: 'חוות דעת אובדן להלכה',
        status: 'draft',
        legal_text: '',
        attachments: '',
        report_title: '',
        generated: false,
        generated_date: '',
        report_sections: {
          vehicle_details: {},
          damage_assessment: {},
          valuation_calculations: {},
          depreciation: {},
          legal_disclaimer: {}
        }
      }
    };
    enhancedCount++;
  }
  
  // Add report type selector mechanism
  if (!window.helper.system.active_report_types) {
    window.helper.system.active_report_types = {
      estimate: '',      // Will be set by UI selection: 'pre_work' or 'post_work'
      final_report: ''   // Will be set by UI selection: 'private_opinion', 'global_opinion', etc.
    };
    enhancedCount++;
  }
  
  if (enhancedCount > 0) {
    saveHelperToAllStorageLocations();
    console.log(`✅ ENHANCED: Added ${enhancedCount} structural enhancements`);
  } else {
    console.log('✅ Estimate sections are already enhanced');
  }
  
  return enhancedCount;
};

/**
 * Set active report type - determines where data should be written
 */
window.setActiveReportType = function(section, reportType) {
  console.log(`📋 REPORT TYPE: Setting ${section} active type to: ${reportType}`);
  
  if (!window.helper) {
    console.error('❌ Helper not initialized - cannot set report type');
    return false;
  }
  
  if (!window.helper.system.active_report_types) {
    window.helper.system.active_report_types = {
      estimate: '',
      final_report: ''
    };
  }
  
  // Validate section
  if (!['estimate', 'final_report'].includes(section)) {
    console.error(`❌ Invalid section: ${section}. Must be 'estimate' or 'final_report'`);
    return false;
  }
  
  // Validate report type for estimate (2 types)
  if (section === 'estimate') {
    const validEstimateTypes = ['pre_work', 'post_work'];
    if (!validEstimateTypes.includes(reportType)) {
      console.error(`❌ Invalid estimate type: ${reportType}. Must be one of: ${validEstimateTypes.join(', ')}`);
      return false;
    }
  }
  
  // Validate report type for final_report (5 types)
  if (section === 'final_report') {
    const validFinalReportTypes = ['private_opinion', 'global_opinion', 'damaged_sale_opinion', 'total_loss_opinion', 'legal_total_loss'];
    if (!validFinalReportTypes.includes(reportType)) {
      console.error(`❌ Invalid final report type: ${reportType}. Must be one of: ${validFinalReportTypes.join(', ')}`);
      return false;
    }
  }
  
  // Set the active type
  window.helper.system.active_report_types[section] = reportType;
  
  // Update metadata
  window.helper.system.last_updated = new Date().toISOString();
  
  saveHelperToAllStorageLocations();
  console.log(`✅ REPORT TYPE: ${section} active type set to: ${reportType}`);
  return true;
};

/**
 * Get current active report type data location
 */
window.getActiveReportData = function(section) {
  if (!window.helper?.system?.active_report_types) {
    return null;
  }
  
  const activeType = window.helper.system.active_report_types[section];
  if (!activeType) {
    return null;
  }
  
  if (section === 'estimate' && window.helper.estimate?.estimate_types?.[activeType]) {
    return window.helper.estimate.estimate_types[activeType];
  }
  
  if (section === 'final_report' && window.helper.final_report?.report_types?.[activeType]) {
    return window.helper.final_report.report_types[activeType];
  }
  
  return null;
};

/**
 * Enhanced parts search management - creates comprehensive parts bank
 */
window.addToPartsBank = function(partData, source = 'manual') {
  console.log(`🔧 PARTS BANK: Adding part to global bank from source: ${source}`);
  
  if (!window.helper?.parts_search?.global_parts_bank) {
    console.error('❌ Parts bank not initialized');
    return false;
  }
  
  const timestamp = new Date().toISOString();
  const enhancedPartData = {
    ...partData,
    id: partData.id || `part_${Date.now()}`,
    added_date: timestamp,
    source: source,
    vehicle_context: window.getVehicleData(),
    case_context: {
      plate: window.getPlateNumber(),
      case_id: window.helper.meta?.case_id
    }
  };
  
  // Add to global parts bank
  window.helper.parts_search.global_parts_bank.all_parts.push(enhancedPartData);
  
  // Update supplier tracking
  if (partData.supplier && !window.helper.parts_search.global_parts_bank.suppliers.find(s => s.name === partData.supplier)) {
    window.helper.parts_search.global_parts_bank.suppliers.push({
      name: partData.supplier,
      contact_info: partData.supplier_contact || {},
      parts_supplied: [enhancedPartData.id],
      first_seen: timestamp,
      total_parts: 1
    });
  }
  
  // Update price history
  if (partData.price) {
    window.helper.parts_search.global_parts_bank.price_history.push({
      part_name: partData.name,
      price: partData.price,
      supplier: partData.supplier,
      date: timestamp,
      vehicle_context: enhancedPartData.vehicle_context
    });
  }
  
  // Update statistics
  window.helper.parts_search.search_history.statistics.unique_parts++;
  
  saveHelperToAllStorageLocations();
  return true;
};

/**
 * Enhanced invoice OCR processing - captures complete JSON data
 */
window.processInvoiceOCR = function(invoiceFile, ocrResults) {
  console.log(`📄 INVOICE OCR: Processing invoice file: ${invoiceFile.name}`);
  
  // Initialize financials section first
  window.initializeFinancialsSection();
  
  if (!window.helper?.financials?.invoices) {
    console.error('❌ Invoice structure not initialized');
    return false;
  }
  
  const timestamp = new Date().toISOString();
  
  // Set current invoice data
  const currentInvoice = {
    file_info: {
      filename: invoiceFile.name,
      file_size: invoiceFile.size,
      file_type: invoiceFile.type,
      upload_date: timestamp,
      processing_status: 'processing'
    },
    ocr_results: {
      raw_text: ocrResults.raw_text || '',
      structured_data: ocrResults.structured_data || {},
      confidence_score: ocrResults.confidence || 0,
      language_detected: ocrResults.language || 'he',
      processing_method: ocrResults.method || 'unknown'
    },
    invoice_data: {
      invoice_number: ocrResults.invoice_number || '',
      date: ocrResults.date || '',
      supplier: ocrResults.supplier || {},
      items: ocrResults.items || [],
      subtotal: ocrResults.subtotal || 0,
      vat_amount: ocrResults.vat_amount || 0,
      total_amount: ocrResults.total_amount || 0,
      currency: ocrResults.currency || 'ILS',
      payment_terms: ocrResults.payment_terms || '',
      due_date: ocrResults.due_date || ''
    },
    classification: {
      category: ocrResults.category || '',
      subcategory: ocrResults.subcategory || '',
      damage_center_assignment: ocrResults.damage_center || '',
      approval_status: 'pending',
      notes: ocrResults.notes || ''
    },
    validation: {
      is_valid: false,
      validation_errors: [],
      manual_corrections: [],
      reviewed_by: '',
      review_date: ''
    }
  };
  
  window.helper.financials.invoices.current_invoice = currentInvoice;
  
  // Update processing status
  currentInvoice.file_info.processing_status = 'completed';
  
  // Add to processed invoices array (complete capture)
  window.helper.financials.invoices.processed_invoices.push({
    ...currentInvoice,
    processing_id: `inv_${Date.now()}`,
    case_context: {
      plate: window.getPlateNumber(),
      case_id: window.helper.meta?.case_id
    }
  });
  
  // Update statistics
  const stats = window.helper.financials.invoices.statistics;
  stats.total_invoices++;
  stats.total_amount += currentInvoice.invoice_data.total_amount;
  
  // Group by supplier
  const supplierName = currentInvoice.invoice_data.supplier.name;
  if (supplierName) {
    if (!stats.by_supplier[supplierName]) {
      stats.by_supplier[supplierName] = { count: 0, total_amount: 0 };
    }
    stats.by_supplier[supplierName].count++;
    stats.by_supplier[supplierName].total_amount += currentInvoice.invoice_data.total_amount;
  }
  
  saveHelperToAllStorageLocations();
  console.log(`✅ INVOICE OCR: Successfully processed and stored invoice data`);
  return true;
};

/**
 * Enhanced fee module data capture - stores complete UI JSON
 */
window.captureFeeModuleData = function(feeUIData) {
  console.log(`💰 FEE MODULE: Capturing complete UI data`);
  
  // Initialize financials section first
  window.initializeFinancialsSection();
  
  if (!window.helper?.financials?.fees) {
    console.error('❌ Fee structure not initialized');
    return false;
  }
  
  // Store complete UI data
  window.helper.financials.fees.ui_data = {
    ...feeUIData,
    captured_at: new Date().toISOString(),
    case_context: {
      plate: window.getPlateNumber(),
      case_id: window.helper.meta?.case_id
    }
  };
  
  // Extract and store structured data
  if (feeUIData.assessment) {
    Object.assign(window.helper.financials.fees.assessment, feeUIData.assessment);
  }
  
  if (feeUIData.travel) {
    Object.assign(window.helper.financials.fees.travel, feeUIData.travel);
  }
  
  if (feeUIData.photography) {
    Object.assign(window.helper.financials.fees.photography, feeUIData.photography);
  }
  
  if (feeUIData.office) {
    Object.assign(window.helper.financials.fees.office, feeUIData.office);
  }
  
  // Store any additional fees
  if (feeUIData.additional_fees) {
    window.helper.financials.fees.additional_fees = feeUIData.additional_fees;
  }
  
  // Calculate subtotal
  const subtotal = (window.helper.financials.fees.assessment.total || 0) +
                  (window.helper.financials.fees.travel.total || 0) +
                  (window.helper.financials.fees.photography.total || 0) +
                  (window.helper.financials.fees.office.total || 0);
  
  window.helper.financials.fees.subtotal = subtotal;
  
  saveHelperToAllStorageLocations();
  console.log(`✅ FEE MODULE: Successfully captured fee data, subtotal: ₪${subtotal}`);
  return true;
};

/**
 * Search parts in global bank - provides comprehensive search across all cases
 */
window.searchPartsBank = function(searchQuery, filters = {}) {
  console.log(`🔍 PARTS BANK SEARCH: Searching for "${searchQuery}"`);
  
  if (!window.helper?.parts_search?.global_parts_bank?.all_parts) {
    return [];
  }
  
  const allParts = window.helper.parts_search.global_parts_bank.all_parts;
  const query = searchQuery.toLowerCase();
  
  let results = allParts.filter(part => {
    const nameMatch = (part.name || '').toLowerCase().includes(query);
    const descMatch = (part.description || '').toLowerCase().includes(query);
    const supplierMatch = (part.supplier || '').toLowerCase().includes(query);
    
    return nameMatch || descMatch || supplierMatch;
  });
  
  // Apply filters
  if (filters.supplier) {
    results = results.filter(part => part.supplier === filters.supplier);
  }
  
  if (filters.price_min) {
    results = results.filter(part => (part.price || 0) >= filters.price_min);
  }
  
  if (filters.price_max) {
    results = results.filter(part => (part.price || 0) <= filters.price_max);
  }
  
  if (filters.source) {
    results = results.filter(part => part.source === filters.source);
  }
  
  // Sort by relevance and date
  results.sort((a, b) => {
    // Prioritize exact name matches
    if (a.name && a.name.toLowerCase() === query) return -1;
    if (b.name && b.name.toLowerCase() === query) return 1;
    
    // Then by most recent
    return new Date(b.added_date) - new Date(a.added_date);
  });
  
  console.log(`✅ PARTS BANK SEARCH: Found ${results.length} results`);
  return results;
};

/**
 * Test function to demonstrate plate normalization
 */
window.testPlateNormalization = function() {
  console.log('🧪 Testing plate number normalization...');
  
  const testPlates = [
    '221-84-003',
    '221 84 003',
    '22184003',
    '12345678',
    '123-45-678',
    '1234567',
    'invalid',
    '221-84-003 ',
    ' 221-84-003'
  ];
  
  testPlates.forEach(testPlate => {
    console.log(`Testing: "${testPlate}"`);
    const result = window.setPlateNumber(testPlate, 'test_normalization');
    if (result) {
      console.log(`✅ Success: "${testPlate}" → "${window.getPlateNumber()}"`);
    } else {
      console.log(`❌ Failed: "${testPlate}" (invalid format)`);
    }
    console.log('---');
  });
  
  return {
    message: 'Plate normalization test completed - check console for results',
    currentPlate: window.getPlateNumber()
  };
};

/**
 * Legacy protection function - now uses centralized system
 */
window.protectPlateNumber = function(plateNumber, source = 'manual') {
  return window.setPlateNumber(plateNumber, source, true);
};

/**
 * Validates incoming plate number against protected original
 */
window.validatePlateNumber = function(incomingPlate, source = 'unknown') {
  if (!window.helper.meta.plate_locked || !window.helper.meta.original_plate) {
    return { valid: true, action: 'accept' };
  }
  
  // Normalize both plates by removing dashes before comparison
  const originalPlate = window.helper.meta.original_plate.replace(/[-\s]/g, '').toUpperCase().trim();
  const newPlate = String(incomingPlate).replace(/[-\s]/g, '').toUpperCase().trim();
  
  console.log(`🔍 VALIDATION: Checking plate "${newPlate}" from ${source} against protected "${originalPlate}"`);
  
  if (originalPlate === newPlate) {
    console.log(`✅ VALIDATION: Plate numbers match - allowing update`);
    return { valid: true, action: 'accept', message: 'Plate numbers match' };
  } else {
    console.warn(`⚠️ VALIDATION: Plate mismatch detected!`);
    console.warn(`   Original (protected): "${originalPlate}" from ${window.helper.meta.plate_protection_source}`);
    console.warn(`   Incoming (rejected):  "${newPlate}" from ${source}`);
    
    return { 
      valid: false, 
      action: 'reject',
      message: `Plate number mismatch detected!\n\nProtected plate: "${originalPlate}" (from ${window.helper.meta.plate_protection_source})\nIncoming plate: "${newPlate}" (from ${source})\n\nThe original plate number is protected and cannot be changed.`,
      originalPlate: originalPlate,
      incomingPlate: newPlate,
      source: source
    };
  }
};

/**
 * Gets current plate protection status
 */
window.getPlateProtectionStatus = function() {
  return {
    isProtected: window.helper?.meta?.plate_locked || false,
    originalPlate: window.helper?.meta?.original_plate || '',
    source: window.helper?.meta?.plate_protection_source || '',
    currentPlate: window.helper?.meta?.plate || '',
    alertCount: window.helper?.system?.protection_alerts?.length || 0
  };
};

/**
 * Shows plate protection alert to user
 */
window.showPlateProtectionAlert = function(validationResult) {
  const alertMessage = `🚨 PLATE NUMBER PROTECTION ALERT 🚨\n\n${validationResult.message}`;
  
  // Show browser alert
  alert(alertMessage);
  
  // Also log to console with styling
  console.error('%c🚨 PLATE PROTECTION ALERT', 'color: red; font-size: 16px; font-weight: bold;');
  console.error(validationResult.message);
  
  // Store alert in helper for debugging
  if (!window.helper.system) window.helper.system = {};
  if (!window.helper.system.protection_alerts) window.helper.system.protection_alerts = [];
  
  window.helper.system.protection_alerts.push({
    timestamp: new Date().toISOString(),
    type: 'plate_mismatch',
    originalPlate: validationResult.originalPlate,
    incomingPlate: validationResult.incomingPlate,
    source: validationResult.source,
    message: validationResult.message
  });
  
  saveHelperToAllStorageLocations();
};

// Removed storage manager to prevent system conflicts

// 🔧 PHASE 2 FIX: Use centralized storage manager for initialization
function initializeHelper() {
  console.log('🔄 Initializing helper - checking for existing data...');
  
  let existingData = null;
  
  try {
    const sessionData = sessionStorage.getItem('helper');
    if (sessionData && sessionData !== '{}') {
      existingData = JSON.parse(sessionData);
      console.log('✅ Found existing helper data in sessionStorage (fallback):', existingData);
    }
  } catch (e) {
    console.warn('⚠️ Could not load from sessionStorage:', e);
  }
  
  // Fallback to localStorage if sessionStorage is empty
  if (!existingData) {
    try {
      const localData = localStorage.getItem('helper_data');
      if (localData && localData !== '{}') {
        existingData = JSON.parse(localData);
        console.log('✅ Found existing helper data in localStorage (fallback):', existingData);
      }
    } catch (e) {
      console.warn('⚠️ Could not load from localStorage:', e);
    }
  }
  
  return existingData;
}

// Load existing data or create default structure
const existingHelper = initializeHelper();

// Create comprehensive helper system with ALL required fields
window.helper = existingHelper || {
  meta: {
    plate: '',
    case_id: '',  // Will be generated dynamically as YC-PLATENUMBER-YEAR
    original_plate: '',      // CRITICAL: Protected original plate from case opening
    plate_locked: false,     // CRITICAL: Protection flag
    plate_protection_source: '',  // Track where the original plate came from
    created_at: new Date().toISOString(),
    last_updated: '',
    last_webhook_update: ''
  },
  vehicle: {
    plate: '',
    manufacturer: '',
    model: '',
    model_code: '',
    model_type: '',
    trim: '',
    year: '',
    chassis: '',
    engine_volume: '',
    fuel_type: '',
    transmission: '',
    is_automatic: false,
    drive_type: '',
    km: '',
    office_code: '',
    ownership_type: '',
    registration_date: '',
    category: '',
    features: '',
    condition: '',
    market_value: 0,
    created_at: '',
    updated_at: ''
  },
  case_info: {
    case_id: '',  // Will be set dynamically as YC-PLATENUMBER-YEAR
    plate: '',
    status: 'active',
    damage_date: '',        // Should stay empty until general info page
    inspection_date: '',    // Should get case opening date
    submission_date: '',
    created_at: '',
    inspection_location: '',
    damage_type: '',
    report_type: '',        // Dynamic based on current stage
    report_type_display: '' // Dynamic based on report_type
  },
  stakeholders: {
    owner: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    garage: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    },
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
  damage_assessment: {
    summary: {
      total_damage_amount: 0,
      damage_percentage: 0,
      is_total_loss: false,
      classification: '',
      assessment_notes: ''
    },
    // Individual damage centers (AUTHORITATIVE LOCATION)
    centers: [],
    
    // Session management for damage centers workflow
    current_session: {
      active_center_id: null,
      center_count: 0,
      session_start: '',
      last_activity: '',
      wizard_step: 1,
      wizard_data: {},
      temp_data: {}
    },
    
    // Aggregated totals and calculations
    totals: {
      all_centers_subtotal: 0,
      all_centers_vat: 0,
      all_centers_total: 0,
      
      // Breakdown by category
      breakdown: {
        total_works: 0,
        total_parts: 0,
        total_repairs: 0,
        total_fees: 0
      },
      
      // By location analysis
      by_location: {},
      
      // Calculation metadata
      last_calculated: '',
      calculation_method: 'auto',
      manual_overrides: []
    },
    
    // Integration with other modules
    integrations: {
      parts_search: {
        linked_searches: [],
        auto_suggestions_enabled: true,
        last_sync: '',
        // Integration with helper.parts_search structure
        selected_parts_sync: true,
        unselected_parts_sync: true,
        webhook_capture_enabled: true
      },
      invoices: {
        linked_invoices: [],
        auto_matching_enabled: true,
        matching_confidence: {}
      },
      estimates: {
        linked_estimates: [],
        estimate_basis: 'damage_centers',
        last_export: ''
      }
    },
    
    // Validation and quality control
    validation: {
      all_centers_valid: false,
      validation_errors: [],
      validation_warnings: [],
      manual_reviews: [],
      last_validation: '',
      validation_rules: {
        require_location: true,
        require_description: true,
        require_at_least_one_item: true,
        require_costs: true
      }
    },
    
    // Statistics and analytics
    statistics: {
      total_centers: 0,
      avg_cost_per_center: 0,
      most_common_locations: {},
      most_expensive_center: null,
      completion_rate: 0,
      
      // Time tracking
      time_spent: {
        total_minutes: 0,
        per_center_avg: 0,
        per_step_breakdown: {}
      }
    },
    
    // Templates and automation
    templates: {
      common_works: [],
      common_parts: [],
      common_repairs: [],
      auto_fill_enabled: true,
      smart_suggestions: true
    },
    
    // Audit trail and history
    audit_trail: [],
    
    // Settings and configuration
    settings: {
      auto_increment_numbers: true,
      default_vat_percentage: 17,
      currency: 'ILS',
      allow_multiple_centers: true,
      wizard_mode: true,
      
      // UI preferences
      ui_preferences: {
        show_subtotals: true,
        show_vat_breakdown: true,
        auto_save: true,
        confirmation_dialogs: true
      },
      
      // Validation settings
      validation_settings: {
        strict_mode: false,
        require_images: false,
        require_part_numbers: false,
        min_cost_threshold: 0
      }
    },
    
    // Metadata
    created_date: '',
    last_updated: '',
    version: '2.0.1', // Updated version to indicate enhancement
    created_by: 'damage_centers_wizard',
    workflow_status: 'in_progress'
  },
  valuation: {
    source: 'levi_yitzhak',
    report_date: '',
    valuation_date: '',
    base_price: 0,
    final_price: 0,
    currency: 'ILS',
    levi_code: '',             // CRITICAL: Store Levi code separately from vehicle model code
    levi_model_code: '',       // Alternative Levi code field
    code: '',                  // Generic code field from Levi
    market_conditions: '',
    comparable_vehicles: [],
    adjustments: {
      registration: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        date: ''
      },
      mileage: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        km_value: 0
      },
      ownership_type: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        type: ''
      },
      ownership_history: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        owner_count: 0
      },
      features: {
        percent: 0,
        amount: 0,
        cumulative: 0,
        reason: '',
        feature_list: []
      },
      market_factors: {
        percent: 0,
        amount: 0,
        reason: ''
      }
    },
    depreciation: {
      global_percentage: 0,
      global_amount: 0,
      work_days_impact: 0,
      total_depreciation: 0
    },
    calculations: {
      gross_price: {
        base: 0,
        features_total: 0,
        registration_total: 0,
        total: 0
      },
      market_price: {
        gross_total: 0,
        mileage_adjustment: 0,
        ownership_type_adjustment: 0,
        ownership_history_adjustment: 0,
        market_factors_adjustment: 0,
        total: 0
      }
    }
  },
  financials: {
    // Case costs (aggregated)
    costs: {
      parts_total: 0,
      repairs_total: 0,
      works_total: 0,
      subtotal: 0
    },
    
    // Fee module data (enhanced for full UI capture)
    fees: {
      assessment: {
        hours: 0,                    // Assessment hours
        hourly_rate: 0,              // Rate per hour (₪280 default)
        total: 0,                    // Calculated total
        description: '',             // Work description
        date: '',                    // Assessment date
        location: ''                 // Assessment location
      },
      travel: {
        count: 0,                    // Number of trips
        unit_price: 0,               // Price per trip
        total: 0,                    // Calculated total 
        distance_km: 0,              // Distance traveled
        fuel_cost: 0,                // Fuel expenses
        tolls: 0,                    // Toll expenses
        description: ''              // Travel details
      },
      photography: {
        count: 0,                    // Number of photos
        unit_price: 0,               // Price per photo
        total: 0,                    // Calculated total
        equipment_cost: 0,           // Equipment expenses
        processing_time: 0,          // Time spent processing
        description: ''              // Photo session details
      },
      office: {
        fixed_fee: 0,                // Fixed office fee
        percentage: 0,               // Percentage-based fee
        total: 0,                    // Calculated total
        overhead_cost: 0,            // Office overhead
        administrative_time: 0,      // Admin time spent
        description: ''              // Office work details
      },
      additional_fees: [],           // Any additional custom fees
      subtotal: 0,                   // Total of all fees
      ui_data: {}                    // Complete fee module UI JSON capture
    },
    
    // Invoice OCR (comprehensive capture)
    invoices: {
      // All processed invoices
      processed_invoices: [],        // Array of all invoice OCR results
      
      // Current invoice being processed
      current_invoice: {
        file_info: {
          filename: '',
          file_size: 0,
          file_type: '',
          upload_date: '',
          processing_status: ''      // 'pending', 'processing', 'completed', 'failed'
        },
        ocr_results: {
          raw_text: '',              // Raw OCR extracted text
          structured_data: {},       // Parsed structured data
          confidence_score: 0,       // OCR confidence (0-100)
          language_detected: '',     // Detected language
          processing_method: ''      // OCR method used
        },
        invoice_data: {
          invoice_number: '',
          date: '',
          supplier: {
            name: '',
            address: '',
            phone: '',
            email: '',
            tax_id: '',
            business_number: ''
          },
          items: [],                 // Detailed line items
          subtotal: 0,
          vat_amount: 0,
          total_amount: 0,
          currency: 'ILS',
          payment_terms: '',
          due_date: ''
        },
        classification: {
          category: '',              // 'parts', 'labor', 'materials', etc.
          subcategory: '',
          damage_center_assignment: '', // Which damage center this belongs to
          approval_status: '',       // 'pending', 'approved', 'rejected'
          notes: ''
        },
        validation: {
          is_valid: false,
          validation_errors: [],
          manual_corrections: [],
          reviewed_by: '',
          review_date: ''
        }
      },
      
      // Invoice statistics and tracking
      statistics: {
        total_invoices: 0,
        total_amount: 0,
        by_supplier: {},             // Grouped by supplier
        by_category: {},             // Grouped by category
        by_date: {},                 // Grouped by date
        processing_errors: 0,
        manual_corrections: 0
      }
    },
    
    // Taxes and calculations
    taxes: {
      vat_percentage: 18,
      vat_amount: 0,
      tax_exempt_items: [],
      tax_calculations: {}
    },
    
    // Final totals
    totals: {
      before_tax: 0,
      after_tax: 0,
      total_compensation: 0,
      salvage_value: 0,
      net_settlement: 0,
      breakdown: {
        parts_cost: 0,
        labor_cost: 0,
        fees_cost: 0,
        other_costs: 0
      }
    },
    
    // Metadata
    calculation_date: '',
    calculation_method: '',
    last_updated: '',
    overrides: [],                   // Manual overrides with reasons
    audit_trail: []                  // All changes tracked
  },
  parts_search: {
    // Case-specific selections
    selected_parts: [],           // Parts chosen for THIS case
    unselected_parts: [],         // Parts not chosen for this case
    case_search_history: [],      // Search history for this case
    
    // Global parts bank (accumulates across all cases)
    global_parts_bank: {
      all_parts: [],              // Every part ever searched/found
      suppliers: [],              // All supplier information
      price_history: [],          // Price tracking over time
      search_patterns: [],        // Common search patterns
      ocr_results: [],            // All OCR processing results
      manual_additions: []        // Manually added parts
    },
    
    // Search session data
    current_session: {
      search_query: '',
      vehicle_context: {},        // Vehicle info for current search
      results: [],               // Current search results
      timestamp: '',
      search_method: ''          // 'manual', 'ocr_image', 'ocr_file', etc.
    },
    
    // Comprehensive search history
    search_history: {
      by_date: [],               // Chronological search history
      by_vehicle: {},            // Searches grouped by vehicle/plate
      by_part_name: {},          // Searches grouped by part name
      by_supplier: {},           // Searches grouped by supplier
      statistics: {
        total_searches: 0,
        unique_parts: 0,
        unique_suppliers: 0,
        average_results_per_search: 0
      }
    },
    
    // Summary for current case
    case_summary: {
      total_searches: 0,
      total_results: 0,
      selected_count: 0,
      unselected_count: 0,
      last_search: '',
      estimated_total_cost: 0
    }
  },
  documents: {
    images: [],
    invoices: [],
    reports: [],
    pdfs: [],
    other_files: [],
    photo_count: 0
  },
  estimate: {
    type: '',
    legal_text: '',
    attachments: '',
    report_title: '',
    generated: false,
    generated_date: ''
  },
  final_report: {
    type: '',  // One of the 5 types: חוות דעת פרטית, חוות דעת גלובלית, etc.
    legal_text: '',
    attachments: '',
    report_title: '',
    generated: false,
    generated_date: '',
    report_sections: {
      vehicle_details: {},
      damage_assessment: {},
      valuation_calculations: {},
      depreciation: {},
      legal_disclaimer: {}
    }
  },
  levi_data: {
    base_value: 0,
    adjusted_value: 0,
    depreciation_factors: {},
    calculation_notes: ''
  },
  calculations: {
    depreciation: {},
    adjustments: {},
    final_values: {},
    calculation_log: []
  },
  raw_webhook_data: {},
  system: {
    version: '2.0.0-comprehensive',
    enhanced_data_capture: true,
    last_updated: new Date().toISOString(),
    processing_history: [],
    validation_status: {
      vehicle: false,
      damage: false,
      valuation: false,
      financials: false,
      estimate: false
    },
    integrations: {
      levi_processed: false,
      invoices_processed: false,
      images_uploaded: false,
      estimate_generated: false
    },
    vat_percentage: 18 // Global VAT percentage setting
  }
};

// 🔧 CRITICAL FIX: If we have existing data, merge it with the default structure
if (existingHelper && typeof existingHelper === 'object') {
  console.log('🔄 Merging existing helper data with default structure...');
  
  // Deep merge function to preserve existing data while ensuring all required fields exist
  function deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        target[key] = source[key];
      }
    }
  }
  
  // Apply the merge
  deepMerge(window.helper, existingHelper);
  console.log('✅ Helper data merged successfully:', window.helper);
  
  // Immediately trigger form population with restored data
  setTimeout(() => {
    console.log('🔄 Auto-populating forms with restored helper data...');
    if (typeof populateAllForms === 'function') {
      populateAllForms();
    }
    
    // Force broadcast update to all listening components
    if (typeof broadcastHelperUpdate === 'function') {
      broadcastHelperUpdate(['vehicle', 'stakeholders', 'case_info', 'valuation'], 'helper_restoration');
    }
  }, 500);
}

// 🔧 CRITICAL: Also watch for DOM changes and ensure forms are populated
if (typeof window !== 'undefined') {
  // Set up immediate population when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        console.log('🔄 DOM loaded - force populating forms...');
        if (window.helper && Object.keys(window.helper).length > 0) {
          populateAllForms();
        }
      }, 1000);
    });
  } else {
    // DOM already ready, populate immediately
    setTimeout(() => {
      console.log('🔄 DOM ready - force populating forms...');
      if (window.helper && Object.keys(window.helper).length > 0) {
        populateAllForms();
      }
    }, 1000);
  }
}

// Enhanced processIncomingData function with comprehensive field mapping
window.processIncomingData = async function(data, webhookId = 'unknown') {
  console.log('🔄 ENHANCED: Processing incoming data from webhook:', webhookId);
  console.log('📥 Raw data:', data);
  console.log('📊 Data type:', typeof data);
  console.log('📈 Data keys:', typeof data === 'object' ? Object.keys(data) : 'N/A');
  
  if (!data) {
    console.warn('⚠️ No data received');
    return { success: false, error: 'No data provided' };
  }
  
  // 🔧 PHASE 2 FIX: Enhanced debugging and validation
  console.log('🧠 Helper before processing:', {
    plate: window.helper?.vehicle?.plate,
    manufacturer: window.helper?.vehicle?.manufacturer,
    owner: window.helper?.stakeholders?.owner?.name
  });
  
  try {
    const result = {
      success: true,
      updatedSections: [],
      warnings: [],
      timestamp: new Date().toISOString(),
      webhookId: webhookId,
      helperUpdated: false
    };
    
    // Handle Hebrew text in Body field (from Make.com)
    if (data.Body && typeof data.Body === 'string') {
      console.log('📥 Processing Hebrew text from Body field');
      result.helperUpdated = processHebrewText(data.Body, result);
    }
    
    // Handle array format with Body field
    else if (Array.isArray(data) && data[0] && data[0].Body) {
      console.log('📥 Processing array format with Body field');
      result.helperUpdated = processHebrewText(data[0].Body, result);
    }
    
    // Handle direct object data
    else if (typeof data === 'object' && !data.Body) {
      console.log('📥 Processing direct object data');
      result.helperUpdated = processDirectData(data, result);
    }
    
    // Store raw webhook data for debugging
    if (!window.helper) window.helper = {};
    if (!window.helper.raw_webhook_data) window.helper.raw_webhook_data = {};
    window.helper.raw_webhook_data[`${webhookId}_${Date.now()}`] = {
      data: data,
      timestamp: new Date().toISOString(),
      processed: result.helperUpdated
    };
    
    // Update meta information
    window.helper.meta.last_updated = new Date().toISOString();
    window.helper.meta.last_webhook_update = webhookId;
    
    // Save to storage immediately
    saveHelperToAllStorageLocations();
    
    // Force UI refresh
    if (result.helperUpdated) {
      setTimeout(() => populateAllForms(), 200);
    }
    
    // 🔧 PHASE 2 FIX: Show what was captured
    console.log('🧠 Helper after processing:', {
      plate: window.helper?.vehicle?.plate,
      manufacturer: window.helper?.vehicle?.manufacturer,
      model: window.helper?.vehicle?.model,
      owner: window.helper?.stakeholders?.owner?.name,
      garage: window.helper?.stakeholders?.garage?.name,
      model_code: window.helper?.vehicle?.model_code,
      engine_model: window.helper?.vehicle?.engine_model,
      drive_type: window.helper?.vehicle?.drive_type
    });
    
    console.log('✅ ENHANCED: Data processing completed:', result);
    console.log('📊 Fields updated:', result.helperUpdated ? 'YES' : 'NO');
    console.log('🎯 Sections processed:', result.updatedSections);
    
    return result;
    
  } catch (error) {
    console.error('❌ ENHANCED: Error processing data:', error);
    return {
      success: false,
      error: error.message,
      webhookId: webhookId,
      timestamp: new Date().toISOString()
    };
  }
};

// 🔧 PHASE 1 FIX: Hebrew Text Normalization and Corruption Recovery
function normalizeHebrewText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  console.log('🔧 Starting Hebrew text normalization...');
  
  // Step 1: Detect and fix UTF-8 corruption patterns
  let normalizedText = text;
  
  // Common UTF-8 corruption patterns for Hebrew - using safer approach
  const corruptionMap = {};
  
  // Basic corruption patterns - focus on common issues that don't have encoding problems
  const corruptionPatterns = [
    // Safe patterns that work in all encodings
    ['â€™', '\'', 'Right single quotation mark'],
    ['â€œ', '"', 'Left double quotation mark'],
    ['â€', '"', 'Right double quotation mark'],
    ['Ã—', '×', 'Multiplication sign corruption'],
    ['Ã¡', 'á', 'Latin a with acute'],
    ['â€¦', '...', 'Ellipsis'],
    ['â€"', '-', 'Em dash'],
    ['â€"', '--', 'En dash'],
    // Hebrew-specific basic patterns
    ['×', '', 'Remove orphaned multiplication signs'],
    ['â€™', '\'', 'Fix apostrophes in Hebrew text'],
    ['Ã', '', 'Remove Latin prefix artifacts']
  ];
  
  // Build corruption map safely
  corruptionPatterns.forEach(([corrupted, correct, desc]) => {
    try {
      corruptionMap[corrupted] = correct;
    } catch (e) {
      console.warn(`⚠️ Could not add corruption pattern: ${desc}`, e);
    }
  });
  
  // Apply corruption fixes
  let fixedCorruption = false;
  for (const [corrupted, correct] of Object.entries(corruptionMap)) {
    if (normalizedText.includes(corrupted)) {
      normalizedText = normalizedText.replace(new RegExp(corrupted, 'g'), correct);
      console.log(`✅ Fixed UTF-8 corruption: "${corrupted}" → "${correct}"`);
      fixedCorruption = true;
    }
  }
  
  // Step 2: Normalize Unicode characters (NFD -> NFC)
  try {
    normalizedText = normalizedText.normalize('NFC');
  } catch (e) {
    console.warn('⚠️ Unicode normalization failed:', e);
  }
  
  // Step 3: Standardize Hebrew punctuation marks - using safer character codes
  const punctuationMap = {};
  
  // Build punctuation map programmatically to avoid syntax errors
  const punctuationPatterns = [
    // Format: [searchChar, replaceChar, description]
    ['\u2019', '\'', 'Right single quotation mark → Regular apostrophe'],
    ['\u2018', '\'', 'Left single quotation mark → Regular apostrophe'],
    ['\u05F3', '\'', 'Hebrew punctuation geresh → Regular apostrophe'],
    ['\u05F4', '"', 'Hebrew punctuation gershayim → Regular quotation'],
    ['`', '\'', 'Grave accent → Regular apostrophe'],
    ['\u2032', '\'', 'Prime symbol → Regular apostrophe'],
    ['\u2033', '"', 'Double prime → Regular quotation'],
    ['\uFF1A', ':', 'Fullwidth colon → Regular colon'],
    ['\uFF1B', ';', 'Fullwidth semicolon → Regular semicolon'],
    ['\uFF0C', ',', 'Fullwidth comma → Regular comma'],
    ['\u200F', '', 'Right-to-left mark (remove)'],
    ['\u200E', '', 'Left-to-right mark (remove)']
  ];
  
  // Build punctuation map safely
  punctuationPatterns.forEach(([search, replace, desc]) => {
    try {
      punctuationMap[search] = replace;
    } catch (e) {
      console.warn(`⚠️ Could not add punctuation pattern: ${desc}`, e);
    }
  });
  
  let fixedPunctuation = false;
  for (const [nonStandard, standard] of Object.entries(punctuationMap)) {
    if (normalizedText.includes(nonStandard)) {
      normalizedText = normalizedText.replace(new RegExp(escapeRegExp(nonStandard), 'g'), standard);
      console.log(`✅ Normalized punctuation: "${nonStandard}" → "${standard}"`);
      fixedPunctuation = true;
    }
  }
  
  // Step 4: Clean up extra whitespace and normalize spacing
  normalizedText = normalizedText
    .replace(/\s+/g, ' ')           // Multiple spaces → single space
    .replace(/\n\s*\n/g, '\n')      // Multiple newlines → single newline  
    .replace(/^\s+|\s+$/g, '')      // Trim whitespace
    .replace(/:\s+/g, ': ')         // Normalize colon spacing
    .replace(/\s+:/g, ':');         // Remove space before colon
  
  if (fixedCorruption || fixedPunctuation || normalizedText !== text) {
    console.log(`✅ Hebrew normalization completed:`, {
      original_length: text.length,
      normalized_length: normalizedText.length,
      corruption_fixed: fixedCorruption,
      punctuation_fixed: fixedPunctuation
    });
  }
  
  return normalizedText;
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced Hebrew Text Processing with Unicode Normalization and Corruption Detection
function processHebrewText(bodyText, result) {
  console.log('🔍 Extracting data from Hebrew text...');
  let updated = false;
  
  // 🔧 PHASE 1 FIX: Unicode normalization and UTF-8 corruption recovery
  bodyText = normalizeHebrewText(bodyText);
  
  console.log('📝 Processed Hebrew text:', bodyText);
  
  // Enhanced Hebrew patterns with comprehensive field variations and multiple encoding support
  const patterns = [
    // Plate number - multiple variants with better Hebrew support
    { regex: /(?:פרטי רכב|מס[׳״\'"`]*\s*רכב|מספר רכב|מס רכב|מס\'\s*רכב|מספר ציון|מספר זיהוי)[:\s-]*([0-9]{7,8})/i, field: 'plate', target: ['vehicle.plate', 'meta.plate', 'case_info.plate'] },
    
    // Manufacturer - FIXED patterns
    { regex: /(?:שם היצרן|יצרן)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'manufacturer', target: ['vehicle.manufacturer'] },
    
    // Model - FIXED patterns  
    { regex: /(?:דגם)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'model', target: ['vehicle.model'] },
    
    // Year - handle multiple formats: MM/YYYY, YYYY, DD/MM/YYYY
    { regex: /(?:שנת ייצור|שנת יצור|שנת\s*ייצור|שנת\s*יצור|שנה|שנת\s*רכישה)[:\s-]*(?:(\d{1,2})\/)?(\d{4})(?:\/(\d{1,2}))?/i, field: 'year', target: ['vehicle.year'] },
    
    // Owner - FIXED patterns
    { regex: /(?:שם בעל הרכב)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'owner', target: ['stakeholders.owner.name'] },
    
    // Chassis/VIN - FIXED patterns
    { regex: /(?:מספר שילדה)[:\s]*([A-Z0-9]+)/i, field: 'chassis', target: ['vehicle.chassis'] },
    
    // Engine volume - various patterns
    { regex: /(?:נפח מנוע|נפח|נפח\s*מנוע|נפח\s*המנוע|עוצמת מנוע)[:\s-]*([0-9,]+)/i, field: 'engine_volume', target: ['vehicle.engine_volume'] },
    
    // Fuel type - FIXED patterns
    { regex: /(?:סוג דלק)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'fuel_type', target: ['vehicle.fuel_type'] },
    
    // Ownership type - FIXED patterns
    { regex: /(?:סוג בעלות)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'ownership_type', target: ['vehicle.ownership_type'] },
    
    // Mileage - comprehensive patterns with comma support
    { regex: /(?:מס[׳״\'"`]*\s*ק[״׳\"'`]מ|קילומטר|ק[״׳\"'`]מ|מרחק\s*נסיעה|קילומטרים|מס\'\s*ק\"מ|מס\s*ק\"מ)[:\s-]*([0-9,]+)/i, field: 'km', target: ['vehicle.km'] },
    
    // Model type - FIXED patterns
    { regex: /(?:סוג הדגם|סוג הרכב|סוג\s*הדגם|סוג\s*רכב|קטגוריה|סיווג)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'model_type', target: ['vehicle.model_type'] },
    
    // Trim/Equipment level - FIXED patterns
    { regex: /(?:רמת גימור|גימור|רמת\s*גימור|רמת\s*ציוד|ציוד|דרגת\s*ציוד)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'trim', target: ['vehicle.trim'] },
    
    // Garage - FIXED patterns
    { regex: /(?:מוסך|בית מלאכה|מוסך\s*מורשה|גרש|מרכז שירות)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'garage', target: ['stakeholders.garage.name'] },
    
    // Office code - MOT registration office
    { regex: /(?:קוד משרד התחבורה|קוד משרד|משרד התחבורה|קוד\s*משרד)[:\s-]*([0-9-]+)/i, field: 'office_code', target: ['vehicle.office_code'] },
    
    // Enhanced Levi-specific patterns with better Hebrew support
    { regex: /(?:קוד דגם|קוד\s*דגם|מזהה\s*דגם)[:\s-]*([0-9]+)/i, field: 'model_code', target: ['vehicle.model_code'] },
    { regex: /(?:שם דגם מלא|דגם מלא|שם\s*דגם\s*מלא|תיאור מלא)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'full_model_name', target: ['vehicle.model'] },
    { regex: /(?:אוטומט|תיבת הילוכים|הילוכים)[:\s-]*(כן|לא|אוטומטית|ידנית)/i, field: 'is_automatic', target: ['vehicle.is_automatic'] },
    { regex: /(?:מאפייני הרכב|מאפיינים|אבזור|ציוד נוסף)[:\s-]*([^\n\r\t]+?)(?:\s*(?:\n|\r|$))/i, field: 'features', target: ['vehicle.features'] },
    { regex: /(?:תאריך הוצאת הדו[״׳\"'`]ח|תאריך דוח|תאריך הערכה)[:\s-]*([0-9\/]+)/i, field: 'report_date', target: ['valuation.report_date'] },
    { regex: /(?:עליה לכביש|רישום|תאריך רישום|רישום ראשון)[:\s-]*([0-9\/]+)/i, field: 'registration_date', target: ['vehicle.registration_date'] },
    { regex: /(?:מספר בעלים|מס[׳״\'"`]*\s*בעלים|כמות בעלים|קודמים)[:\s-]*(\d+)/i, field: 'owner_count', target: ['valuation.adjustments.ownership_history.owner_count'] },
    { regex: /(?:קטיגוריה|קטגוריית רכב|סיווג רכב)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'category', target: ['vehicle.category'] },
    
    // Levi pricing data with enhanced number recognition
    { regex: /(?:מחיר בסיס|מחיר\s*בסיס|ערך בסיס)[:\s-]*([0-9,]+)/i, field: 'base_price', target: ['valuation.base_price'] },
    { regex: /(?:מחיר סופי לרכב|מחיר סופי|ערך סופי|שווי סופי)[:\s-]*([0-9,]+)/i, field: 'final_price', target: ['valuation.final_price'] },
    { regex: /(?:שווי שוק|ערך שוק|מחיר שוק)[:\s-]*([0-9,]+)/i, field: 'market_value', target: ['vehicle.market_value'] },
    
    // Levi adjustment patterns - Registration (enhanced + exact Make.com format)
    { regex: /(?:עליה לכביש\s*%|עליה לכביש\s*אחוז|התאמה עליה לכביש)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'registration_percent', target: ['valuation.adjustments.registration.percent'] },
    { regex: /(?:ערך כספי עליה לכביש|סכום עליה לכביש|התאמה כספית עליה לכביש)[:\s-]*([+-]?[0-9,]+)/i, field: 'registration_amount', target: ['valuation.adjustments.registration.amount'] },
    { regex: /(?:שווי מצטבר עליה לכביש|סך הכל עליה לכביש)[:\s-]*([0-9,]+)/i, field: 'registration_cumulative', target: ['valuation.adjustments.registration.cumulative'] },
    
    // 🔧 EXACT Make.com format for registration (from your example: "עליה לכביש % : 0%")  
    { regex: /עליה\s*לכביש\s*%\s*:\s*([+-]?[0-9.]+)%?/i, field: 'registration_percent', target: ['valuation.adjustments.registration.percent'] },
    { regex: /ערך\s*כספי\s*עליה\s*לכביש\s*:\s*([+-]?[0-9,]+)/i, field: 'registration_amount', target: ['valuation.adjustments.registration.amount'] },
    { regex: /שווי\s*מצטבר\s*עליה\s*לכביש\s*:\s*([0-9,]+)/i, field: 'registration_cumulative', target: ['valuation.adjustments.registration.cumulative'] },
    
    // Levi adjustment patterns - Mileage (enhanced + exact Make.com format)
    { regex: /(?:מס[׳״\'"`]*\s*ק[״׳\"'`]מ\s*%|קילומטראז\s*%|התאמת קילומטראז)[:\s-]*([+-]?[0-9.,]+)%?/i, field: 'mileage_percent', target: ['valuation.adjustments.mileage.percent'] },
    { regex: /(?:ערך כספי מס[׳״\'"`]*\s*ק[״׳\"'`]מ|ערך כספי קילומטראז|התאמה כספית ק\"מ)[:\s-]*([+-]?[0-9,]+)/i, field: 'mileage_amount', target: ['valuation.adjustments.mileage.amount'] },
    { regex: /(?:שווי מצטבר מס[׳״\'"`]*\s*ק[״׳\"'`]מ|סך הכל קילומטראז)[:\s-]*([0-9,]+)/i, field: 'mileage_cumulative', target: ['valuation.adjustments.mileage.cumulative'] },
    
    // 🔧 EXACT Make.com response format patterns (from your example)
    { regex: /מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*%\s*:\s*([+-]?[0-9.,]+)/i, field: 'mileage_percent', target: ['valuation.adjustments.mileage.percent'] },
    { regex: /ערך\s*כספי\s*מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*:\s*([+-]?[0-9,]+)/i, field: 'mileage_amount', target: ['valuation.adjustments.mileage.amount'] },
    { regex: /שווי\s*מצטבר\s*מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*:\s*([0-9,]+)/i, field: 'mileage_cumulative', target: ['valuation.adjustments.mileage.cumulative'] },
    
    // Levi adjustment patterns - Ownership Type (enhanced + exact Make.com format)
    { regex: /(?:סוג בעלות)[:\s-]*(פרטית|חברה|מסחרית|ציבורית)/i, field: 'ownership_value', target: ['valuation.adjustments.ownership_type.type'] },
    { regex: /(?:בעלות\s*%|אחוז בעלות|התאמת בעלות)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'ownership_percent', target: ['valuation.adjustments.ownership_type.percent'] },
    { regex: /(?:ערך כספי בעלות|התאמה כספית בעלות)[:\s-]*([+-]?[0-9,]+)/i, field: 'ownership_amount', target: ['valuation.adjustments.ownership_type.amount'] },
    { regex: /(?:שווי מצטבר בעלות|סך הכל בעלות)[:\s-]*([0-9,]+)/i, field: 'ownership_cumulative', target: ['valuation.adjustments.ownership_type.cumulative'] },
    
    // 🔧 EXACT Make.com format for ownership (from your example: "בעלות % : +7.95%")
    { regex: /בעלות\s*%\s*:\s*([+-]?[0-9.]+)%?/i, field: 'ownership_percent', target: ['valuation.adjustments.ownership_type.percent'] },
    { regex: /ערך\s*כספי\s*בעלות\s*:\s*([+-]?[0-9,]+)/i, field: 'ownership_amount', target: ['valuation.adjustments.ownership_type.amount'] },
    { regex: /שווי\s*מצטבר\s*בעלות\s*:\s*([0-9,]+)/i, field: 'ownership_cumulative', target: ['valuation.adjustments.ownership_type.cumulative'] },
    
    // Levi adjustment patterns - Ownership History (enhanced + exact Make.com format)
    { regex: /(?:מס[׳״\'"`]*\s*בעלים\s*%|מספר בעלים\s*%|התאמת בעלים)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'owners_percent', target: ['valuation.adjustments.ownership_history.percent'] },
    { regex: /(?:ערך כספי מס[׳״\'"`]*\s*בעלים|ערך כספי בעלים קודמים)[:\s-]*([+-]?[0-9,]+)/i, field: 'owners_amount', target: ['valuation.adjustments.ownership_history.amount'] },
    { regex: /(?:שווי מצטבר מס[׳״\'"`]*\s*בעלים|סך הכל בעלים קודמים)[:\s-]*([0-9,]+)/i, field: 'owners_cumulative', target: ['valuation.adjustments.ownership_history.cumulative'] },
    
    // 🔧 EXACT Make.com format for owner count (from your example: "מס' בעלים % : -3%")
    { regex: /מס[׳״\'\"`]*\s*בעלים\s*%\s*:\s*([+-]?[0-9.]+)%?/i, field: 'owners_percent', target: ['valuation.adjustments.ownership_history.percent'] },
    { regex: /ערך\s*כספי\s*מס[׳״\'\"`]*\s*בעלים\s*:\s*([+-]?[0-9,]+)/i, field: 'owners_amount', target: ['valuation.adjustments.ownership_history.amount'] },
    { regex: /שווי\s*מצטבר\s*מס[׳״\'\"`]*\s*בעלים\s*:\s*([0-9,]+)/i, field: 'owners_cumulative', target: ['valuation.adjustments.ownership_history.cumulative'] },
    
    // Levi adjustment patterns - Features (enhanced)
    { regex: /(?:מאפיינים\s*%|אבזור\s*%|התאמת מאפיינים|התאמת אבזור)[:\s-]*([+-]?[0-9.]+)%?/i, field: 'features_percent', target: ['valuation.adjustments.features.percent'] },
    { regex: /(?:ערך כספי מאפיינים|ערך כספי אבזור|התאמה כספית מאפיינים)[:\s-]*([+-]?[0-9,]+)/i, field: 'features_amount', target: ['valuation.adjustments.features.amount'] },
    { regex: /(?:שווי מצטבר מאפיינים|סך הכל מאפיינים)[:\s-]*([0-9,]+)/i, field: 'features_cumulative', target: ['valuation.adjustments.features.cumulative'] },
    
    // 🔧 MISSING PATTERNS - Added for specific webhook fields (handles both : and :\s formats)
    { regex: /(?:מספר דגם הרכב):\s*([A-Z0-9]+)/i, field: 'vehicle_model_code', target: ['vehicle.vehicle_model_code'] },
    { regex: /(?:מספר דגם הרכב):([A-Z0-9]+)/i, field: 'vehicle_model_code_no_space', target: ['vehicle.vehicle_model_code'] },
    { regex: /(?:דגם מנוע):\s*([A-Z0-9]+)/i, field: 'engine_model', target: ['vehicle.engine_model'] },
    { regex: /(?:דגם מנוע):([A-Z0-9]+)/i, field: 'engine_model_no_space', target: ['vehicle.engine_model'] },
    { regex: /(?:הנעה)[:\s]*([^\n\r]+?)(?=\n|$)/i, field: 'drive_type', target: ['vehicle.drive_type'] },
    
    // 🔧 ENHANCED DATE PATTERNS - Handle both ISO timestamps and Hebrew dates
    { regex: /(?:תאריך):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}\+[0-9]{2}:[0-9]{2})/i, field: 'iso_timestamp', target: ['case_info.created_at'] },
    { regex: /(?:תאריך):([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}\+[0-9]{2}:[0-9]{2})/i, field: 'iso_timestamp_no_space', target: ['case_info.created_at'] },
    { regex: /(?:תאריך):\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i, field: 'date_simple', target: ['case_info.created_at'] },
    { regex: /(?:תאריך):([0-9]{4}-[0-9]{2}-[0-9]{2})/i, field: 'date_simple_no_space', target: ['case_info.created_at'] },
    
    // Additional important fields for comprehensive capture
    { regex: /(?:תאריך נזק|תאריך\s*הנזק|מועד הנזק)[:\s-]*([0-9\/]+)/i, field: 'damage_date', target: ['case_info.damage_date'] },
    { regex: /(?:סוג נזק|סוג\s*הנזק|תיאור נזק)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'damage_type', target: ['case_info.damage_type'] },
    { regex: /(?:חברת ביטוח|ביטוח|מבטח)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'insurance_company', target: ['stakeholders.insurance.company'] },
    { regex: /(?:מספר פוליסה|פוליסה|מס[׳״\'"`]*\s*פוליסה)[:\s-]*([A-Z0-9-]+)/i, field: 'policy_number', target: ['stakeholders.insurance.policy_number'] },
    { regex: /(?:מספר תביעה|תביעה|מס[׳״\'"`]*\s*תביעה)[:\s-]*([A-Z0-9-]+)/i, field: 'claim_number', target: ['stakeholders.insurance.claim_number'] },
    
    // 🔧 PHASE 1 FIX: Additional missing Hebrew field mappings
    { regex: /(?:מקום בדיקה|מקום\s*בדיקה|מיקום בדיקה)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'inspection_location', target: ['case_info.inspection_location'] },
    { regex: /(?:תאריך בדיקה|תאריך\s*בדיקה|מועד בדיקה)[:\s-]*([0-9\/]+)/i, field: 'inspection_date', target: ['case_info.inspection_date'] },
    { regex: /(?:סוכן ביטוח|שם סוכן|סוכן)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'agent_name', target: ['stakeholders.insurance.agent.name'] },
    { regex: /(?:טלפון סוכן|טלפון\s*סוכן)[:\s-]*([0-9-]+)/i, field: 'agent_phone', target: ['stakeholders.insurance.agent.phone'] },
    { regex: /(?:אימייל סוכן|מייל סוכן)[:\s-]*([^\s]+@[^\s]+)/i, field: 'agent_email', target: ['stakeholders.insurance.agent.email'] },
    { regex: /(?:טלפון בעל הרכב|טלפון בעלים|טלפון\s*בעל)[:\s-]*([0-9-]+)/i, field: 'owner_phone', target: ['stakeholders.owner.phone'] },
    { regex: /(?:כתובת בעל הרכב|כתובת בעלים|כתובת\s*בעל)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'owner_address', target: ['stakeholders.owner.address'] },
    { regex: /(?:טלפון מוסך|טלפון\s*מוסך)[:\s-]*([0-9-]+)/i, field: 'garage_phone', target: ['stakeholders.garage.phone'] },
    { regex: /(?:אימייל מוסך|מייל מוסך)[:\s-]*([^\s]+@[^\s]+)/i, field: 'garage_email', target: ['stakeholders.garage.email'] },
    { regex: /(?:איש קשר מוסך|איש קשר)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'garage_contact', target: ['stakeholders.garage.contact_person'] },
    
    // Enhanced automatic transmission patterns
    { regex: /(?:תיבת הילוכים|הילוכים|גיר)[:\s-]*(אוטומטי|ידני|אוטומט|מקל)/i, field: 'transmission', target: ['vehicle.transmission'] },
    { regex: /(?:דלת|דלתות)[:\s-]*([0-9]+)/i, field: 'doors', target: ['vehicle.doors'] },
    { regex: /(?:צבע|צבע הרכב)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'color', target: ['vehicle.color'] },
    
    // Market conditions and comparisons
    { regex: /(?:תנאי שוק|מצב שוק)[:\s-]*([^\n\r]+?)(?=\n|$)/i, field: 'market_conditions', target: ['valuation.market_conditions'] },
    
    // Enhanced phone number patterns for all stakeholders
    { regex: /(?:טלפון)[:\s-]*([0-9]{2,3}[-\s]?[0-9]{7,8})/i, field: 'general_phone', target: ['temp.phone'] },
    
    // 🔧 LEVI OCR SPECIFIC PATTERNS - Optimized for Levi report OCR format
    { regex: /קוד הדגם\s+([A-Z0-9]+)/i, field: 'levi_model', target: ['vehicle.model'] },
    { regex: /רמת ג.ימור\s*([A-Z0-9]+)/i, field: 'levi_trim', target: ['vehicle.trim'] },
    { regex: /שילדה\s*\n\s*([A-Z0-9]{17})/im, field: 'levi_chassis', target: ['vehicle.chassis'] },
    { regex: /שנת ייצור\s+(?:\d{2}\/)?(\d{4})/i, field: 'levi_year', target: ['vehicle.year'] },
    { regex: /בעל הרכב\s+([^\n]+?)(?:\s*\n|\s*קוד)/i, field: 'levi_owner', target: ['stakeholders.owner.name'] },
    { regex: /קוד בעלות\s+([^\s]+)/i, field: 'levi_ownership_type', target: ['vehicle.ownership_type'] },
    { regex: /(\d{4})\s+מנוע/i, field: 'levi_engine_volume', target: ['vehicle.engine_volume'] },
    { regex: /(בנזין|דיזל|היברידי)\s+מספר דגם/i, field: 'levi_fuel_type', target: ['vehicle.fuel_type'] },
    { regex: /הנעה\s+([A-Z0-9]+)/i, field: 'levi_drive_type', target: ['vehicle.drive_type'] },
    { regex: /התחבורה-(\d+-\d+)/i, field: 'levi_office_code', target: ['vehicle.office_code'] },
    { regex: /מנוע\s+(\d+)/i, field: 'levi_engine_code', target: ['vehicle.engine_model'] }
  ];
  
  patterns.forEach(({ regex, field, target }) => {
    const match = bodyText.match(regex);
    if (match) {
      let value = match[1] || match[2] || match[3] || match[0];
      value = value ? value.trim() : '';
      
      // Skip empty values
      if (!value) return;
      
      // 🔒 CRITICAL: Validate plate numbers before processing
      if (field === 'plate') {
        const validation = validatePlateNumber(value, 'hebrew_text_ocr');
        if (!validation.valid) {
          showPlateProtectionAlert(validation);
          console.warn(`🚫 BLOCKING Hebrew OCR plate extraction - validation failed`);
          result.warnings.push(`Hebrew OCR plate "${value}" blocked due to mismatch`);
          return; // Skip this pattern
        }
      }
      
      // Enhanced value processing based on field type
      if (field === 'km' || field.includes('amount') || field.includes('cumulative') || field.includes('price') || field === 'engine_volume') {
        // Remove commas and spaces from numeric values
        value = value.replace(/[,\s]/g, '');
        // Convert to number if it's a pure number
        if (/^\d+$/.test(value)) {
          value = parseInt(value);
        }
      }
      
      if (field.includes('percent')) {
        // Handle percentage values - remove % symbol and convert to number
        value = value.replace(/%/g, '').trim();
        if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
          value = parseFloat(value);
        }
      }
      
      if (field === 'is_automatic') {
        // Convert Hebrew yes/no or automatic/manual to boolean
        value = value === 'כן' || value === 'אוטומטית' || value.toLowerCase() === 'automatic';
      }
      
      // Handle year - prefer 4-digit year from any capture group
      if (field === 'year') {
        if (match[2] && /^\d{4}$/.test(match[2])) {
          value = parseInt(match[2]);
        } else if (match[1] && /^\d{4}$/.test(match[1])) {
          value = parseInt(match[1]);
        } else if (/^\d{4}$/.test(value)) {
          value = parseInt(value);
        }
      }
      
      // Handle ISO timestamps - extract date portion
      if (field === 'iso_timestamp' || field === 'iso_timestamp_no_space') {
        if (value && value.includes('T')) {
          // Extract just the date part (YYYY-MM-DD)
          const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            value = dateMatch[1];
          }
        }
      }
      
      // Clean text fields - remove extra whitespace and special characters
      if (typeof value === 'string' && !field.includes('amount') && !field.includes('percent') && !field.includes('price') && field !== 'km') {
        value = value.replace(/\s+/g, ' ').trim();
        // Remove common OCR artifacts
        value = value.replace(/[^\u0590-\u05FF\u200F\u200Ea-zA-Z0-9\s\-\.\/\(\)]/g, '');
      }
      
      // Validate and normalize plate numbers (Israeli format: 7-8 digits, remove dashes)
      if (field === 'plate') {
        const originalValue = value;
        const cleanedPlate = String(value).replace(/[-\s]/g, '');
        const plateMatch = cleanedPlate.match(/^(\d{7,8})$/);
        if (plateMatch) {
          value = plateMatch[1];
          if (originalValue !== value) {
            console.log(`🔢 NORMALIZED: Hebrew plate "${originalValue}" → "${value}" (removed dashes)`);
          }
        }
      }
      
      // Set values in helper with validation
      target.forEach(path => {
        // Only update if we have a meaningful value
        if (value !== '' && value !== null && value !== undefined) {
          setNestedValue(window.helper, path, value);
        }
      });
      
      console.log(`✅ Extracted ${field}: ${value} (type: ${typeof value})`);
      updated = true;
    }
  });
  
  if (updated) {
    result.updatedSections.push('vehicle', 'meta', 'stakeholders');
  }
  
  return updated;
}

// Process direct object data
function processDirectData(data, result) {
  console.log('🔍 Processing direct object data...');
  let updated = false;
  
  // 🔧 COMPATIBILITY FIX: Handle plate_number from Make.com
  if (data.plate_number && !data.plate) {
    console.log('🔄 COMPATIBILITY: Converting plate_number to plate');
    data.plate = data.plate_number;
  }
  
  // 🔒 CRITICAL: Validate any plate number in incoming data before processing
  const plateFields = ['plate', 'license_plate', 'מספר_רכב', 'מס_רכב', 'plate_number'];
  for (const field of plateFields) {
    if (data[field]) {
      const validation = validatePlateNumber(data[field], 'webhook_direct_data');
      if (!validation.valid) {
        showPlateProtectionAlert(validation);
        console.warn(`🚫 BLOCKING webhook data - plate validation failed for field: ${field}`);
        // Remove the invalid plate from data to prevent processing
        delete data[field];
        result.warnings.push(`Plate field "${field}" removed due to mismatch: ${validation.incomingPlate}`);
      }
    }
  }
  
  const fieldMappings = {
    // Vehicle fields - comprehensive mapping
    'plate': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'plate_number': ['vehicle.plate', 'meta.plate', 'case_info.plate'],  // FIX: Map plate_number to plate
    'license_plate': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'מספר_רכב': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'מס_רכב': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'מס רכב': ['vehicle.plate', 'meta.plate', 'case_info.plate'], // With space for test compatibility
    'manufacturer': ['vehicle.manufacturer'],
    'make': ['vehicle.manufacturer'],
    'יצרן': ['vehicle.manufacturer'],
    'שם_היצרן': ['vehicle.manufacturer'],
    'model': ['vehicle.model'],
    'דגם': ['vehicle.model'],
    'שם_דגם': ['vehicle.model'],
    'year': ['vehicle.year'],
    'שנת_ייצור': ['vehicle.year'],
    'שנת_יצור': ['vehicle.year'],
    'chassis': ['vehicle.chassis'],
    'vin': ['vehicle.chassis'],
    'מספר_שילדה': ['vehicle.chassis'],
    'שילדה': ['vehicle.chassis'],
    'km': ['vehicle.km'],
    'mileage': ['vehicle.km'],
    'קילומטרים': ['vehicle.km'],
    'קילומטראז': ['vehicle.km'],
    'engine_volume': ['vehicle.engine_volume'],
    'נפח_מנוע': ['vehicle.engine_volume'],
    'fuel_type': ['vehicle.fuel_type'],
    'סוג_דלק': ['vehicle.fuel_type'],
    'דלק': ['vehicle.fuel_type'],
    'ownership_type': ['vehicle.ownership_type'],
    'סוג_בעלות': ['vehicle.ownership_type'],
    'בעלות': ['vehicle.ownership_type'],
    'trim': ['vehicle.trim'],
    'רמת_גימור': ['vehicle.trim'],
    'גימור': ['vehicle.trim'],
    'model_type': ['vehicle.model_type'],
    'סוג_הדגם': ['vehicle.model_type'],
    'office_code': ['vehicle.office_code'],
    'קוד_משרד': ['vehicle.office_code'],
    'model_code': ['vehicle.model_code'],
    'vehicle_model_code': ['vehicle.vehicle_model_code'],  // CRITICAL: From open case webhook "מספר דגם הרכב"
    'קוד_דגם': ['valuation.levi_code'],                    // CRITICAL: From Levi webhook "קוד דגם" - separate storage
    'levi_code': ['valuation.levi_code'],
    'features': ['vehicle.features'],
    'מאפיינים': ['vehicle.features'],
    'אבזור': ['vehicle.features'],
    'category': ['vehicle.category'],
    'קטיגוריה': ['vehicle.category'],
    'is_automatic': ['vehicle.is_automatic'],
    'אוטומט': ['vehicle.is_automatic'],
    
    // Additional mappings for JSON webhook keys
    'vehicle_type': ['vehicle.vehicle_type'],
    'סוג_הרכב': ['vehicle.vehicle_type'],
    'drive_type': ['vehicle.drive_type'], 
    'הנעה': ['vehicle.drive_type'],
    'engine_model': ['vehicle.engine_model'],
    'דגם_מנוע': ['vehicle.engine_model'],
    'מספר_דגם_הרכב': ['vehicle.vehicle_model_code'],  // CRITICAL: From open case webhook "מספר דגם הרכב"
    'קוד_משרד_התחבורה': ['vehicle.office_code'],
    
    // 🔧 EXACT LEVI JSON MAPPINGS - Critical for system-wide data consistency
    'תאריך': ['valuation.levi_report_date'],
    'סוג רכב': ['vehicle.vehicle_type'], 
    'יצרן': ['vehicle.manufacturer'],
    'קוד דגם': ['vehicle.model_code', 'valuation.levi_code'],
    'קטגוריה': ['vehicle.category'],
    'מספר רישוי': ['vehicle.plate', 'meta.plate'],
    'אוטומט': ['vehicle.is_automatic'],
    'שנת יצור': ['vehicle.year'],
    'מחיר בסיס': ['valuation.base_price'],
    'מחיר סופי לרכב': ['valuation.final_price'],
    'שם דגם מלא': ['vehicle.full_model_name', 'vehicle.model'],
    'קוד לוי': ['valuation.levi_code'],
    'קוד דגם לוי': ['valuation.levi_model_code'],
    
    // LEVI WEBHOOK RESPONSE MAPPING - Fixed according to documentation
    // Registration adjustments
    'עליה לכביש': ['valuation.adjustments.registration.description'],
    'ערך עליה לכביש': ['valuation.adjustments.registration.value'],
    'עליה לכביש %': ['valuation.adjustments.registration.percent'],
    'ערך ש"ח עליה לכביש': ['valuation.adjustments.registration.amount'],
    'שווי מצטבר עליה לכביש': ['valuation.adjustments.registration.cumulative'],
    
    // Ownership type adjustments
    'בעלות': ['valuation.adjustments.ownership_type.description'],
    'ערך בעלות': ['valuation.adjustments.ownership_type.value'],
    'בעלות %': ['valuation.adjustments.ownership_type.percent'],
    'ערך ש"ח בעלות': ['valuation.adjustments.ownership_type.amount'],
    'שווי מצטבר בעלות': ['valuation.adjustments.ownership_type.cumulative'],
    
    // Mileage adjustments
    'מס ק"מ': ['valuation.adjustments.mileage.description'],
    'ערך מס ק"מ': ['valuation.adjustments.mileage.value'],
    'מס ק"מ %': ['valuation.adjustments.mileage.percent'],
    'ערך ש"ח מס ק"מ': ['valuation.adjustments.mileage.amount'],
    'שווי מצטבר מס ק"מ': ['valuation.adjustments.mileage.cumulative'],
    
    // Ownership history adjustments (number of owners)
    'מספר בעלים': ['valuation.adjustments.ownership_history.description'],
    'ערך מספר בעלים': ['valuation.adjustments.ownership_history.value'],
    'מספר בעלים %': ['valuation.adjustments.ownership_history.percent'],
    'ערך ש"ח מספר בעלים': ['valuation.adjustments.ownership_history.amount'],
    'שווי מצטבר מספר בעלים': ['valuation.adjustments.ownership_history.cumulative'],
    
    // Features adjustments
    'מאפיינים': ['valuation.adjustments.features.description'],
    'ערך מאפיינים': ['valuation.adjustments.features.value'],
    'תיאור מאפיינים': ['valuation.adjustments.features.תיאור מאפיינים'],
    'תיאור מאפיינים:': ['valuation.adjustments.features.תיאור מאפיינים'],
    'מחיר מאפיינים %': ['valuation.adjustments.features.percent'],
    'ערך ש"ח מאפיינים': ['valuation.adjustments.features.amount'],
    'שווי מצטבר מאפיינים': ['valuation.adjustments.features.cumulative'],
    'מאפיינים_text': ['vehicle.features_text'],
    
    // 🔧 UNIVERSAL SOLUTION: Features text preservation from duplicate key parser
    'features-text': ['vehicle.features_text'],
    
    // Additional fields for specific data mapping
    'ערך מס ק"מ': ['vehicle.km'], // Mileage value also goes to vehicle.km
    
    // Final price
    'מחיר סופי לרכב': ['valuation.final_price', 'vehicle.market_value'],
    
    // Owner fields
    'owner': ['stakeholders.owner.name'],
    'owner_name': ['stakeholders.owner.name'],
    'בעלים': ['stakeholders.owner.name'],
    'שם_בעל_הרכב': ['stakeholders.owner.name'],
    'owner_phone': ['stakeholders.owner.phone'],
    'owner_address': ['stakeholders.owner.address'],
    'client_name': ['stakeholders.owner.name'],
    
    // Garage fields
    'garage_name': ['stakeholders.garage.name'],
    'garage': ['stakeholders.garage.name'],
    'מוסך': ['stakeholders.garage.name'],
    'garage_phone': ['stakeholders.garage.phone'],
    'garage_email': ['stakeholders.garage.email'],
    
    // Insurance fields
    'insurance_company': ['stakeholders.insurance.company'],
    'חברת_ביטוח': ['stakeholders.insurance.company'],
    'ביטוח': ['stakeholders.insurance.company'],
    'insurance_email': ['stakeholders.insurance.email'],
    'policy_number': ['stakeholders.insurance.policy_number'],
    'מספר_פוליסה': ['stakeholders.insurance.policy_number'],
    'claim_number': ['stakeholders.insurance.claim_number'],
    'מספר_תביעה': ['stakeholders.insurance.claim_number'],
    'agent_name': ['stakeholders.insurance.agent.name'],
    'agent_phone': ['stakeholders.insurance.agent.phone'],
    'agent_email': ['stakeholders.insurance.agent.email'],
    
    // Case info fields
    'damage_date': ['case_info.damage_date'],
    'תאריך_נזק': ['case_info.damage_date'],
    'damage_type': ['case_info.damage_type'],
    'סוג_נזק': ['case_info.damage_type'],
    'inspection_date': ['case_info.inspection_date'],
    'תאריך_בדיקה': ['case_info.inspection_date'],
    'location': ['case_info.inspection_location'],
    'inspection_location': ['case_info.inspection_location'],
    'מקום_בדיקה': ['case_info.inspection_location'],
    'case_number': ['case_info.case_number'],
    'מספר_תיק': ['case_info.case_number'],
    
    // Valuation fields
    'base_price': ['valuation.base_price'],
    'מחיר_בסיס': ['valuation.base_price'],
    'final_price': ['valuation.final_price'],
    'מחיר_סופי': ['valuation.final_price'],
    'market_value': ['vehicle.market_value', 'valuation.final_price'],
    'שווי_שוק': ['vehicle.market_value'],
    'report_date': ['valuation.report_date'],
    'תאריך_דוח': ['valuation.report_date'],
    'registration_date': ['vehicle.registration_date'],
    'עליה_לכביש': ['vehicle.registration_date'],
    'owner_count': ['valuation.adjustments.ownership_history.owner_count'],
    'מספר_בעלים': ['valuation.adjustments.ownership_history.owner_count'],
    
    // Adjustment fields
    'registration_percent': ['valuation.adjustments.registration.percent'],
    'registration_amount': ['valuation.adjustments.registration.amount'],
    'mileage_percent': ['valuation.adjustments.mileage.percent'],
    'mileage_amount': ['valuation.adjustments.mileage.amount'],
    'ownership_percent': ['valuation.adjustments.ownership_type.percent'],
    'ownership_amount': ['valuation.adjustments.ownership_type.amount'],
    'owners_percent': ['valuation.adjustments.ownership_history.percent'],
    'owners_amount': ['valuation.adjustments.ownership_history.amount'],
    'features_percent': ['valuation.adjustments.features.percent'],
    'features_amount': ['valuation.adjustments.features.amount']
  };
  
  // 🔧 ENHANCED DEBUG: Log all incoming JSON data
  console.log('📋 JSON Data received for processing:');
  Object.entries(data).forEach(([key, value]) => {
    console.log(`  📝 ${key}: ${value} (type: ${typeof value})`);
  });
  
  console.log('📋 Available field mappings:', Object.keys(fieldMappings));
  
  Object.entries(data).forEach(([key, value]) => {
    const keyLower = key.toLowerCase();
    console.log(`🔍 Processing key: "${key}" → "${keyLower}"`);
    
    if (value && value !== '') {
      const targets = fieldMappings[key]; // Try exact key first
      const targetsLower = fieldMappings[keyLower]; // Then try lowercase
      const finalTargets = targets || targetsLower;
      
      if (finalTargets) {
        // 🔧 PRICE FORMATTING FIX: Handle number strings with commas
        let processedValue = value;
        if (typeof value === 'string' && /^[\d,]+$/.test(value)) {
          // Keep original string format for prices like "85,000"
          processedValue = value;
          console.log(`💰 Preserving price format: ${value}`);
        }
        
        finalTargets.forEach(target => {
          console.log(`📍 Setting ${target} = ${processedValue}`);
          setNestedValue(window.helper, target, processedValue);
        });
        console.log(`✅ Mapped ${key}: ${processedValue}`);
        updated = true;
      } else {
        console.warn(`⚠️ No mapping found for key: "${key}" (${keyLower})`);
      }
    } else {
      console.log(`⏭️ Skipping empty value for key: "${key}"`);
    }
  });
  
  if (updated) {
    result.updatedSections.push('vehicle', 'stakeholders', 'valuation');
  }
  
  return updated;
}

// Helper function to set nested object values
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Deep merge helper for merging objects without overwriting
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const key in source) {
    const srcVal = source[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

// 🔧 PHASE 2 FIX: Use centralized storage manager
// Centralized storage save using the new storage manager
function saveHelperToAllStorageLocations() {
  try {
    const helperString = JSON.stringify(window.helper);
    const timestamp = new Date().toISOString();
    
    // Primary storage
    sessionStorage.setItem('helper', helperString);
    
    // Backup storage locations
    sessionStorage.setItem('helper_backup', helperString);
    sessionStorage.setItem('helper_timestamp', timestamp);
    
    // Persistent storage
    localStorage.setItem('helper_data', helperString);
    localStorage.setItem('helper_last_save', timestamp);
    
    console.log('✅ Helper saved to all storage locations (fallback method)');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save helper to storage:', error);
    return false;
  }
}

// Detect current module to optimize field population
function detectCurrentModule() {
  const url = window.location.pathname.toLowerCase();
  const title = document.title.toLowerCase();
  
  if (url.includes('parts') || title.includes('parts')) return 'parts';
  if (url.includes('general') || title.includes('general')) return 'general';
  if (url.includes('levi') || url.includes('upload') || title.includes('levi')) return 'levi';
  if (url.includes('open') || url.includes('cases') || title.includes('cases')) return 'cases';
  if (url.includes('damage') || title.includes('damage')) return 'damage';
  
  // Check for specific form elements
  if (document.querySelector('#part_quantity, #free_query')) return 'parts';
  if (document.querySelector('#odo, #ownerPhone, #garageName')) return 'general';
  if (document.querySelector('#manual-base-price, #manual-final-price')) return 'levi';
  if (document.querySelector('#plate, #owner, #date, #location')) return 'cases';
  
  return 'unknown';
}

// Get relevant fields for current module
function getModuleFields(module) {
  const moduleFieldSets = {
    'parts': ['plate', 'manufacturer', 'model', 'year', 'chassis', 'vin', 'part_quantity', 'free_query', 'part_name', 'part_group'],
    'general': ['plate', 'odo', 'km', 'mileage', 'ownerPhone', 'owner_phone', 'ownerAddress', 'owner_address', 'garageName', 'garage_name', 'garagePhone', 'garage_phone', 'garageEmail', 'garage_email', 'agentName', 'agent_name', 'agentPhone', 'agent_phone', 'damageDate', 'damage_date'],
    'levi': ['manual-base-price', 'manual-final-price', 'manual-registration-percent', 'manual-km', 'plate'],
    'cases': ['plate', 'owner', 'date', 'location'],
    'damage': ['plate', 'damage_type', 'damage_date', 'location', 'inspection_location']
  };
  
  return moduleFieldSets[module] || Object.keys(moduleFieldSets).reduce((all, key) => [...all, ...moduleFieldSets[key]], []);
}

// Populate all forms from helper data
function populateAllForms() {
  console.log('🔄 Populating all forms from helper data');
  
  const currentModule = detectCurrentModule();
  console.log('📍 Detected current module:', currentModule);
  
  let updated = 0;
  
  // Helper data mapping with comprehensive field coverage
  const dataMapping = {
    // Basic vehicle info - use centralized plate getter
    'plate': window.getPlateNumber(),
    'plateNumber': window.getPlateNumber(),
    'manufacturer': window.helper.vehicle?.manufacturer,
    'model': window.helper.vehicle?.model,
    'year': window.helper.vehicle?.year,
    'chassis': window.helper.vehicle?.chassis,
    'vin': window.helper.vehicle?.chassis,
    'km': window.helper.vehicle?.km,
    'odo': window.helper.vehicle?.km,
    'mileage': window.helper.vehicle?.km,
    'engine_volume': window.helper.vehicle?.engine_volume,
    'fuel_type': window.helper.vehicle?.fuel_type,
    'ownership_type': window.helper.vehicle?.ownership_type,
    'trim': window.helper.vehicle?.trim,
    'model_type': window.helper.vehicle?.model_type,
    'office_code': window.helper.vehicle?.office_code,
    'model_code': window.helper.vehicle?.model_code,
    'features': window.helper.vehicle?.features,
    'category': window.helper.vehicle?.category,
    'is_automatic': window.helper.vehicle?.is_automatic,
    
    // 🔧 PHASE 3 FIX: Add missing vehicle fields from webhook
    'vehicle_model_code': window.helper.vehicle?.model_code,
    'engine_model': window.helper.vehicle?.engine_model,
    'drive_type': window.helper.vehicle?.drive_type,
    'model_type': window.helper.vehicle?.model_type,
    
    // Owner info - use centralized getter
    'owner': window.getOwnerName(),
    'ownerName': window.getOwnerName(),
    'client_name': window.getOwnerName(),
    // 'ownerPhone': window.helper.stakeholders?.owner?.phone, // DISABLED - should not auto-populate
    // 'owner_phone': window.helper.stakeholders?.owner?.phone, // DISABLED - should not auto-populate
    'phone_number': window.helper.stakeholders?.owner?.phone, // NEW CLEAN FIELD - AUTO-POPULATE
    'ownerAddress': window.helper.stakeholders?.owner?.address,
    'owner_address': window.helper.stakeholders?.owner?.address,
    'ownerEmail': window.helper.stakeholders?.owner?.email,
    
    // Garage info
    'garage': window.helper.stakeholders?.garage?.name,
    'garageName': window.helper.stakeholders?.garage?.name,
    'garage_name': window.helper.stakeholders?.garage?.name,
    'garagePhone': window.helper.stakeholders?.garage?.phone,
    'garage_phone': window.helper.stakeholders?.garage?.phone,
    'garageEmail': window.helper.stakeholders?.garage?.email,
    'garage_email': window.helper.stakeholders?.garage?.email,
    'garageContact': window.helper.stakeholders?.garage?.contact_person,
    
    // Insurance info
    'insurance': window.helper.stakeholders?.insurance?.company,
    'insuranceCompany': window.helper.stakeholders?.insurance?.company,
    'insurance_company': window.helper.stakeholders?.insurance?.company,
    'insuranceEmail': window.helper.stakeholders?.insurance?.email,
    'insurance_email': window.helper.stakeholders?.insurance?.email,
    'agentName': window.helper.stakeholders?.insurance?.agent?.name,
    'agent_name': window.helper.stakeholders?.insurance?.agent?.name,
    'agentPhone': window.helper.stakeholders?.insurance?.agent?.phone,
    'agent_phone': window.helper.stakeholders?.insurance?.agent?.phone,
    'agentEmail': window.helper.stakeholders?.insurance?.agent?.email,
    'agent_email': window.helper.stakeholders?.insurance?.agent?.email,
    'policyNumber': window.helper.stakeholders?.insurance?.policy_number,
    'policy_number': window.helper.stakeholders?.insurance?.policy_number,
    'claimNumber': window.helper.stakeholders?.insurance?.claim_number,
    'claim_number': window.helper.stakeholders?.insurance?.claim_number,
    
    // SIMPLE: Exclude damage_date_independent from auto-population - user must enter manually
    // 'damage_date_independent': window.helper.case_info?.damage_date, // DISABLED
    'damageType': window.helper.case_info?.damage_type,
    'damage_type': window.helper.case_info?.damage_type,
    
    // Case info (inspection details only - NOT damage date)
    'inspectionDate': window.helper.case_info?.inspection_date,
    'inspection_date': window.helper.case_info?.inspection_date,
    'location': window.helper.case_info?.inspection_location,
    'inspection_location': window.helper.case_info?.inspection_location,
    
    // Valuation fields
    'base_price': window.helper.valuation?.base_price,
    'final_price': window.helper.valuation?.final_price,
    'market_value': window.helper.vehicle?.market_value || window.helper.valuation?.final_price,
    'report_date': window.helper.valuation?.report_date,
    'registration_date': window.helper.vehicle?.registration_date,
    'owner_count': window.helper.valuation?.adjustments?.ownership_history?.owner_count,
    
    // Manual Levi form fields
    'manual-base-price': window.helper.valuation?.base_price,
    'manual-final-price': window.helper.valuation?.final_price,
    'manual-market-value': window.helper.vehicle?.market_value,
    'manual-km': window.helper.vehicle?.km,
    'manual-registration-percent': window.helper.valuation?.adjustments?.registration?.percent,
    'manual-km-percent': window.helper.valuation?.adjustments?.mileage?.percent,
    'manual-ownership-percent': window.helper.valuation?.adjustments?.ownership_type?.percent,
    'manual-owners-percent': window.helper.valuation?.adjustments?.ownership_history?.percent
  };

  // 🔧 PHASE 3 FIX: Enhanced form population with better field detection
  Object.entries(dataMapping).forEach(([fieldId, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Multiple field detection strategies
      const element = document.getElementById(fieldId) || 
                     document.querySelector(`[name="${fieldId}"]`) || 
                     document.querySelector(`input[placeholder*="${fieldId}"]`) ||
                     document.querySelector(`input[id*="${fieldId}"]`) ||
                     document.querySelector(`select[name="${fieldId}"]`) ||
                     document.querySelector(`textarea[name="${fieldId}"]`) ||
                     // Hebrew field mappings for vehicle details form
                     (fieldId === 'manufacturer' ? document.querySelector('[id*="יצרן"], [name*="manufacturer"]') : null) ||
                     (fieldId === 'model' ? document.querySelector('[id*="דגם"], [name*="model"]') : null) ||
                     (fieldId === 'year' ? document.querySelector('[id*="שנה"], [name*="year"]') : null) ||
                     (fieldId === 'plate' ? document.querySelector('[id*="רכב"], [name*="plate"]') : null);
                     
      if (element) {
        const currentValue = element.value?.trim() || '';
        const newValue = String(value).trim();
        
        // PROTECTION: Don't override email fields with non-email values
        const isEmailField = fieldId.includes('Email') || fieldId.includes('email');
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue);
        const currentIsValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue);
        
        // Protect email fields: don't override valid email with invalid data
        if (isEmailField && currentIsValidEmail && !isValidEmail) {
          console.log(`🛡️ Protecting ${fieldId}: keeping valid email "${currentValue}" instead of "${newValue}"`);
          return;
        }
        
        // 🔧 CRITICAL PROTECTION: Don't override damage_date_independent if manually entered
        if (fieldId === 'damage_date_independent' && window.helper?.meta?.damage_date_manual) {
          console.log(`🛡️ Protecting ${fieldId}: respecting manual entry "${currentValue}" - not overriding with "${newValue}"`);
          return;
        }
        
        // Only update if different and meaningful
        if (newValue && newValue !== currentValue && newValue !== '-' && newValue !== 'undefined') {
          if (element.type === 'checkbox') {
            const shouldBeChecked = value === true || value === 'כן' || value === 'yes' || value === 'true';
            element.checked = shouldBeChecked;
          } else {
            // Clean percentage values for number inputs
            if (element.type === 'number' && typeof newValue === 'string' && newValue.includes('%')) {
              element.value = parseFloat(newValue.replace('%', '')) || 0;
            } else {
              element.value = newValue;
            }
          }
          
          // Trigger events
          ['input', 'change', 'blur'].forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
          
          // Visual feedback for populated fields
          element.style.borderLeft = '3px solid #4CAF50';
          element.title = `Auto-populated by webhook (${fieldId})`;
          
          updated++;
          console.log(`✅ Updated ${fieldId}: ${newValue} (element: ${element.tagName}#${element.id || element.name})`);
        }
      } else {
        // Debug: log missing elements
        if (['plate', 'manufacturer', 'model', 'year', 'owner', 'garage'].includes(fieldId)) {
          console.log(`⚠️ Element not found for key field: ${fieldId} (value: ${value})`);
        }
      }
    }
  });
  
  console.log(`✅ Form population completed: ${updated} fields updated`);
  
  // Update helper timestamp
  window.helper.meta.last_updated = new Date().toISOString();
  saveHelperToAllStorageLocations();
  
  // 🔧 PHASE 3 FIX: Return success info for retry logic
  return { updated, totalFields: Object.keys(dataMapping).length };
}

// Enhanced form population with retry mechanism
function populateAllFormsWithRetry(maxRetries = 3, delay = 1000) {
  console.log('🔄 Starting enhanced form population with retry...');
  
  let attempt = 0;
  
  const tryPopulate = () => {
    attempt++;
    console.log(`📝 Form population attempt ${attempt}/${maxRetries}`);
    
    const result = populateAllForms();
    
    // If we updated few fields and have retries left, try again after delay
    if (result.updated < 3 && attempt < maxRetries) {
      console.log(`⏳ Only ${result.updated} fields updated, retrying in ${delay}ms...`);
      setTimeout(tryPopulate, delay);
    } else {
      console.log(`🎯 Form population completed after ${attempt} attempts: ${result.updated} fields`);
    }
  };
  
  tryPopulate();
}

// Simple helper update functions
window.updateHelper = function(field, value) {
  if (!window.helper) initializeHelper();

  // FIXED: Allow damage_date updates but respect manual entries
  if (field === 'case_info' && value && value.damage_date) {
    const isFromGeneralInfo = sessionStorage.getItem('damageDate_manualEntry') === 'true';
    const existingManualDate = window.helper?.case_info?.damage_date;
    
    if (isFromGeneralInfo) {
      console.log('✅ ALLOWING case_info.damage_date update from manual entry:', value.damage_date);
    } else if (existingManualDate && existingManualDate !== value.damage_date) {
      console.log('🚫 PROTECTING existing manual damage_date entry. Rejecting value:', value.damage_date);
      // Remove damage_date from the value object to protect manual entry
      value = { ...value };
      delete value.damage_date;
    } else {
      console.log('✅ ALLOWING case_info.damage_date update (no manual entry exists):', value.damage_date);
    }
  }

  // 🔒 CRITICAL: Validate plate number changes before processing
  if (field === 'plate' || (typeof value === 'object' && value && value.plate)) {
    const incomingPlate = typeof value === 'string' ? value : value.plate;
    if (incomingPlate) {
      const validation = validatePlateNumber(incomingPlate, 'updateHelper');
      if (!validation.valid) {
        showPlateProtectionAlert(validation);
        console.error(`🚫 BLOCKING plate update from updateHelper - validation failed`);
        return false; // Block the update
      }
    }
  }

  const fieldMappings = {
    'plate': 'centralized_plate',
    'manufacturer': 'centralized_vehicle_manufacturer',
    'model': 'centralized_vehicle_model',
    'year': 'centralized_vehicle_year',
    'chassis': 'centralized_vehicle_chassis',
    'km': 'centralized_vehicle_km',
    'ownership_type': 'centralized_vehicle_ownership_type',
    'category': 'centralized_vehicle_category',
    'features': 'centralized_vehicle_features',
    'condition': 'centralized_vehicle_condition',
    'engine_volume': 'centralized_vehicle_engine_volume',
    'fuel_type': 'centralized_vehicle_fuel_type',
    'transmission': 'centralized_vehicle_transmission',
    'drive_type': 'centralized_vehicle_drive_type',
    'model_code': 'centralized_vehicle_model_code',
    'model_type': 'centralized_vehicle_model_type',
    'trim': 'centralized_vehicle_trim',
    'registration_date': 'centralized_vehicle_registration_date',
    'market_value': 'centralized_vehicle_market_value',
    'office_code': 'centralized_vehicle_office_code',
    'is_automatic': 'centralized_vehicle_is_automatic',
    'owner': 'centralized_owner_name',
    'owner_name': 'centralized_owner_name',
    'client_name': 'centralized_owner_name',
    'owner_phone': 'centralized_owner_phone',
    'client_phone': 'centralized_owner_phone',
    'owner_address': 'centralized_owner_address',
    'client_address': 'centralized_owner_address',
    'owner_email': 'centralized_owner_email',
    'client_email': 'centralized_owner_email',
    'garage': ['stakeholders.garage.name'],
    'insurance': ['stakeholders.insurance.company']
  };

  const targets = fieldMappings[field] || [field];
  
  // Handle centralized functions
  if (targets === 'centralized_plate') {
    window.setPlateNumber(value, 'updateHelper');
    return true;
  } else if (targets === 'centralized_owner_name') {
    window.setOwnerName(value, 'updateHelper');
    return true;
  } else if (targets === 'centralized_owner_phone') {
    window.setOwnerPhone(value, 'updateHelper');
    return true;
  } else if (targets === 'centralized_owner_address') {
    window.setOwnerAddress(value, 'updateHelper');
    return true;
  } else if (targets === 'centralized_owner_email') {
    window.setOwnerEmail(value, 'updateHelper');
    return true;
  } else if (typeof targets === 'string' && targets.startsWith('centralized_vehicle_')) {
    // Extract field name from centralized_vehicle_fieldname
    const vehicleField = targets.replace('centralized_vehicle_', '');
    window.setVehicleField(vehicleField, value, 'updateHelper');
    return true;
  }
  
  // Handle array targets (legacy approach)
  const targetArray = Array.isArray(targets) ? targets : [targets];
  targetArray.forEach(target => {
    // If value is an object and target refers to a section, merge instead of overwrite
    if (typeof value === 'object' && !Array.isArray(value) && target.split('.').length === 1) {
      const section = target;
      if (!window.helper[section] || typeof window.helper[section] !== 'object') {
        window.helper[section] = {};
      }
      deepMerge(window.helper[section], value);
    } else {
      setNestedValue(window.helper, target, value);
    }
  });

  // CRITICAL: Update case_id when plate number is updated
  if (field === 'plate' || (field === 'vehicle' && value && value.plate) || 
      (field === 'meta' && value && value.plate) || (field === 'case_info' && value && value.plate)) {
    const plateValue = typeof value === 'string' ? value : 
                      (value && value.plate) ? value.plate : 
                      window.helper.vehicle.plate || window.helper.meta.plate;
    
    if (plateValue) {
      const currentYear = new Date().getFullYear();
      const dynamicCaseId = `YC-${plateValue}-${currentYear}`;
      window.helper.meta.case_id = dynamicCaseId;
      window.helper.case_info.case_id = dynamicCaseId;
      console.log(`✅ Auto-updated case_id to: ${dynamicCaseId}`);
    }
  }

  saveHelperToAllStorageLocations();
  console.log(`Updated ${field}:`, value);
};

window.updateHelperAndSession = function(field, value) {
  updateHelper(field, value);
};

window.broadcastHelperUpdate = function(sections, source) {
  // Handle case where sections might not be an array
  const sectionList = Array.isArray(sections) ? sections.join(', ') : String(sections || 'unknown');
  console.log(`Broadcasting helper update: ${sectionList} (source: ${source || 'unknown'})`);
  setTimeout(() => populateAllForms(), 200);
};

// Test function for Levi JSON webhook data processing
window.testLeviJSONData = function() {
  console.log('🧪 Testing Levi JSON webhook data processing...');
  
  // Exact Levi JSON data from your webhook
  const leviData = {
    "תאריך": "07/04/2025",
    "סוג רכב": "פרטי",
    "יצרן": "ג'יפ",
    "קוד דגם": "870170",
    "קטגוריה": "פנאי שטח",
    "מספר רישוי": "608-26-402",
    "אוטומט": "כן",
    "שנת יצור": "2021",
    "מחיר בסיס": "85,000",
    "שם דגם מלא": "ג'יפ ריינג'ד 150(1332) LATITUDE כ\"ס 2X4 אוטו'",
    "מאפיינים": "הגה כוח,4 חלונות חשמל חישוקי מגנזיום, מניעת גניבה,מניעת הנעה,רדיו מובנה",
    "עליה לכביש": "עליה לכביש",
    "ערך עליה לכביש": "08/2021",
    "עליה לכביש %": "0%",
    "ערך ש\"ח עליה לכביש": "3,500",
    "שווי מצטבר עליה לכביש": "88,500",
    "בעלות": "בעלות",
    "ערך בעלות": "פרטית",
    "בעלות %": "0%",
    "ערך ש\"ח בעלות": "0",
    "שווי מצטבר בעלות": "88,500",
    "מס ק\"מ": "מס ק\"מ",
    "ערך מס ק\"מ": "16290",
    "מס ק\"מ %": "+7.95%",
    "ערך ש\"ח מס ק\"מ": "7,036",
    "שווי מצטבר מס ק\"מ": "95,536",
    "מספר בעלים": "מספר בעלים",
    "ערך מספר בעלים": "2",
    "מספר בעלים %": "-3%",
    "ערך ש\"ח מספר בעלים": "-2,866",
    "שווי מצטבר מספר בעלים": "92,670",
    "מאפיינים": "מאפיינים",
    "ערך מאפיינים ": "",
    "מחיר מאפיינים %": "0%",
    "ערך ש\"ח מאפיינים": "0",
    "שווי מצטבר  מאפיינים": "92,670",
    "מחיר סופי לרכב": "92,670"
  };
  
  console.log('🧠 Helper before Levi test:', window.helper?.valuation);
  
  // Test processing
  const result = window.processIncomingData(leviData, 'TEST_LEVI_JSON');
  
  console.log('📊 Levi processing result:', result);
  console.log('🧠 Helper vehicle after test:', window.helper?.vehicle);
  console.log('💰 Helper valuation after test:', window.helper?.valuation);
  console.log('🔧 Adjustment data:', window.helper?.valuation?.adjustments);
  
  return {
    success: result?.success || false,
    helperData: window.helper,
    vehicleData: window.helper?.vehicle,
    valuationData: window.helper?.valuation,
    adjustments: window.helper?.valuation?.adjustments
  };
};

// Test function for JSON webhook data processing
window.testJSONWebhookData = function() {
  console.log('🧪 Testing JSON webhook data processing...');
  
  // Sample JSON data from your webhook
  const testData = {
    "plate": "5785269",
    "timestamp": "2025-07-21T18:06:03.613+02:00",
    "manufacturer": "ביואיק",
    "model": "LUCERNE",
    "model_type": "סדאן",
    "vehicle_type": "פרטי",
    "trim": "CXL",
    "chassis": "1G4HD57258U196450",
    "year": "05/2009",
    "owner": "כרמל כיוף",
    "ownership_type": "פרטי",
    "engine_volume": "3791",
    "fuel_type": "בנזין",
    "model_code": "HD572",
    "engine_model": "428",
    "drive_type": "4X2",
    "garage": "UMI חיפה",
    "office_code": "156-11"
  };
  
  console.log('🧠 Helper before test:', window.helper?.vehicle);
  
  // Test processing
  const result = window.processIncomingData(testData, 'TEST_JSON');
  
  console.log('📊 Processing result:', result);
  console.log('🧠 Helper after test:', window.helper?.vehicle);
  console.log('👤 Owner data:', window.helper?.stakeholders?.owner);
  console.log('🔧 Garage data:', window.helper?.stakeholders?.garage);
  
  return {
    success: result?.success || false,
    helperData: window.helper,
    vehicleData: window.helper?.vehicle,
    ownerData: window.helper?.stakeholders?.owner,
    garageData: window.helper?.stakeholders?.garage
  };
};

// Simple test functions
window.testDataCapture = function() {
  console.log('🧪 Testing basic data capture...');
  console.log('Helper data:', window.helper);
  populateAllForms();
};

// 🔧 COMPREHENSIVE TEST: Test with your actual webhook data
window.testWithActualWebhookData = function() {
  console.log('🧪 Testing with actual Hebrew webhook data...');
  
  const actualWebhookData = `פרטי רכב: 5785269
תאריך: 2025-07-21T15:26:07.129+02:00
מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הדגם: סדאן
סוג הרכב: פרטי
רמת גימור:CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
שם בעל הרכב: כרמל כיוף
סוג בעלות: פרטי
נפח מנוע: 3791
סוג דלק: בנזין
מספר דגם הרכב:HD572
דגם מנוע: 428
הנעה: 4X2
מוסך: UMI חיפה
קוד משרד התחבורה:156-11`;

  console.log('🔄 Processing actual webhook data...');
  const result = window.universalWebhookReceiver(actualWebhookData, 'TEST_ACTUAL_DATA');
  
  console.log('📊 Test Results:');
  console.log('Success:', result.success);
  console.log('Sections updated:', result.updatedSections);
  
  // Check specific fields that should be captured
  const expectedFields = {
    'plate': '5785269',
    'manufacturer': 'ביואיק', 
    'model': 'LUCERNE',
    'model_type': 'סדאן',
    'trim': 'CXL',
    'chassis': '1G4HD57258U196450',
    'owner': 'כרמל כיוף',
    'ownership_type': 'פרטי',
    'engine_volume': '3791',
    'fuel_type': 'בנזין',
    'model_code': 'HD572',
    'engine_model': '428',
    'drive_type': '4X2',
    'garage': 'UMI חיפה',
    'office_code': '156-11'
  };
  
  console.log('🎯 Field Capture Analysis:');
  let captured = 0;
  let total = Object.keys(expectedFields).length;
  
  for (const [field, expectedValue] of Object.entries(expectedFields)) {
    const actualValue = getNestedValue(window.helper, getFieldPath(field));
    const isMatch = actualValue === expectedValue;
    
    if (isMatch) {
      captured++;
      console.log(`✅ ${field}: "${actualValue}" (CAPTURED)`);
    } else {
      console.log(`❌ ${field}: Expected "${expectedValue}", Got "${actualValue}" (MISSED)`);
    }
  }
  
  const captureRate = Math.round((captured / total) * 100);
  console.log(`📈 CAPTURE RATE: ${captured}/${total} (${captureRate}%)`);
  
  // Test form population
  setTimeout(() => {
    console.log('🔄 Testing form population...');
    const populateResult = populateAllForms();
    console.log(`📝 Forms populated: ${populateResult.updated} fields`);
  }, 1000);
  
  return { 
    captureRate, 
    captured, 
    total, 
    helperData: window.helper,
    processingResult: result 
  };
};

// Helper function to get nested values
function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr && curr[key], obj);
}

// Helper function to get field path in helper structure
function getFieldPath(field) {
  const pathMap = {
    'plate': 'vehicle.plate',
    'manufacturer': 'vehicle.manufacturer',
    'model': 'vehicle.model',
    'model_type': 'vehicle.model_type',
    'trim': 'vehicle.trim',
    'chassis': 'vehicle.chassis',
    'owner': 'stakeholders.owner.name',
    'ownership_type': 'vehicle.ownership_type',
    'engine_volume': 'vehicle.engine_volume',
    'fuel_type': 'vehicle.fuel_type',
    'model_code': 'vehicle.model_code',
    'engine_model': 'vehicle.engine_model',
    'drive_type': 'vehicle.drive_type',
    'garage': 'stakeholders.garage.name',
    'office_code': 'vehicle.office_code'
  };
  return pathMap[field] || `vehicle.${field}`;
}

// Window-level helper functions
window.getVehicleData = function() {
  return window.helper?.vehicle || {};
};

window.getOwnerData = function() {
  return window.helper?.stakeholders?.owner || {};
};

// Auto-populate on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => populateAllForms(), 300);
  });
} else {
  setTimeout(() => populateAllForms(), 300);
}

console.log('✅ Helper system loaded and ready');

// 🔧 PHASE 2 FIX: Universal webhook receiver with Hebrew data auto-detection
window.universalWebhookReceiver = function(data, source = 'unknown') {
  console.log('🌐 Universal webhook receiver activated:', source);
  console.log('📥 Raw incoming data:', data);
  
  // 🔍 CAPTURE RAW WEBHOOK RESPONSE FOR DEBUGGING
  window.captureRawWebhookResponse(source, data, {
    receiver_function: 'universalWebhookReceiver',
    processing_method: 'universal'
  });
  
  if (!data) {
    console.warn('⚠️ No data received by universal webhook receiver');
    return { success: false, error: 'No data provided' };
  }
  
  // Auto-detect Hebrew text in incoming data
  const hasHebrewText = detectHebrewText(data);
  console.log('🔍 Hebrew text detected:', hasHebrewText);
  
  // Route to appropriate processor
  let result;
  if (hasHebrewText) {
    console.log('🔄 Routing Hebrew data to processIncomingData...');
    result = window.processIncomingData(data, source);
  } else if (typeof data === 'object') {
    console.log('🔄 Routing object data to processIncomingData...');
    result = window.processIncomingData(data, source);
  } else {
    console.log('🔄 Routing string data to processIncomingData...');
    result = window.processIncomingData({ Body: data }, source);
  }
  
  // Force UI refresh regardless of result
  setTimeout(() => {
    console.log('🔄 Force refreshing forms after webhook data...');
    populateAllForms();
  }, 100);
  
  return result;
};

// Hebrew text detection function
function detectHebrewText(data) {
  const hebrewRegex = /[\u0590-\u05FF]/;
  
  if (typeof data === 'string') {
    return hebrewRegex.test(data);
  }
  
  if (typeof data === 'object') {
    // Check all string values in object
    const checkObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && hebrewRegex.test(obj[key])) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) return true;
        }
      }
      return false;
    };
    return checkObject(data);
  }
  
  return false;
}

// Enhanced event system for webhook processing
window.addEventListener('makeWebhookData', (event) => {
  console.log('📨 Webhook event received:', event.detail);
  window.universalWebhookReceiver(event.detail.data, event.detail.source || 'makeWebhookEvent');
});

// Global webhook processor that can be called from anywhere
window.processWebhookData = function(data, source = 'manual') {
  return window.universalWebhookReceiver(data, source);
};

// 🔧 PHASE 4 FIX: Universal manual input capture system
window.setupUniversalInputCapture = function() {
  console.log('🎯 Setting up universal input capture for all forms...');
  
  // Field mapping for input capture (reverse of populateAllForms mapping)
  const fieldToHelperMapping = {
    // Vehicle fields
    'plate': 'vehicle.plate',
    'plateNumber': 'vehicle.plate', 
    'manufacturer': 'vehicle.manufacturer',
    'model': 'vehicle.model',
    'year': 'vehicle.year',
    'chassis': 'vehicle.chassis',
    'vin': 'vehicle.chassis',
    'km': 'vehicle.km',
    'odo': 'vehicle.km',
    'mileage': 'vehicle.km',
    'engine_volume': 'vehicle.engine_volume',
    'fuel_type': 'vehicle.fuel_type',
    'ownership_type': 'vehicle.ownership_type',
    'trim': 'vehicle.trim',
    'model_type': 'vehicle.model_type',
    'model_code': 'vehicle.model_code',
    'engine_model': 'vehicle.engine_model',
    'drive_type': 'vehicle.drive_type',
    
    // Owner fields
    'owner': 'stakeholders.owner.name',
    'ownerName': 'stakeholders.owner.name',
    'client_name': 'stakeholders.owner.name',
    'ownerPhone': 'stakeholders.owner.phone',
    'owner_phone': 'stakeholders.owner.phone',
    'phone_number': 'stakeholders.owner.phone', // NEW CLEAN FIELD
    'ownerAddress': 'stakeholders.owner.address',
    'owner_address': 'stakeholders.owner.address',
    
    // Garage fields
    'garage': 'stakeholders.garage.name',
    'garageName': 'stakeholders.garage.name',
    'garage_name': 'stakeholders.garage.name',
    'garagePhone': 'stakeholders.garage.phone',
    'garage_phone': 'stakeholders.garage.phone',
    'garageEmail': 'stakeholders.garage.email',
    'garage_email': 'stakeholders.garage.email',
    
    // Case fields
    'damageDate': 'case_info.damage_date',
    'damage_date': 'case_info.damage_date',
    'damageType': 'case_info.damage_type',
    'damage_type': 'case_info.damage_type',
    'location': 'case_info.inspection_location',
    'inspection_location': 'case_info.inspection_location'
  };
  
  // Set up input listeners on all form elements
  const setupInputListener = (element) => {
    if (!element || element.dataset.helperCaptureSetup === 'true') return;
    
    const fieldId = element.id || element.name;
    const helperPath = fieldToHelperMapping[fieldId];
    
    if (helperPath) {
      console.log(`🎯 Setting up capture for field: ${fieldId} → ${helperPath}`);
      
      element.addEventListener('input', function() {
        const value = this.value?.trim();
        if (value && value !== '') {
          console.log(`📝 Manual input captured: ${fieldId} = ${value}`);
          setNestedValue(window.helper, helperPath, value);
          
          // Update meta info  
          window.helper.meta.last_updated = new Date().toISOString();
          saveHelperToAllStorageLocations();
          
          // Visual feedback
          this.style.borderLeft = '3px solid #2196F3';
          this.title = `Manually entered - synced to helper (${helperPath})`;
        }
      });
      
      element.addEventListener('change', function() {
        const value = this.value?.trim();
        if (value && value !== '') {
          console.log(`✅ Manual input confirmed: ${fieldId} = ${value}`);
          setNestedValue(window.helper, helperPath, value);
          window.helper.meta.last_updated = new Date().toISOString();
          saveHelperToAllStorageLocations();
        }
      });
      
      element.dataset.helperCaptureSetup = 'true';
    }
  };
  
  // Find all form elements and set up listeners
  const allInputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="tel"], select, textarea');
  allInputs.forEach(setupInputListener);
  
  console.log(`🎯 Universal input capture setup complete: ${allInputs.length} elements monitored`);
  
  // Monitor for new form elements (dynamic forms)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const newInputs = node.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="tel"], select, textarea');
          newInputs.forEach(setupInputListener);
          
          if (newInputs.length > 0) {
            console.log(`🎯 Added capture to ${newInputs.length} new form elements`);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  return { monitored: allInputs.length, observer };
};

/**
 * Initialize financials section according to helper-structure.md specification
 */
window.initializeFinancialsSection = function() {
  console.log('🏗️ Initializing financials section per helper-structure.md specification');
  
  if (!window.helper.financials) {
    window.helper.financials = {
      "costs": {
        "parts_total": 0,
        "repairs_total": 0,
        "works_total": 0,
        "subtotal": 0
      },
      "fees": {
        "photography": {
          "count": 0,
          "unit_price": 0,
          "total": 0
        },
        "office": {
          "fixed_fee": 0,
          "percentage": 0,
          "total": 0
        },
        "travel": {
          "count": 0,
          "unit_price": 0,
          "total": 0
        },
        "assessment": {
          "hours": 0,
          "hourly_rate": 0,
          "total": 0
        },
        "subtotal": 0
      },
      "taxes": {
        "vat_percentage": 18,
        "vat_amount": 0
      },
      "totals": {
        "before_tax": 0,
        "after_tax": 0,
        "total_compensation": 0,
        "salvage_value": 0,
        "net_settlement": 0
      },
      "calculation_date": "",
      "calculation_method": "",
      "overrides": []
    };
    
    console.log('✅ Financials section initialized per specification');
    window.saveHelperToAllStorageLocations();
  } else {
    console.log('✅ Financials section already exists');
  }
  
  return window.helper.financials;
};

/**
 * Raw webhook response capture for debugging data loss
 * READ-ONLY debugging zone to track all incoming webhook data
 */
window.captureRawWebhookResponse = function(webhookType, rawResponse, metadata = {}) {
  console.log(`🔍 RAW WEBHOOK CAPTURE: ${webhookType}`);
  console.log(`🔍 RAW DATA BEING CAPTURED:`, rawResponse);
  
  // FORCE initialize helper if not exists
  if (!window.helper) {
    console.log('⚠️ Helper not initialized - initializing now');
    window.helper = {};
  }
  
  // Initialize debug section if not exists
  if (!window.helper.debug) {
    console.log('🔧 Initializing debug section for webhook capture');
    window.helper.debug = {
      raw_webhook_responses: [],
      metadata: {
        total_webhooks_captured: 0,
        last_capture: null,
        capture_enabled: true
      }
    };
  }
  
  const timestamp = new Date().toISOString();
  const captureEntry = {
    webhook_type: webhookType,
    timestamp: timestamp,
    raw_response: JSON.parse(JSON.stringify(rawResponse)), // Deep clone to prevent mutations
    metadata: {
      ...metadata,
      capture_sequence: window.helper.debug.metadata.total_webhooks_captured + 1,
      response_size: JSON.stringify(rawResponse).length,
      response_keys: Array.isArray(rawResponse) ? rawResponse.length : Object.keys(rawResponse || {}).length
    },
    processing_info: {
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      helper_state_before: {
        meta_plate: window.helper.meta?.plate,
        case_id: window.helper.meta?.case_id,
        last_updated: window.helper.meta?.last_updated
      }
    }
  };
  
  // Add to capture array (limit to last 100 entries to prevent memory issues)
  window.helper.debug.raw_webhook_responses.push(captureEntry);
  if (window.helper.debug.raw_webhook_responses.length > 100) {
    window.helper.debug.raw_webhook_responses.shift(); // Remove oldest entry
  }
  
  // Update metadata
  window.helper.debug.metadata.total_webhooks_captured++;
  window.helper.debug.metadata.last_capture = timestamp;
  
  // Log summary for debugging
  console.log(`📊 WEBHOOK CAPTURE SUMMARY:`, {
    type: webhookType,
    sequence: captureEntry.metadata.capture_sequence,
    size: captureEntry.metadata.response_size,
    keys: captureEntry.metadata.response_keys,
    total_captured: window.helper.debug.metadata.total_webhooks_captured
  });
  
  // Safe save to storage (handle missing function)
  if (window.saveHelperToAllStorageLocations) {
    window.saveHelperToAllStorageLocations();
  } else {
    // Fallback: save to sessionStorage directly
    try {
      sessionStorage.setItem('helper', JSON.stringify(window.helper));
      console.log('💾 Saved to sessionStorage (fallback)');
    } catch (e) {
      console.warn('⚠️ Could not save to storage:', e);
    }
  }
  
  return captureEntry.metadata.capture_sequence;
};

/**
 * Initialize debug section immediately (for testing)
 */
window.initializeDebugSection = function() {
  console.log('🔧 Force initializing debug section...');
  
  if (!window.helper) {
    window.helper = {};
  }
  
  if (!window.helper.debug) {
    window.helper.debug = {
      raw_webhook_responses: [],
      metadata: {
        total_webhooks_captured: 0,
        last_capture: null,
        capture_enabled: true
      }
    };
    console.log('✅ Debug section initialized');
  } else {
    console.log('✅ Debug section already exists');
  }
  
  // Test the capture function
  window.captureRawWebhookResponse('INITIALIZATION_TEST', {
    test_data: 'This is a test webhook capture',
    timestamp: new Date().toISOString(),
    source: 'manual_initialization'
  }, {
    test: true,
    initialization: true
  });
  
  // Safe save to storage (handle missing function)
  if (window.saveHelperToAllStorageLocations) {
    window.saveHelperToAllStorageLocations();
  } else {
    // Fallback: save to sessionStorage directly
    try {
      sessionStorage.setItem('helper', JSON.stringify(window.helper));
      console.log('💾 Saved to sessionStorage (fallback)');
    } catch (e) {
      console.warn('⚠️ Could not save to storage:', e);
    }
  }
  
  return window.helper.debug;
};

/**
 * Enhanced error handling wrapper for critical functions
 */
window.safeHelperOperation = function(operation, fallbackValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error('🚨 SAFE HELPER OPERATION ERROR:', error);
    console.error('🚨 Stack trace:', error.stack);
    
    // Capture error for debugging
    if (window.captureRawWebhookResponse) {
      window.captureRawWebhookResponse('ERROR_CAPTURE', {
        error_message: error.message,
        error_stack: error.stack,
        timestamp: new Date().toISOString()
      }, {
        error_type: 'safe_operation_error',
        critical: true
      });
    }
    
    return fallbackValue;
  }
};

/**
 * Process comprehensive invoice JSON using actual helper-structure.md specification
 * Maintains compatibility with existing system while capturing full data
 */
window.processComprehensiveInvoiceJSON = function(invoiceFile, comprehensiveJSON) {
  console.log(`📄 COMPREHENSIVE INVOICE: Processing with actual specification`);
  
  // Ensure both structures exist - maintain compatibility
  if (!window.helper.invoices) {
    window.helper.invoices = [];  // Original simple structure (used by /invoice upload.html)
  }
  
  // Initialize financials section per specification
  window.initializeFinancialsSection();
  
  if (!window.helper.financials.invoice_processing) {
    window.helper.financials.invoice_processing = {
      comprehensive_data: [],
      ocr_confidence_scores: [],
      processing_history: [],
      failed_attempts: [],
      manual_corrections: [],
      metadata: {
        total_invoices_processed: 0,
        last_processed: null,
        processing_engine: 'make_com_ocr',
        supported_formats: ['pdf', 'jpg', 'png', 'webp']
      }
    };
  }
  
  const timestamp = new Date().toISOString();
  
  // Validate comprehensive JSON matches specification
  const expectedFields = [
    'מספר רכב', 'יצרן', 'דגם', 'בעל הרכב', 'שם מוסך', 'חלקים', 'עבודות', 'תיקונים'
  ];
  
  let isValidSpec = true;
  const missingFields = [];
  
  expectedFields.forEach(field => {
    if (!comprehensiveJSON.hasOwnProperty(field)) {
      missingFields.push(field);
      isValidSpec = false;
    }
  });
  
  if (!isValidSpec) {
    console.warn(`⚠️ Invoice JSON missing expected fields: ${missingFields.join(', ')}`);
  }
  
  // Add processing metadata to comprehensive data
  comprehensiveJSON._processing_info = {
    filename: invoiceFile?.name || 'unknown',
    size: invoiceFile?.size || 0,
    type: invoiceFile?.type || 'application/json',
    uploaded_at: timestamp,
    processing_status: 'completed',
    specification_compliance: isValidSpec,
    missing_fields: missingFields
  };
  
  // Add to comprehensive data store
  window.helper.financials.invoice_processing.comprehensive_data.push(comprehensiveJSON);
  
  // Create simplified version for existing system compatibility  
  const simpleInvoice = {
    plate: comprehensiveJSON["מספר רכב"] || window.getPlateNumber() || "",
    owner: comprehensiveJSON["בעל הרכב"] || window.getOwnerName() || "",
    garage_name: comprehensiveJSON["שם מוסך"] || "",
    date: comprehensiveJSON["תאריך"] || "",
    invoice_type: "mixed", // Default type
    items: (comprehensiveJSON["חלקים"] || []).map(part => ({
      name: part["שם חלק"] || "",
      description: part["תיאור"] || "",
      quantity: parseInt(part["כמות"]) || 1,
      unit_price: parseFloat(part["עלות"]?.replace(/[,]/g, '')) || 0
    })),
    total: parseFloat(comprehensiveJSON["עלות כוללת"]?.replace(/[,]/g, '')) || 0,
    processed_at: timestamp
  };
  
  // Add to original simple structure (maintains compatibility)
  window.helper.invoices.push(simpleInvoice);
  
  // Update processing metadata
  const metadata = window.helper.financials.invoice_processing.metadata;
  metadata.total_invoices_processed++;
  metadata.last_processed = timestamp;
  
  // Update helper metadata
  window.helper.meta.last_updated = timestamp;
  if (!window.helper.meta.total_invoices) {
    window.helper.meta.total_invoices = 0;
  }
  window.helper.meta.total_invoices = window.helper.invoices.length;
  
  window.saveHelperToAllStorageLocations();
  
  const partsCount = comprehensiveJSON["חלקים"]?.length || 0;
  const worksCount = comprehensiveJSON["עבודות"]?.length || 0;
  const repairsCount = comprehensiveJSON["תיקונים"]?.length || 0;
  
  console.log(`✅ COMPREHENSIVE INVOICE: Processed with ${partsCount} parts, ${worksCount} works, ${repairsCount} repairs`);
  console.log(`📊 Total comprehensive invoices: ${window.helper.financials.invoice_processing.comprehensive_data.length}`);
  console.log(`📊 Total simple invoices: ${window.helper.invoices.length}`);
  
  return {
    success: true,
    comprehensive_count: window.helper.financials.invoice_processing.comprehensive_data.length,
    simple_count: window.helper.invoices.length,
    specification_compliance: isValidSpec,
    missing_fields: missingFields
  };
};

// Auto-setup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.setupUniversalInputCapture(), 1000);
  });
} else {
  setTimeout(() => window.setupUniversalInputCapture(), 1000);
}

// ✅ FIXED: Use window exports instead of ES6 export (since loaded as regular script)
// All functions are already available on window, no need for additional exports
console.log('✅ Helper.js loaded successfully - all functions available on window object');
// ✅ FIXED: All helper functions are available on window object, no ES6 exports needed

// Export new centralized data management functions
// export const setPlateNumber = window.setPlateNumber;
// export const getPlateNumber = window.getPlateNumber;
// export const setOwnerName = window.setOwnerName;
// export const getOwnerName = window.getOwnerName;
// export const setOwnerPhone = window.setOwnerPhone;
// export const getOwnerPhone = window.getOwnerPhone;
// export const setOwnerAddress = window.setOwnerAddress;
// export const getOwnerAddress = window.getOwnerAddress;
// export const setOwnerEmail = window.setOwnerEmail;
// export const getOwnerEmail = window.getOwnerEmail;
// export const cleanupDuplicateOwnerData = window.cleanupDuplicateOwnerData;
// export const cleanupDuplicateVehicleData = window.cleanupDuplicateVehicleData;
// export const setVehicleField = window.setVehicleField;
// export const fixHelperStructure = window.fixHelperStructure;
// export const enhanceEstimateSections = window.enhanceEstimateSections;
// export const setActiveReportType = window.setActiveReportType;
// export const getActiveReportData = window.getActiveReportData;
// export const addToPartsBank = window.addToPartsBank;
// export const processInvoiceOCR = window.processInvoiceOCR;
// export const captureFeeModuleData = window.captureFeeModuleData;
// export const searchPartsBank = window.searchPartsBank;
// export const protectPlateNumber = window.protectPlateNumber;
// export const testPlateNormalization = window.testPlateNormalization;
// export const processComprehensiveInvoiceJSON = window.processComprehensiveInvoiceJSON;
// export const initializeFinancialsSection = window.initializeFinancialsSection;
// export const captureRawWebhookResponse = window.captureRawWebhookResponse;
// export const initializeDebugSection = window.initializeDebugSection;
// populateAllFormsWithRetry is already declared as a function above
// export const testWithActualWebhookData = window.testWithActualWebhookData;

// Additional exports that modules might need
// export const saveHelperToStorage = saveHelperToAllStorageLocations;
// export { saveHelperToAllStorageLocations };
// export { populateAllFormsWithRetry };

// Expose populate functions on window object
window.populateAllForms = populateAllForms;
window.populateAllFormsWithRetry = populateAllFormsWithRetry;
window.saveHelperToStorage = saveHelperToAllStorageLocations;

// Add missing refreshAllModuleForms function
window.refreshAllModuleForms = function() {
  console.log('🔄 Refreshing all module forms...');
  if (typeof window.populateAllForms === 'function') {
    window.populateAllForms();
  } else if (typeof window.populateAllFormsWithRetry === 'function') {
    window.populateAllFormsWithRetry();
  } else {
    console.warn('⚠️ No populate function available - trying direct form population');
    // Fallback: try to populate forms directly if available
    if (typeof window.populateFormFields === 'function') {
      window.populateFormFields();
    }
  }
};

// Add missing manual override tracking functions
window.markFieldAsManuallyModified = function(fieldId, value, origin) {
  console.log(`🔄 Marking field ${fieldId} as manually modified:`, value, `(origin: ${origin})`);
  
  if (!window.helper) {
    console.warn('Helper not initialized, cannot mark field as modified');
    return;
  }
  
  // Initialize overrides structure
  if (!window.helper.meta) window.helper.meta = {};
  if (!window.helper.meta.manual_overrides) window.helper.meta.manual_overrides = [];
  
  // Create override record
  const override = {
    fieldId: fieldId,
    value: value,
    origin: origin,
    timestamp: new Date().toISOString(),
    type: 'manual_override'
  };
  
  // Remove any existing override for this field
  window.helper.meta.manual_overrides = window.helper.meta.manual_overrides.filter(
    o => o.fieldId !== fieldId
  );
  
  // Add new override
  window.helper.meta.manual_overrides.push(override);
  
  // Update helper timestamp
  window.helper.meta.last_updated = new Date().toISOString();
  
  // Save to storage
  if (typeof window.saveHelperToStorage === 'function') {
    window.saveHelperToStorage();
  }
  
  console.log(`✅ Field ${fieldId} marked as manually modified`);
};

window.isFieldManuallyModified = function(fieldId) {
  if (!window.helper?.meta?.manual_overrides) {
    return false;
  }
  
  const override = window.helper.meta.manual_overrides.find(o => o.fieldId === fieldId);
  return !!override;
};

// ✅ RESTORE CRITICAL EXPORTS: Essential functions that modules need
export const helper = window.helper;
export const updateHelper = window.updateHelper;
export const saveHelperToStorage = window.saveHelperToStorage;
export const broadcastHelperUpdate = window.broadcastHelperUpdate;
export const processIncomingData = window.processIncomingData;
export const refreshAllModuleForms = window.refreshAllModuleForms;
export const markFieldAsManuallyModified = window.markFieldAsManuallyModified;
export const isFieldManuallyModified = window.isFieldManuallyModified;
