// Hebrew Text Processing Analysis and Testing Script
// This script tests Hebrew character encoding, regex patterns, and data extraction

console.log('🔤 Starting Hebrew Text Processing Analysis...');

// Test data with various Hebrew encoding scenarios
const testData = {
  // Standard Hebrew with different apostrophe characters
  standard_hebrew: `מס' רכב: 5785269
שם היצרן: ביואיק  
דגם: LUCERNE
סוג הרכב: פרטי
רמת גימור: CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
נפח מנוע: 3791
סוג דלק: בנזין`,

  // Hebrew with different apostrophe/geresh characters
  encoding_variations: `מס׳ רכב: 5785269
מס״ רכב: 5785269
מס' רכב: 5785269
מס' רכב: 5785269`,

  // Real Levi report sample (from parse-hebrew-response.js)
  levi_sample: `פרטי רכב 5785269 להערכת נזק
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
מחיר סופי לרכב: 92,670`,

  // Corrupted or problematic encoding scenarios
  problematic: `מ×¡â€™ רכב: 5785269
יצר×Ÿ: ×'×™×•××™×§
דק×: LUCERNE
ק××× ×"××: פרטי`,

  // Mixed Hebrew and English
  mixed: `Plate Number: 5785269
יצרן: Buick
Model: LUCERNE
שנת ייצור: 2009
Owner: כרמל כיוף`
};

// Hebrew character patterns for analysis
const hebrewPatterns = {
  // Different apostrophe/geresh variations used in Hebrew
  apostrophes: [`'`, `'`, `׳`, `״`],
  
  // Common Hebrew field names with variations
  plate_variations: [
    'פרטי רכב',
    'מס\' רכב',
    "מס' רכב", 
    'מס׳ רכב',
    'מס״ רכב',
    'מספר רכב',
    'מס רכב'
  ],
  
  // Percentage patterns
  percentage_variations: [
    'מס\' ק״מ %',
    "מס' ק״מ %",
    'מס׳ ק״מ %',
    'מס״ ק״מ %',
    'בעלות %',
    'עליה לכביש %'
  ]
};

// Function to test Hebrew character detection
function testHebrewCharacterDetection() {
  console.log('\n🔍 Testing Hebrew Character Detection:');
  
  const hebrewText = 'מס\' רכב';
  console.log('Sample text:', hebrewText);
  console.log('Character codes:', [...hebrewText].map(char => `${char}(${char.charCodeAt(0)})`));
  console.log('Hebrew range test (U+0590-U+05FF):', /[\u0590-\u05FF]/.test(hebrewText));
  console.log('Hebrew range test (U+05D0-U+05EA):', /[\u05D0-\u05EA]/.test(hebrewText));
  
  // Test different apostrophe characters
  hebrewPatterns.apostrophes.forEach((apos, i) => {
    const testText = `מס${apos} רכב: 1234567`;
    console.log(`Apostrophe ${i+1} (${apos}): charCode=${apos.charCodeAt(0)}, text="${testText}"`);
  });
}

// Function to test current regex patterns against sample data
function testCurrentRegexPatterns() {
  console.log('\n🔍 Testing Current Regex Patterns:');
  
  // These are the actual patterns from helper.js
  const currentPatterns = [
    { 
      name: 'Plate Number',
      regex: /(?:פרטי רכב|מס[׳״\'"`]*\s*רכב|מספר רכב|מס רכב|מס\'\s*רכב|מספר ציון|מספר זיהוי)[:\s-]*([0-9]{7,8})/i,
      testData: testData.encoding_variations
    },
    {
      name: 'Manufacturer',
      regex: /(?:שם היצרן|יצרן|שם\s*יצרן|יצרן\s*הרכב)[:\s-]*([^\n\r\t,;]+?)(?:\s*(?:\n|\r|\t|,|;|$))/i,
      testData: 'שם היצרן: ביואיק\nדגם: LUCERNE'
    },
    {
      name: 'Mileage Percentage',
      regex: /מס[׳״\'\"`]*\s*ק[״׳\"\'\`]מ\s*%\s*:\s*([+-]?[0-9.,]+)/i,
      testData: testData.levi_sample
    },
    {
      name: 'Ownership Percentage', 
      regex: /בעלות\s*%\s*:\s*([+-]?[0-9.]+)%?/i,
      testData: testData.levi_sample
    }
  ];
  
  currentPatterns.forEach(({name, regex, testData: data}) => {
    console.log(`\nTesting ${name} pattern:`);
    console.log(`Regex: ${regex}`);
    const match = data.match(regex);
    if (match) {
      console.log(`✅ Match found: "${match[0]}" -> Value: "${match[1]}"`);
    } else {
      console.log(`❌ No match found in data`);
      console.log(`Sample data: ${data.substring(0, 200)}...`);
    }
  });
}

// Function to test encoding scenarios
function testEncodingScenarios() {
  console.log('\n🔍 Testing Encoding Scenarios:');
  
  Object.entries(testData).forEach(([scenario, data]) => {
    console.log(`\n--- ${scenario.toUpperCase()} ---`);
    console.log('Raw data preview:', data.substring(0, 150) + '...');
    
    // Test basic Hebrew detection
    const hasHebrew = /[\u0590-\u05FF]/.test(data);
    console.log('Contains Hebrew characters:', hasHebrew);
    
    // Test for common encoding issues
    const hasEncodingIssues = /×/.test(data) || /â€/.test(data);
    console.log('Potential encoding issues detected:', hasEncodingIssues);
    
    // Test plate number extraction with current pattern
    const plateMatch = data.match(/(?:פרטי רכב|מס[׳״\'"`]*\s*רכב|מספר רכב|מס רכב|מס\'\s*רכב)[:\s-]*([0-9]{7,8})/i);
    if (plateMatch) {
      console.log(`Plate extracted: ${plateMatch[1]}`);
    } else {
      console.log('❌ Plate extraction failed');
    }
  });
}

// Function to simulate webhook processing
function simulateWebhookProcessing() {
  console.log('\n🔍 Simulating Webhook Processing:');
  
  // Simulate different webhook payload formats
  const webhookPayloads = [
    {
      name: 'Direct Body Field',
      payload: { Body: testData.levi_sample }
    },
    {
      name: 'Array Format with Body',
      payload: [{ Body: testData.levi_sample }]
    },
    {
      name: 'Nested Value Format',
      payload: [{ value: JSON.stringify({ Body: testData.levi_sample }) }]
    },
    {
      name: 'Direct Hebrew Fields',
      payload: {
        'מס\' רכב': '5785269',
        'יצרן': 'ביואיק',
        'דגם': 'LUCERNE',
        'שנת ייצור': '2009'
      }
    }
  ];
  
  webhookPayloads.forEach(({name, payload}) => {
    console.log(`\n--- Testing ${name} ---`);
    console.log('Payload:', JSON.stringify(payload, null, 2).substring(0, 200) + '...');
    
    // Test how current processing would handle this
    if (payload.Body) {
      console.log('Direct Body processing: Available');
      testHebrewExtraction(payload.Body);
    } else if (Array.isArray(payload) && payload[0]?.Body) {
      console.log('Array Body processing: Available');
      testHebrewExtraction(payload[0].Body);
    } else if (typeof payload === 'object') {
      console.log('Direct object processing: Available');
      const hebrewFields = Object.keys(payload).filter(key => /[\u0590-\u05FF]/.test(key));
      console.log('Hebrew field keys detected:', hebrewFields);
    }
  });
}

// Helper function to test Hebrew extraction
function testHebrewExtraction(text) {
  if (!text || typeof text !== 'string') return;
  
  const extractionTests = [
    { name: 'Plate', regex: /([0-9]{7,8})/ },
    { name: 'Percentage values', regex: /([+-]?[0-9.,]+)%/ },
    { name: 'Currency values', regex: /([0-9,]+)/ },
    { name: 'Hebrew words', regex: /[\u0590-\u05FF]+/g }
  ];
  
  extractionTests.forEach(({name, regex}) => {
    const matches = text.match(regex);
    if (matches) {
      console.log(`${name} found:`, matches.slice(0, 3)); // Show first 3 matches
    }
  });
}

// Function to identify common problems
function identifyCommonProblems() {
  console.log('\n🚨 Identifying Common Hebrew Processing Problems:');
  
  const problems = [];
  
  // Problem 1: Multiple apostrophe/geresh character variations
  console.log('\n1. Apostrophe/Geresh Character Variations:');
  hebrewPatterns.apostrophes.forEach((char, i) => {
    const code = char.charCodeAt(0);
    const testText = `מס${char} רכב: 1234567`;
    const basicMatch = /מס.רכב/.test(testText);
    const advancedMatch = /מס[׳״\'"`]*\s*רכב/.test(testText);
    
    console.log(`  ${i+1}. "${char}" (U+${code.toString(16).toUpperCase().padStart(4, '0')}): basic=${basicMatch}, advanced=${advancedMatch}`);
    
    if (!advancedMatch) {
      problems.push(`Apostrophe variant "${char}" (U+${code.toString(16)}) may not be caught by current regex`);
    }
  });
  
  // Problem 2: Spacing variations
  console.log('\n2. Spacing Variations:');
  const spacingTests = [
    'מס\' רכב:1234567',      // No space after colon
    'מס\' רכב: 1234567',     // Space after colon
    'מס\' רכב : 1234567',    // Space before colon
    'מס\'רכב: 1234567'       // No space before 'רכב'
  ];
  
  spacingTests.forEach((test, i) => {
    const match = test.match(/מס[׳״\'"`]*\s*רכב\s*:\s*([0-9]{7,8})/);
    console.log(`  ${i+1}. "${test}": ${match ? '✅' : '❌'}`);
    if (!match) problems.push(`Spacing variant not handled: "${test}"`);
  });
  
  // Problem 3: Unicode normalization
  console.log('\n3. Unicode Normalization Issues:');
  const unicodeTest = 'מס\u0027 רכב'; // Regular apostrophe
  const hebrewTest = 'מס\u05F3 רכב';   // Hebrew punctuation geresh
  console.log(`Regular apostrophe (U+0027): "${unicodeTest}"`);
  console.log(`Hebrew geresh (U+05F3): "${hebrewTest}"`);
  
  const regexTest = /מס[׳״\'"`]*\s*רכב/;
  console.log(`Current regex handles regular: ${regexTest.test(unicodeTest)}`);
  console.log(`Current regex handles geresh: ${regexTest.test(hebrewTest)}`);
  
  return problems;
}

// Main execution function
function runHebrewProcessingAnalysis() {
  console.log('🚀 Starting Hebrew Processing Analysis...\n');
  
  // Run all tests
  testHebrewCharacterDetection();
  testCurrentRegexPatterns();
  testEncodingScenarios();
  simulateWebhookProcessing();
  const problems = identifyCommonProblems();
  
  // Summary
  console.log('\n📊 ANALYSIS SUMMARY:');
  console.log('='.repeat(50));
  
  if (problems.length > 0) {
    console.log('🚨 Problems Identified:');
    problems.forEach((problem, i) => {
      console.log(`  ${i+1}. ${problem}`);
    });
  } else {
    console.log('✅ No major problems identified in basic testing');
  }
  
  console.log('\n📝 Recommendations:');
  console.log('  1. Test with real Make.com webhook payloads');
  console.log('  2. Implement Unicode normalization for Hebrew characters');
  console.log('  3. Add comprehensive logging for failed regex matches');
  console.log('  4. Create automated tests for all Hebrew character variants');
  console.log('  5. Test with corrupted/malformed Hebrew encoding scenarios');
  
  return {
    success: true,
    problems: problems,
    testData: testData,
    patterns: hebrewPatterns
  };
}

// Export functions for external testing
if (typeof window !== 'undefined') {
  window.HebrewTestSuite = {
    runHebrewProcessingAnalysis,
    testHebrewCharacterDetection,
    testCurrentRegexPatterns,
    testEncodingScenarios,
    simulateWebhookProcessing,
    identifyCommonProblems,
    testData,
    hebrewPatterns
  };
  
  console.log('💡 Hebrew Test Suite loaded. Run window.HebrewTestSuite.runHebrewProcessingAnalysis() to start testing.');
}

// If running in Node.js environment, execute immediately
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runHebrewProcessingAnalysis, testData, hebrewPatterns };
  
  // Auto-run if script is executed directly
  if (require.main === module) {
    runHebrewProcessingAnalysis();
  }
}