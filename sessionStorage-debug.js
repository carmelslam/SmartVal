// SessionStorage Debug and Data Capture System
// This script provides comprehensive debugging for sessionStorage data flow issues

console.log('🔍 SessionStorage debug system loaded');

// Main debugging function
window.debugSessionStorage = function() {
    console.log('='.repeat(60));
    console.log('🔍 COMPREHENSIVE SESSIONSTORAGE DEBUG');
    console.log('='.repeat(60));
    
    // 1. List all sessionStorage keys and values
    console.log('\n📋 ALL SESSIONSTORAGE KEYS:');
    const allKeys = Object.keys(sessionStorage);
    console.log('Total keys found:', allKeys.length);
    
    allKeys.forEach(key => {
        try {
            const value = sessionStorage.getItem(key);
            console.log(`\n🔑 ${key}:`);
            
            // Try to parse as JSON for better display
            try {
                const parsed = JSON.parse(value);
                console.log('  📄 Type: JSON Object');
                console.log('  📄 Content:', parsed);
            } catch {
                console.log('  📄 Type: String');
                console.log('  📄 Content:', value.substring(0, 200) + (value.length > 200 ? '...' : ''));
            }
        } catch (error) {
            console.log(`❌ Error reading key ${key}:`, error);
        }
    });
    
    // 2. Check specific car data keys
    console.log('\n🚗 SPECIFIC CAR DATA ANALYSIS:');
    const carDataKeys = ['makeCarData', 'carData', 'helper', 'lastWebhookResponse'];
    
    carDataKeys.forEach(key => {
        const data = sessionStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log(`\n✅ ${key} found with fields:`, Object.keys(parsed));
                
                // Special analysis for each key type
                if (key === 'makeCarData') {
                    console.log('  🔍 Make.com data includes:');
                    console.log('    - Manufacturer:', parsed.manufacturer || parsed.יצרן || 'Missing');
                    console.log('    - Model:', parsed.model || parsed.דגם || 'Missing');
                    console.log('    - Year:', parsed.year || parsed['שנת ייצור'] || 'Missing');
                    console.log('    - Chassis:', parsed.chassis || parsed['מספר שלדה'] || 'Missing');
                    console.log('    - Office Code:', parsed.office_code || parsed['קוד משרד התחבורה'] || 'Missing');
                }
                
                if (key === 'helper') {
                    console.log('  🔍 Helper sections:');
                    const sections = ['vehicle', 'car_details', 'client', 'meta', 'general_info'];
                    sections.forEach(section => {
                        if (parsed[section]) {
                            console.log(`    - ${section}:`, Object.keys(parsed[section]));
                        } else {
                            console.log(`    - ${section}: Missing`);
                        }
                    });
                }
            } catch (error) {
                console.log(`❌ Error parsing ${key}:`, error);
            }
        } else {
            console.log(`❌ ${key}: Not found`);
        }
    });
    
    // 3. Check for missing critical fields
    console.log('\n⚠️ MISSING FIELD ANALYSIS:');
    const criticalFields = [
        'manufacturer', 'יצרן',
        'model', 'דגם', 
        'year', 'שנת ייצור',
        'chassis', 'מספר שלדה',
        'office_code', 'קוד משרד התחבורה',
        'fuel_type', 'סוג דלק',
        'engine_volume', 'נפח מנוע'
    ];
    
    const makeData = sessionStorage.getItem('makeCarData');
    if (makeData) {
        try {
            const parsed = JSON.parse(makeData);
            const missingFields = criticalFields.filter(field => !parsed[field]);
            if (missingFields.length > 0) {
                console.log('❌ Missing fields in makeCarData:', missingFields);
            } else {
                console.log('✅ All critical fields present in makeCarData');
            }
        } catch (error) {
            console.log('❌ Could not analyze makeCarData:', error);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DEBUG COMPLETE');
    console.log('='.repeat(60));
};

// Function to manually populate sessionStorage with complete data from screenshots
window.populateSessionStorageWithScreenshotData = function() {
    console.log('📸 Populating sessionStorage with exact screenshot data...');
    
    // Exact data structure from the Make.com screenshot
    const completeCarData = {
        // Basic case info
        plate: '5785269',
        owner: 'כרמל כיוף',
        date: new Date().toISOString().split('T')[0],
        location: 'UMI חיפה',
        case_id: 'YC-5785269-2025',
        
        // Vehicle details from Make.com Hebrew MOT data
        manufacturer: 'ביואיק',
        יצרן: 'ביואיק',
        model: 'LUCERNE', 
        דגם: 'LUCERNE',
        model_type: 'סדאן',
        'סוג דגם': 'סדאן',
        year: '2009',
        'שנת ייצור': '05/2009',
        production_date: '05/2009',
        chassis: '1G4HD57258U196450',
        'מספר שלדה': '1G4HD57258U196450',
        engine_volume: '3791',
        'נפח מנוע': '3791',
        fuel_type: 'בנזין',
        'סוג דלק': 'בנזין',
        model_code: 'HD572',
        'קוד דגם רכב': 'HD572',
        'מספר דגם הרכב': 'HD572', // From Make.com - universal code field
        universal_code: 'HD572', // This is universal, not Levi-specific
        engine_model: '428',
        'דגם מנוע': '428',
        drive_type: '4X2',
        הנעה: '4X2',
        office_code: '156-11',
        'קוד משרד התחבורה': '156-11',
        
        // Vehicle type
        vehicle_type: 'רכב פרטי',
        'סוג רכב': 'רכב פרטי',
        
        // Ownership
        ownership_type: 'פרטי',
        'סוג בעלות': 'פרטי',
        
        // Meta
        data_source: 'make_com_hebrew_mot',
        make_com_processed: true,
        processing_timestamp: new Date().toISOString()
    };
    
    // Complete helper structure with all sections
    const completeHelper = {
        vehicle: completeCarData,
        car_details: completeCarData,
        client: {
            name: 'כרמל כיוף',
            insurance_agent: '', // Will be filled from general_info
            insurance_agent_phone: '',
            contact_phone: '',
            email: ''
        },
        meta: {
            plate: '5785269',
            case_id: 'YC-5785269-2025',
            owner_name: 'כרמל כיוף',
            creation_date: new Date().toISOString(),
            last_updated: new Date().toISOString()
        },
        general_info: {
            // These would typically come from general_info.html form
            agent_name: '',
            agent_phone: '',
            insurance_company: '',
            policy_number: '',
            claim_number: '',
            incident_date: '',
            incident_description: ''
        }
    };
    
    // Store all data with multiple keys for compatibility
    sessionStorage.setItem('makeCarData', JSON.stringify(completeCarData));
    sessionStorage.setItem('carData', JSON.stringify(completeCarData));
    sessionStorage.setItem('helper', JSON.stringify(completeHelper));
    
    // Store individual components for compatibility
    sessionStorage.setItem('vehicle', JSON.stringify(completeCarData));
    sessionStorage.setItem('car_details', JSON.stringify(completeCarData));
    
    // Store raw Make.com response simulation
    const simulatedMakeResponse = {
        Body: `פרטי רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג דגם: סדאן
שנת ייצור: 05/2009
מספר שלדה: 1G4HD57258U196450
שם בעל הרכב: כרמל כיוף
סוג בעלות: פרטי
נפח מנוע: 3791
סוג דלק: בנזין
קוד דגם רכב: HD572
דגם מנוע: 428
הנעה: 4X2
מיקום: UMI חיפה
קוד משרד התחבורה: 156-11`,
        timestamp: new Date().toISOString(),
        status: 'success'
    };
    
    sessionStorage.setItem('lastWebhookResponse', JSON.stringify(simulatedMakeResponse));
    
    // Store password for prefill
    sessionStorage.setItem('prefillPassword', '8881');
    
    console.log('✅ Complete screenshot data populated in sessionStorage');
    console.log('📋 Stored keys:', ['makeCarData', 'carData', 'helper', 'vehicle', 'car_details', 'lastWebhookResponse']);
    
    // Update global helper if it exists
    if (typeof window.updateHelper === 'function') {
        try {
            window.updateHelper('vehicle', completeCarData);
            window.updateHelper('car_details', completeCarData);
            window.updateHelper('meta', completeHelper.meta);
            console.log('✅ Global helper updated');
        } catch (error) {
            console.log('❌ Failed to update global helper:', error);
        }
    }
    
    // Refresh floating screen if available
    if (typeof window.refreshCarData === 'function') {
        setTimeout(() => {
            window.refreshCarData();
            console.log('🔄 Floating screen refreshed');
        }, 500);
    }
    
    return completeCarData;
};

// Function to clear all car-related sessionStorage for clean testing
window.clearCarSessionStorage = function() {
    console.log('🧹 Clearing all car-related sessionStorage...');
    
    const carKeys = [
        'makeCarData', 'carData', 'helper', 'vehicle', 'car_details',
        'lastWebhookResponse', 'client', 'meta', 'general_info'
    ];
    
    carKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed: ${key}`);
    });
    
    console.log('✅ Car sessionStorage cleared');
};

// Function to validate data completeness
window.validateSessionStorageData = function() {
    console.log('✅ VALIDATING SESSIONSTORAGE DATA COMPLETENESS');
    
    const requiredFields = {
        'Basic Info': ['plate', 'owner', 'date', 'location'],
        'Vehicle Details': ['manufacturer', 'model', 'year', 'chassis'],
        'Technical Info': ['engine_volume', 'fuel_type', 'model_code'],
        'Administrative': ['office_code']
    };
    
    const makeData = sessionStorage.getItem('makeCarData');
    if (!makeData) {
        console.log('❌ No makeCarData found');
        return false;
    }
    
    let parsed;
    try {
        parsed = JSON.parse(makeData);
    } catch (error) {
        console.log('❌ Invalid JSON in makeCarData');
        return false;
    }
    
    let allValid = true;
    
    Object.entries(requiredFields).forEach(([category, fields]) => {
        console.log(`\n📋 ${category}:`);
        
        fields.forEach(field => {
            const value = parsed[field];
            const isValid = value && value.toString().trim();
            console.log(`  ${isValid ? '✅' : '❌'} ${field}: ${value || 'Missing'}`);
            if (!isValid) allValid = false;
        });
    });
    
    console.log(`\n${allValid ? '✅' : '❌'} Overall validation: ${allValid ? 'PASSED' : 'FAILED'}`);
    return allValid;
};

// Auto-run basic debug on load
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        console.log('🔍 Auto-running sessionStorage debug...');
        window.debugSessionStorage();
    }, 2000);
});

// Export all functions for manual use
window.sessionStorageDebug = {
    debug: window.debugSessionStorage,
    populateScreenshotData: window.populateSessionStorageWithScreenshotData,
    clear: window.clearCarSessionStorage,
    validate: window.validateSessionStorageData
};

console.log('✅ SessionStorage debug system ready');
console.log('🔧 Available functions:');
console.log('  - debugSessionStorage()');
console.log('  - populateSessionStorageWithScreenshotData()');
console.log('  - clearCarSessionStorage()');
console.log('  - validateSessionStorageData()');