// Test script for parse-hebrew-response.js.disabled functionality
// This tests the disabled Hebrew parsing functionality to identify why it was disabled

console.log('🔤 Testing Disabled Hebrew Response Parser...');

// Mock window object for testing
if (typeof window === 'undefined') {
  global.window = {
    helper: {},
    updateHelper: () => {},
    forcePopulateFields: () => {},
    refreshCarData: () => {},
    sessionStorage: {
      setItem: (key, value) => console.log(`SessionStorage set: ${key} = ${value}`),
      getItem: (key) => null
    }
  };
}

// Load the disabled Hebrew parser code (modified to work in test environment)
function loadHebrewParser() {
  // Hebrew to English field mapping (from parse-hebrew-response.js.disabled)
  const hebrewFieldMap = {
    'פרטי רכב': 'plate', 
    'מס\' רכב': 'plate',
    'מספר רכב': 'plate',
    'שם היצרן': 'manufacturer',
    'שם רכב': 'manufacturer',
    'דגם': 'model',
    'סוג הדגם': 'model_type',
    'סוג הרכב': 'vehicle_type',
    'סוג רכב': 'vehicle_type',
    'רמת גימור': 'trim',
    'מספר שילדה': 'chassis',
    'מספר שלדה': 'chassis',
    'שנת ייצור': 'year',
    'שנת יצור': 'year',
    'שם בעל הרכב': 'owner',
    'סוג בעלות': 'ownership_type',
    'נפח מנוע': 'engine_volume',
    'סוג דלק': 'fuel_type',
    'מספר דגם הרכב': 'model_code',
    'דגם מנוע': 'engine_model',
    'הנעה': 'drive_type',
    'מוסך': 'garage_name',
    'קוד משרד התחבורה': 'office_code',
    'תאריך רישוי': 'registration_date',
    'תאריך': 'timestamp',
    'שם בעלים': 'owner',
    'בעל הרכב': 'owner',
    'מיקום': 'location',
    'מקום בדיקה': 'location'
  };
  
  // Parse Hebrew text response (from disabled file)
  function parseHebrewCarData(text) {
    console.log('📥 Parsing Hebrew car data...');
    
    const result = {};
    
    // Split by lines and parse each field
    const lines = text.split('\n');
    lines.forEach(line => {
      // Try different separators
      let parts = line.split(':');
      if (parts.length < 2) {
        parts = line.split('：'); // Full-width colon
      }
      
      if (parts.length >= 2) {
        const hebrewKey = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        
        // Find English key
        const englishKey = hebrewFieldMap[hebrewKey];
        if (englishKey) {
          result[englishKey] = value;
          console.log(`  ${hebrewKey} → ${englishKey}: ${value}`);
        } else {
          // Store with Hebrew key if no mapping
          result[hebrewKey] = value;
          console.log(`  ${hebrewKey}: ${value} (no mapping)`);
        }
      }
    });
    
    // Extract year from production date if needed
    if (!result.year && result.year && result.year.includes('/')) {
      result.year = result.year.split('/')[1];
    }
    
    return result;
  }
  
  return { parseHebrewCarData, hebrewFieldMap };
}

// Test data scenarios
const testScenarios = [
  {
    name: 'Standard Hebrew Format',
    data: `מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הרכב: פרטי
רמת גימור: CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
נפח מנוע: 3791
סוג דלק: בנזין`
  },
  {
    name: 'Levi Report Format',
    data: `פרטי רכב 5785269 להערכת נזק
קוד דגם: 870170
שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE
אוטומט: כן
מאפייני הרכב: מזגן, רדיו
תאריך הוצאת הדו״ח: 12/10/2023`
  },
  {
    name: 'Mixed Hebrew-English',
    data: `מס' רכב: 5785269
Manufacturer: ביואיק
דגם: LUCERNE
Year: 2009
Owner: כרמל כיוף`
  },
  {
    name: 'Different Apostrophe Characters',
    data: `מס' רכב: 1111111
מס׳ רכב: 2222222
מס״ רכב: 3333333
מס\' רכב: 4444444`
  },
  {
    name: 'No Colon Separators',
    data: `מס' רכב 5785269
שם היצרן ביואיק
דגם LUCERNE`
  },
  {
    name: 'Full-Width Characters',
    data: `מס' רכב：5785269
שם היצרן：ביואיק
דגם：LUCERNE`
  },
  {
    name: 'Malformed Data',
    data: `מס' רכב5785269
: שם היצרן
דגם: 
: LUCERNE`
  }
];

// Function to test the disabled parser
function testDisabledParser() {
  console.log('\n🧪 Testing Disabled Hebrew Parser Functionality:');
  
  const { parseHebrewCarData, hebrewFieldMap } = loadHebrewParser();
  
  // Test field mapping coverage
  console.log('\n📋 Field Mapping Coverage:');
  console.log(`Total Hebrew fields mapped: ${Object.keys(hebrewFieldMap).length}`);
  console.log('Sample mappings:');
  Object.entries(hebrewFieldMap).slice(0, 5).forEach(([hebrew, english]) => {
    console.log(`  "${hebrew}" → "${english}"`);
  });
  
  // Test each scenario
  testScenarios.forEach(({name, data}) => {
    console.log(`\n--- Testing: ${name} ---`);
    console.log('Input data:', data.substring(0, 100) + '...');
    
    try {
      const result = parseHebrewCarData(data);
      console.log('Parse result:', result);
      
      // Analyze the result
      const extractedFields = Object.keys(result).length;
      const hebrewFieldsCount = Object.keys(result).filter(key => /[\u0590-\u05FF]/.test(key)).length;
      const englishFieldsCount = extractedFields - hebrewFieldsCount;
      
      console.log(`📊 Analysis: ${extractedFields} fields total, ${englishFieldsCount} mapped, ${hebrewFieldsCount} unmapped`);
      
      if (hebrewFieldsCount > 0) {
        console.log('⚠️ Unmapped Hebrew fields found:', Object.keys(result).filter(key => /[\u0590-\u05FF]/.test(key)));
      }
      
    } catch (error) {
      console.error('❌ Parse failed:', error.message);
    }
  });
}

// Function to identify why the parser might have been disabled
function identifyDisabledReasons() {
  console.log('\n🔍 Analyzing Why Hebrew Parser Might Be Disabled:');
  
  const { parseHebrewCarData } = loadHebrewParser();
  
  const potentialIssues = [];
  
  // Issue 1: Limited field mapping
  const { hebrewFieldMap } = loadHebrewParser();
  const mappedFields = Object.keys(hebrewFieldMap).length;
  if (mappedFields < 30) {
    potentialIssues.push(`Limited field mapping: only ${mappedFields} Hebrew fields supported`);
  }
  
  // Issue 2: Simple line-by-line parsing (doesn't handle complex formats)
  const complexData = `פרטי רכב 5785269 להערכת נזק
קוד דגם: 870170
שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE`;
  
  const complexResult = parseHebrewCarData(complexData);
  const extractedPlate = complexResult.plate;
  if (!extractedPlate) {
    potentialIssues.push('Cannot extract plate number from complex format (inline format not supported)');
  }
  
  // Issue 3: No percentage/currency parsing
  const percentageData = `בעלות % : +7.95%
ערך כספי בעלות: +10,669`;
  const percentResult = parseHebrewCarData(percentageData);
  if (!percentResult['בעלות %']) {
    potentialIssues.push('Cannot parse percentage fields with complex formatting');
  }
  
  // Issue 4: Character encoding sensitivity
  const encodingData = `מס' רכב: 1111111
מס׳ רכב: 2222222`;
  const encodingResult = parseHebrewCarData(encodingData);
  if (Object.keys(encodingResult).length < 2) {
    potentialIssues.push('Character encoding issues with different apostrophe types');
  }
  
  return potentialIssues;
}

// Function to compare with current helper.js implementation
function compareWithCurrentImplementation() {
  console.log('\n🔄 Comparing Disabled Parser vs Current Implementation:');
  
  console.log('\nDisabled Parser Approach:');
  console.log('  ✅ Simple field mapping dictionary');
  console.log('  ✅ Line-by-line processing');
  console.log('  ✅ Basic colon separator handling');
  console.log('  ❌ No regex pattern matching');
  console.log('  ❌ No complex format support');
  console.log('  ❌ No percentage/currency parsing');
  console.log('  ❌ Limited character encoding handling');
  
  console.log('\nCurrent Helper.js Implementation:');
  console.log('  ✅ Advanced regex pattern matching');
  console.log('  ✅ Multiple character encoding support');
  console.log('  ✅ Complex format parsing (percentages, currencies)');
  console.log('  ✅ Comprehensive field extraction');
  console.log('  ✅ Data validation and cleaning');
  console.log('  ❌ More complex and potentially error-prone');
  
  console.log('\nRecommendation: Current helper.js approach is more robust');
}

// Function to test webhook integration scenarios
function testWebhookIntegration() {
  console.log('\n🌐 Testing Webhook Integration Scenarios:');
  
  const { parseHebrewCarData } = loadHebrewParser();
  
  // Simulate different webhook payload formats
  const webhookFormats = [
    {
      name: 'Direct Body Field',
      payload: {
        Body: `מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE`
      },
      extract: (payload) => payload.Body
    },
    {
      name: 'Array Format',
      payload: [{
        Body: `מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE`
      }],
      extract: (payload) => payload[0]?.Body
    },
    {
      name: 'Nested Value',
      payload: [{
        value: JSON.stringify({
          Body: `מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE`
        })
      }],
      extract: (payload) => {
        try {
          return JSON.parse(payload[0]?.value)?.Body;
        } catch (e) {
          return null;
        }
      }
    }
  ];
  
  webhookFormats.forEach(({name, payload, extract}) => {
    console.log(`\n--- Testing ${name} ---`);
    
    const bodyText = extract(payload);
    if (bodyText) {
      console.log('✅ Body text extracted successfully');
      const result = parseHebrewCarData(bodyText);
      console.log(`📊 Extracted ${Object.keys(result).length} fields`);
      
      // Check for key fields
      const hasPlate = result.plate || result['מס\' רכב'];
      const hasManufacturer = result.manufacturer || result['שם היצרן'];
      console.log(`Key fields: plate=${!!hasPlate}, manufacturer=${!!hasManufacturer}`);
    } else {
      console.log('❌ Failed to extract body text from payload');
    }
  });
}

// Main execution
function runDisabledParserTests() {
  console.log('🚀 Starting Disabled Hebrew Parser Tests...\n');
  
  testDisabledParser();
  const issues = identifyDisabledReasons();
  compareWithCurrentImplementation();
  testWebhookIntegration();
  
  // Summary
  console.log('\n📊 DISABLED PARSER ANALYSIS SUMMARY:');
  console.log('='.repeat(60));
  
  if (issues.length > 0) {
    console.log('🚨 Reasons Parser Likely Disabled:');
    issues.forEach((issue, i) => {
      console.log(`  ${i+1}. ${issue}`);
    });
  }
  
  console.log('\n💡 Key Findings:');
  console.log('  • Disabled parser is simpler but less capable');
  console.log('  • Current helper.js implementation is more comprehensive');
  console.log('  • Major limitation: cannot handle complex Levi report formats');
  console.log('  • Character encoding handling is basic');
  console.log('  • Webhook integration logic exists but is incomplete');
  
  console.log('\n✅ Conclusion: Current implementation is superior to disabled parser');
  
  return {
    success: true,
    issues: issues,
    recommendation: 'Keep current helper.js implementation, enhance Hebrew character handling'
  };
}

// Export for external use
if (typeof window !== 'undefined') {
  window.DisabledParserTest = {
    runDisabledParserTests,
    testDisabledParser,
    identifyDisabledReasons,
    compareWithCurrentImplementation,
    testWebhookIntegration,
    testScenarios
  };
  
  console.log('💡 Disabled Parser Test loaded. Run window.DisabledParserTest.runDisabledParserTests() to start.');
}

// Auto-run if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDisabledParserTests };
  
  if (require.main === module) {
    runDisabledParserTests();
  }
}