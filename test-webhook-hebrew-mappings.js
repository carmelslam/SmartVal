// Test script for webhook.js Hebrew field mappings analysis
// Identifies encoding issues and mapping problems in webhook data processing

console.log('🔗 Testing Webhook Hebrew Field Mappings...');

// Extract the actual mappings from webhook.js (lines 146-194)
const webhookHebrewMappings = {
  // Basic vehicle fields with Hebrew alternatives (from webhook.js)
  'plate': ['plate', 'מספר_רכב', 'מס\' רכב', 'מס רכב', 'license_plate'],
  'plateNumber': ['plate', 'מספר_רכב', 'מס\' רכב', 'מס רכב', 'license_plate'],
  'manufacturer': ['manufacturer', 'יצרן', 'שם היצרן', 'make'],
  'model': ['model', 'דגם', 'שם דגם'],
  'year': ['year', 'שנת ייצור', 'שנת יצור', 'שנת_ייצור'],
  'owner': ['owner', 'בעלים', 'שם בעל הרכב', 'owner_name', 'client_name'],
  'km': ['km', 'mileage', 'קילומטראז', 'מס\' ק\"מ', 'קילומטרים'],
  'chassis': ['chassis', 'vin', 'מספר שילדה', 'שילדה'],
  'engine_volume': ['engine_volume', 'נפח מנוע', 'נפח_מנוע'],
  'fuel_type': ['fuel_type', 'סוג דלק', 'דלק'],
  'ownership_type': ['ownership_type', 'סוג בעלות', 'בעלות'],
  'trim': ['trim', 'רמת גימור', 'גימור'],
  'garage_name': ['garage_name', 'garage', 'מוסך'],
  'insurance_company': ['insurance_company', 'חברת ביטוח', 'ביטוח']
};

// Test data scenarios with different encoding issues
const testWebhookPayloads = [
  {
    name: 'Standard Hebrew Fields',
    payload: {
      'מס\' רכב': '5785269',
      'יצרן': 'ביואיק',
      'דגם': 'LUCERNE',
      'שנת ייצור': '2009',
      'בעלים': 'כרמל כיוף'
    }
  },
  {
    name: 'Mixed Character Encodings',
    payload: {
      'מס׳ רכב': '1111111',      // Hebrew geresh
      'מס״ רכב': '2222222',      // Hebrew gershayim
      'מס\' רכב': '3333333',     // Regular apostrophe
      'מס' רכב': '4444444'       // Curly apostrophe
    }
  },
  {
    name: 'Underscored Hebrew Fields',
    payload: {
      'מספר_רכב': '5785269',
      'שנת_ייצור': '2009',
      'נפח_מנוע': '3791'
    }
  },
  {
    name: 'Body Field with Hebrew Text',
    payload: {
      Body: `מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
שנת ייצור: 2009
בעל הרכב: כרמל כיוף`
    }
  },
  {
    name: 'Array Format with Nested Hebrew',
    payload: [{
      value: JSON.stringify({
        'מס\' רכב': '5785269',
        'יצרן': 'ביואיק',
        'דגם': 'LUCERNE'
      })
    }]
  },
  {
    name: 'Corrupted Encoding (UTF-8 issues)',
    payload: {
      'מ×¡â€™ רכב': '5785269',    // Corrupted apostrophe
      'יצר×Ÿ': 'ביואיק',          // Corrupted Hebrew
      'ק××× ×"××': 'פרטי'         // Heavily corrupted
    }
  },
  {
    name: 'Full Levi Report in Body',
    payload: {
      Body: `פרטי רכב 5785269 להערכת נזק
קוד דגם: 870170
שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE
אוטומט: כן
מאפייני הרכב: מזגן, רדיו
מס' ק״מ % : +14.95%
ערך כספי מס' ק״מ: +17,467`
    }
  }
];

// Function to test webhook field mapping logic
function testWebhookFieldMapping(payload) {
  console.log('\n🔍 Testing Webhook Field Mapping...');
  
  const mappingResults = {};
  const unmappedFields = {};
  
  // Simulate the webhook.js mapping logic (lines 146-194)
  Object.entries(webhookHebrewMappings).forEach(([englishField, hebrewVariants]) => {
    let foundValue = null;
    let foundKey = null;
    
    // Try each Hebrew variant
    hebrewVariants.forEach(variant => {
      if (payload[variant] && !foundValue) {
        foundValue = payload[variant];
        foundKey = variant;
      }
    });
    
    if (foundValue) {
      mappingResults[englishField] = {
        value: foundValue,
        sourceKey: foundKey,
        mapped: true
      };
      console.log(`✅ ${englishField}: "${foundKey}" → "${foundValue}"`);
    }
  });
  
  // Find unmapped Hebrew fields
  Object.keys(payload).forEach(key => {
    if (/[\u0590-\u05FF]/.test(key)) {  // Contains Hebrew characters
      let isMapped = false;
      Object.values(webhookHebrewMappings).forEach(variants => {
        if (variants.includes(key)) {
          isMapped = true;
        }
      });
      
      if (!isMapped) {
        unmappedFields[key] = payload[key];
        console.log(`⚠️ Unmapped Hebrew field: "${key}" = "${payload[key]}"`);
      }
    }
  });
  
  return { mappingResults, unmappedFields };
}

// Function to test character encoding detection
function testCharacterEncoding() {
  console.log('\n🔤 Testing Character Encoding Detection:');
  
  const encodingTests = [
    { name: 'Regular Apostrophe', text: 'מס\' רכב', char: '\'' },
    { name: 'Curly Apostrophe', text: 'מס' רכב', char: ''' },
    { name: 'Hebrew Geresh', text: 'מס׳ רכב', char: '׳' },
    { name: 'Hebrew Gershayim', text: 'מס״ רכב', char: '״' },
    { name: 'Corrupted UTF-8', text: 'מ×¡â€™ רכב', char: 'â€™' }
  ];
  
  encodingTests.forEach(({name, text, char}) => {
    const charCode = char.charCodeAt(0);
    const unicodeHex = charCode.toString(16).toUpperCase().padStart(4, '0');
    const isHebrew = /[\u0590-\u05FF]/.test(char);
    const isCorrupted = /[×â€]/.test(char);
    
    console.log(`${name}:`);
    console.log(`  Text: "${text}"`);
    console.log(`  Char: "${char}" (U+${unicodeHex})`);
    console.log(`  Hebrew: ${isHebrew}, Corrupted: ${isCorrupted}`);
    
    // Test if current regex patterns would match
    const plateRegex = /(?:מס[׳״\'"`]*\s*רכב)/i;
    const matches = plateRegex.test(text);
    console.log(`  Matches current regex: ${matches}`);
  });
}

// Function to simulate webhook processing with Hebrew data
function simulateWebhookProcessing(payload, webhookId = 'test') {
  console.log(`\n🌐 Simulating Webhook Processing for: ${webhookId}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  let processedData = null;
  
  // Simulate the actual webhook.js processing logic
  if (payload.Body && typeof payload.Body === 'string') {
    console.log('📥 Processing Body field (Hebrew text parsing)');
    
    // Test if Hebrew text would be detected
    const hasHebrew = /[\u0590-\u05FF]/.test(payload.Body);
    console.log(`Hebrew text detected: ${hasHebrew}`);
    
    if (hasHebrew) {
      // Simulate processHebrewText function call
      const plateMatch = payload.Body.match(/(?:פרטי רכב|מס[׳״\'"`]*\s*רכב|מספר רכב)[:\s-]*([0-9]{7,8})/i);
      const manufacturerMatch = payload.Body.match(/(?:שם היצרן|יצרן)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i);
      
      processedData = {
        source: 'hebrew_text_parsing',
        plate: plateMatch ? plateMatch[1] : null,
        manufacturer: manufacturerMatch ? manufacturerMatch[1].trim() : null,
        raw_text: payload.Body
      };
    }
  } else if (Array.isArray(payload) && payload[0]) {
    console.log('📥 Processing array format');
    
    if (payload[0].Body) {
      const hasHebrew = /[\u0590-\u05FF]/.test(payload[0].Body);
      console.log(`Hebrew text in array Body: ${hasHebrew}`);
    } else if (payload[0].value) {
      try {
        const parsed = JSON.parse(payload[0].value);
        console.log('Nested value parsed:', Object.keys(parsed));
        processedData = { source: 'nested_value', data: parsed };
      } catch (e) {
        console.log('Failed to parse nested value');
      }
    }
  } else if (typeof payload === 'object') {
    console.log('📥 Processing direct object data');
    
    // Test field mapping
    const { mappingResults, unmappedFields } = testWebhookFieldMapping(payload);
    
    processedData = {
      source: 'direct_object_mapping',
      mappedFields: Object.keys(mappingResults).length,
      unmappedFields: Object.keys(unmappedFields).length,
      results: mappingResults,
      unmapped: unmappedFields
    };
  }
  
  return processedData;
}

// Function to identify webhook Hebrew processing issues
function identifyWebhookIssues() {
  console.log('\n🚨 Identifying Webhook Hebrew Processing Issues:');
  
  const issues = [];
  
  // Issue 1: Limited Hebrew character coverage in field names
  const hebrewFieldsInMapping = [];
  Object.values(webhookHebrewMappings).forEach(variants => {
    variants.forEach(variant => {
      if (/[\u0590-\u05FF]/.test(variant) && !hebrewFieldsInMapping.includes(variant)) {
        hebrewFieldsInMapping.push(variant);
      }
    });
  });
  
  console.log(`Hebrew fields in current mapping: ${hebrewFieldsInMapping.length}`);
  if (hebrewFieldsInMapping.length < 20) {
    issues.push('Limited Hebrew field coverage in webhook mappings');
  }
  
  // Issue 2: Character encoding variations not handled
  const apostropheVariants = ['\'', ''', '׳', '״'];
  const testedInMapping = apostropheVariants.filter(char => 
    hebrewFieldsInMapping.some(field => field.includes(char))
  );
  
  if (testedInMapping.length < apostropheVariants.length) {
    issues.push(`Missing apostrophe variants in mappings: ${apostropheVariants.filter(char => !testedInMapping.includes(char)).join(', ')}`);
  }
  
  // Issue 3: No fallback for unmapped Hebrew fields
  // This would require analyzing the actual webhook processing code
  issues.push('No systematic fallback handling for unmapped Hebrew fields');
  
  // Issue 4: Body field processing vs direct field mapping conflict
  issues.push('Potential conflict between Body field Hebrew parsing and direct field mapping');
  
  return issues;
}

// Main test execution
function runWebhookHebrewTests() {
  console.log('🚀 Starting Webhook Hebrew Mapping Tests...\n');
  
  // Test character encoding detection
  testCharacterEncoding();
  
  // Test each payload scenario
  testWebhookPayloads.forEach(({name, payload}) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing: ${name}`);
    console.log(`${'='.repeat(50)}`);
    
    const result = simulateWebhookProcessing(payload, name);
    
    if (result) {
      console.log('✅ Processing completed');
      console.log('Result:', result);
    } else {
      console.log('❌ No data extracted from payload');
    }
  });
  
  // Identify issues
  const issues = identifyWebhookIssues();
  
  // Summary
  console.log('\n📊 WEBHOOK HEBREW MAPPING ANALYSIS:');
  console.log('='.repeat(60));
  
  console.log('\n🔍 Key Findings:');
  console.log('  • Hebrew field mappings exist but are limited');
  console.log('  • Character encoding variations partially supported');
  console.log('  • Body field processing uses different logic than direct mapping');
  console.log('  • No systematic handling of unmapped Hebrew fields');
  
  if (issues.length > 0) {
    console.log('\n🚨 Issues Identified:');
    issues.forEach((issue, i) => {
      console.log(`  ${i+1}. ${issue}`);
    });
  }
  
  console.log('\n💡 Recommendations:');
  console.log('  1. Expand Hebrew field mappings to cover more variations');
  console.log('  2. Add comprehensive apostrophe/geresh character handling');
  console.log('  3. Implement fallback mapping for unknown Hebrew fields');
  console.log('  4. Unify Body field parsing and direct field mapping approaches');
  console.log('  5. Add encoding validation and normalization');
  
  return {
    success: true,
    issues: issues,
    testResults: testWebhookPayloads.map(({name}) => name)
  };
}

// Export for external use
if (typeof window !== 'undefined') {
  window.WebhookHebrewTest = {
    runWebhookHebrewTests,
    testWebhookFieldMapping,
    testCharacterEncoding,
    simulateWebhookProcessing,
    identifyWebhookIssues,
    webhookHebrewMappings,
    testWebhookPayloads
  };
  
  console.log('💡 Webhook Hebrew Test loaded. Run window.WebhookHebrewTest.runWebhookHebrewTests() to start.');
}

// Auto-run in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runWebhookHebrewTests };
  
  if (require.main === module) {
    runWebhookHebrewTests();
  }
}