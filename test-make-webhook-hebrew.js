// Test script for Make.com webhook Hebrew data processing
// Simulates real webhook payloads and tests Hebrew data extraction

console.log('🎣 Testing Make.com Webhook Hebrew Data Processing...');

// Mock the processIncomingData function from helper.js for testing
function mockProcessIncomingData(data, webhookId) {
  console.log(`📥 Mock processing data from webhook: ${webhookId}`);
  
  const results = {
    success: false,
    extractedData: {},
    hebrewFieldsFound: [],
    encodingIssues: [],
    unmappedFields: [],
    processingSteps: []
  };
  
  // Step 1: Detect Hebrew text in Body field
  if (data && data.Body && typeof data.Body === 'string') {
    results.processingSteps.push('Hebrew text detected in Body field');
    
    const hebrewDetected = /[\u0590-\u05FF]/.test(data.Body);
    if (hebrewDetected) {
      results.hebrewFieldsFound.push('Body field contains Hebrew text');
      
      // Test Hebrew extraction patterns (simplified version of processHebrewText)
      const patterns = [
        { 
          name: 'plate', 
          regex: /(?:פרטי רכב|מס[׳״\'"`]*\s*רכב|מספר רכב)[:\s-]*([0-9]{7,8})/i 
        },
        { 
          name: 'manufacturer', 
          regex: /(?:שם היצרן|יצרן)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i 
        },
        { 
          name: 'model', 
          regex: /(?:דגם|שם דגם)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i 
        },
        { 
          name: 'year', 
          regex: /(?:שנת ייצור)[:\s-]*(?:\d{1,2}\/)?(\d{4})/i 
        },
        { 
          name: 'mileage_percent', 
          regex: /מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*%\s*:\s*([+-]?[0-9.,]+)/i 
        },
        { 
          name: 'ownership_percent', 
          regex: /בעלות\s*%\s*:\s*([+-]?[0-9.]+)%?/i 
        },
        { 
          name: 'final_price', 
          regex: /(?:מחיר סופי לרכב)[:\s-]*([0-9,]+)/i 
        }
      ];
      
      patterns.forEach(({name, regex}) => {
        const match = data.Body.match(regex);
        if (match) {
          results.extractedData[name] = match[1]?.trim();
          results.processingSteps.push(`Extracted ${name}: ${match[1]}`);
        }
      });
      
      results.success = Object.keys(results.extractedData).length > 0;
    }
  }
  
  // Step 2: Check for array format with Body field
  else if (Array.isArray(data) && data[0] && data[0].Body) {
    results.processingSteps.push('Array format with Body field detected');
    return mockProcessIncomingData(data[0], webhookId);
  }
  
  // Step 3: Check for direct Hebrew field names
  else if (typeof data === 'object') {
    results.processingSteps.push('Direct object data processing');
    
    Object.keys(data).forEach(key => {
      if (/[\u0590-\u05FF]/.test(key)) {
        results.hebrewFieldsFound.push(key);
        
        // Check if field is mapped
        const hebrewToEnglish = {
          'מס\' רכב': 'plate',
          'יצרן': 'manufacturer',
          'דגם': 'model',
          'שנת ייצור': 'year',
          'בעלים': 'owner'
        };
        
        if (hebrewToEnglish[key]) {
          results.extractedData[hebrewToEnglish[key]] = data[key];
          results.processingSteps.push(`Mapped ${key} → ${hebrewToEnglish[key]}: ${data[key]}`);
        } else {
          results.unmappedFields.push(key);
          results.processingSteps.push(`Unmapped Hebrew field: ${key}`);
        }
      }
      
      // Check for encoding issues
      if (/[×â€]/.test(key)) {
        results.encodingIssues.push(key);
      }
    });
    
    results.success = Object.keys(results.extractedData).length > 0;
  }
  
  return results;
}

// Real Make.com webhook payload examples (based on the system)
const makeWebhookPayloads = [
  {
    name: 'Standard Levi Report (Body Field)',
    description: 'Hebrew Levi valuation report in Body field format',
    payload: {
      Body: `פרטי רכב 5785269 להערכת נזק
קוד דגם: 870170
שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE
אוטומט: כן
מאפייני הרכב: מזגן, רדיו
תאריך הוצאת הדו״ח: 12/10/2023
עליה לכביש: 15/06/2011
מס' בעלים: 3
קטיגוריה: פרטי
מחיר בסיס: 116,835
עליה לכביש % : 0%
ערך כספי עליה לכביש: 0
שווי מצטבר עליה לכביש: 116,835
מס' ק״מ % : +14.95%
ערך כספי מס' ק״מ: +17,467
שווי מצטבר מס' ק״מ: 134,302
בעלות % : +7.95%
ערך כספי בעלות: +10,669
שווי מצטבר בעלות: 144,971
מס' בעלים % : -3%
ערך כספי מס' בעלים: -4,349
שווי מצטבר מס' בעלים: 140,622
מאפיינים % : -34.15%
ערך כספי מאפיינים: -48,002
שווי מצטבר מאפיינים: 92,620
מחיר סופי לרכב: 92,670`
    }
  },
  {
    name: 'Simple Vehicle Data (Direct Fields)',
    description: 'Direct Hebrew field names from Make.com',
    payload: {
      'מס\' רכב': '5785269',
      'יצרן': 'ביואיק',
      'דגם': 'LUCERNE', 
      'שנת ייצור': '2009',
      'בעלים': 'כרמל כיוף',
      'קילומטראז': '120,000',
      'סוג דלק': 'בנזין'
    }
  },
  {
    name: 'Mixed Array Format',
    description: 'Array format with Body field (Make.com common format)',
    payload: [
      {
        Body: `מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הרכב: פרטי
שנת ייצור: 05/2009
בעל הרכב: כרמל כיוף`,
        timestamp: '2024-03-15T10:30:00Z'
      }
    ]
  },
  {
    name: 'Nested Value Format',
    description: 'Nested JSON value (Make.com advanced format)',
    payload: [
      {
        value: JSON.stringify({
          'מס\' רכב': '5785269',
          'יצרן': 'ביואיק',
          'דגם': 'LUCERNE',
          'שנת ייצור': '2009'
        })
      }
    ]
  },
  {
    name: 'Character Encoding Issues',
    description: 'Payload with various encoding problems',
    payload: {
      Body: `מ×¡â€™ רכב: 5785269
יצר×Ÿ: ×'×™×•××™×§  
דק×: LUCERNE
ק××× ×"××: פרטי`
    }
  },
  {
    name: 'Multiple Apostrophe Types',
    description: 'Different apostrophe characters in field names',
    payload: {
      'מס\' רכב': '1111111',    // Regular apostrophe
      'מס\u2019 רכב': '2222222',     // Curly apostrophe  
      'מס׳ רכב': '3333333',     // Hebrew geresh
      'מס״ רכב': '4444444',     // Hebrew gershayim
      'manufacturer': 'ביואיק'
    }
  },
  {
    name: 'Insurance Data (Hebrew)',
    description: 'Insurance-related Hebrew fields',
    payload: {
      Body: `פרטי רכב: 5785269
חברת ביטוח: הכלל ביטוח
מספר פוליסה: POL123456789
מספר תביעה: CL987654321
תאריך נזק: 15/03/2024
סוג נזק: התנגשות אחורית
מוסך מבצע: מוסך דוד בע״מ
מקום בדיקה: תל אביב`
    }
  },
  {
    name: 'Complex Percentage Data',
    description: 'Complex percentage and adjustment data from Levi',
    payload: {
      Body: `פרטי רכב 5785269
מחיר בסיס: 116,835
עליה לכביש % : 0%
מס' ק״מ % : +14.95%
בעלות % : +7.95%  
מס' בעלים % : -3%
מאפיינים % : -34.15%
מחיר סופי לרכב: 92,670`
    }
  },
  {
    name: 'Edge Case: Empty/Null Fields',
    description: 'Payload with empty or null Hebrew fields',
    payload: {
      'מס\' רכב': '',
      'יצרן': null,
      'דגם': '   ',
      'שנת ייצור': undefined,
      'בעלים': 'כרמל כיוף'
    }
  },
  {
    name: 'Large Text Block',
    description: 'Very long Hebrew text with multiple sections',
    payload: {
      Body: `פרטי רכב 5785269 להערכת נזק - דוח מפורט
===== פרטי הרכב =====
קוד דגם: 870170
שם דגם מלא: ג'יפ ריינג'ד 150(1332) LATITUDE
יצרן: ג'יפ
שנת ייצור: 2011
נפח מנוע: 2800
סוג דלק: דיזל
אוטומט: כן
מאפייני הרכב: מזגן, רדיו, מערכת ניווט

===== פרטי הבעלות =====
בעל הרכב: כרמל כיוף
מספר בעלים: 3
עליה לכביש: 15/06/2011
קטיגוריה: פרטי

===== הערכת שווי =====
מחיר בסיס: 116,835
התאמות:
- עליה לכביש % : 0%
- מס' ק״מ % : +14.95%  
- בעלות % : +7.95%
- מס' בעלים % : -3%
- מאפיינים % : -34.15%

מחיר סופי לרכב: 92,670 ₪

===== פרטי הבדיקה =====
תאריך הוצאת הדו״ח: 12/10/2023
מבצע הבדיקה: מוסך דוד המומחה
מקום הבדיקה: תל אביב`
    }
  }
];

// Function to test webhook data processing
function testWebhookProcessing(payload, name, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`${'='.repeat(60)}`);
  
  // Show payload structure
  console.log('\n📦 Payload Structure:');
  if (payload.Body) {
    console.log('  Format: Body field');
    console.log(`  Body length: ${payload.Body.length} characters`);
    console.log(`  Contains Hebrew: ${/[\u0590-\u05FF]/.test(payload.Body)}`);
    console.log(`  Preview: ${payload.Body.substring(0, 100)}...`);
  } else if (Array.isArray(payload)) {
    console.log('  Format: Array');
    console.log(`  Array length: ${payload.length}`);
    if (payload[0]?.Body) {
      console.log('  Contains Body field in array');
    } else if (payload[0]?.value) {
      console.log('  Contains nested value field');
    }
  } else {
    console.log('  Format: Direct object');
    const hebrewKeys = Object.keys(payload).filter(key => /[\u0590-\u05FF]/.test(key));
    console.log(`  Hebrew fields: ${hebrewKeys.length}`);
    console.log(`  Total fields: ${Object.keys(payload).length}`);
  }
  
  // Process the payload
  const result = mockProcessIncomingData(payload, name.replace(/\s+/g, '_'));
  
  // Analyze results
  console.log('\n📊 Processing Results:');
  console.log(`  Success: ${result.success ? '✅' : '❌'}`);
  console.log(`  Extracted fields: ${Object.keys(result.extractedData).length}`);
  console.log(`  Hebrew fields found: ${result.hebrewFieldsFound.length}`);
  console.log(`  Unmapped fields: ${result.unmappedFields.length}`);
  console.log(`  Encoding issues: ${result.encodingIssues.length}`);
  
  // Show extracted data
  if (Object.keys(result.extractedData).length > 0) {
    console.log('\n✅ Successfully Extracted:');
    Object.entries(result.extractedData).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });
  }
  
  // Show unmapped fields
  if (result.unmappedFields.length > 0) {
    console.log('\n⚠️ Unmapped Hebrew Fields:');
    result.unmappedFields.forEach(field => {
      console.log(`  "${field}": ${payload[field] || 'N/A'}`);
    });
  }
  
  // Show encoding issues
  if (result.encodingIssues.length > 0) {
    console.log('\n❌ Encoding Issues:');
    result.encodingIssues.forEach(field => {
      console.log(`  "${field}": ${payload[field] || 'N/A'}`);
    });
  }
  
  // Show processing steps
  console.log('\n🔄 Processing Steps:');
  result.processingSteps.forEach((step, i) => {
    console.log(`  ${i+1}. ${step}`);
  });
  
  return result;
}

// Function to analyze overall webhook performance
function analyzeWebhookPerformance(results) {
  console.log('\n📈 WEBHOOK PROCESSING ANALYSIS:');
  console.log('='.repeat(60));
  
  const stats = {
    totalTests: results.length,
    successfulTests: results.filter(r => r.success).length,
    totalFieldsExtracted: results.reduce((sum, r) => sum + Object.keys(r.extractedData).length, 0),
    totalUnmappedFields: results.reduce((sum, r) => sum + r.unmappedFields.length, 0),
    totalEncodingIssues: results.reduce((sum, r) => sum + r.encodingIssues.length, 0)
  };
  
  console.log('\n📊 Statistics:');
  console.log(`  Total tests: ${stats.totalTests}`);
  console.log(`  Successful: ${stats.successfulTests}/${stats.totalTests} (${Math.round(stats.successfulTests/stats.totalTests*100)}%)`);
  console.log(`  Fields extracted: ${stats.totalFieldsExtracted}`);
  console.log(`  Unmapped fields: ${stats.totalUnmappedFields}`);
  console.log(`  Encoding issues: ${stats.totalEncodingIssues}`);
  
  // Find most common issues
  const allUnmappedFields = results.flatMap(r => r.unmappedFields);
  const unmappedFieldCounts = {};
  allUnmappedFields.forEach(field => {
    unmappedFieldCounts[field] = (unmappedFieldCounts[field] || 0) + 1;
  });
  
  const topUnmappedFields = Object.entries(unmappedFieldCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  if (topUnmappedFields.length > 0) {
    console.log('\n🔍 Most Common Unmapped Fields:');
    topUnmappedFields.forEach(([field, count], i) => {
      console.log(`  ${i+1}. "${field}" (${count} occurrences)`);
    });
  }
  
  return stats;
}

// Function to identify specific encoding problems
function identifyEncodingProblems(results) {
  console.log('\n🔍 ENCODING PROBLEM ANALYSIS:');
  console.log('='.repeat(50));
  
  const problems = [];
  
  results.forEach((result, i) => {
    const testName = makeWebhookPayloads[i].name;
    
    // Character encoding issues
    if (result.encodingIssues.length > 0) {
      problems.push({
        test: testName,
        type: 'Character Corruption',
        details: `Fields with corrupted characters: ${result.encodingIssues.join(', ')}`,
        severity: 'High'
      });
    }
    
    // Missing field mappings
    if (result.unmappedFields.length > 0) {
      const hebrewUnmapped = result.unmappedFields.filter(field => /[\u0590-\u05FF]/.test(field));
      if (hebrewUnmapped.length > 0) {
        problems.push({
          test: testName,
          type: 'Missing Hebrew Mappings',
          details: `Unmapped Hebrew fields: ${hebrewUnmapped.join(', ')}`,
          severity: 'Medium'
        });
      }
    }
    
    // No data extraction
    if (!result.success) {
      problems.push({
        test: testName,
        type: 'Complete Extraction Failure',
        details: 'No data could be extracted from payload',
        severity: 'Critical'
      });
    }
  });
  
  // Categorize problems
  const problemsByType = {};
  problems.forEach(problem => {
    problemsByType[problem.type] = problemsByType[problem.type] || [];
    problemsByType[problem.type].push(problem);
  });
  
  console.log('📋 Problems by Category:');
  Object.entries(problemsByType).forEach(([type, probs]) => {
    console.log(`\n${type} (${probs.length} occurrences):`);
    probs.forEach(prob => {
      console.log(`  • ${prob.test}: ${prob.details}`);
    });
  });
  
  return problems;
}

// Main test execution
function runMakeWebhookTests() {
  console.log('🚀 Starting Make.com Webhook Hebrew Processing Tests...\n');
  
  const results = [];
  
  // Test each webhook payload
  makeWebhookPayloads.forEach(({name, description, payload}) => {
    const result = testWebhookProcessing(payload, name, description);
    results.push(result);
  });
  
  // Analyze overall performance
  const stats = analyzeWebhookPerformance(results);
  
  // Identify specific problems
  const problems = identifyEncodingProblems(results);
  
  // Final summary and recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('='.repeat(40));
  console.log('1. Add comprehensive Unicode normalization');
  console.log('2. Expand Hebrew field mapping dictionary');
  console.log('3. Implement fuzzy matching for similar Hebrew fields'); 
  console.log('4. Add encoding validation and cleanup');
  console.log('5. Create fallback extraction patterns');
  console.log('6. Add logging for failed Hebrew extractions');
  console.log('7. Test with real Make.com webhook data');
  
  return {
    success: true,
    stats: stats,
    problems: problems,
    results: results
  };
}

// Export for external use
if (typeof window !== 'undefined') {
  window.MakeWebhookTest = {
    runMakeWebhookTests,
    testWebhookProcessing,
    analyzeWebhookPerformance,
    identifyEncodingProblems,
    makeWebhookPayloads
  };
  
  console.log('💡 Make.com Webhook Test loaded. Run window.MakeWebhookTest.runMakeWebhookTests() to start.');
}

// Auto-run in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runMakeWebhookTests };
  
  if (require.main === module) {
    runMakeWebhookTests();
  }
}