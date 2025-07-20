// 🧪 Test script to debug data parsing issues
// This helps identify exactly where the data flow breaks

import { HEBREW_TO_ENGLISH } from './field-mapping-dictionary.js';

// Your actual Make.com data from the examples
const testMakeComData = `פרטי רכב: 5785269
תאריך: 2025-07-20T18:26:27.643+02:00
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

const testLeviData = `פרטי רכב 5785269 להערכת נזק
-------------------------------------
קוד דגם: 870170
שם דגם מלא :ג'יפ ריינג'ד 150(1332) LATITUDE
אוטומט : כן
מאפייני הרכב : 
תאריך הוצאת הדו"ח : 07/04/2025
עליה לכביש : 08/2021
מספר בעלים : 2
קטיגוריה : פנאי שטח
מס' ק"מ : 11900
מחיר בסיס : 85,000
מחיר סופי לרכב : 92,670

---------  נתוני התאמות מחיר--------
1. עליה לכביש : 
עליה לכביש % : 0%
ערך כספי עליה לכביש : 3,500
שווי מצטבר עליה לכביש : 88,500

2. מס' ק"מ : 
מס' ק"מ % : 7.95%
ערך כספי מס' ק"מ : 7,036
שווי מצטבר מס' ק"מ : 95,536

3. סוג בעלות : 
סוג בעלות : פרטית
בעלות % : -3%
ערך כספי בעלות : 2,866
שווי מצטבר בעלות : 92,670`;

function testHebrewParsing(text, label) {
  console.log(`\n🧪 Testing ${label}:`);
  console.log('📝 Raw text:', text.substring(0, 100) + '...');
  
  const result = {};
  const lines = text.split('\n').filter(line => line.trim());
  
  console.log(`📋 Processing ${lines.length} lines`);
  
  let mappedCount = 0;
  let unmappedCount = 0;
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    
    let parts = [];
    if (line.includes(':')) {
      parts = line.split(':');
    } else if (line.includes('：')) {
      parts = line.split('：');
    }
    
    if (parts.length >= 2) {
      const hebrewKey = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      
      if (!value) return;
      
      const englishKey = HEBREW_TO_ENGLISH[hebrewKey];
      if (englishKey) {
        result[englishKey] = value;
        console.log(`  ✅ Line ${index + 1}: "${hebrewKey}" → ${englishKey}: "${value}"`);
        mappedCount++;
      } else if (value && value !== '-') {
        result[hebrewKey] = value;
        console.log(`  ❌ Line ${index + 1}: "${hebrewKey}": "${value}" (NO MAPPING FOUND)`);
        unmappedCount++;
      }
    }
  });
  
  console.log(`\n📊 Results for ${label}:`);
  console.log(`  ✅ Mapped fields: ${mappedCount}`);
  console.log(`  ❌ Unmapped fields: ${unmappedCount}`);
  console.log(`  📋 Final parsed object:`, result);
  
  return result;
}

// Test the parsing
console.log('🧪 TESTING DATA PARSING WITH ACTUAL MAKE.COM DATA');
console.log('=' .repeat(60));

const makeComResult = testHebrewParsing(testMakeComData, 'Make.com Car Data');
const leviResult = testHebrewParsing(testLeviData, 'Levi OCR Data');

console.log('\n🎯 SUMMARY:');
console.log('Make.com parsed fields:', Object.keys(makeComResult));
console.log('Levi parsed fields:', Object.keys(leviResult));

// Test specific critical fields
const criticalFields = ['plate', 'manufacturer', 'model', 'owner', 'year'];
console.log('\n🔍 Critical field check:');
criticalFields.forEach(field => {
  const makeValue = makeComResult[field];
  const status = makeValue ? '✅' : '❌';
  console.log(`  ${status} ${field}: ${makeValue || 'MISSING'}`);
});

export { testHebrewParsing };