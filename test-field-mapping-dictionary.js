// Test script for field-mapping-dictionary.js Hebrew character handling analysis
// Comprehensive testing of Hebrew field mappings and character encoding

console.log('📚 Testing Field Mapping Dictionary Hebrew Handling...');

// Import the Hebrew mappings from field-mapping-dictionary.js
const HEBREW_TO_ENGLISH = {
  // Vehicle Identification (from the actual file)
  'פרטי רכב': 'plate',
  'מס\' רכב': 'plate',
  "מס' רכב": 'plate',         // Real apostrophe from Make.com  
  'מס׳ רכב': 'plate',         // Hebrew geresh character
  'מס״ רכב': 'plate',         // Hebrew gershayim character
  'מספר רכב': 'plate',
  'מס רכב': 'plate',
  'לוחית רישוי': 'plate',
  'מספר לוחית': 'plate',
  
  // Manufacturer & Model
  'שם היצרן': 'manufacturer',
  'יצרן': 'manufacturer',
  'שם רכב': 'manufacturer',
  'חברת יצור': 'manufacturer',
  'דגם': 'model',
  'שם דגם': 'model',
  'דגם רכב': 'model',
  
  // Vehicle Type & Category
  'סוג הדגם': 'model_type',
  'סוג הרכב': 'vehicle_type',
  'סוג רכב': 'vehicle_type',
  'רמת גימור': 'trim',
  'גימור': 'trim',
  'ציוד': 'equipment',
  'רמת ציוד': 'equipment',
  
  // Technical specifications
  'מספר שילדה': 'chassis',
  'מספר שלדה': 'chassis',
  'שילדה': 'chassis',
  'שלדה': 'chassis',
  'שנת ייצור': 'year',
  'שנת יצור': 'year',
  'שנה': 'year',
  'מודל שנה': 'model_year',
  'נפח מנוע': 'engine_volume',
  'נפח': 'engine_volume',
  'מנוע': 'engine_model',
  'סוג דלק': 'fuel_type',
  'דלק': 'fuel_type',
  'מספר דגם הרכב': 'model_code',
  'קוד דגם': 'model_code',
  'דגם מנוע': 'engine_model',
  'הנעה': 'drive_type'
};

// Test scenarios for Hebrew character handling
const hebrewTestScenarios = [
  {
    name: 'Standard Hebrew Fields',
    fields: {
      'מספר רכב': '5785269',
      'יצרן': 'ביואיק',
      'דגם': 'LUCERNE',
      'שנת ייצור': '2009'
    }
  },
  {
    name: 'Apostrophe Variants',
    fields: {
      'מס\' רכב': '1111111',    // Regular apostrophe
      'מס' רכב': '2222222',     // Curly apostrophe
      'מס׳ רכב': '3333333',     // Hebrew geresh
      'מס״ רכב': '4444444'      // Hebrew gershayim
    }
  },
  {
    name: 'Spacing Variations',
    fields: {
      'מס\' רכב': '1111111',    // Standard
      'מס \'רכב': '2222222',     // Space before apostrophe
      'מס\' רכב ': '3333333',   // Trailing space
      ' מס\' רכב': '4444444'    // Leading space
    }
  },
  {
    name: 'Case Sensitivity',
    fields: {
      'יצרן': 'ביואיק',
      'יצרן': 'BUICK',
      'דגם': 'LUCERNE',
      'דגם': 'lucerne'
    }
  },
  {
    name: 'Mixed Hebrew-English',
    fields: {
      'מס\' רכב': '5785269',
      'Manufacturer': 'ביואיק',
      'דגם': 'LUCERNE',
      'Year': '2009'
    }
  },
  {
    name: 'Corrupted Encoding',
    fields: {
      'מ×¡â€™ רכב': '5785269',    // UTF-8 corruption
      'יצר×Ÿ': 'ביואיק',          // Corrupted Hebrew
      'ק××× ×"××': 'פרטי'         // Heavily corrupted
    }
  },
  {
    name: 'Unicode Normalization Issues',
    fields: {
      'מס\u0027 רכב': '1111111', // Explicit regular apostrophe
      'מס\u2019 רכב': '2222222', // Right single quotation mark
      'מס\u05F3 רכב': '3333333', // Hebrew punctuation geresh
      'מס\u05F4 רכב': '4444444'  // Hebrew punctuation gershayim
    }
  },
  {
    name: 'Additional Hebrew Fields (not in dictionary)',
    fields: {
      'מספר פוליסה': 'POL123456',      // Policy number
      'חברת ביטוח': 'הכלל ביטוח',      // Insurance company
      'מקום בדיקה': 'תל אביב',         // Inspection location
      'תאריך נזק': '15/03/2024',      // Damage date
      'סוג נזק': 'התנגשות אחורית',     // Damage type
      'מוסך מבצע': 'מוסך דוד',       // Performing garage
      'מספר תביעה': 'CL789012'       // Claim number
    }
  }
];

// Function to test Hebrew field translation
function testHebrewTranslation() {
  console.log('\n🔤 Testing Hebrew Field Translation:');
  
  // Test each mapped Hebrew field
  Object.entries(HEBREW_TO_ENGLISH).forEach(([hebrew, english]) => {
    console.log(`"${hebrew}" → "${english}"`);
    
    // Test character composition
    const chars = [...hebrew];
    const hasSpecialChars = chars.some(char => {
      const code = char.charCodeAt(0);
      return code === 0x0027 || code === 0x2019 || code === 0x05F3 || code === 0x05F4; // Various apostrophes
    });
    
    if (hasSpecialChars) {
      console.log(`  ⚠️ Contains special characters: ${chars.filter(char => {
        const code = char.charCodeAt(0);
        return code === 0x0027 || code === 0x2019 || code === 0x05F3 || code === 0x05F4;
      }).map(char => `"${char}"(U+${char.charCodeAt(0).toString(16).toUpperCase()})`).join(', ')}`);
    }
  });
  
  console.log(`\nTotal Hebrew mappings: ${Object.keys(HEBREW_TO_ENGLISH).length}`);
}

// Function to simulate field mapping process
function simulateFieldMapping(fields) {
  console.log('\n🔍 Simulating Field Mapping Process:');
  
  const results = {
    mapped: {},
    unmapped: {},
    conflicts: {},
    encodingIssues: {}
  };
  
  Object.entries(fields).forEach(([fieldName, value]) => {
    // Test direct mapping
    if (HEBREW_TO_ENGLISH[fieldName]) {
      const englishField = HEBREW_TO_ENGLISH[fieldName];
      
      // Check for conflicts (multiple Hebrew fields mapping to same English field)
      if (results.mapped[englishField]) {
        results.conflicts[englishField] = results.conflicts[englishField] || [];
        results.conflicts[englishField].push({
          hebrew: fieldName,
          value: value,
          previous: results.mapped[englishField]
        });
      } else {
        results.mapped[englishField] = {
          hebrew: fieldName,
          value: value
        };
      }
      
      console.log(`✅ Mapped: "${fieldName}" → "${englishField}" = "${value}"`);
    } else {
      results.unmapped[fieldName] = value;
      
      // Check if it might be an encoding issue
      const hasCorruptionMarkers = /[×â€]/.test(fieldName);
      const hasValidHebrew = /[\u0590-\u05FF]/.test(fieldName);
      
      if (hasCorruptionMarkers || (hasValidHebrew && fieldName.length > 20)) {
        results.encodingIssues[fieldName] = value;
        console.log(`❌ Encoding issue: "${fieldName}" = "${value}"`);
      } else {
        console.log(`⚠️ Unmapped: "${fieldName}" = "${value}"`);
      }
    }
  });
  
  return results;
}

// Function to test character normalization
function testCharacterNormalization() {
  console.log('\n🔄 Testing Character Normalization:');
  
  // Test different apostrophe characters in same field name
  const apostropheTests = [
    { name: 'Regular Apostrophe', field: 'מס\u0027 רכב', code: 0x0027 },
    { name: 'Right Single Quote', field: 'מס\u2019 רכב', code: 0x2019 },
    { name: 'Hebrew Geresh', field: 'מס\u05F3 רכב', code: 0x05F3 },
    { name: 'Hebrew Gershayim', field: 'מס\u05F4 רכב', code: 0x05F4 }
  ];
  
  console.log('Testing apostrophe normalization:');
  apostropheTests.forEach(({name, field, code}) => {
    const mapped = !!HEBREW_TO_ENGLISH[field];
    const normalized = field.normalize('NFC');
    const isNormalized = field === normalized;
    
    console.log(`  ${name} (U+${code.toString(16).toUpperCase()}): mapped=${mapped}, normalized=${isNormalized}`);
    
    if (!mapped) {
      // Try to find similar field
      const similar = Object.keys(HEBREW_TO_ENGLISH).find(key => 
        key.replace(/[\u0027\u2019\u05F3\u05F4]/g, '') === field.replace(/[\u0027\u2019\u05F3\u05F4]/g, '')
      );
      if (similar) {
        console.log(`    → Similar field found: "${similar}"`);
      }
    }
  });
}

// Function to identify missing Hebrew fields
function identifyMissingFields() {
  console.log('\n🔍 Identifying Missing Hebrew Fields:');
  
  // Common Hebrew fields that might be missing
  const commonHebrewFields = [
    'מספר פוליסה',      // Policy number
    'חברת ביטוח',       // Insurance company  
    'מספר תביעה',       // Claim number
    'מוסך מבצע',       // Performing garage
    'מקום בדיקה',      // Inspection location
    'תאריך בדיקה',     // Inspection date
    'תאריך נזק',       // Damage date
    'סוג נזק',         // Damage type
    'תיאור נזק',       // Damage description
    'מחיר בסיס',       // Base price
    'מחיר סופי',       // Final price
    'ערך שוק',         // Market value
    'קילומטראז',       // Mileage
    'מס\' ק\"מ',       // KM number
    'בעלות %',         // Ownership percentage
    'מאפיינים',        // Features
    'תאריך רישום',     // Registration date
    'מספר בעלים',      // Number of owners
    'רישיון נהיגה',    // Driver's license
    'תעודת זהות',      // ID number
    'כתובת',          // Address
    'טלפון',           // Phone
    'דוא\"ל'          // Email
  ];
  
  const missing = commonHebrewFields.filter(field => !HEBREW_TO_ENGLISH[field]);
  
  console.log('Missing Hebrew fields in dictionary:');
  missing.forEach(field => {
    console.log(`  ❌ "${field}" - no mapping available`);
  });
  
  console.log(`\nSummary: ${missing.length} common Hebrew fields are not mapped`);
  
  return missing;
}

// Function to analyze encoding robustness
function analyzeEncodingRobustness() {
  console.log('\n🛡️ Analyzing Encoding Robustness:');
  
  const robustnessTests = [
    {
      name: 'UTF-8 BOM',
      test: '\uFEFFמס\' רכב',
      issue: 'Byte Order Mark at beginning'
    },
    {
      name: 'Mixed RTL/LTR',
      test: 'מס\' vehicle_number',
      issue: 'Mixed right-to-left and left-to-right text'
    },
    {
      name: 'Combining Characters',
      test: 'מס\u0307\' רכב',
      issue: 'Combining diacritical marks'
    },
    {
      name: 'Zero-Width Chars',
      test: 'מס\u200D\' רכב',
      issue: 'Zero-width joiner characters'
    },
    {
      name: 'HTML Entities',
      test: 'מס&#x27; רכב',
      issue: 'HTML-encoded characters'
    }
  ];
  
  robustnessTests.forEach(({name, test, issue}) => {
    const directMatch = !!HEBREW_TO_ENGLISH[test];
    const cleanedTest = test.replace(/[\uFEFF\u0300-\u036F\u200B-\u200D\u2060-\u206F]/g, '');
    const cleanedMatch = !!HEBREW_TO_ENGLISH[cleanedTest];
    
    console.log(`${name}:`);
    console.log(`  Issue: ${issue}`);
    console.log(`  Direct match: ${directMatch}`);
    console.log(`  Cleaned match: ${cleanedMatch}`);
    
    if (!directMatch && !cleanedMatch) {
      console.log(`  ⚠️ Would fail to map: "${test}"`);
    }
  });
}

// Main test execution
function runFieldMappingTests() {
  console.log('🚀 Starting Field Mapping Dictionary Tests...\n');
  
  // Test basic Hebrew translation
  testHebrewTranslation();
  
  // Test each scenario
  hebrewTestScenarios.forEach(({name, fields}) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing: ${name}`);
    console.log(`${'='.repeat(50)}`);
    
    const results = simulateFieldMapping(fields);
    
    console.log('\n📊 Results:');
    console.log(`  Mapped: ${Object.keys(results.mapped).length}`);
    console.log(`  Unmapped: ${Object.keys(results.unmapped).length}`);
    console.log(`  Conflicts: ${Object.keys(results.conflicts).length}`);
    console.log(`  Encoding Issues: ${Object.keys(results.encodingIssues).length}`);
    
    if (Object.keys(results.conflicts).length > 0) {
      console.log('\n⚠️ Conflicts detected:');
      Object.entries(results.conflicts).forEach(([englishField, conflicts]) => {
        console.log(`  ${englishField}: ${conflicts.length + 1} Hebrew fields mapping to same English field`);
      });
    }
  });
  
  // Additional analysis
  testCharacterNormalization();
  const missingFields = identifyMissingFields();
  analyzeEncodingRobustness();
  
  // Summary
  console.log('\n📊 FIELD MAPPING DICTIONARY ANALYSIS:');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Key Findings:');
  console.log(`  • ${Object.keys(HEBREW_TO_ENGLISH).length} Hebrew fields mapped to English`);
  console.log(`  • ${missingFields.length} common Hebrew fields missing from dictionary`);
  console.log('  • Multiple apostrophe character variants supported');
  console.log('  • Some encoding robustness issues identified');
  
  console.log('\n💡 Recommendations:');
  console.log('  1. Add missing common Hebrew fields to dictionary');
  console.log('  2. Implement Unicode normalization before mapping');
  console.log('  3. Add fuzzy matching for similar Hebrew field names');
  console.log('  4. Handle HTML entities and combining characters');
  console.log('  5. Add fallback mapping for unknown Hebrew fields');
  
  return {
    success: true,
    totalMapped: Object.keys(HEBREW_TO_ENGLISH).length,
    missingFields: missingFields.length,
    scenarios: hebrewTestScenarios.length
  };
}

// Export for external use
if (typeof window !== 'undefined') {
  window.FieldMappingTest = {
    runFieldMappingTests,
    testHebrewTranslation,
    simulateFieldMapping,
    testCharacterNormalization,
    identifyMissingFields,
    analyzeEncodingRobustness,
    HEBREW_TO_ENGLISH,
    hebrewTestScenarios
  };
  
  console.log('💡 Field Mapping Test loaded. Run window.FieldMappingTest.runFieldMappingTests() to start.');
}

// Auto-run in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFieldMappingTests, HEBREW_TO_ENGLISH };
  
  if (require.main === module) {
    runFieldMappingTests();
  }
}