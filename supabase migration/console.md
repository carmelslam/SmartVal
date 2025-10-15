parts%20search.html?wizard=true&step=4&t=1760559672920:4479 🔄 Updated part name options for group: מנוע וחלקי מנוע
parts%20search.html?wizard=true&step=4&t=1760559672920:1093 🔍 Loading 89 parts for category: מנוע וחלקי מנוע
parts%20search.html?wizard=true&step=4&t=1760559672920:1145 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760559672920:1166 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760559672920:1145 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760559672920:1166 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760559672920:1145 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760559672920:1166 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760559672920:2416 🌐 SESSION 23: Starting web external search...
parts%20search.html?wizard=true&step=4&t=1760559672920:2062 🔘 Button state: web
parts%20search.html?wizard=true&step=4&t=1760559672920:2456 🔍 DEBUG: Reading form values...
parts%20search.html?wizard=true&step=4&t=1760559672920:2472 📋 Form values: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', year: '2022', part_name: 'מיכל עיבוי', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2492 📦 Search params assembled: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:130 💾 SESSION 26 DEBUG: createSearchSession called!
partsSearchSupabaseService.js:131   - Plate: 221-84-003
partsSearchSupabaseService.js:132   - Call stack: Error
    at PartsSearchSupabaseService.createSearchSession (https://yaron-cayouf-portal.netlify.app/services/partsSearchSupabaseService.js:132:40)
    at searchWebExternal (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:2495:67)
    at handleWebSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:708:13)
    at HTMLDivElement.onclick (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:516:79)
partsSearchSupabaseService.js:133 💾 SESSION 11: Creating search session for plate: 221-84-003
partsSearchSupabaseService.js:138   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:35 🔍 SESSION 11: Determining case_id for plate: 221-84-003
partsSearchSupabaseService.js:68   🔍 TIER 3: Looking up by plate (active cases only)
partsSearchSupabaseService.js:70   - Normalized plate (no dashes): 22184003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&or=%28plate.eq.221-84-003%2Cplate.eq.22184003%29&or=%28status.eq.OPEN%2Cstatus.eq.IN_PROGRESS%29&limit=1
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'cases', filters: Array(2), selectFields: 'id'}
partsSearchSupabaseService.js:81   ✅ TIER 3: Found case_id from active case: c52af5d6-3b78-47b8-88a2-d2553ee3e1af
partsSearchSupabaseService.js:115   ⚠️ Auth check failed: Cannot read properties of undefined (reading 'getUser')
partsSearchSupabaseService.js:152 🔍 SESSION 28: dataSource being sent to Supabase: web
partsSearchSupabaseService.js:153   - searchContext.dataSource: web
partsSearchSupabaseService.js:154   - searchParams.dataSource: undefined
partsSearchSupabaseService.js:155   - DB expects: catalog, web, or ocr
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_sessions
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'parts_search_sessions', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:184 ✅ SESSION 11: Search session created: 2c5d4c18-31c0-4fed-82fe-b7f665a427f0 | case_id: c52af5d6-3b78-47b8-88a2-d2553ee3e1af | user: NULL
parts%20search.html?wizard=true&step=4&t=1760559672920:2500 ✅ Search session created: 2c5d4c18-31c0-4fed-82fe-b7f665a427f0
parts%20search.html?wizard=true&step=4&t=1760559672920:2543 📤 Webhook FormData assembled with image: no image
parts%20search.html?wizard=true&step=4&t=1760559672920:2565 📥 Raw webhook response: {"results":[{"ספק":"יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)","מיקום":"ישראל (רשת ארצית)","סוג מקור":"מקורי","מצב":"חדש","תיאור חלק":"מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.","זמינות":"זמין (במלאי מרכזי או בהזמנה)","מחיר":"580","מטבע":"ש\"ח","קוד OEM":"16470-F0010","קוד קטלוגי":null,"הערות":"האפשרות המומלצת ביותר לאמינות והתאמה מלאה. אחריות יבואן רשמי."},{"ספק":"א.ד.י מערכות רכב","מיקום":"חולון, ישראל","סוג מקור":"תחליפי","מצב":"חדש","תיאור חלק":"מיכל עיבוי תחליפי איכותי מתוצרת אירופאית, תואם למקורי.","זמינות":"זמין במלאי","מחיר":"340","מטבע":"ש\"ח","קוד OEM":"16470-F0010","קוד קטלוגי":"NRF-454059","הערות":"איזון טוב בין איכות למחיר. מומלץ לוודא ארץ ייצור."},{"ספק":"יעד חלפים לרכב","מיקום":"פתח תקווה, ישראל","סוג מקור":"תחליפי","מצב":"חדש","תיאור חלק":"מיכל עיבוי תחליפי (Aftermarket) לדגם הקורולה קרוס.","זמינות":"זמין במלאי","מחיר":"290","מטבע":"ש\"ח","קוד OEM":"16470-F0010","קוד קטלוגי":"TYC-18-G039-A","הערות":"אפשרות חסכונית, יש לוודא התאמה מלאה לפני ההתקנה."},{"ספק":"מלכי החלפים (מגרש פירוק)","מיקום":"אזור תעשייה סגולה, פתח תקווה","סוג מקור":"משומש","מצב":"משומש","תיאור חלק":"מיכל עיבוי מקורי מפירוק רכב, נבדק ויזואלית.","זמינות":"במלאי מוגבל","מחיר":"200","מטבע":"ש\"ח","קוד OEM":"16470-F0010","קוד קטלוגי":null,"הערות":"האפשרות הזולה ביותר. מומלץ לבדוק את החלק היטב לאיתור סדקים או נזילות לפני הרכישה. אחריות מוגבלת."},{"ספק":"Autodoc","מיקום":"גרמניה (משלוח בינלאומי)","סוג מקור":"תחליפי","מצב":"חדש","תיאור חלק":"מיכל עיבוי תחליפי של מותג אירופאי.","זמינות":"זמין למשלוח","מחיר":"255","מטבע":"ש\"ח","קוד OEM":"16470-F0010","קוד קטלוגי":"RIDEX-586T0021","הערות":"המחיר אינו כולל עלויות משלוח, מכס ומע\"מ. זמן אספקה ארוך יחסית."}],"סיכום":{"סהכ תוצאות":5,"המלצה":"ההמלצה הטובה ביותר היא החלק התחליפי מ'א.ד.י מערכות רכב' במחיר 340 ש\"ח, המציע את האיזון הטוב ביותר בין מחיר, איכות וזמינות מיידית בישראל. לרכב חדש יחסית, חלק מקורי מיוניון מוטורס מבטיח שקט נפשי למרות מחירו הגבוה."}}
parts%20search.html?wizard=true&step=4&t=1760559672920:2576 ✅ Webhook response received: {results: Array(5), סיכום: {…}}
parts%20search.html?wizard=true&step=4&t=1760559672920:2067 📥 SESSION 23: Processing webhook response {dataSource: 'web', webhookData: {…}}
parts%20search.html?wizard=true&step=4&t=1760559672920:2075 🔍 SESSION 26 DEBUG: Raw webhook data before append...
parts%20search.html?wizard=true&step=4&t=1760559672920:2076   - Using window.helper: true
parts%20search.html?wizard=true&step=4&t=1760559672920:2077   - Current raw_webhook_data length: 22
parts%20search.html?wizard=true&step=4&t=1760559672920:2118 📝 SESSION 26: Appending webhook to array (current length: 22)...
parts%20search.html?wizard=true&step=4&t=1760559672920:2120 ✅ SESSION 26: Webhook appended! New length: 23
parts%20search.html?wizard=true&step=4&t=1760559672920:2121   - Webhook ID: webhook_1760560371637_vwzmh786q
parts%20search.html?wizard=true&step=4&t=1760559672920:2122   - Data source: web
parts%20search.html?wizard=true&step=4&t=1760559672920:2128 💾 SESSION 26: Helper saved to window, sessionStorage, and localStorage
parts%20search.html?wizard=true&step=4&t=1760559672920:2134 🔍 SESSION 24: Analyzing webhook structure...
parts%20search.html?wizard=true&step=4&t=1760559672920:2135   - Is Array? false
parts%20search.html?wizard=true&step=4&t=1760559672920:2136   - Has body? false
parts%20search.html?wizard=true&step=4&t=1760559672920:2137   - Has results? true
parts%20search.html?wizard=true&step=4&t=1760559672920:2153 📦 Webhook has direct results structure
parts%20search.html?wizard=true&step=4&t=1760559672920:2159 📦 Received 5 results from webhook
parts%20search.html?wizard=true&step=4&t=1760559672920:2161 📋 First result sample: {ספק: 'יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)', מיקום: 'ישראל (רשת ארצית)', סוג מקור: 'מקורי', מצב: 'חדש', תיאור חלק: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2162 📋 First result keys: (11) ['ספק', 'מיקום', 'סוג מקור', 'מצב', 'תיאור חלק', 'זמינות', 'מחיר', 'מטבע', 'קוד OEM', 'קוד קטלוגי', 'הערות']
parts%20search.html?wizard=true&step=4&t=1760559672920:2187 🔄 SESSION 24: Transforming webhook results...
parts%20search.html?wizard=true&step=4&t=1760559672920:2188 🔍 SESSION 27: Data source is: web
parts%20search.html?wizard=true&step=4&t=1760559672920:2192 📋 First webhook item keys: (11) ['ספק', 'מיקום', 'סוג מקור', 'מצב', 'תיאור חלק', 'זמינות', 'מחיר', 'מטבע', 'קוד OEM', 'קוד קטלוגי', 'הערות']
parts%20search.html?wizard=true&step=4&t=1760559672920:2193 📋 First webhook item sample: {ספק: 'יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)', מיקום: 'ישראל (רשת ארצית)', סוג מקור: 'מקורי', מצב: 'חדש', תיאור חלק: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2266 🔄 Transformed 5 results to catalog format
parts%20search.html?wizard=true&step=4&t=1760559672920:2270 🔍 WEB SEARCH - First transformed result (what PiP receives): {id: 'webhook_1760560371637_vwzmh786q_0', pcode: '16470-F0010', cat_num_desc: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', supplier_name: 'יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)', availability: 'מקורי', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2271   📋 cat_num_desc: מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.
parts%20search.html?wizard=true&step=4&t=1760559672920:2272   💰 price: 580
parts%20search.html?wizard=true&step=4&t=1760559672920:2273   🏷️ supplier_name: יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)
parts%20search.html?wizard=true&step=4&t=1760559672920:2274   🔧 part_family: מנוע וחלקי מנוע
parts%20search.html?wizard=true&step=4&t=1760559672920:2298 📝 SESSION 26: Appending to web_search_results (current: 20)...
parts%20search.html?wizard=true&step=4&t=1760559672920:2300 ✅ SESSION 26: Web result appended! New total: 21
parts%20search.html?wizard=true&step=4&t=1760559672920:2314 📋 SESSION 26: Also added to generic results array (total: 36)
parts%20search.html?wizard=true&step=4&t=1760559672920:2321 ✅ SESSION 26: Helper updated with webhook results and saved
parts-search-results-pip.js:29 📋 Showing PiP results: 5 items
parts-search-results-pip.js:32 🔄 SESSION 17: Clearing selectedItems for new search (was: 2 )
parts-search-results-pip.js:34 ✅ SESSION 17: selectedItems cleared, starting fresh count
parts-search-results-pip.js:37 🔍 SESSION 9 TASK 1: Plate number extraction...
parts-search-results-pip.js:38   - searchContext: {
  "plate": "221-84-003",
  "sessionId": "2c5d4c18-31c0-4fed-82fe-b7f665a427f0",
  "searchType": "web_search",
  "dataSource": "web",
  "searchSuccess": true,
  "errorMessage": null,
  "searchTime": 0,
  "searchParams": {
    "plate": "221-84-003",
    "manufacturer": "טויוטה יפן",
    "model": "קורולה קרוס",
    "model_code": "ZVG12L-KHXGBW",
    "trim": "ADVENTURE",
    "year": "2022",
    "engine_volume": "",
    "engine_code": "2ZR",
    "engine_type": "בנזין",
    "vin": "JTNADACB20J001538",
    "oem": "",
    "part_group": "מנוע וחלקי מנוע",
    "part_name": "מיכל עיבוי",
    "free_query": "",
    "selectedParts": []
  },
  "caseId": "c52af5d6-3b78-47b8-88a2-d2553ee3e1af"
}
parts-search-results-pip.js:39   - searchContext.plate: 221-84-003
parts-search-results-pip.js:40   - window.helper exists: true
parts-search-results-pip.js:41   - window.helper?.plate: undefined
parts-search-results-pip.js:53   - RESOLVED plate number: 221-84-003
parts-search-results-pip.js:54   - Extraction strategy used: SUCCESS
parts-search-results-pip.js:60 📋 SESSION 34: Case UUID stored in PiP: c52af5d6-3b78-47b8-88a2-d2553ee3e1af
parts-search-results-pip.js:67 🔍 SESSION 9 DEBUG: Check conditions: {hasPlateNumber: true, plateNumber: '221-84-003', hasSessionId: true, resultsCount: 5, serviceAvailable: true}
parts-search-results-pip.js:77 ✅ SESSION 12: Conditions met, starting Supabase save...
parts-search-results-pip.js:78   - Plate number: 221-84-003
parts-search-results-pip.js:79   - Results count: 5
parts-search-results-pip.js:82 📦 SESSION 9: Getting global service...
parts-search-results-pip.js:87 ✅ SESSION 9: Service available
parts-search-results-pip.js:93 🔍 SESSION 26 DEBUG: PiP session handling...
parts-search-results-pip.js:94   - searchContext.sessionId: 2c5d4c18-31c0-4fed-82fe-b7f665a427f0
parts-search-results-pip.js:95   - window.currentSearchSessionId: 2c5d4c18-31c0-4fed-82fe-b7f665a427f0
parts-search-results-pip.js:96   - Resolved session ID: 2c5d4c18-31c0-4fed-82fe-b7f665a427f0
parts-search-results-pip.js:97   - Stack trace: Error
    at PartsSearchResultsPiP.showResults (https://yaron-cayouf-portal.netlify.app/parts-search-results-pip.js:97:41)
    at handleWebhookResponse (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:2349:38)
    at async searchWebExternal (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:2583:7)
    at async handleWebSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:708:7)
parts-search-results-pip.js:102 ✅ SESSION 26: PiP using existing search session (NOT creating new): 2c5d4c18-31c0-4fed-82fe-b7f665a427f0
parts-search-results-pip.js:106 💾 SESSION 26: PiP calling saveSearchResults (does NOT create session)...
partsSearchSupabaseService.js:215 💾 SESSION 9 TASK 3: Saving search results with individual fields...
partsSearchSupabaseService.js:216   - Results count: 5
partsSearchSupabaseService.js:217   - Query context: {plate: '221-84-003', sessionId: '2c5d4c18-31c0-4fed-82fe-b7f665a427f0', searchType: 'web_search', dataSource: 'web', searchSuccess: true, …}
partsSearchSupabaseService.js:223   - First result sample: {id: 'webhook_1760560371637_vwzmh786q_0', pcode: '16470-F0010', cat_num_desc: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', supplier_name: 'יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)', availability: 'מקורי', …}
partsSearchSupabaseService.js:224   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:239   - Unique sources found: מקורי, תחליפי, משומש
partsSearchSupabaseService.js:271   - Insert data prepared: (17) ['session_id', 'plate', 'make', 'model', 'trim', 'year', 'engine_volume', 'engine_code', 'engine_type', 'vin', 'part_family', 'search_type', 'data_source', 'search_query', 'results', 'response_time_ms', 'created_at']
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_results
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'parts_search_results', filters: Array(0), selectFields: '*'}
damage-centers-wizard.html:7070 🔄 Helper data updated, refreshing damage centers dropdown...
damage-centers-wizard.html:7070 🔄 Helper data updated, refreshing damage centers dropdown...
damage-centers-wizard.html:6701 🔍 Populating existing damage centers dropdown (forceRefresh: true)
damage-centers-wizard.html:6734 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
damage-centers-wizard.html:6739 🔍 Using getDamageCentersFromHelper to find damage centers...
damage-centers-wizard.html:5909 ✅ Found damage centers in helper.centers: 2
damage-centers-wizard.html:6744 ✅ Found damage centers via getDamageCentersFromHelper: 2
damage-centers-wizard.html:6749 📊 Found 2 damage centers in getDamageCentersFromHelper
damage-centers-wizard.html:7138 ✅ Updated existing centers display with 2 centers
damage-centers-wizard.html:6701 🔍 Populating existing damage centers dropdown (forceRefresh: true)
damage-centers-wizard.html:6734 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
damage-centers-wizard.html:6739 🔍 Using getDamageCentersFromHelper to find damage centers...
damage-centers-wizard.html:5909 ✅ Found damage centers in helper.centers: 2
damage-centers-wizard.html:6744 ✅ Found damage centers via getDamageCentersFromHelper: 2
damage-centers-wizard.html:6749 📊 Found 2 damage centers in getDamageCentersFromHelper
damage-centers-wizard.html:7138 ✅ Updated existing centers display with 2 centers
partsSearchSupabaseService.js:283 ✅ SESSION 9 TASK 3: Search results saved with populated fields: e5958081-6bc6-429d-b531-9b52225761c5
parts-search-results-pip.js:112 ✅ SESSION 26: Search results saved to Supabase
parts-search-results-pip.js:114 📋 SESSION 26: Stored search result ID for FK: e5958081-6bc6-429d-b531-9b52225761c5
parts-search-results-pip.js:157 🪟 PiP DOM element created and appended: {element: div.pip-overlay, className: 'pip-overlay', innerHTML_length: 8525, isConnected: true, parentNode: body}
parts-search-results-pip.js:744 🔍 Attempting to discover selected_parts table structure...
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?limit=1
parts-search-results-pip.js:173 🎬 PiP animation class added: {hasVisibleClass: true, computedStyle: '0', display: 'flex'}
parts-search-results-pip.js:759 📋 Selected parts table columns: (34) ['id', 'plate', 'search_result_id', 'part_name', 'price', 'oem', 'quantity', 'damage_center_id', 'status', 'selected_by', 'selected_at', 'raw_data', 'make', 'model', 'trim', 'year', 'engine_volume', 'pcode', 'cat_num_desc', 'source', 'availability', 'location', 'comments', 'vin', 'engine_code', 'engine_type', 'supplier_name', 'part_family', 'data_source', 'part_make', 'part_model', 'part_year_from', 'part_year_to', 'case_id']
parts-search-results-pip.js:767 🚗 Found vehicle identifier column: plate
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?plate=eq.221-84-003
parts-search-results-pip.js:781 📋 Loaded existing selections (visual only): 3
parts%20search.html?wizard=true&step=4&t=1760559672920:2350 ✅ PiP displayed with transformed webhook results
parts%20search.html?wizard=true&step=4&t=1760559672920:2062 🔘 Button state: all enabled
parts-search-results-pip.js:548 🔧 SESSION 15: addToHelper called with item: {id: 'webhook_1760560371637_vwzmh786q_0', pcode: '16470-F0010', cat_num_desc: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', supplier_name: 'יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)', availability: 'מקורי', …}
parts-search-results-pip.js:573 🔧 SESSION 15: Converted part entry: {name: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', תיאור: 'מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.', כמות: 1, qty: 1, group: 'מנוע וחלקי מנוע', …}
parts-search-results-pip.js:597 ✅ SESSION 19: Added new part to current_selected_list
parts-search-results-pip.js:601 ✅ SESSION 19: Reset saved flag (new part added)
parts-search-results-pip.js:604 📋 SESSION 15: Current session parts: 1
parts-search-results-pip.js:605 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 3
parts-search-results-pip.js:610 ✅ SESSION 15: Saved helper to sessionStorage
parts%20search.html?wizard=true&step=4&t=1760559672920:3504 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760559672920:3650 ✅ SESSION 19: Displaying 1 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760559672920:3655 📊 SESSION 19: Updated count display to 1
parts-search-results-pip.js:618 ✅ SESSION 13: Triggered selected parts list UI update
partsSearchSupabaseService.js:308 💾 SESSION 11: Saving selected part for plate: 221-84-003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.16470-F0010&limit=1
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(2), selectFields: 'id'}
damage-centers-wizard.html:7070 🔄 Helper data updated, refreshing damage centers dropdown...
damage-centers-wizard.html:6701 🔍 Populating existing damage centers dropdown (forceRefresh: true)
damage-centers-wizard.html:6734 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
damage-centers-wizard.html:6739 🔍 Using getDamageCentersFromHelper to find damage centers...
damage-centers-wizard.html:5909 ✅ Found damage centers in helper.centers: 2
damage-centers-wizard.html:6744 ✅ Found damage centers via getDamageCentersFromHelper: 2
damage-centers-wizard.html:6749 📊 Found 2 damage centers in getDamageCentersFromHelper
damage-centers-wizard.html:7138 ✅ Updated existing centers display with 2 centers
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:376 ✅ SESSION 11: Selected part saved: 4993fade-d6a8-475e-8c0f-80b699000e32 | search_result_id: e5958081-6bc6-429d-b531-9b52225761c5
parts-search-results-pip.js:499 ✅ SESSION 11: Part saved to Supabase selected_parts: 4993fade-d6a8-475e-8c0f-80b699000e32
parts-search-results-pip.js:503 📊 SESSION 34: Triggering counter refresh in wizard...
damage-centers-wizard.html:6490 📊 SESSION 34: Found filing_case_id: YC-22184003-2025, looking up UUID...
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&filing_case_id=eq.YC-22184003-2025
parts-search-results-pip.js:444 ✅ Part selected: 16470-F0010
damage-centers-wizard.html:6505 📊 SESSION 34: Found case UUID: c52af5d6-3b78-47b8-88a2-d2553ee3e1af, counting selected parts...
supabaseClient.js:221 🔍 Supabase RPC call: count_selected_parts_by_case {case_uuid: 'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'}
damage-centers-wizard.html:6523 ✅ SESSION 34: Updated counter to show 4 selected parts
parts-search-results-pip.js:548 🔧 SESSION 15: addToHelper called with item: {id: 'webhook_1760560371637_vwzmh786q_1', pcode: 'NRF-454059', cat_num_desc: 'מיכל עיבוי תחליפי איכותי מתוצרת אירופאית, תואם למקורי.', supplier_name: 'א.ד.י מערכות רכב', availability: 'תחליפי', …}
parts-search-results-pip.js:573 🔧 SESSION 15: Converted part entry: {name: 'מיכל עיבוי תחליפי איכותי מתוצרת אירופאית, תואם למקורי.', תיאור: 'מיכל עיבוי תחליפי איכותי מתוצרת אירופאית, תואם למקורי.', כמות: 1, qty: 1, group: 'מנוע וחלקי מנוע', …}
parts-search-results-pip.js:597 ✅ SESSION 19: Added new part to current_selected_list
parts-search-results-pip.js:601 ✅ SESSION 19: Reset saved flag (new part added)
parts-search-results-pip.js:604 📋 SESSION 15: Current session parts: 2
parts-search-results-pip.js:605 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 3
parts-search-results-pip.js:610 ✅ SESSION 15: Saved helper to sessionStorage
parts%20search.html?wizard=true&step=4&t=1760559672920:3504 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760559672920:3650 ✅ SESSION 19: Displaying 2 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760559672920:3655 📊 SESSION 19: Updated count display to 2
parts-search-results-pip.js:618 ✅ SESSION 13: Triggered selected parts list UI update
partsSearchSupabaseService.js:308 💾 SESSION 11: Saving selected part for plate: 221-84-003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.NRF-454059&limit=1
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(2), selectFields: 'id'}
damage-centers-wizard.html:7070 🔄 Helper data updated, refreshing damage centers dropdown...
damage-centers-wizard.html:6701 🔍 Populating existing damage centers dropdown (forceRefresh: true)
damage-centers-wizard.html:6734 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
damage-centers-wizard.html:6739 🔍 Using getDamageCentersFromHelper to find damage centers...
damage-centers-wizard.html:5909 ✅ Found damage centers in helper.centers: 2
damage-centers-wizard.html:6744 ✅ Found damage centers via getDamageCentersFromHelper: 2
damage-centers-wizard.html:6749 📊 Found 2 damage centers in getDamageCentersFromHelper
damage-centers-wizard.html:7138 ✅ Updated existing centers display with 2 centers
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:376 ✅ SESSION 11: Selected part saved: d689f053-dadb-459d-bfa9-0ecbe8400086 | search_result_id: e5958081-6bc6-429d-b531-9b52225761c5
parts-search-results-pip.js:499 ✅ SESSION 11: Part saved to Supabase selected_parts: d689f053-dadb-459d-bfa9-0ecbe8400086
parts-search-results-pip.js:503 📊 SESSION 34: Triggering counter refresh in wizard...
damage-centers-wizard.html:6490 📊 SESSION 34: Found filing_case_id: YC-22184003-2025, looking up UUID...
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&filing_case_id=eq.YC-22184003-2025
parts-search-results-pip.js:444 ✅ Part selected: NRF-454059
damage-centers-wizard.html:6505 📊 SESSION 34: Found case UUID: c52af5d6-3b78-47b8-88a2-d2553ee3e1af, counting selected parts...
supabaseClient.js:221 🔍 Supabase RPC call: count_selected_parts_by_case {case_uuid: 'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'}
damage-centers-wizard.html:6523 ✅ SESSION 34: Updated counter to show 5 selected parts
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(1), selectFields: 'id'}
parts-search-results-pip.js:878 ✅ SESSION 17: Cumulative total from Supabase: 5
parts-search-results-pip.js:889 💾 SESSION 17: Saving selections - selectedItems.size: 2 Cumulative total: 5
parts-search-results-pip.js:890 💾 SESSION 17: selectedItems contents: (2) ['webhook_1760560371637_vwzmh786q_0', 'webhook_1760560371637_vwzmh786q_1']
parts%20search.html?wizard=true&step=4&t=1760559672920:1145 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760559672920:1166 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760559672920:2416 🌐 SESSION 23: Starting web external search...
parts%20search.html?wizard=true&step=4&t=1760559672920:2062 🔘 Button state: web
parts%20search.html?wizard=true&step=4&t=1760559672920:2456 🔍 DEBUG: Reading form values...
parts%20search.html?wizard=true&step=4&t=1760559672920:2472 📋 Form values: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', year: '2022', part_name: 'כיסוי מנוע', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2492 📦 Search params assembled: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:130 💾 SESSION 26 DEBUG: createSearchSession called!
partsSearchSupabaseService.js:131   - Plate: 221-84-003
partsSearchSupabaseService.js:132   - Call stack: Error
    at PartsSearchSupabaseService.createSearchSession (https://yaron-cayouf-portal.netlify.app/services/partsSearchSupabaseService.js:132:40)
    at searchWebExternal (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:2495:67)
    at handleWebSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:708:13)
    at HTMLDivElement.onclick (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:516:79)
partsSearchSupabaseService.js:133 💾 SESSION 11: Creating search session for plate: 221-84-003
partsSearchSupabaseService.js:138   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:35 🔍 SESSION 11: Determining case_id for plate: 221-84-003
partsSearchSupabaseService.js:68   🔍 TIER 3: Looking up by plate (active cases only)
partsSearchSupabaseService.js:70   - Normalized plate (no dashes): 22184003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&or=%28plate.eq.221-84-003%2Cplate.eq.22184003%29&or=%28status.eq.OPEN%2Cstatus.eq.IN_PROGRESS%29&limit=1
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'cases', filters: Array(2), selectFields: 'id'}
partsSearchSupabaseService.js:81   ✅ TIER 3: Found case_id from active case: c52af5d6-3b78-47b8-88a2-d2553ee3e1af
partsSearchSupabaseService.js:115   ⚠️ Auth check failed: Cannot read properties of undefined (reading 'getUser')
partsSearchSupabaseService.js:152 🔍 SESSION 28: dataSource being sent to Supabase: web
partsSearchSupabaseService.js:153   - searchContext.dataSource: web
partsSearchSupabaseService.js:154   - searchParams.dataSource: undefined
partsSearchSupabaseService.js:155   - DB expects: catalog, web, or ocr
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_sessions
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'parts_search_sessions', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:184 ✅ SESSION 11: Search session created: 2caca252-c0f6-4cad-8cad-bf89a24a614c | case_id: c52af5d6-3b78-47b8-88a2-d2553ee3e1af | user: NULL
parts%20search.html?wizard=true&step=4&t=1760559672920:2500 ✅ Search session created: 2caca252-c0f6-4cad-8cad-bf89a24a614c
parts%20search.html?wizard=true&step=4&t=1760559672920:2543 📤 Webhook FormData assembled with image: no image
parts%20search.html?wizard=true&step=4&t=1760559672920:2565 📥 Raw webhook response: {"results":[{"ספק":"יוניון מוטורס - יבואן טויוטה הרשמי","מיקום":"ישראל","סוג מקור":"מקורי","מצב":"חדש","תיאור":"מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב","זמינות":"זמין","מחיר":550,"מטבע":"ש״ח","קוד OEM":"16470-F0050","קוד קטלוגי":null,"הערות":"החלק המקורי והמומלץ ביותר על ידי היצרן. כולל אחריות יבואן רשמי."},{"ספק":"אוטוסטור ישראל","מיקום":"ישראל","סוג מקור":"מקורי","מצב":"חדש","תיאור":"מיכל עיבוי מקורי טויוטה באריזה מקורית","זמינות":"במלאי","מחיר":485,"מטבע":"ש״ח","קוד OEM":"16470-F0050","קוד קטלוגי":"AS-16470F0050","הערות":"חלופה למפיץ הרשמי, חלק זהה במחיר נמוך יותר."},{"ספק":"אירוקאר חלפים","מיקום":"אירופה (יבוא)","סוג מקור":"תחליפי","מצב":"חדש","תיאור":"מיכל עיבוי תחליפי איכותי מתוצרת NRF, הולנד","זמינות":"זמין להזמנה","מחיר":250,"מטבע":"ש״ח","קוד OEM":"16470-F0050","קוד קטלוגי":"NRF-47391","הערות":"תחליפי איכותי מתוצרת אירופאית מוכרת, עומד בתקני איכות מחמירים. זמן אספקה 7-10 ימי עסקים."},{"ספק":"חלפים בקליק","מיקום":"ישראל","סוג מקור":"תחליפי","מצב":"חדש","תיאור":"מיכל עיבוי תואם לטויוטה קורולה קרוס","זמינות":"במלאי מוגבל","מחיר":210,"מטבע":"ש״ח","קוד OEM":"16470-F0050","קוד קטלוגי":"CP-TY88412","הערות":"האפשרות הזולה ביותר, מגיע עם אחריות לשנה מהספק."},{"ספק":"פירוקיית 'השלדה'","מיקום":"ישראל","סוג מקור":"משומש","מצב":"משומש","תיאור":"מיכל עיבוי מקורי מפירוק רכב עם נסועה נמוכה","זמינות":"זמין","מחיר":150,"מטבע":"ש״ח","קוד OEM":"16470-F0050","קוד קטלוגי":null,"הערות":"החלק נבדק ונמצא תקין. כולל אחריות לשלושה חודשים."}],"תקציר":{"סך הכל תוצאות":5,"מומלץ":"מיכל עיבוי תחליפי, אירוקאר חלפים, 250 ₪, זמין להזמנה"}}
parts%20search.html?wizard=true&step=4&t=1760559672920:2576 ✅ Webhook response received: {results: Array(5), תקציר: {…}}
parts%20search.html?wizard=true&step=4&t=1760559672920:2067 📥 SESSION 23: Processing webhook response {dataSource: 'web', webhookData: {…}}
parts%20search.html?wizard=true&step=4&t=1760559672920:2075 🔍 SESSION 26 DEBUG: Raw webhook data before append...
parts%20search.html?wizard=true&step=4&t=1760559672920:2076   - Using window.helper: true
parts%20search.html?wizard=true&step=4&t=1760559672920:2077   - Current raw_webhook_data length: 23
parts%20search.html?wizard=true&step=4&t=1760559672920:2118 📝 SESSION 26: Appending webhook to array (current length: 23)...
parts%20search.html?wizard=true&step=4&t=1760559672920:2120 ✅ SESSION 26: Webhook appended! New length: 24
parts%20search.html?wizard=true&step=4&t=1760559672920:2121   - Webhook ID: webhook_1760560594058_bojkv589c
parts%20search.html?wizard=true&step=4&t=1760559672920:2122   - Data source: web
parts%20search.html?wizard=true&step=4&t=1760559672920:2128 💾 SESSION 26: Helper saved to window, sessionStorage, and localStorage
parts%20search.html?wizard=true&step=4&t=1760559672920:2134 🔍 SESSION 24: Analyzing webhook structure...
parts%20search.html?wizard=true&step=4&t=1760559672920:2135   - Is Array? false
parts%20search.html?wizard=true&step=4&t=1760559672920:2136   - Has body? false
parts%20search.html?wizard=true&step=4&t=1760559672920:2137   - Has results? true
parts%20search.html?wizard=true&step=4&t=1760559672920:2153 📦 Webhook has direct results structure
parts%20search.html?wizard=true&step=4&t=1760559672920:2159 📦 Received 5 results from webhook
parts%20search.html?wizard=true&step=4&t=1760559672920:2161 📋 First result sample: {ספק: 'יוניון מוטורס - יבואן טויוטה הרשמי', מיקום: 'ישראל', סוג מקור: 'מקורי', מצב: 'חדש', תיאור: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2162 📋 First result keys: (11) ['ספק', 'מיקום', 'סוג מקור', 'מצב', 'תיאור', 'זמינות', 'מחיר', 'מטבע', 'קוד OEM', 'קוד קטלוגי', 'הערות']
parts%20search.html?wizard=true&step=4&t=1760559672920:2187 🔄 SESSION 24: Transforming webhook results...
parts%20search.html?wizard=true&step=4&t=1760559672920:2188 🔍 SESSION 27: Data source is: web
parts%20search.html?wizard=true&step=4&t=1760559672920:2192 📋 First webhook item keys: (11) ['ספק', 'מיקום', 'סוג מקור', 'מצב', 'תיאור', 'זמינות', 'מחיר', 'מטבע', 'קוד OEM', 'קוד קטלוגי', 'הערות']
parts%20search.html?wizard=true&step=4&t=1760559672920:2193 📋 First webhook item sample: {ספק: 'יוניון מוטורס - יבואן טויוטה הרשמי', מיקום: 'ישראל', סוג מקור: 'מקורי', מצב: 'חדש', תיאור: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2266 🔄 Transformed 5 results to catalog format
parts%20search.html?wizard=true&step=4&t=1760559672920:2270 🔍 WEB SEARCH - First transformed result (what PiP receives): {id: 'webhook_1760560594058_bojkv589c_0', pcode: '16470-F0050', cat_num_desc: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', supplier_name: 'יוניון מוטורס - יבואן טויוטה הרשמי', availability: 'מקורי', …}
parts%20search.html?wizard=true&step=4&t=1760559672920:2271   📋 cat_num_desc: מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב
parts%20search.html?wizard=true&step=4&t=1760559672920:2272   💰 price: 550
parts%20search.html?wizard=true&step=4&t=1760559672920:2273   🏷️ supplier_name: יוניון מוטורס - יבואן טויוטה הרשמי
parts%20search.html?wizard=true&step=4&t=1760559672920:2274   🔧 part_family: מנוע וחלקי מנוע
parts%20search.html?wizard=true&step=4&t=1760559672920:2298 📝 SESSION 26: Appending to web_search_results (current: 21)...
parts%20search.html?wizard=true&step=4&t=1760559672920:2300 ✅ SESSION 26: Web result appended! New total: 22
parts%20search.html?wizard=true&step=4&t=1760559672920:2314 📋 SESSION 26: Also added to generic results array (total: 37)
parts%20search.html?wizard=true&step=4&t=1760559672920:2321 ✅ SESSION 26: Helper updated with webhook results and saved
parts-search-results-pip.js:29 📋 Showing PiP results: 5 items
 🔄 SESSION 17: Clearing selectedItems for new search (was: 2 )
 ✅ SESSION 17: selectedItems cleared, starting fresh count
 🔍 SESSION 9 TASK 1: Plate number extraction...
   - searchContext: {
  "plate": "221-84-003",
  "sessionId": "2caca252-c0f6-4cad-8cad-bf89a24a614c",
  "searchType": "web_search",
  "dataSource": "web",
  "searchSuccess": true,
  "errorMessage": null,
  "searchTime": 0,
  "searchParams": {
    "plate": "221-84-003",
    "manufacturer": "טויוטה יפן",
    "model": "קורולה קרוס",
    "model_code": "ZVG12L-KHXGBW",
    "trim": "ADVENTURE",
    "year": "2022",
    "engine_volume": "",
    "engine_code": "2ZR",
    "engine_type": "בנזין",
    "vin": "JTNADACB20J001538",
    "oem": "",
    "part_group": "מנוע וחלקי מנוע",
    "part_name": "כיסוי מנוע",
    "free_query": "",
    "selectedParts": [
      {
        "name": "מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.",
        "תיאור": "מיכל עיבוי מקורי של היצרן, מותאם באופן מלא לדגם הרכב.",
        "כמות": 1,
        "qty": 1,
        "group": "מנוע וחלקי מנוע",
        "מחיר": "₪580",
        "סוג חלק": "מקורי",
        "ספק": "יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)",
        "supplier": "יוניון מוטורס - טויוטה ישראל (סוכנות מורשית)",
        "fromSuggestion": false,
        "entry_method": "catalog_search",
        "מיקום": "ישראל (רשת ארצית)",
        "זמינות": "מקורי",
        "מספר OEM": "16470-F0010",
        "oem": "16470-F0010",
        "הערות": "האפשרות המומלצת ביותר לאמינות והתאמה מלאה. אחריות יבואן רשמי.",
        "price": 580,
        "quantity": 1,
        "source": "מקורי",
        "supplier_pcode": "16470-F0010",
        "pcode": "16470-F0010",
        "catalog_code": "16470-F0010",
        "מספר קטלוגי": "16470-F0010",
        "משפחת חלק": "מנוע וחלקי מנוע",
        "part_family": "מנוע וחלקי מנוע",
        "make": "טויוטה יפן",
        "model": "קורולה קרוס",
        "year_from": null,
        "year_to": null,
        "catalog_item_id": "webhook_1760560371637_vwzmh786q_0",
        "selected_at": "2025-10-15T20:32:55.360Z",
        "plate_number": "221-84-003"
      },
      {
        "name": "מיכל עיבוי תחליפי איכותי מתוצרת אירופאית, תואם למקורי.",
        "תיאור": "מיכל עיבוי תחליפי איכותי מתוצרת אירופאית, תואם למקורי.",
        "כמות": 1,
        "qty": 1,
        "group": "מנוע וחלקי מנוע",
        "מחיר": "₪340",
        "סוג חלק": "תחליפי",
        "ספק": "א.ד.י מערכות רכב",
        "supplier": "א.ד.י מערכות רכב",
        "fromSuggestion": false,
        "entry_method": "catalog_search",
        "מיקום": "חולון, ישראל",
        "זמינות": "תחליפי",
        "מספר OEM": "16470-F0010",
        "oem": "16470-F0010",
        "הערות": "איזון טוב בין איכות למחיר. מומלץ לוודא ארץ ייצור.",
        "price": 340,
        "quantity": 1,
        "source": "תחליפי",
        "supplier_pcode": "NRF-454059",
        "pcode": "NRF-454059",
        "catalog_code": "NRF-454059",
        "מספר קטלוגי": "NRF-454059",
        "משפחת חלק": "מנוע וחלקי מנוע",
        "part_family": "מנוע וחלקי מנוע",
        "make": "טויוטה יפן",
        "model": "קורולה קרוס",
        "year_from": null,
        "year_to": null,
        "catalog_item_id": "webhook_1760560371637_vwzmh786q_1",
        "selected_at": "2025-10-15T20:32:57.977Z",
        "plate_number": "221-84-003"
      }
    ]
  },
  "caseId": "c52af5d6-3b78-47b8-88a2-d2553ee3e1af"
}
   - searchContext.plate: 221-84-003
   - window.helper exists: true
   - window.helper?.plate: undefined
   - RESOLVED plate number: 221-84-003
   - Extraction strategy used: SUCCESS
 📋 SESSION 34: Case UUID stored in PiP: c52af5d6-3b78-47b8-88a2-d2553ee3e1af
 🔍 SESSION 9 DEBUG: Check conditions: {hasPlateNumber: true, plateNumber: '221-84-003', hasSessionId: true, resultsCount: 5, serviceAvailable: true}
 ✅ SESSION 12: Conditions met, starting Supabase save...
   - Plate number: 221-84-003
   - Results count: 5
 📦 SESSION 9: Getting global service...
 ✅ SESSION 9: Service available
 🔍 SESSION 26 DEBUG: PiP session handling...
   - searchContext.sessionId: 2caca252-c0f6-4cad-8cad-bf89a24a614c
   - window.currentSearchSessionId: 2caca252-c0f6-4cad-8cad-bf89a24a614c
   - Resolved session ID: 2caca252-c0f6-4cad-8cad-bf89a24a614c
   - Stack trace: Error
    at PartsSearchResultsPiP.showResults (https://yaron-cayouf-portal.netlify.app/parts-search-results-pip.js:97:41)
    at handleWebhookResponse (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:2349:38)
    at async searchWebExternal (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:2583:7)
    at async handleWebSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760559672920:708:7)
 ✅ SESSION 26: PiP using existing search session (NOT creating new): 2caca252-c0f6-4cad-8cad-bf89a24a614c
 💾 SESSION 26: PiP calling saveSearchResults (does NOT create session)...
 💾 SESSION 9 TASK 3: Saving search results with individual fields...
   - Results count: 5
   - Query context: {plate: '221-84-003', sessionId: '2caca252-c0f6-4cad-8cad-bf89a24a614c', searchType: 'web_search', dataSource: 'web', searchSuccess: true, …}
   - First result sample: {id: 'webhook_1760560594058_bojkv589c_0', pcode: '16470-F0050', cat_num_desc: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', supplier_name: 'יוניון מוטורס - יבואן טויוטה הרשמי', availability: 'מקורי', …}
   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
   - Unique sources found: מקורי, תחליפי, משומש
   - Insert data prepared: (17) ['session_id', 'plate', 'make', 'model', 'trim', 'year', 'engine_volume', 'engine_code', 'engine_type', 'vin', 'part_family', 'search_type', 'data_source', 'search_query', 'results', 'response_time_ms', 'created_at']
 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_results
 🔍 Request URL breakdown: {table: 'parts_search_results', filters: Array(0), selectFields: '*'}
 🔄 Helper data updated, refreshing damage centers dropdown...
 🔄 Helper data updated, refreshing damage centers dropdown...
 🔍 Populating existing damage centers dropdown (forceRefresh: true)
 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 Using getDamageCentersFromHelper to find damage centers...
 ✅ Found damage centers in helper.centers: 2
 ✅ Found damage centers via getDamageCentersFromHelper: 2
 📊 Found 2 damage centers in getDamageCentersFromHelper
 ✅ Updated existing centers display with 2 centers
 🔍 Populating existing damage centers dropdown (forceRefresh: true)
 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 Using getDamageCentersFromHelper to find damage centers...
 ✅ Found damage centers in helper.centers: 2
 ✅ Found damage centers via getDamageCentersFromHelper: 2
 📊 Found 2 damage centers in getDamageCentersFromHelper
 ✅ Updated existing centers display with 2 centers
 ✅ SESSION 9 TASK 3: Search results saved with populated fields: ba109b1a-a293-48c0-a573-7c536b5f73e4
 ✅ SESSION 26: Search results saved to Supabase
 📋 SESSION 26: Stored search result ID for FK: ba109b1a-a293-48c0-a573-7c536b5f73e4
 🪟 PiP DOM element created and appended: {element: div.pip-overlay, className: 'pip-overlay', innerHTML_length: 8410, isConnected: true, parentNode: body}
 🔍 Attempting to discover selected_parts table structure...
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?limit=1
 🎬 PiP animation class added: {hasVisibleClass: true, computedStyle: '0', display: 'flex'}
 📋 Selected parts table columns: (34) ['id', 'plate', 'search_result_id', 'part_name', 'price', 'oem', 'quantity', 'damage_center_id', 'status', 'selected_by', 'selected_at', 'raw_data', 'make', 'model', 'trim', 'year', 'engine_volume', 'pcode', 'cat_num_desc', 'source', 'availability', 'location', 'comments', 'vin', 'engine_code', 'engine_type', 'supplier_name', 'part_family', 'data_source', 'part_make', 'part_model', 'part_year_from', 'part_year_to', 'case_id']
 🚗 Found vehicle identifier column: plate
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?plate=eq.221-84-003
 📋 Loaded existing selections (visual only): 5
 ✅ PiP displayed with transformed webhook results
 🔘 Button state: all enabled
 🔧 SESSION 15: addToHelper called with item: {id: 'webhook_1760560594058_bojkv589c_0', pcode: '16470-F0050', cat_num_desc: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', supplier_name: 'יוניון מוטורס - יבואן טויוטה הרשמי', availability: 'מקורי', …}
 🔧 SESSION 15: Converted part entry: {name: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', תיאור: 'מיכל עיבוי מקורי של טויוטה, התאמה מלאה לרכב', כמות: 1, qty: 1, group: 'מנוע וחלקי מנוע', …}
 ✅ SESSION 19: Added new part to current_selected_list
 ✅ SESSION 19: Reset saved flag (new part added)
 📋 SESSION 15: Current session parts: 3
 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 3
 ✅ SESSION 15: Saved helper to sessionStorage
 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
 ✅ SESSION 19: Displaying 3 parts from current_selected_list
 📊 SESSION 19: Updated count display to 3
 ✅ SESSION 13: Triggered selected parts list UI update
 💾 SESSION 11: Saving selected part for plate: 221-84-003
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.16470-F0050&limit=1
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(2), selectFields: 'id'}
 🔄 Helper data updated, refreshing damage centers dropdown...
 🔍 Populating existing damage centers dropdown (forceRefresh: true)
 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 Using getDamageCentersFromHelper to find damage centers...
 ✅ Found damage centers in helper.centers: 2
 ✅ Found damage centers via getDamageCentersFromHelper: 2
 📊 Found 2 damage centers in getDamageCentersFromHelper
 ✅ Updated existing centers display with 2 centers
 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(0), selectFields: '*'}
 ✅ SESSION 11: Selected part saved: d1ab2acc-0fc8-45ae-8109-2198c84bc744 | search_result_id: ba109b1a-a293-48c0-a573-7c536b5f73e4
 ✅ SESSION 11: Part saved to Supabase selected_parts: d1ab2acc-0fc8-45ae-8109-2198c84bc744
 📊 SESSION 34: Triggering counter refresh in wizard...
 📊 SESSION 34: Found filing_case_id: YC-22184003-2025, looking up UUID...
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&filing_case_id=eq.YC-22184003-2025
 ✅ Part selected: 16470-F0050
 📊 SESSION 34: Found case UUID: c52af5d6-3b78-47b8-88a2-d2553ee3e1af, counting selected parts...
 🔍 Supabase RPC call: count_selected_parts_by_case {case_uuid: 'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'}
 ✅ SESSION 34: Updated counter to show 6 selected parts
 🔧 SESSION 15: addToHelper called with item: {id: 'webhook_1760560594058_bojkv589c_1', pcode: 'AS-16470F0050', cat_num_desc: 'מיכל עיבוי מקורי טויוטה באריזה מקורית', supplier_name: 'אוטוסטור ישראל', availability: 'מקורי', …}
 🔧 SESSION 15: Converted part entry: {name: 'מיכל עיבוי מקורי טויוטה באריזה מקורית', תיאור: 'מיכל עיבוי מקורי טויוטה באריזה מקורית', כמות: 1, qty: 1, group: 'מנוע וחלקי מנוע', …}
 ✅ SESSION 19: Added new part to current_selected_list
 ✅ SESSION 19: Reset saved flag (new part added)
 📋 SESSION 15: Current session parts: 4
 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 3
 ✅ SESSION 15: Saved helper to sessionStorage
 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
 ✅ SESSION 19: Displaying 4 parts from current_selected_list
 📊 SESSION 19: Updated count display to 4
 ✅ SESSION 13: Triggered selected parts list UI update
 💾 SESSION 11: Saving selected part for plate: 221-84-003
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.AS-16470F0050&limit=1
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(2), selectFields: 'id'}
 🔄 Helper data updated, refreshing damage centers dropdown...
 🔍 Populating existing damage centers dropdown (forceRefresh: true)
 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 Using getDamageCentersFromHelper to find damage centers...
 ✅ Found damage centers in helper.centers: 2
 ✅ Found damage centers via getDamageCentersFromHelper: 2
 📊 Found 2 damage centers in getDamageCentersFromHelper
 ✅ Updated existing centers display with 2 centers
 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(0), selectFields: '*'}
 ✅ SESSION 11: Selected part saved: 3a90b4b4-0eab-495b-9cd9-0c7274bd690b | search_result_id: ba109b1a-a293-48c0-a573-7c536b5f73e4
 ✅ SESSION 11: Part saved to Supabase selected_parts: 3a90b4b4-0eab-495b-9cd9-0c7274bd690b
 📊 SESSION 34: Triggering counter refresh in wizard...
 📊 SESSION 34: Found filing_case_id: YC-22184003-2025, looking up UUID...
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&filing_case_id=eq.YC-22184003-2025
 ✅ Part selected: AS-16470F0050
 📊 SESSION 34: Found case UUID: c52af5d6-3b78-47b8-88a2-d2553ee3e1af, counting selected parts...
 🔍 Supabase RPC call: count_selected_parts_by_case {case_uuid: 'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'}
 ✅ SESSION 34: Updated counter to show 7 selected parts
 🔧 SESSION 15: addToHelper called with item: {id: 'webhook_1760560594058_bojkv589c_2', pcode: 'NRF-47391', cat_num_desc: 'מיכל עיבוי תחליפי איכותי מתוצרת NRF, הולנד', supplier_name: 'אירוקאר חלפים', availability: 'תחליפי', …}
 🔧 SESSION 15: Converted part entry: {name: 'מיכל עיבוי תחליפי איכותי מתוצרת NRF, הולנד', תיאור: 'מיכל עיבוי תחליפי איכותי מתוצרת NRF, הולנד', כמות: 1, qty: 1, group: 'מנוע וחלקי מנוע', …}
 ✅ SESSION 19: Added new part to current_selected_list
 ✅ SESSION 19: Reset saved flag (new part added)
 📋 SESSION 15: Current session parts: 5
 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 3
 ✅ SESSION 15: Saved helper to sessionStorage
 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
 ✅ SESSION 19: Displaying 5 parts from current_selected_list
 📊 SESSION 19: Updated count display to 5
 ✅ SESSION 13: Triggered selected parts list UI update
 💾 SESSION 11: Saving selected part for plate: 221-84-003
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.NRF-47391&limit=1
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(2), selectFields: 'id'}
 🔄 Helper data updated, refreshing damage centers dropdown...
 🔍 Populating existing damage centers dropdown (forceRefresh: true)
 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 Using getDamageCentersFromHelper to find damage centers...
 ✅ Found damage centers in helper.centers: 2
 ✅ Found damage centers via getDamageCentersFromHelper: 2
 📊 Found 2 damage centers in getDamageCentersFromHelper
 ✅ Updated existing centers display with 2 centers
 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(0), selectFields: '*'}
 ✅ SESSION 11: Selected part saved: b0973a10-dcc9-40ee-a3ac-09bd6bb0fec4 | search_result_id: ba109b1a-a293-48c0-a573-7c536b5f73e4
 ✅ SESSION 11: Part saved to Supabase selected_parts: b0973a10-dcc9-40ee-a3ac-09bd6bb0fec4
 📊 SESSION 34: Triggering counter refresh in wizard...
 📊 SESSION 34: Found filing_case_id: YC-22184003-2025, looking up UUID...
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&filing_case_id=eq.YC-22184003-2025
 ✅ Part selected: NRF-47391
 📊 SESSION 34: Found case UUID: c52af5d6-3b78-47b8-88a2-d2553ee3e1af, counting selected parts...
 🔍 Supabase RPC call: count_selected_parts_by_case {case_uuid: 'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'}
 ✅ SESSION 34: Updated counter to show 8 selected parts
 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003
 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(1), selectFields: 'id'}
 ✅ SESSION 17: Cumulative total from Supabase: 8
 💾 SESSION 17: Saving selections - selectedItems.size: 3 Cumulative total: 8
 💾 SESSION 17: selectedItems contents: (3) ['webhook_1760560594058_bojkv589c_0', 'webhook_1760560594058_bojkv589c_1', 'webhook_1760560594058_bojkv589c_2']
