export function setNestedValue(obj, path, value) {
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

export function deepMerge(target, source) {
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

export function saveHelperToAllStorageLocations() {
  try {
    const helperString = JSON.stringify(window.helper);
    const timestamp = new Date().toISOString();
    sessionStorage.setItem('helper', helperString);
    sessionStorage.setItem('helper_backup', helperString);
    sessionStorage.setItem('helper_timestamp', timestamp);
    localStorage.setItem('helper_data', helperString);
    localStorage.setItem('helper_last_save', timestamp);
    console.log('✅ Helper saved to all storage locations (fallback method)');
    return true;
  } catch (error) {
    console.error('❌ Failed to save helper to storage:', error);
    return false;
  }
}

export function validatePlateNumber(incomingPlate, source = 'unknown') {
  if (!window.helper.meta.plate_locked || !window.helper.meta.original_plate) {
    return { valid: true, action: 'accept' };
  }

  const originalPlate = window.helper.meta.original_plate.replace(/[-\s]/g, '').toUpperCase().trim();
  const newPlate = String(incomingPlate).replace(/[-\s]/g, '').toUpperCase().trim();

  console.log(`🔍 VALIDATION: Checking plate "${newPlate}" from ${source} against protected "${originalPlate}"`);

  if (originalPlate === newPlate) {
    console.log('✅ VALIDATION: Plate numbers match - allowing update');
    return { valid: true, action: 'accept', message: 'Plate numbers match' };
  } else {
    console.warn('⚠️ VALIDATION: Plate mismatch detected!');
    console.warn(`   Original (protected): "${originalPlate}" from ${window.helper.meta.plate_protection_source}`);
    console.warn(`   Incoming (rejected):  "${newPlate}" from ${source}`);
    return {
      valid: false,
      action: 'reject',
      message: `Plate number mismatch detected!\n\nProtected plate: "${originalPlate}" (from ${window.helper.meta.plate_protection_source})\nIncoming plate: "${newPlate}" (from ${source})\n\nThe original plate number is protected and cannot be changed.`,
      originalPlate,
      incomingPlate: newPlate,
      source
    };
  }
}

export function getPlateProtectionStatus() {
  return {
    isProtected: window.helper?.meta?.plate_locked || false,
    originalPlate: window.helper?.meta?.original_plate || '',
    source: window.helper?.meta?.plate_protection_source || '',
    currentPlate: window.helper?.meta?.plate || '',
    alertCount: window.helper?.system?.protection_alerts?.length || 0
  };
}

export function showPlateProtectionAlert(validationResult) {
  const alertMessage = `🚨 PLATE NUMBER PROTECTION ALERT 🚨\n\n${validationResult.message}`;
  alert(alertMessage);
  console.error('%c🚨 PLATE PROTECTION ALERT', 'color: red; font-size: 16px; font-weight: bold;');
  console.error(validationResult.message);
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
}

export function updateHelper(field, value) {
  if (!window.helper && typeof window.initializeHelper === 'function') {
    window.initializeHelper();
  }

  if (field === 'case_info' && value && value.damage_date) {
    const isFromGeneralInfo = sessionStorage.getItem('damageDate_manualEntry') === 'true';
    const existingManualDate = window.helper?.case_info?.damage_date;
    if (isFromGeneralInfo) {
      console.log('✅ ALLOWING case_info.damage_date update from manual entry:', value.damage_date);
    } else if (existingManualDate && existingManualDate !== value.damage_date) {
      console.log('🚫 PROTECTING existing manual damage_date entry. Rejecting value:', value.damage_date);
      value = { ...value };
      delete value.damage_date;
    } else {
      console.log('✅ ALLOWING case_info.damage_date update (no manual entry exists):', value.damage_date);
    }
  }

  if (field === 'plate' || (typeof value === 'object' && value && value.plate)) {
    const incomingPlate = typeof value === 'string' ? value : value.plate;
    if (incomingPlate) {
      const validation = validatePlateNumber(incomingPlate, 'updateHelper');
      if (!validation.valid) {
        showPlateProtectionAlert(validation);
        console.error('🚫 BLOCKING plate update from updateHelper - validation failed');
        return false;
      }
    }
  }

  const fieldMappings = {
    'plate': ['vehicle.plate', 'meta.plate', 'case_info.plate'],
    'manufacturer': ['vehicle.manufacturer'],
    'model': ['vehicle.model'],
    'year': ['vehicle.year'],
    'owner': ['stakeholders.owner.name'],
    'garage': ['stakeholders.garage.name'],
    'insurance': ['stakeholders.insurance.company']
  };

  const targets = fieldMappings[field] || [field];
  targets.forEach(target => {
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
  return true;
}

export function updateHelperAndSession(field, value) {
  updateHelper(field, value);
}

export function broadcastHelperUpdate(sections, source) {
  const sectionList = Array.isArray(sections) ? sections.join(', ') : String(sections || 'unknown');
  console.log(`Broadcasting helper update: ${sectionList} (source: ${source || 'unknown'})`);
  setTimeout(() => {
    if (typeof window.populateAllForms === 'function') {
      window.populateAllForms();
    }
  }, 200);
}
