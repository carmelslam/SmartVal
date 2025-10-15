 🧠 Loading enhanced helper system...
 🔄 Initializing helper - checking for existing data...
 ✅ Found existing helper data in sessionStorage (fallback): {fees: {…}, meta: {…}, client: {…}, centers: Array(2), general: {…}, …}
 🔍 DEBUG: existingHelper exists? true
 🔍 DEBUG: existingHelper.levisummary exists? true
 🔍 DEBUG: existingHelper.levisummary.adjustments exists? true
 🔍 DEBUG: Current levisummary.adjustments: {mileage: {…}, features: {…}, registration: {…}, ownership_type: {…}, ownership_history: {…}}
 🔍 DEBUG: ALL helper keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 DEBUG: Raw webhook keys found: []
 🔍 DEBUG: Alternative webhook keys found: ['raw_webhook_data']
 🔍 DEBUG: Direct raw_webhook_data: {SUBMIT_LEVI_REPORT_1758279099202: {…}, OPEN_CASE_UI_ENGLISH_1758278988289: {…}}
 🔧 Checking for leviSummary values that need fixing...
 🔧 Fixing leviSummary values from raw webhook data
 Found direct raw_webhook_data object
 Using nested LEVI data from key: SUBMIT_LEVI_REPORT_1758279099202
 Found raw webhook data for value correction: {יצרן: 'טויוטה', בעלות: 'בעלות', מס ק"מ: 'מס ק"מ', תאריך: '19/12/2024', אוטומט: 'כן', …}
 🔍 Raw text for pattern matching: {"יצרן":"טויוטה","בעלות":"בעלות","מס ק\"מ":"מס ק\"מ","תאריך":"19/12/2024","אוטומט":"כן","בעלות %":"-17%","מס ק\"מ %":"-26.88%","סוג רכב":"פרטי","קוד דגם":"413765","קטגוריה":"פנאי שטח","שנת יצור":"2022","מאפיינים":"מאפיינים","מחיר בסיס":"₪ 118,000","ערך בעלות":"חברה, עמותות ואגודות שיתופיות למיניהן או לשעבר","ערך מס ק\"מ":"ק\"מ 137719 (ק\"מ + 18700) (מס ק\"מ: 1.1)","שם דגם מלא":"טויוטה קורולה קרוס ACTIVE140 כ\"ס (97 כ\"ס בנזין) (1798) הברידי אוטו'","מספר בעלים":"מספר בעלים","מספר רישוי":"221-84-0...
 🔍 Looking for Hebrew patterns in raw data:
 - ערך ש״ח מאפיינים: false
 - ערך ש״ח עליה לכביש: false
 - ערך ש״ח בעלות: false
 - ערך ש״ח מס ק״מ: false
 - ערך ש״ח מספר בעלים: false
 🔧 Copying correct values from helper.valuation.adjustments to helper.levisummary.adjustments
 ✅ Found helper.valuation.adjustments: {mileage: {…}, features: {…}, additional: {…}, registration: {…}, ownership_type: {…}, …}
 🔍 Checking mileage:
   - levisummary.amount: "₪ -29,588"
   - valuation.amount: "35648"
 🔍 Checking features:
   - levisummary.amount: "₪ 10,620"
   - valuation.amount: "10620"
 🔍 Checking registration:
   - levisummary.amount: "₪ 4,000"
   - valuation.amount: "4000"
 🔍 Checking ownership_type:
   - levisummary.amount: "₪ -22,545"
   - valuation.amount: "24097"
 🔍 Checking ownership_history:
   - levisummary.amount: "₪ -1,610"
   - valuation.amount: "3459"
 ✅ Synced levisummary to expertise.levi_report
 No leviSummary values needed correction
 ✅ SESSION 15: Saved migrated helper to sessionStorage
 🔄 Merging existing helper data with default structure...
 ✅ Helper data merged successfully: {fees: {…}, meta: {…}, client: {…}, centers: Array(2), general: {…}, …}
 ✅ Helper system loaded and ready
 🏛️ Helper VAT integration complete - all modules can now use getHelperVatRate()
 🔄 Admin can call refreshHelperVatRate() to update all modules when VAT changes
 ✏️ Manual override: setHelperVatRate(rate) - allows manual VAT rate changes
 🎯 Expertise validation functions loaded
 ✅ SESSION 34: Supabase client initialized
 🔍 SESSION 34: Full helper structure on wizard init: {
  "fees": {
    "case_id": "YC-22184003-2025",
    "issue_date": "2025-09-23",
    "calculations": {
      "vat_rate": 18,
      "vat_amount": 119,
      "fees_subtotal": 659,
      "total_with_vat": 778,
      "total_before_vat": 659,
      "calculation_notes": "Fee module completed successfully",
      "calculation_timestamp": "2025-09-23T20:20:11.414Z"
    },
    "completed_by": "fee-module",
    "fees_summary": {
      "office": {
        "total": 300,
        "fixed_fee": 0,
        "percentage": 0,
        "description": "",
        "overhead_cost": 0,
        "administrative_time": 0
      },
      "travel": {
        "count": 0,
        "tolls": 0,
        "total": 230,
        "fuel_cost": 0,
        "unit_price": 0,
        "description": "",
        "distance_km": 0
      },
      "ui_data": {},
      "assessment": {
        "date": "",
        "hours": 0,
        "total": 0,
        "location": "",
        "description": "",
        "hourly_rate": 120
      },
      "photography": {
        "count": 0,
        "total": 129,
        "unit_price": 0,
        "description": "",
        "equipment_cost": 0,
        "processing_time": 0
      },
      "calculations": {
        "vat_rate": 18,
        "vat_amount": 119,
        "fees_subtotal": 659,
        "total_with_vat": 778,
        "total_before_vat": 659,
        "calculation_notes": "Fee module completed successfully",
        "calculation_timestamp": "2025-09-23T20:20:11.414Z"
      },
      "additional_fees": []
    }
  },
  "meta": {
    "plate": "221-84-003",
    "damage": "",
    "source": "general_info_form",
    "address": "",
    "case_id": "YC-22184003-2025",
    "location": "מקום האירוע",
    "updated_at": "2025-10-10T14:51:05.998Z",
    "client_name": "",
    "last_updated": "2025-10-15T19:48:07.829Z",
    "phone_number": "",
    "inspection_date": "23.9.2025",
    "last_fee_update": "2025-09-23T20:20:11.414Z",
    "last_session_save": "2025-10-10T14:51:05.998Z",
    "damage_date_manual": true,
    "last_levi_processed": "2025-09-19T10:52:17.675Z",
    "last_webhook_update": "SUBMIT_LEVI_REPORT",
    "fee_module_completed": true,
    "levi_report_available": true,
    "report_type_display": "חוות דעת מכירה מצבו הניזוק"
  },
  "client": {
    "name": "כרמל כיוף",
    "address": "עספיא",
    "insurance_email": "carmel.cayouf@gmail.com",
    "insurance_company": "איילון",
    "insurance_agent_email": "carmel.cayouf@gmail.com",
    "insurance_agent_phone": "09888989",
    "is_company_client": false
  },
  "centers": [
    {
      "Id": "dc_1758279232700_1",
      "Damage center Number": "1",
      "Location": "קדמת הרכב",
      "Description": "פגוש עקום, פנס ימני שבור",
      "RepairNature": "החלפת פנס , תיקון וצביעה של הפגוש , צביעת פרונט",
      "Works": {
        "takana389": "",
        "works": [
          {
            "category": "כל עבודות הפחחות כולל פירוקים והרכבות",
            "cost": 2900,
            "comments": "צבע מקורי",
            "added_at": "2025-10-10T11:04:14.306Z",
            "source": "wizard_inline_component"
          },
          {
            "category": "עבודות חשמל",
            "cost": 780,
            "comments": "החלפת פנס קדמי",
            "added_at": "2025-10-10T11:04:14.306Z",
            "source": "wizard_inline_component"
          }
        ],
        "works_meta": {
          "total_items": 2,
          "total_cost": 3680,
          "takana389_status": "",
          "timestamp": "2025-10-10T11:04:14.306Z"
        }
      },
      "Parts": {
        "parts_meta": {
          "total_items": 0,
          "total_cost": 0,
          "timestamp": "2025-10-10T11:04:22.244Z"
        },
        "parts_required": [],
        "parts_search": {
          "results": [],
          "search_meta": {
            "total_results": 0,
            "timestamp": "2025-10-10T11:04:14.767Z",
            "search_session": "search_1760094254767"
          }
        },
        "takana389": ""
      },
      "Repairs": {
        "repairs": [
          {
            "name": "תיקון פגוש קדמי",
            "cost": 780,
            "description": "פירוק והרכבה, שחזור וצביעה",
            "added_at": "2025-10-10T11:04:24.515Z",
            "source": "wizard_inline_component"
          }
        ],
        "repairs_meta": {
          "total_items": 1,
          "total_cost": 780,
          "timestamp": "2025-10-10T11:04:24.515Z"
        }
      },
      "Summary": {
        "Total works": 3680,
        "Total parts": 0,
        "Total repairs": 780,
        "Subtotal": 4460,
        "VAT percentage": 18,
        "VAT amount": 802.8,
        "Total with VAT": 5262.8
      },
      "last_step": 7,
      "session_active": true,
      "last_updated": "2025-10-10T11:04:24.521Z"
    },
    {
      "Id": "dc_1758279411208_2",
      "Damage center Number": "2",
      "Location": "אחורי הרכב",
      "Description": "כנף אחורית שמאלית מעוקמת",
      "RepairNature": "החלפת כנף וצביעה",
      "Works": {
        "takana389": "",
        "w
 🔍 SESSION 34: Checking case_id locations: {helper.case_info?.case_id: 'YC-22184003-2025', helper.meta?.case_id: 'YC-22184003-2025', helper.case?.id: undefined, helper.case_id: undefined, helper.id: undefined}
 🔢 Generated damage center number using helper API: 3
 🧹 Clearing orphaned global assessment data...
 ⚠️ Removing orphaned totals data: {Total works: 4880, Total parts: 0, Total repairs: 1120, Total without VAT: 6000, Total with VAT: 7080}
 🎯 Set active damage center ID for new center: center_1760557734186_3
 ✅ Cleared orphaned data, modules will now save to specific centers only
 🚀 Damage centers wizard loaded, populating existing centers...
 🔄 Populating all forms from helper data
 🔧 PHASE 6: Preserved case_summary before populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 Preserved expertise.summary before populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 📍 Detected current module: damage
 ⚠️ Element not found for key field: plate (value: 221-84-003)
 ⚠️ Element not found for key field: manufacturer (value: טויוטה יפן)
 ⚠️ Element not found for key field: model (value: קורולה קרוס)
 ⚠️ Element not found for key field: year (value: 2022)
 ⚠️ Element not found for key field: owner (value: כרמל כיוף)
 ⚠️ Element not found for key field: garage (value: FARCAR)
 🔧 PHASE 6: Restored case_summary after populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 PHASE 6: Restored case_summary to sessionStorage as well
 🔧 Restored expertise.summary after populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 🔧 Restored expertise.summary to sessionStorage as well
 ✅ Helper saved to all storage locations (fallback method)
 🔄 Auto-populating forms with restored helper data...
 🔄 Populating all forms from helper data
 🔧 PHASE 6: Preserved case_summary before populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 Preserved expertise.summary before populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 📍 Detected current module: damage
 ⚠️ Element not found for key field: plate (value: 221-84-003)
 ⚠️ Element not found for key field: manufacturer (value: טויוטה יפן)
 ⚠️ Element not found for key field: model (value: קורולה קרוס)
 ⚠️ Element not found for key field: year (value: 2022)
 ⚠️ Element not found for key field: owner (value: כרמל כיוף)
 ⚠️ Element not found for key field: garage (value: FARCAR)
 🔧 PHASE 6: Restored case_summary after populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 PHASE 6: Restored case_summary to sessionStorage as well
 🔧 Restored expertise.summary after populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 🔧 Restored expertise.summary to sessionStorage as well
 ✅ Helper saved to all storage locations (fallback method)
 Broadcasting helper update: vehicle, stakeholders, case_info, valuation (source: helper_restoration)
 🔍 Populating existing damage centers dropdown (forceRefresh: true)
 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
 🔍 Using getDamageCentersFromHelper to find damage centers...
 ✅ Found damage centers in helper.centers: 2
 ✅ Found damage centers via getDamageCentersFromHelper: 2
 📊 Found 2 damage centers in getDamageCentersFromHelper
 ✅ Updated existing centers display with 2 centers
 🔄 Populating all forms from helper data
 🔧 PHASE 6: Preserved case_summary before populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 Preserved expertise.summary before populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 📍 Detected current module: damage
 ⚠️ Element not found for key field: plate (value: 221-84-003)
 ⚠️ Element not found for key field: manufacturer (value: טויוטה יפן)
 ⚠️ Element not found for key field: model (value: קורולה קרוס)
 ⚠️ Element not found for key field: year (value: 2022)
 ⚠️ Element not found for key field: owner (value: כרמל כיוף)
 ⚠️ Element not found for key field: garage (value: FARCAR)
 🔧 PHASE 6: Restored case_summary after populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 PHASE 6: Restored case_summary to sessionStorage as well
 🔧 Restored expertise.summary after populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 🔧 Restored expertise.summary to sessionStorage as well
 ✅ Helper saved to all storage locations (fallback method)
 🔄 DOM ready - force populating forms...
 🔄 Populating all forms from helper data
 🔧 PHASE 6: Preserved case_summary before populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 Preserved expertise.summary before populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 📍 Detected current module: damage
 ⚠️ Element not found for key field: plate (value: 221-84-003)
 ⚠️ Element not found for key field: manufacturer (value: טויוטה יפן)
 ⚠️ Element not found for key field: model (value: קורולה קרוס)
 ⚠️ Element not found for key field: year (value: 2022)
 ⚠️ Element not found for key field: owner (value: כרמל כיוף)
 ⚠️ Element not found for key field: garage (value: FARCAR)
 🔧 PHASE 6: Restored case_summary after populateAllForms: {total_searches: 0, total_results: 0, selected_count: 0, unselected_count: 0, last_search: '2025-10-15T13:05:22.976Z', …}
 🔧 PHASE 6: Restored case_summary to sessionStorage as well
 🔧 Restored expertise.summary after populateAllForms: {notes: 'לשלוח תמונות אחרי פירוק \n', plate: '221-84-003', status: 'לתיקון', license: '1097', directive: 'לתיקון', …}
 🔧 Restored expertise.summary to sessionStorage as well
 ✅ Helper saved to all storage locations (fallback method)
 🎯 Setting up universal input capture for all forms...
 🎯 Universal input capture setup complete: 6 elements monitored
 🔢 Formatting all calculations to 2 decimal places...
 ✅ Formatted helper.calculations decimal precision
 ✅ Formatted 2 center calculations decimal precision
 ✅ Formatted damage assessment totals decimal precision
 ✅ Formatted financials decimal precision
 ✅ Helper saved to all storage locations (fallback method)
 🔢 All calculations formatted to 2 decimal places
 🔍 === NEXT STEP BUTTON CLICKED ===
 🔍 Current step: 1
 🔍 Total steps: 7
 🔍 Checking validation for current step...
 🔍 === VALIDATION DEBUG ===
 🔍 Validating step: 1
 🔍 Validating step 1 (location)...
 🔍 locationSelect element: true
 🔍 locationSelect value: 
 🔍 otherLocationInput element: true
 🔍 otherLocationInput value: 
 ❌ No location selected
 ⚠️ Validation error: אנא בחר מיקום נזק מהרשימה (field: locationSelect)
 🔍 Validation result: false
 ❌ Validation failed, step not advanced
 🔍 Selected existing center for edit: 1
 🔍 Selected existing center for edit: 2
 🔧 Edit damage center requested, selectedValue: 2 string
 ✏️ Loading damage center for editing: 2
 📊 EDIT DEBUG - Helper centers: (2) [{…}, {…}]
 📊 EDIT DEBUG - Looking for damage center number: 2
 🔍 Helper API result for damage center number: 2 -> null
 🔍 Helper API returned null for number, trying to find by actual ID...
 ✅ Found damage centers in helper.centers: 2
 🔍 All available centers for ID lookup: (2) [{…}, {…}]
 🔍 Checking center for ID lookup: {centerNum: '1', selectedValue: '2', actualId: 'dc_1758279232700_1', match: false}
 🔍 Checking center for ID lookup: {centerNum: '2', selectedValue: '2', actualId: 'dc_1758279411208_2', match: true}
 🔍 Found center with matching number, trying helper API with actual ID: dc_1758279411208_2
 🔍 Helper API result with actual ID: dc_1758279411208_2 -> {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 === EDIT MODE DIAGNOSTIC ===
 Center to edit: {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 Selected value (center number): 2
 Damage center data created: {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 Parts in center: []
 ✅ Set damage_center_mode to edit_existing in sessionStorage
 ✅ Set active_damage_center_id to dc_1758279411208_2
 ✅ Set repair nature field: החלפת כנף וצביעה
 🔄 Restoring data for step: 1
 ✅ LOCATION RESTORED: אחורי הרכב from center: dc_1758279411208_2
 ✅ Damage center loaded for editing: {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 🧮 Recalculating totals after edit data load...
 🧮 === CALCULATE TOTALS START ===
 🔍 Current damage center data: {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 🔍 Current module data: {location: 'אחורי הרכב', description: 'כנף אחורית שמאלית מעוקמת', repairNature: 'החלפת כנף וצביעה', works: Array(1), parts: Array(0), …}
 🧮 CURRENT CENTER ONLY totals: {works: 1200, parts: 0, repairs: 340}
 🧮 FINAL CALCULATED totals (current center only): {workTotal: 1200, partsTotal: 0, repairsTotal: 340, subtotal: 1540, totalWithVat: 1817.2}
 📊 Updated module subtotals: {workTotal: 1200, partsTotal: 0, repairsTotal: 340, vatPercentage: 18}
 ✅ Saved CURRENT CENTER cost totals to helper.damage_assessment.current_center_totals
 🧮 === CALCULATE TOTALS END ===
 📊 Updated module subtotals: {workTotal: 1200, partsTotal: 0, repairsTotal: 340, vatPercentage: 18}
 ✅ Edit mode: totals recalculated and wizard displays updated
 🔄 Refreshing parts module with center-specific data...
 🔍 === NEXT STEP BUTTON CLICKED ===
 🔍 Current step: 1
 🔍 Total steps: 7
 🔍 Checking validation for current step...
 🔍 === VALIDATION DEBUG ===
 🔍 Validating step: 1
 🔍 Validating step 1 (location)...
 🔍 locationSelect element: true
 🔍 locationSelect value: אחורי הרכב
 🔍 otherLocationInput element: true
 🔍 otherLocationInput value: 
 ✅ Step 1 validation passed
 🔍 Validation result: true
 ✅ Validation passed, proceeding...
 🔍 Not final step, saving current step data...
 🔍 About to call saveCurrentStepData()...
 💾 Saving step data for step: 1
 📝 PHASE 1: Step 1 save - using existing center number
 ✅ Current damage center initialized: {id: 'dc_1758279411208_2', number: '2', location: 'אחורי הרכב'}
 📢 User notification (success): מוקד נזק 2 עודכן בהצלחה!
 ✅ Step 1 - Damage center created and saved to helper: אחורי הרכב
 🔄 Saving step data to session storage and syncing window.helper...
 ✅ Synced to window.helper, damage_centers count: 2
 ✅ Step data saved and window.helper synced for step: 1
 ✅ saveCurrentStepData() completed
 🔍 Moving to next step...
 💾 Saved current step 2 to session
 🔄 Restoring data for step: 2
 🔄 === RESTORE DESCRIPTION DATA - STEP 2 ===
 🔍 Damage center mode: edit_existing
 🔍 Active center ID for editing: dc_1758279411208_2
 🔍 Found in helper.centers: true
 ✅ DESCRIPTION RESTORED: כנף אחורית שמאלית מעוקמת from center: dc_1758279411208_2
 ✅ REPAIR NATURE RESTORED: החלפת כנף וצביעה from center: dc_1758279411208_2
 📦 Loading module for step 2...
 ✅ Step transition completed
 🔍 === NEXT STEP BUTTON CLICKED ===
 🔍 Current step: 2
 🔍 Total steps: 7
 🔍 Checking validation for current step...
 🔍 === VALIDATION DEBUG ===
 🔍 Validating step: 2
 🔍 Validation result: true
 ✅ Validation passed, proceeding...
 🔍 Not final step, saving current step data...
 🔍 About to call saveCurrentStepData()...
 💾 Saving step data for step: 2
 🔍 === STEP 2 DESCRIPTION & REPAIR NATURE SAVE ===
 🔍 Description value: כנף אחורית שמאלית מעוקמת
 🔍 Repair Nature value: החלפת כנף וצביעה
 ✅ RepairNature saved to damage_centers array: החלפת כנף וצביעה
 ✅ repair_nature saved to damage_assessment.damage_centers: החלפת כנף וצביעה
 ✅ Description saved to current_damage_center.Description: כנף אחורית שמאלית מעוקמת
 ✅ Repair Nature saved to current_damage_center.RepairNature: החלפת כנף וצביעה
 📢 User notification (success): תיאור נזק ומהות התיקון נוספו למוקד 2
 ✅ Step 2 - Description and Repair Nature saved to current_damage_center
 🔄 Saving step data to session storage and syncing window.helper...
 ✅ Synced to window.helper, damage_centers count: 2
 ✅ Step data saved and window.helper synced for step: 2
 ✅ saveCurrentStepData() completed
 🔍 Moving to next step...
 💾 Saved current step 3 to session
 🔄 Restoring data for step: 3
 🔄 === RESTORE WORKS DATA - STEP 3 ===
 ❌ תקנה 389 select element not found for step 3
 📦 Loading module for step 3...
 ⏳ Loading state shown: טוען מודול עבודות...
 ✅ Step transition completed
 ✅ תקנה 389 saved immediately to helper: 
 💰 DEBUG: updateWorkSubtotal called with total: 1200
 💰 DEBUG: Valid total after validation: 1200
 💰 DEBUG: workAmount element: 
 💰 DEBUG: workAmountWithVat element: 
 💰 DEBUG: Set workAmount text to: ₪1,200
 💰 DEBUG: Set workAmountWithVat text to: ₪1,416
 💰 DEBUG: workSubtotal element: 
 💰 DEBUG: Set workSubtotal display to: block (always show when calculation happens)
 💰 Work subtotal updated: ₪1200 (with VAT: ₪1416)
 🧮 === CALCULATE TOTALS START ===
 🔍 Current damage center data: {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 🔍 Current module data: {location: 'אחורי הרכב', description: 'כנף אחורית שמאלית מעוקמת', repairNature: 'החלפת כנף וצביעה', works: Array(1), parts: Array(0), …}
 🧮 CURRENT CENTER ONLY totals: {works: 1200, parts: 0, repairs: 340}
 🧮 Calculating comprehensive totals for dc_1758279411208_2
 🔍 DEBUG: window.helper exists? true
 🔍 DEBUG: window.helper.centers exists? true
 🔍 DEBUG: window.helper.centers is array? true
 🔍 DEBUG: About to call find on centers array: (2) [{…}, {…}]
 🔍 DEBUG: Using current_damage_center for calculations: dc_1758279411208_2
 🧮 Calculating global damage centers totals
 ✅ Global damage centers totals calculated: {all_centers_subtotal: 0, all_centers_vat: 0, all_centers_total: 0, breakdown: {…}, by_location: {…}, …}
 ✅ Calculated comprehensive totals for dc_1758279411208_2: {works_subtotal: 1200, parts_subtotal: 0, repairs_subtotal: 780, fees_subtotal: 0, subtotal_before_vat: 1980, …}
 🔧 DEBUG: Extracted totals for updateModuleSubtotals: {workTotal: 1200, partsTotal: 0, repairsTotal: 780}
 📊 Updated module subtotals: {workTotal: 1200, partsTotal: 0, repairsTotal: 780, vatPercentage: 18}
 🧮 Calculated totals using helper API: {works_subtotal: 1200, parts_subtotal: 0, repairs_subtotal: 780, fees_subtotal: 0, subtotal_before_vat: 1980, …}
 ✅ תקנה 389 saved immediately to helper: 
 💰 DEBUG: updateWorkSubtotal called with total: 1200
 💰 DEBUG: Valid total after validation: 1200
 💰 DEBUG: workAmount element: 
 💰 DEBUG: workAmountWithVat element: 
 💰 DEBUG: Set workAmount text to: ₪1,200
 💰 DEBUG: Set workAmountWithVat text to: ₪1,416
 💰 DEBUG: workSubtotal element: 
 💰 DEBUG: Set workSubtotal display to: block (always show when calculation happens)
 💰 Work subtotal updated: ₪1200 (with VAT: ₪1416)
 🧮 === CALCULATE TOTALS START ===
 🔍 Current damage center data: {Id: 'dc_1758279411208_2', Damage center Number: '2', Location: 'אחורי הרכב', Description: 'כנף אחורית שמאלית מעוקמת', RepairNature: 'החלפת כנף וצביעה', …}
 🔍 Current module data: {location: 'אחורי הרכב', description: 'כנף אחורית שמאלית מעוקמת', repairNature: 'החלפת כנף וצביעה', works: Array(1), parts: Array(0), …}
 🧮 CURRENT CENTER ONLY totals: {works: 1200, parts: 0, repairs: 340}
 🧮 Calculating comprehensive totals for dc_1758279411208_2
 🔍 DEBUG: window.helper exists? true
 🔍 DEBUG: window.helper.centers exists? true
 🔍 DEBUG: window.helper.centers is array? true
 🔍 DEBUG: About to call find on centers array: (2) [{…}, {…}]
 🔍 DEBUG: Using current_damage_center for calculations: dc_1758279411208_2
 🧮 Calculating global damage centers totals
 ✅ Global damage centers totals calculated: {all_centers_subtotal: 0, all_centers_vat: 0, all_centers_total: 0, breakdown: {…}, by_location: {…}, …}
 ✅ Calculated comprehensive totals for dc_1758279411208_2: {works_subtotal: 1200, parts_subtotal: 0, repairs_subtotal: 780, fees_subtotal: 0, subtotal_before_vat: 1980, …}
 🔧 DEBUG: Extracted totals for updateModuleSubtotals: {workTotal: 1200, partsTotal: 0, repairsTotal: 780}
 📊 Updated module subtotals: {workTotal: 1200, partsTotal: 0, repairsTotal: 780, vatPercentage: 18}
 🧮 Calculated totals using helper API: {works_subtotal: 1200, parts_subtotal: 0, repairs_subtotal: 780, fees_subtotal: 0, subtotal_before_vat: 1980, …}
 ✅ Work component loaded inline (no iframe)
 📢 User notification (success): מודול עבודות נטען בהצלחה
 🎯 Added capture to 4 new form elements
 🎯 Added capture to 3 new form elements
 🔄 === RESTORE WORKS DATA - STEP 3 ===
 🔍 Damage center mode for step 3: edit_existing
 🔍 Active center ID for editing (step 3): dc_1758279411208_2
 🔍 Searching for center with ID: dc_1758279411208_2
 🔍 Available centers in helper.centers: 2
 🔍 Center IDs in helper.centers: (2) ['dc_1758279232700_1', 'dc_1758279411208_2']
 🔍 Found in helper.centers (step 3): true
 🔍 Center data structure: {id: 'dc_1758279411208_2', hasWorks: true, hasTakana389: false, takana389Value: ''}
 ❌ תקנה 389 NOT RESTORED - takana389: undefined select: true center: dc_1758279411208_2
 🔄 Force calculating works subtotal... [{…}]
 🧮 Calculated works total: ₪1200
 ✅ Updated worksAmount display
 ✅ Updated worksAmountWithVat display
 ✅ Made workSubtotal visible
 ✅ Force updated works subtotal: ₪1200
 🔄 Force calculating works subtotal... [{…}]
 🧮 Calculated works total: ₪1200
 ✅ Updated worksAmount display
 ✅ Updated worksAmountWithVat display
 ✅ Made workSubtotal visible
 ✅ Force updated works subtotal: ₪1200
 🔍 === NEXT STEP BUTTON CLICKED ===
 🔍 Current step: 3
 🔍 Total steps: 7
 🔍 Checking validation for current step...
 🔍 === VALIDATION DEBUG ===
 🔍 Validating step: 3
 🔍 Validation result: true
 ✅ Validation passed, proceeding...
 🔍 Not final step, saving current step data...
 🔍 About to call saveCurrentStepData()...
 💾 Saving step data for step: 3
 ✅ Step 3 - Works data saved to current_damage_center.Works
 📢 User notification (success): עבודות נדרשות נוספו למוקד 2
 🔄 Saving step data to session storage and syncing window.helper...
 ✅ Synced to window.helper, damage_centers count: 2
 ✅ Step data saved and window.helper synced for step: 3
 ✅ saveCurrentStepData() completed
 🔍 Moving to next step...
 💾 Saved current step 4 to session
damage-centers-wizard.html:2385 🔄 Restoring data for step: 4
damage-centers-wizard.html:2418 ✅ Step 4 - data restored by module
damage-centers-wizard.html:2716 📦 Loading module for step 4...
damage-centers-wizard.html:3347 ⏳ Loading state shown: טוען מודול חיפוש חלפים...
damage-centers-wizard.html:1989 ✅ Step transition completed
damage-centers-wizard.html:2867 🎯 Set active damage center ID for parts search webhook: dc_1758279411208_2
damage-centers-wizard.html:6490 📊 SESSION 34: Found filing_case_id: YC-22184003-2025, looking up UUID...
damage-centers-wizard.html:3283 📢 User notification (success): מודול חיפוש חלפים נטען בהצלחה
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&filing_case_id=eq.YC-22184003-2025
damage-centers-wizard.html:6505 📊 SESSION 34: Found case UUID: c52af5d6-3b78-47b8-88a2-d2553ee3e1af, counting selected parts...
supabaseClient.js:221 🔍 Supabase RPC call: count_selected_parts_by_case {case_uuid: 'c52af5d6-3b78-47b8-88a2-d2553ee3e1af'}
damage-centers-wizard.html:6523 ✅ SESSION 34: Updated counter to show 0 selected parts
damage-centers-wizard.html:6053 🔗 Setting up communication with partsSearch module
damage-centers-wizard.html:2908 📱 Parts search module lazy loaded successfully
supabaseClient.js:550 ✅ Supabase client loaded and available at window.supabase
partsSearchSupabaseService.js:13 🔧 PartsSearchSupabaseService initialized
partsSearchSupabaseService.js:476 ✅ partsSearchSupabaseService loaded globally
parts-search-results-pip.js:21 🔍 PiP Search Results Window initialized
selected-parts-list.js:16 📋 Selected Parts List initialized for plate: null
parts%20search.html?wizard=true&step=4&t=1760557751170:4463 ✅ SESSION 17: Loaded helper from sessionStorage: {fees: {…}, meta: {…}, client: {…}, centers: Array(2), general: {…}, …}
parts%20search.html?wizard=true&step=4&t=1760557751170:4469 🔄 SESSION 17: Auto-refreshing UI list from helper...
parts%20search.html?wizard=true&step=4&t=1760557751170:3477 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760557751170:3623 ✅ SESSION 19: Displaying 2 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760557751170:3628 📊 SESSION 19: Updated count display to 2
parts%20search.html?wizard=true&step=4&t=1760557751170:868 🔍 Parts Search Page Loaded - Debug Info:
parts%20search.html?wizard=true&step=4&t=1760557751170:869   - openInternalBrowser function available: true
parts%20search.html?wizard=true&step=4&t=1760557751170:870   - internal-browser.js loaded: true
parts%20search.html?wizard=true&step=4&t=1760557751170:872   ✅ Internal browser is ready
parts%20search.html?wizard=true&step=4&t=1760557751170:896 🚗 Parts Search: Auto-populating vehicle data from helper...
parts%20search.html?wizard=true&step=4&t=1760557751170:902 ✅ Helper data loaded for parts search: {fees: {…}, meta: {…}, client: {…}, centers: Array(2), general: {…}, …}
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ plate: "221-84-003"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ manufacturer: "טויוטה יפן"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ model: "קורולה קרוס"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ model_code: "ZVG12L-KHXGBW"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ trim: "ADVENTURE"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ year: "2022"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ engine_code: "2ZR"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ engine_type: "בנזין"
parts%20search.html?wizard=true&step=4&t=1760557751170:924   ✅ vin: "JTNADACB20J001538"
parts%20search.html?wizard=true&step=4&t=1760557751170:928 ✅ Parts search auto-population completed
parts%20search.html?wizard=true&step=4&t=1760557751170:2913 ✅ SESSION 14: Loaded 8 parts from helper
parts%20search.html?wizard=true&step=4&t=1760557751170:3477 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760557751170:3623 ✅ SESSION 19: Displaying 2 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760557751170:3628 📊 SESSION 19: Updated count display to 2
damage-centers-wizard.html:1 ✅ Parts search module iframe loaded - lazy loading complete
parts%20search.html?wizard=true&step=4&t=1760557751170:942 🔄 SESSION 20: Starting auto-sync from Supabase to helper...
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id%2C+status&plate=eq.221-84-003&order=created_at.desc
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'cases', filters: Array(1), selectFields: 'id, status'}
parts%20search.html?wizard=true&step=4&t=1760557751170:977 ℹ️ SESSION 29: No active case found for plate: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:985 📦 SESSION 20: Loading parts from Supabase for plate: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1387 📦 SESSION 19: Getting selected parts... {plate: '221-84-003'}
parts%20search.html?wizard=true&step=4&t=1760557751170:1419 🔍 SESSION 19: Querying Supabase for plate: 221-84-003 case_id: YC-22184003-2025
parts%20search.html?wizard=true&step=4&t=1760557751170:1427 ⚠️ SESSION 29: Using plate-based filter with case_id in helper context
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?plate=eq.221-84-003&order=selected_at.desc
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(1), selectFields: '*'}
parts%20search.html?wizard=true&step=4&t=1760557751170:1450 📊 SESSION 24: Supabase query result for plate "221-84-003": {rowCount: 10, hasData: true, hasError: false}
parts%20search.html?wizard=true&step=4&t=1760557751170:1472 ✅ SESSION 19: Retrieved 10 parts from Supabase
parts%20search.html?wizard=true&step=4&t=1760557751170:1473 📋 First part sample: {id: '84294492-4c69-4b34-88cd-b09b1aff13e9', plate: '221-84-003', search_result_id: 'c240d4cb-a801-4f11-bc32-c6cfed45dfc3', part_name: "דלת קד' ימ' - קורולה 013-", price: 3002.37, …}
parts%20search.html?wizard=true&step=4&t=1760557751170:994 ✅ SESSION 20: Found 10 parts in Supabase
parts%20search.html?wizard=true&step=4&t=1760557751170:1014 💾 SESSION 20: Synced 10 parts from Supabase to helper (with field mapping)
parts%20search.html?wizard=true&step=4&t=1760557751170:3477 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760557751170:3623 ✅ SESSION 19: Displaying 2 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760557751170:3628 📊 SESSION 19: Updated count display to 2
parts%20search.html?wizard=true&step=4&t=1760557751170:1032 ✅ SESSION 17: Updated selected parts list UI on page load
damage-centers-wizard.html:7070 🔄 Helper data updated, refreshing damage centers dropdown...
damage-centers-wizard.html:6701 🔍 Populating existing damage centers dropdown (forceRefresh: true)
damage-centers-wizard.html:6734 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
damage-centers-wizard.html:6739 🔍 Using getDamageCentersFromHelper to find damage centers...
damage-centers-wizard.html:5909 ✅ Found damage centers in helper.centers: 2
damage-centers-wizard.html:6744 ✅ Found damage centers via getDamageCentersFromHelper: 2
damage-centers-wizard.html:6749 📊 Found 2 damage centers in getDamageCentersFromHelper
damage-centers-wizard.html:7138 ✅ Updated existing centers display with 2 centers
damage-centers-wizard.html:6159 📝 Informing partsSearch iframe that it's in EDIT MODE and should recalculate totals
damage-centers-wizard.html:6165 📤 Sent enhanced context to partsSearch module: {centerId: 'dc_1758279411208_2', step: 4, dataKeys: Array(10), editMode: true}
parts%20search.html?wizard=true&step=4&t=1760557751170:2928 📨 Parts search received message: {type: 'damageCenterContext', damageCenterId: 'dc_1758279411208_2', damageCenter: {…}, moduleType: 'partsSearch', wizardStep: 4, …}
parts%20search.html?wizard=true&step=4&t=1760557751170:2950 🎯 Handling wizard context: {type: 'damageCenterContext', damageCenterId: 'dc_1758279411208_2', damageCenter: {…}, moduleType: 'partsSearch', wizardStep: 4, …}
parts%20search.html?wizard=true&step=4&t=1760557751170:2964 ✅ Pre-filled vehicle data from wizard context
parts%20search.html?wizard=true&step=4&t=1760557751170:2928 📨 Parts search received message: {type: 'wizardReady', wizardStep: 4, source: 'damage-centers-wizard'}
parts%20search.html?wizard=true&step=4&t=1760557751170:2935 ✅ Wizard is ready, parts search module loaded
damage-centers-wizard.html:1517 📨 Wizard received message: {type: 'moduleReady', module: 'partsSearch', source: 'parts_search_iframe'}
damage-centers-wizard.html:6237 📨 Received message from module: {type: 'moduleReady', module: 'partsSearch', source: 'parts_search_iframe'}
damage-centers-wizard.html:6268 ✅ Module partsSearch is ready
parts%20search.html?wizard=true&step=4&t=1760557751170:2928 📨 Parts search received message: {type: 'damageCenterData', damageCenterId: 'dc_1758279411208_2', damageCenter: {…}}
damage-centers-wizard.html:6181 🧮 Requested totals recalculation from partsSearch iframe in edit mode
parts%20search.html?wizard=true&step=4&t=1760557751170:2928 📨 Parts search received message: {type: 'requestTotalsRecalculation', reason: 'edit_mode_load', respondWithTotals: true, moduleType: 'partsSearch'}
damage-centers-wizard.html:6191 📊 Requested current totals from partsSearch iframe for wizard sync
parts%20search.html?wizard=true&step=4&t=1760557751170:2928 📨 Parts search received message: {type: 'requestCurrentTotals', moduleType: 'partsSearch', reason: 'wizard_sync'}
parts%20search.html?wizard=true&step=4&t=1760557751170:4452 🔄 Updated part name options for group: חלקי מרכב
parts%20search.html?wizard=true&step=4&t=1760557751170:1070 🔍 Loading 152 parts for category: חלקי מרכב
parts%20search.html?wizard=true&step=4&t=1760557751170:1122 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1143 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760557751170:1122 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1143 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760557751170:1122 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1143 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760557751170:1611 🔍 Starting Supabase search...
parts%20search.html?wizard=true&step=4&t=1760557751170:1612 🔍 DEBUG: Checking dependencies at search start...
parts%20search.html?wizard=true&step=4&t=1760557751170:1613   - window.SmartPartsSearchService: function
parts%20search.html?wizard=true&step=4&t=1760557751170:1614   - window.partsResultsPiP: object
parts%20search.html?wizard=true&step=4&t=1760557751170:1615   - window.supabase: object
parts%20search.html?wizard=true&step=4&t=1760557751170:2037 🔘 Button state: catalog
parts%20search.html?wizard=true&step=4&t=1760557751170:1670 📋 Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
parts%20search.html?wizard=true&step=4&t=1760557751170:1673 📦 Initializing SimplePartsSearchService...
simplePartsSearchService.js:18 ✅ Supabase client initialized
parts%20search.html?wizard=true&step=4&t=1760557751170:1675 ✅ SimplePartsSearchService initialized
parts%20search.html?wizard=true&step=4&t=1760557751170:1680 🔍 SESSION 26: Creating catalog search session...
parts%20search.html?wizard=true&step=4&t=1760557751170:1681   - Plate: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1682   - Stack trace: Error
    at searchSupabase (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:1682:41)
    at handleCatalogSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:690:13)
    at HTMLDivElement.onclick (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:509:91)
partsSearchSupabaseService.js:130 💾 SESSION 26 DEBUG: createSearchSession called!
partsSearchSupabaseService.js:131   - Plate: 221-84-003
partsSearchSupabaseService.js:132   - Call stack: Error
    at PartsSearchSupabaseService.createSearchSession (https://yaron-cayouf-portal.netlify.app/services/partsSearchSupabaseService.js:132:40)
    at searchSupabase (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:1684:67)
    at handleCatalogSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:690:13)
    at HTMLDivElement.onclick (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:509:91)
partsSearchSupabaseService.js:133 💾 SESSION 11: Creating search session for plate: 221-84-003
partsSearchSupabaseService.js:138   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:35 🔍 SESSION 11: Determining case_id for plate: 221-84-003
partsSearchSupabaseService.js:68   🔍 TIER 3: Looking up by plate (active cases only)
partsSearchSupabaseService.js:70   - Normalized plate (no dashes): 22184003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&or=%28plate.eq.221-84-003%2Cplate.eq.22184003%29&or=%28status.eq.OPEN%2Cstatus.eq.IN_PROGRESS%29&limit=1
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'cases', filters: Array(2), selectFields: 'id'}
partsSearchSupabaseService.js:81   ✅ TIER 3: Found case_id from active case: c52af5d6-3b78-47b8-88a2-d2553ee3e1af
partsSearchSupabaseService.js:115   ⚠️ Auth check failed: Cannot read properties of undefined (reading 'getUser')
partsSearchSupabaseService.js:152 🔍 SESSION 28: dataSource being sent to Supabase: catalog
partsSearchSupabaseService.js:153   - searchContext.dataSource: catalog
partsSearchSupabaseService.js:154   - searchParams.dataSource: undefined
partsSearchSupabaseService.js:155   - DB expects: catalog, web, or ocr
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_sessions
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'parts_search_sessions', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:184 ✅ SESSION 11: Search session created: 7cedeffd-d47e-48a9-84f8-2e0da37af637 | case_id: c52af5d6-3b78-47b8-88a2-d2553ee3e1af | user: NULL
parts%20search.html?wizard=true&step=4&t=1760557751170:1689 ✅ SESSION 26: Catalog search session created: 7cedeffd-d47e-48a9-84f8-2e0da37af637
parts%20search.html?wizard=true&step=4&t=1760557751170:1690   - This is the ONLY session creation for catalog search
parts%20search.html?wizard=true&step=4&t=1760557751170:1697 🔄 About to call smart search...
simplePartsSearchService.js:50 🔍 Starting REAL search with params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
simplePartsSearchService.js:73 📤 Sending to RPC: {car_plate: '221-84-003', make_param: 'טויוטה יפן', model_param: 'קורולה קרוס', model_code_param: 'ZVG12L-KHXGBW', trim_param: 'ADVENTURE', …}
supabaseClient.js:259 🔍 Supabase RPC request: smart_parts_search {car_plate: '221-84-003', make_param: 'טויוטה יפן', model_param: 'קורולה קרוס', model_code_param: 'ZVG12L-KHXGBW', trim_param: 'ADVENTURE', …}
supabaseClient.js:276 ✅ RPC smart_parts_search success: 0 results
simplePartsSearchService.js:86 ✅ REAL search completed in 674ms, found 0 results
parts%20search.html?wizard=true&step=4&t=1760557751170:1702 🔍 Search result: {data: Array(0), error: null, searchTime: 674, totalResults: 0}
parts%20search.html?wizard=true&step=4&t=1760557751170:1703   - Error: null
parts%20search.html?wizard=true&step=4&t=1760557751170:1704   - Data length: 0
parts%20search.html?wizard=true&step=4&t=1760557751170:1705   - Search time: 674
parts%20search.html?wizard=true&step=4&t=1760557751170:1708 🪟 About to show PiP window...
parts%20search.html?wizard=true&step=4&t=1760557751170:1709   - PiP component available: true
parts%20search.html?wizard=true&step=4&t=1760557751170:1714 📋 Showing PiP with 0 results...
parts%20search.html?wizard=true&step=4&t=1760557751170:1715   - Search success: true
parts%20search.html?wizard=true&step=4&t=1760557751170:1716   - Error message: None
parts%20search.html?wizard=true&step=4&t=1760557751170:1732 📋 PiP context: {plate: '221-84-003', sessionId: '7cedeffd-d47e-48a9-84f8-2e0da37af637', searchType: 'smart_search', dataSource: 'catalog', searchSuccess: true, …}
parts-search-results-pip.js:28 📋 Showing PiP results: 0 items
parts-search-results-pip.js:31 🔄 SESSION 17: Clearing selectedItems for new search (was: 0 )
parts-search-results-pip.js:33 ✅ SESSION 17: selectedItems cleared, starting fresh count
parts-search-results-pip.js:36 🔍 SESSION 9 TASK 1: Plate number extraction...
parts-search-results-pip.js:37   - searchContext: {
  "plate": "221-84-003",
  "sessionId": "7cedeffd-d47e-48a9-84f8-2e0da37af637",
  "searchType": "smart_search",
  "dataSource": "catalog",
  "searchSuccess": true,
  "errorMessage": null,
  "searchTime": 674,
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
    "part_group": "חלקי מרכב",
    "part_name": "ביטנה לכנף אחורי ימין",
    "free_query": "",
    "selectedParts": [
      {
        "name": "קישוט דלת קד' שמ' - קורולה קרוס -022( A(",
        "תיאור": "קישוט דלת קד' שמ' - קורולה קרוס -022( A(",
        "כמות": 1,
        "qty": 1,
        "group": "חלקי מרכב",
        "מחיר": "₪2,132.11",
        "סוג חלק": "חליפי",
        "ספק": "מ.פינס בע\"מ",
        "supplier": "מ.פינס בע\"מ",
        "fromSuggestion": false,
        "entry_method": "catalog_search",
        "מיקום": "ישראל",
        "זמינות": "חליפי",
        "מספר OEM": "",
        "oem": "",
        "הערות": "",
        "price": 2132.11,
        "quantity": 1,
        "source": "חליפי",
        "supplier_pcode": "VB42072672",
        "pcode": "VB42072672",
        "catalog_code": "VB42072672",
        "מספר קטלוגי": "VB42072672",
        "משפחת חלק": "חלקי מרכב",
        "part_family": "חלקי מרכב",
        "make": "טויוטה",
        "model": "קורולה",
        "year_from": null,
        "year_to": null,
        "catalog_item_id": "c0e3bd58-ab4e-400e-a202-a53e793d81d0",
        "selected_at": "2025-10-15T19:48:42.050Z",
        "plate_number": "221-84-003"
      },
      {
        "name": "דלת קד' ימ' - קורולה 013-",
        "תיאור": "דלת קד' ימ' - קורולה 013-",
        "כמות": 1,
        "qty": 1,
        "group": "חלקי מרכב",
        "מחיר": "₪3,002.37",
        "סוג חלק": "חליפי",
        "ספק": "מ.פינס בע\"מ",
        "supplier": "מ.פינס בע\"מ",
        "fromSuggestion": false,
        "entry_method": "catalog_search",
        "מיקום": "ישראל",
        "זמינות": "חליפי",
        "מספר OEM": "",
        "oem": "",
        "הערות": "",
        "price": 3002.37,
        "quantity": 1,
        "source": "חליפי",
        "supplier_pcode": "VB42119114",
        "pcode": "VB42119114",
        "catalog_code": "VB42119114",
        "מספר קטלוגי": "VB42119114",
        "משפחת חלק": "חלקי מרכב",
        "part_family": "חלקי מרכב",
        "make": "טויוטה",
        "model": "קורולה",
        "year_from": 2013,
        "year_to": 2013,
        "catalog_item_id": "ca404eb5-7ce2-4626-8cad-cec85f002511",
        "selected_at": "2025-10-15T19:48:42.884Z",
        "plate_number": "221-84-003"
      }
    ]
  }
}
parts-search-results-pip.js:38   - searchContext.plate: 221-84-003
parts-search-results-pip.js:39   - window.helper exists: true
parts-search-results-pip.js:40   - window.helper?.plate: undefined
parts-search-results-pip.js:52   - RESOLVED plate number: 221-84-003
parts-search-results-pip.js:53   - Extraction strategy used: SUCCESS
parts-search-results-pip.js:62 🔍 SESSION 9 DEBUG: Check conditions: {hasPlateNumber: true, plateNumber: '221-84-003', hasSessionId: true, resultsCount: 0, serviceAvailable: true}
parts-search-results-pip.js:120 ℹ️ SESSION 12: 0 results - skipping session save (no session created for empty searches)
parts-search-results-pip.js:152 🪟 PiP DOM element created and appended: {element: div.pip-overlay, className: 'pip-overlay', innerHTML_length: 3048, isConnected: true, parentNode: body}
parts-search-results-pip.js:168 🎬 PiP animation class added: {hasVisibleClass: true, computedStyle: '0', display: 'flex'}
parts-search-results-pip.js:731 🔍 Attempting to discover selected_parts table structure...
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?limit=1
parts-search-results-pip.js:746 📋 Selected parts table columns: (34) ['id', 'plate', 'search_result_id', 'part_name', 'price', 'oem', 'quantity', 'damage_center_id', 'status', 'selected_by', 'selected_at', 'raw_data', 'make', 'model', 'trim', 'year', 'engine_volume', 'pcode', 'cat_num_desc', 'source', 'availability', 'location', 'comments', 'vin', 'engine_code', 'engine_type', 'supplier_name', 'part_family', 'data_source', 'part_make', 'part_model', 'part_year_from', 'part_year_to', 'case_id']
parts-search-results-pip.js:754 🚗 Found vehicle identifier column: plate
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?plate=eq.221-84-003
parts-search-results-pip.js:768 📋 Loaded existing selections (visual only): 10
parts%20search.html?wizard=true&step=4&t=1760557751170:1735 ✅ PiP showResults completed successfully
parts%20search.html?wizard=true&step=4&t=1760557751170:1779 ℹ️ Search completed with no results
parts%20search.html?wizard=true&step=4&t=1760557751170:1822 🔄 Restoring button state...
parts%20search.html?wizard=true&step=4&t=1760557751170:2037 🔘 Button state: all enabled
parts%20search.html?wizard=true&step=4&t=1760557751170:1827 ✅ Button state restored
parts%20search.html?wizard=true&step=4&t=1760557751170:1122 💾 SESSION 14: Saved plate to session: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1143 💾 Auto-saved search progress
parts%20search.html?wizard=true&step=4&t=1760557751170:1611 🔍 Starting Supabase search...
parts%20search.html?wizard=true&step=4&t=1760557751170:1612 🔍 DEBUG: Checking dependencies at search start...
parts%20search.html?wizard=true&step=4&t=1760557751170:1613   - window.SmartPartsSearchService: function
parts%20search.html?wizard=true&step=4&t=1760557751170:1614   - window.partsResultsPiP: object
parts%20search.html?wizard=true&step=4&t=1760557751170:1615   - window.supabase: object
parts%20search.html?wizard=true&step=4&t=1760557751170:2037 🔘 Button state: catalog
parts%20search.html?wizard=true&step=4&t=1760557751170:1670 📋 Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
parts%20search.html?wizard=true&step=4&t=1760557751170:1673 📦 Initializing SimplePartsSearchService...
simplePartsSearchService.js:18 ✅ Supabase client initialized
parts%20search.html?wizard=true&step=4&t=1760557751170:1675 ✅ SimplePartsSearchService initialized
parts%20search.html?wizard=true&step=4&t=1760557751170:1680 🔍 SESSION 26: Creating catalog search session...
parts%20search.html?wizard=true&step=4&t=1760557751170:1681   - Plate: 221-84-003
parts%20search.html?wizard=true&step=4&t=1760557751170:1682   - Stack trace: Error
    at searchSupabase (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:1682:41)
    at handleCatalogSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:690:13)
    at HTMLDivElement.onclick (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:509:91)
partsSearchSupabaseService.js:130 💾 SESSION 26 DEBUG: createSearchSession called!
partsSearchSupabaseService.js:131   - Plate: 221-84-003
partsSearchSupabaseService.js:132   - Call stack: Error
    at PartsSearchSupabaseService.createSearchSession (https://yaron-cayouf-portal.netlify.app/services/partsSearchSupabaseService.js:132:40)
    at searchSupabase (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:1684:67)
    at handleCatalogSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:690:13)
    at HTMLDivElement.onclick (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:509:91)
partsSearchSupabaseService.js:133 💾 SESSION 11: Creating search session for plate: 221-84-003
partsSearchSupabaseService.js:138   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:35 🔍 SESSION 11: Determining case_id for plate: 221-84-003
partsSearchSupabaseService.js:68   🔍 TIER 3: Looking up by plate (active cases only)
partsSearchSupabaseService.js:70   - Normalized plate (no dashes): 22184003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/cases?select=id&or=%28plate.eq.221-84-003%2Cplate.eq.22184003%29&or=%28status.eq.OPEN%2Cstatus.eq.IN_PROGRESS%29&limit=1
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'cases', filters: Array(2), selectFields: 'id'}
partsSearchSupabaseService.js:81   ✅ TIER 3: Found case_id from active case: c52af5d6-3b78-47b8-88a2-d2553ee3e1af
partsSearchSupabaseService.js:115   ⚠️ Auth check failed: Cannot read properties of undefined (reading 'getUser')
partsSearchSupabaseService.js:152 🔍 SESSION 28: dataSource being sent to Supabase: catalog
partsSearchSupabaseService.js:153   - searchContext.dataSource: catalog
partsSearchSupabaseService.js:154   - searchParams.dataSource: undefined
partsSearchSupabaseService.js:155   - DB expects: catalog, web, or ocr
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_sessions
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'parts_search_sessions', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:184 ✅ SESSION 11: Search session created: 92a41a87-5ce0-45df-946b-2c5e95f98a2c | case_id: c52af5d6-3b78-47b8-88a2-d2553ee3e1af | user: NULL
parts%20search.html?wizard=true&step=4&t=1760557751170:1689 ✅ SESSION 26: Catalog search session created: 92a41a87-5ce0-45df-946b-2c5e95f98a2c
parts%20search.html?wizard=true&step=4&t=1760557751170:1690   - This is the ONLY session creation for catalog search
parts%20search.html?wizard=true&step=4&t=1760557751170:1697 🔄 About to call smart search...
simplePartsSearchService.js:50 🔍 Starting REAL search with params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
simplePartsSearchService.js:73 📤 Sending to RPC: {car_plate: '221-84-003', make_param: 'טויוטה יפן', model_param: 'קורולה קרוס', model_code_param: 'ZVG12L-KHXGBW', trim_param: 'ADVENTURE', …}
supabaseClient.js:259 🔍 Supabase RPC request: smart_parts_search {car_plate: '221-84-003', make_param: 'טויוטה יפן', model_param: 'קורולה קרוס', model_code_param: 'ZVG12L-KHXGBW', trim_param: 'ADVENTURE', …}
supabaseClient.js:276 ✅ RPC smart_parts_search success: 7 results
simplePartsSearchService.js:86 ✅ REAL search completed in 2016ms, found 7 results
simplePartsSearchService.js:90 📋 Sample results: (2) [{…}, {…}]
simplePartsSearchService.js:91 🔍 Makes found: ['טויוטה']
parts%20search.html?wizard=true&step=4&t=1760557751170:1702 🔍 Search result: {data: Array(7), error: null, searchTime: 2016, totalResults: 7}
parts%20search.html?wizard=true&step=4&t=1760557751170:1703   - Error: null
parts%20search.html?wizard=true&step=4&t=1760557751170:1704   - Data length: 7
parts%20search.html?wizard=true&step=4&t=1760557751170:1705   - Search time: 2016
parts%20search.html?wizard=true&step=4&t=1760557751170:1708 🪟 About to show PiP window...
parts%20search.html?wizard=true&step=4&t=1760557751170:1709   - PiP component available: true
parts%20search.html?wizard=true&step=4&t=1760557751170:1714 📋 Showing PiP with 7 results...
parts%20search.html?wizard=true&step=4&t=1760557751170:1715   - Search success: true
parts%20search.html?wizard=true&step=4&t=1760557751170:1716   - Error message: None
parts%20search.html?wizard=true&step=4&t=1760557751170:1732 📋 PiP context: {plate: '221-84-003', sessionId: '92a41a87-5ce0-45df-946b-2c5e95f98a2c', searchType: 'smart_search', dataSource: 'catalog', searchSuccess: true, …}
parts-search-results-pip.js:28 📋 Showing PiP results: 7 items
parts-search-results-pip.js:31 🔄 SESSION 17: Clearing selectedItems for new search (was: 0 )
parts-search-results-pip.js:33 ✅ SESSION 17: selectedItems cleared, starting fresh count
parts-search-results-pip.js:36 🔍 SESSION 9 TASK 1: Plate number extraction...
parts-search-results-pip.js:37   - searchContext: {
  "plate": "221-84-003",
  "sessionId": "92a41a87-5ce0-45df-946b-2c5e95f98a2c",
  "searchType": "smart_search",
  "dataSource": "catalog",
  "searchSuccess": true,
  "errorMessage": null,
  "searchTime": 2016,
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
    "part_group": "חלקי מרכב",
    "part_name": "דלת אחורית צד שמאל",
    "free_query": "",
    "selectedParts": [
      {
        "name": "קישוט דלת קד' שמ' - קורולה קרוס -022( A(",
        "תיאור": "קישוט דלת קד' שמ' - קורולה קרוס -022( A(",
        "כמות": 1,
        "qty": 1,
        "group": "חלקי מרכב",
        "מחיר": "₪2,132.11",
        "סוג חלק": "חליפי",
        "ספק": "מ.פינס בע\"מ",
        "supplier": "מ.פינס בע\"מ",
        "fromSuggestion": false,
        "entry_method": "catalog_search",
        "מיקום": "ישראל",
        "זמינות": "חליפי",
        "מספר OEM": "",
        "oem": "",
        "הערות": "",
        "price": 2132.11,
        "quantity": 1,
        "source": "חליפי",
        "supplier_pcode": "VB42072672",
        "pcode": "VB42072672",
        "catalog_code": "VB42072672",
        "מספר קטלוגי": "VB42072672",
        "משפחת חלק": "חלקי מרכב",
        "part_family": "חלקי מרכב",
        "make": "טויוטה",
        "model": "קורולה",
        "year_from": null,
        "year_to": null,
        "catalog_item_id": "c0e3bd58-ab4e-400e-a202-a53e793d81d0",
        "selected_at": "2025-10-15T19:48:42.050Z",
        "plate_number": "221-84-003"
      },
      {
        "name": "דלת קד' ימ' - קורולה 013-",
        "תיאור": "דלת קד' ימ' - קורולה 013-",
        "כמות": 1,
        "qty": 1,
        "group": "חלקי מרכב",
        "מחיר": "₪3,002.37",
        "סוג חלק": "חליפי",
        "ספק": "מ.פינס בע\"מ",
        "supplier": "מ.פינס בע\"מ",
        "fromSuggestion": false,
        "entry_method": "catalog_search",
        "מיקום": "ישראל",
        "זמינות": "חליפי",
        "מספר OEM": "",
        "oem": "",
        "הערות": "",
        "price": 3002.37,
        "quantity": 1,
        "source": "חליפי",
        "supplier_pcode": "VB42119114",
        "pcode": "VB42119114",
        "catalog_code": "VB42119114",
        "מספר קטלוגי": "VB42119114",
        "משפחת חלק": "חלקי מרכב",
        "part_family": "חלקי מרכב",
        "make": "טויוטה",
        "model": "קורולה",
        "year_from": 2013,
        "year_to": 2013,
        "catalog_item_id": "ca404eb5-7ce2-4626-8cad-cec85f002511",
        "selected_at": "2025-10-15T19:48:42.884Z",
        "plate_number": "221-84-003"
      }
    ]
  }
}
parts-search-results-pip.js:38   - searchContext.plate: 221-84-003
parts-search-results-pip.js:39   - window.helper exists: true
parts-search-results-pip.js:40   - window.helper?.plate: undefined
parts-search-results-pip.js:52   - RESOLVED plate number: 221-84-003
parts-search-results-pip.js:53   - Extraction strategy used: SUCCESS
parts-search-results-pip.js:62 🔍 SESSION 9 DEBUG: Check conditions: {hasPlateNumber: true, plateNumber: '221-84-003', hasSessionId: true, resultsCount: 7, serviceAvailable: true}
parts-search-results-pip.js:72 ✅ SESSION 12: Conditions met, starting Supabase save...
parts-search-results-pip.js:73   - Plate number: 221-84-003
parts-search-results-pip.js:74   - Results count: 7
parts-search-results-pip.js:77 📦 SESSION 9: Getting global service...
parts-search-results-pip.js:82 ✅ SESSION 9: Service available
parts-search-results-pip.js:88 🔍 SESSION 26 DEBUG: PiP session handling...
parts-search-results-pip.js:89   - searchContext.sessionId: 92a41a87-5ce0-45df-946b-2c5e95f98a2c
parts-search-results-pip.js:90   - window.currentSearchSessionId: 92a41a87-5ce0-45df-946b-2c5e95f98a2c
parts-search-results-pip.js:91   - Resolved session ID: 92a41a87-5ce0-45df-946b-2c5e95f98a2c
parts-search-results-pip.js:92   - Stack trace: Error
    at PartsSearchResultsPiP.showResults (https://yaron-cayouf-portal.netlify.app/parts-search-results-pip.js:92:41)
    at searchSupabase (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:1734:38)
    at async handleCatalogSearch (https://yaron-cayouf-portal.netlify.app/parts%20search.html?wizard=true&step=4&t=1760557751170:690:7)
parts-search-results-pip.js:97 ✅ SESSION 26: PiP using existing search session (NOT creating new): 92a41a87-5ce0-45df-946b-2c5e95f98a2c
parts-search-results-pip.js:101 💾 SESSION 26: PiP calling saveSearchResults (does NOT create session)...
partsSearchSupabaseService.js:215 💾 SESSION 9 TASK 3: Saving search results with individual fields...
partsSearchSupabaseService.js:216   - Results count: 7
partsSearchSupabaseService.js:217   - Query context: {plate: '221-84-003', sessionId: '92a41a87-5ce0-45df-946b-2c5e95f98a2c', searchType: 'smart_search', dataSource: 'catalog', searchSuccess: true, …}
partsSearchSupabaseService.js:223   - First result sample: {id: 'a9287d97-ae71-4325-9af9-7706a2fc8bf8', cat_num_desc: "גומי דלת אח' ימ'-קורולה 14", supplier_name: 'מ.פינס בע"מ', pcode: 'VBP42119591G', price: 599.98, …}
partsSearchSupabaseService.js:224   - Search params: {plate: '221-84-003', manufacturer: 'טויוטה יפן', model: 'קורולה קרוס', model_code: 'ZVG12L-KHXGBW', trim: 'ADVENTURE', …}
partsSearchSupabaseService.js:239   - Unique sources found: 
partsSearchSupabaseService.js:271   - Insert data prepared: (17) ['session_id', 'plate', 'make', 'model', 'trim', 'year', 'engine_volume', 'engine_code', 'engine_type', 'vin', 'part_family', 'search_type', 'data_source', 'search_query', 'results', 'response_time_ms', 'created_at']
supabaseClient.js:497 🔍 Supabase POST request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_results
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'parts_search_results', filters: Array(0), selectFields: '*'}
partsSearchSupabaseService.js:283 ✅ SESSION 9 TASK 3: Search results saved with populated fields: ecec50c4-e039-4d61-94cf-446961e1f608
parts-search-results-pip.js:107 ✅ SESSION 26: Search results saved to Supabase
parts-search-results-pip.js:109 📋 SESSION 26: Stored search result ID for FK: ecec50c4-e039-4d61-94cf-446961e1f608
parts-search-results-pip.js:152 🪟 PiP DOM element created and appended: {element: div.pip-overlay, className: 'pip-overlay', innerHTML_length: 10087, isConnected: true, parentNode: body}
parts-search-results-pip.js:731 🔍 Attempting to discover selected_parts table structure...
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?limit=1
parts-search-results-pip.js:168 🎬 PiP animation class added: {hasVisibleClass: true, computedStyle: '0', display: 'flex'}
parts-search-results-pip.js:746 📋 Selected parts table columns: (34) ['id', 'plate', 'search_result_id', 'part_name', 'price', 'oem', 'quantity', 'damage_center_id', 'status', 'selected_by', 'selected_at', 'raw_data', 'make', 'model', 'trim', 'year', 'engine_volume', 'pcode', 'cat_num_desc', 'source', 'availability', 'location', 'comments', 'vin', 'engine_code', 'engine_type', 'supplier_name', 'part_family', 'data_source', 'part_make', 'part_model', 'part_year_from', 'part_year_to', 'case_id']
parts-search-results-pip.js:754 🚗 Found vehicle identifier column: plate
supabaseClient.js:296 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?plate=eq.221-84-003
parts-search-results-pip.js:768 📋 Loaded existing selections (visual only): 10
parts%20search.html?wizard=true&step=4&t=1760557751170:1735 ✅ PiP showResults completed successfully
parts%20search.html?wizard=true&step=4&t=1760557751170:1739 📝 SESSION 30: Saving catalog results to helper.parts_search.results...
parts%20search.html?wizard=true&step=4&t=1760557751170:1759 ✅ SESSION 30: Catalog results saved to helper.parts_search.results (total searches: 29, this search: 7 parts)
parts%20search.html?wizard=true&step=4&t=1760557751170:1768 ✅ Smart search successful: 7 results
parts%20search.html?wizard=true&step=4&t=1760557751170:1822 🔄 Restoring button state...
parts%20search.html?wizard=true&step=4&t=1760557751170:2037 🔘 Button state: all enabled
parts%20search.html?wizard=true&step=4&t=1760557751170:1827 ✅ Button state restored
damage-centers-wizard.html:7070 🔄 Helper data updated, refreshing damage centers dropdown...
damage-centers-wizard.html:6701 🔍 Populating existing damage centers dropdown (forceRefresh: true)
damage-centers-wizard.html:6734 📊 Helper data parsed successfully, keys: (40) ['fees', 'meta', 'client', 'centers', 'general', 'invoice', 'vehicle', 'estimate', 'case_info', 'expertise', 'valuation', 'financials', 'validation', 'car_details', 'claims_data', 'damage_info', 'file_number', 'levisummary', 'calculations', 'depreciation', 'final_report', 'manual_notes', 'parts_search', 'preview_mode', 'report_title', 'stakeholders', 'damage_centers', 'manual_summary', 'damage_sections', 'business_license', 'raw_webhook_data', 'damage_assessment', 'manual_legal_text', 'preview_timestamp', 'manual_gross_result', 'current_damage_center', 'manual_damage_centers', 'estimate_details_title', 'manual_full_market_value', 'manual_gross_calculation']
damage-centers-wizard.html:6739 🔍 Using getDamageCentersFromHelper to find damage centers...
damage-centers-wizard.html:5909 ✅ Found damage centers in helper.centers: 2
damage-centers-wizard.html:6744 ✅ Found damage centers via getDamageCentersFromHelper: 2
damage-centers-wizard.html:6749 📊 Found 2 damage centers in getDamageCentersFromHelper
damage-centers-wizard.html:7138 ✅ Updated existing centers display with 2 centers
parts-search-results-pip.js:535 🔧 SESSION 15: addToHelper called with item: {id: 'a9287d97-ae71-4325-9af9-7706a2fc8bf8', cat_num_desc: "גומי דלת אח' ימ'-קורולה 14", supplier_name: 'מ.פינס בע"מ', pcode: 'VBP42119591G', price: 599.98, …}
parts-search-results-pip.js:560 🔧 SESSION 15: Converted part entry: {name: "גומי דלת אח' ימ'-קורולה 14", תיאור: "גומי דלת אח' ימ'-קורולה 14", כמות: 1, qty: 1, group: 'חלקי מרכב', …}
parts-search-results-pip.js:584 ✅ SESSION 19: Added new part to current_selected_list
parts-search-results-pip.js:588 ✅ SESSION 19: Reset saved flag (new part added)
parts-search-results-pip.js:591 📋 SESSION 15: Current session parts: 3
parts-search-results-pip.js:592 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 10
parts-search-results-pip.js:597 ✅ SESSION 15: Saved helper to sessionStorage
parts%20search.html?wizard=true&step=4&t=1760557751170:3477 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760557751170:3623 ✅ SESSION 19: Displaying 3 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760557751170:3628 📊 SESSION 19: Updated count display to 3
parts-search-results-pip.js:605 ✅ SESSION 13: Triggered selected parts list UI update
partsSearchSupabaseService.js:308 💾 SESSION 11: Saving selected part for plate: 221-84-003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.VBP42119591G&limit=1
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
partsSearchSupabaseService.js:374 ✅ SESSION 11: Selected part saved: ffe474a3-4966-45d3-88a0-39d08c5147b1 | search_result_id: ecec50c4-e039-4d61-94cf-446961e1f608
parts-search-results-pip.js:492 ✅ SESSION 11: Part saved to Supabase selected_parts: ffe474a3-4966-45d3-88a0-39d08c5147b1
parts-search-results-pip.js:439 ✅ Part selected: VBP42119591G
parts-search-results-pip.js:535 🔧 SESSION 15: addToHelper called with item: {id: '40830ebd-35f5-477b-b7e3-67f1ba0d97b9', cat_num_desc: "קישוט דלת אח' שמ' - קורולה קרוס -022( A(", supplier_name: 'מ.פינס בע"מ', pcode: 'VB42074684', price: 847.53, …}
parts-search-results-pip.js:560 🔧 SESSION 15: Converted part entry: {name: "קישוט דלת אח' שמ' - קורולה קרוס -022( A(", תיאור: "קישוט דלת אח' שמ' - קורולה קרוס -022( A(", כמות: 1, qty: 1, group: 'חלקי מרכב', …}
parts-search-results-pip.js:584 ✅ SESSION 19: Added new part to current_selected_list
parts-search-results-pip.js:588 ✅ SESSION 19: Reset saved flag (new part added)
parts-search-results-pip.js:591 📋 SESSION 15: Current session parts: 4
parts-search-results-pip.js:592 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 10
parts-search-results-pip.js:597 ✅ SESSION 15: Saved helper to sessionStorage
parts%20search.html?wizard=true&step=4&t=1760557751170:3477 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760557751170:3623 ✅ SESSION 19: Displaying 4 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760557751170:3628 📊 SESSION 19: Updated count display to 4
parts-search-results-pip.js:605 ✅ SESSION 13: Triggered selected parts list UI update
partsSearchSupabaseService.js:308 💾 SESSION 11: Saving selected part for plate: 221-84-003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.VB42074684&limit=1
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
partsSearchSupabaseService.js:374 ✅ SESSION 11: Selected part saved: 0f9d1612-8355-4455-9479-a9208d5ce0ff | search_result_id: ecec50c4-e039-4d61-94cf-446961e1f608
parts-search-results-pip.js:492 ✅ SESSION 11: Part saved to Supabase selected_parts: 0f9d1612-8355-4455-9479-a9208d5ce0ff
parts-search-results-pip.js:439 ✅ Part selected: VB42074684
parts-search-results-pip.js:535 🔧 SESSION 15: addToHelper called with item: {id: '5505def4-0751-4fbc-815f-85e1e203a43e', cat_num_desc: "קישוט דלת אח' ימ' - קורולה קרוס -022( SA(", supplier_name: 'מ.פינס בע"מ', pcode: 'VB42074683', price: 847.53, …}
parts-search-results-pip.js:560 🔧 SESSION 15: Converted part entry: {name: "קישוט דלת אח' ימ' - קורולה קרוס -022( SA(", תיאור: "קישוט דלת אח' ימ' - קורולה קרוס -022( SA(", כמות: 1, qty: 1, group: 'חלקי מרכב', …}
parts-search-results-pip.js:584 ✅ SESSION 19: Added new part to current_selected_list
parts-search-results-pip.js:588 ✅ SESSION 19: Reset saved flag (new part added)
parts-search-results-pip.js:591 📋 SESSION 15: Current session parts: 5
parts-search-results-pip.js:592 📋 SESSION 15: Cumulative parts (NOT modified by PiP): 10
parts-search-results-pip.js:597 ✅ SESSION 15: Saved helper to sessionStorage
parts%20search.html?wizard=true&step=4&t=1760557751170:3477 📋 SESSION 19: updateSelectedPartsList - showing current_selected_list only
parts%20search.html?wizard=true&step=4&t=1760557751170:3623 ✅ SESSION 19: Displaying 5 parts from current_selected_list
parts%20search.html?wizard=true&step=4&t=1760557751170:3628 📊 SESSION 19: Updated count display to 5
parts-search-results-pip.js:605 ✅ SESSION 13: Triggered selected parts list UI update
partsSearchSupabaseService.js:308 💾 SESSION 11: Saving selected part for plate: 221-84-003
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003&pcode=eq.VB42074683&limit=1
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
partsSearchSupabaseService.js:374 ✅ SESSION 11: Selected part saved: 84c649d3-203f-4379-ab7c-1e043711360d | search_result_id: ecec50c4-e039-4d61-94cf-446961e1f608
parts-search-results-pip.js:492 ✅ SESSION 11: Part saved to Supabase selected_parts: 84c649d3-203f-4379-ab7c-1e043711360d
parts-search-results-pip.js:439 ✅ Part selected: VB42074683
supabaseClient.js:497 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=id&plate=eq.221-84-003
supabaseClient.js:498 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(1), selectFields: 'id'}
parts-search-results-pip.js:865 ✅ SESSION 17: Cumulative total from Supabase: 13
parts-search-results-pip.js:876 💾 SESSION 17: Saving selections - selectedItems.size: 3 Cumulative total: 13
parts-search-results-pip.js:877 💾 SESSION 17: selectedItems contents: (3) ['a9287d97-ae71-4325-9af9-7706a2fc8bf8', '40830ebd-35f5-477b-b7e3-67f1ba0d97b9', '5505def4-0751-4fbc-815f-85e1e203a43e']
