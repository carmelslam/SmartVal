admin hub :
in the module fetch case status , once the tracking tables are pulled , we cant open the buttons : תמ"צ כללי,אקספירטיזה, חוו"ד those are the errors 
error 1 :
💥 Error Report: {message: "Uncaught TypeError: Cannot read properties of null (reading 'style')", filename: 'https://yaron-cayouf-portal.netlify.app/admin.html', lineno: 3734, colno: 19, error: 'TypeError: Cannot read properties of null (reading…//yaron-cayouf-portal.netlify.app/admin.html:1:1)', …}
Understanding the problem
The error message Uncaught TypeError: Cannot read properties of null (reading 'style') indicates that you are trying to access the style property of a variable or expression that currently holds the value null. This usually happens when you try to manipulate the style of an HTML element that doesn't exist or hasn't been found in the DOM.

The error report shows that this error occurred at line 3734 in the file https://yaron-cayouf-portal.netlify.app/admin.html.

The provided code for sendErrorReport is not the direct cause of the TypeError. This function is being called because the TypeError happened elsewhere in your code, likely within the admin.html file around line 3734, and your error reporting mechanism is catching and reporting it.

How to verify
Open your web application in Chrome.
Open DevTools and go to the "Elements" tab.
Examine the HTML structure of your page to confirm whether the element you are trying to access around line 3734 of your JavaScript code actually exists and has the expected ID, class, or tag name.
In the "Console" tab, click on the link next to the error message (https://yaron-cayouf-portal.netlify.app/admin.html:3734:19) to jump to the exact line of code where the error occurred. Inspect the variable or expression that is null right before the access to the .style property.
Suggested fix
The fix involves identifying the line of code around line 3734 where you are attempting to access the style property and ensuring that the element you are targeting actually exists before trying to manipulate its style.

Locate the code around line 3734 in your admin.html file (or a JavaScript file sourced by it). Look for code that tries to access an element, likely using methods like document.getElementById, document.querySelector, or similar.

Here's a common pattern and how to fix it:

js

// Original code (example - not your exact code):
const myElement = document.getElementById('some-id');
myElement.style.display = 'none'; // This line would throw the error if myElement is null

// Suggested fix: Add a check to ensure the element exists
const myElement = document.getElementById('some-id');
if (myElement) { // Check if the element was found
  myElement.style.display = 'none';
} else {
  console.warn("Element with ID 'some-id' not found."); // Optional: Log a warning
}

Use code snippets with caution

Apply this pattern to the specific line causing the error in your code.

Summary
The Uncaught TypeError: Cannot read properties of null (reading 'style') error means you are trying to access the style property of something that is null. This is likely because an HTML element you expected to find was not found in the DOM. To fix this, ensure the element exists before attempting to modify its style, typically by adding a check for null or undefined after retrieving the element.
error 2 :
admin.html:3734 Uncaught TypeError: Cannot read properties of null (reading 'style')
    at window.toggleSection (admin.html:3734:19)
    at HTMLButtonElement.onclick (admin.html:1:1)
window.toggleSection	@	admin.html:3734
onclick	@	admin.html:1

Understanding the problem
The error "Uncaught TypeError: Cannot read properties of null (reading 'style')" means that you are trying to access the style property of a variable that is currently null. In this case, the variable is likely the content variable, which is supposed to represent an HTML element. This happens when document.getElementById(sectionId + '-content') does not find an element with the specified ID, and thus returns null.

Suggested fix
Ensure that the HTML element with the ID constructed from sectionId + '-content' actually exists on the page before attempting to access its style property. You can add a check to see if the element was found:

js

// Collapsible Section Management
    window.toggleSection = function(sectionId) {
      const content = document.getElementById(sectionId + '-content');
      const icon = document.getElementById(sectionId + '-icon');

      // Add a check to ensure the element exists
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
          if (icon) { // Also check if the icon element exists
            icon.textContent = '🔽';
          }
          sessionStorage.setItem(`section-${sectionId}`, 'expanded');
        } else {
          content.style.display = 'none';
          if (icon) { // Also check if the icon element exists
            icon.textContent = '🔼';
          }
          sessionStorage.setItem(`section-${sectionId}`, 'collapsed');
        }
      } else {
        console.error(`Element with ID ${sectionId}-content not found.`);
      }
    };

Use code snippets with caution

Summary
The error occurs because document.getElementById() returned null. The fix is to check if the element was found before trying to access its properties.

error 3 :
environment-config.js:398 💥 Error Report: 
{message: "Uncaught TypeError: Cannot read properties of null (reading 'style')", filename: 'https://yaron-cayouf-portal.netlify.app/admin.html', lineno: 3734, colno: 19, error: 'TypeError: Cannot read properties of null (reading…//yaron-cayouf-portal.netlify.app/admin.html:1:1)', …}
sendErrorReport	@	environment-config.js:398
(anonymous)	@	environment-config.js:379
Understanding the problem
The error message Uncaught TypeError: Cannot read properties of null (reading 'style') indicates that you are trying to access the style property of a variable or expression that currently holds the value null. This usually happens when you try to manipulate the style of an HTML element that doesn't exist or hasn't been found in the DOM.

The error report shows that this error occurred at line 3734 in the file https://yaron-cayouf-portal.netlify.app/admin.html.

The provided code for sendErrorReport is not the direct cause of the TypeError. This function is being called because the TypeError happened elsewhere in your code, likely within the admin.html file around line 3734, and your error reporting mechanism is catching and reporting it.

How to verify
Open your web application in Chrome.
Open DevTools and go to the "Elements" tab.
Examine the HTML structure of your page to confirm whether the element you are trying to access around line 3734 of your JavaScript code actually exists and has the expected ID, class, or tag name.
In the "Console" tab, click on the link next to the error message (https://yaron-cayouf-portal.netlify.app/admin.html:3734:19) to jump to the exact line of code where the error occurred. Inspect the variable or expression that is null right before the access to the .style property.
Suggested fix
The fix involves identifying the line of code around line 3734 where you are attempting to access the style property and ensuring that the element you are targeting actually exists before trying to manipulate its style.

Locate the code around line 3734 in your admin.html file (or a JavaScript file sourced by it). Look for code that tries to access an element, likely using methods like document.getElementById, document.querySelector, or similar.

Here's a common pattern and how to fix it:

js

// Original code (example - not your exact code):
const myElement = document.getElementById('some-id');
myElement.style.display = 'none'; // This line would throw the error if myElement is null

// Suggested fix: Add a check to ensure the element exists
const myElement = document.getElementById('some-id');
if (myElement) { // Check if the element was found
  myElement.style.display = 'none';
} else {
  console.warn("Element with ID 'some-id' not found."); // Optional: Log a warning
}

Use code snippets with caution

Apply this pattern to the specific line causing the error in your code.

Summary
The Uncaught TypeError: Cannot read properties of null (reading 'style') error means you are trying to access the style property of something that is null. This is likely because an HTML element you expected to find was not found in the DOM. To fix this, ensure the element exists before attempting to modify its style, typically by adding a check for null or undefined after retrieving the element.

error 4 :
admin.html:3734 Uncaught TypeError: Cannot read properties of null (reading 'style')
    at window.toggleSection (admin.html:3734:19)
    at HTMLButtonElement.onclick (admin.html:1:1)
window.toggleSection	@	admin.html:3734
onclick	@	admin.html:1
admin.html:3734 Uncaught TypeError: Cannot read properties of null (reading 'style')
    at window.toggleSection (admin.html:3734:19)
    at HTMLButtonElement.onclick (admin.html:1:1)
window.toggleSection	@	admin.html:3734
onclick	@	admin.html:1

error 5 :

environment-config.js:398 💥 Error Report: 
{message: "Uncaught TypeError: Cannot read properties of null (reading 'style')", filename: 'https://yaron-cayouf-portal.netlify.app/admin.html', lineno: 3734, colno: 19, error: 'TypeError: Cannot read properties of null (reading…//yaron-cayouf-portal.netlify.app/admin.html:1:1)', …}
sendErrorReport	@	environment-config.js:398
(anonymous)	@	environment-config.js:379
Understanding the problem
The error message Uncaught TypeError: Cannot read properties of null (reading 'style') indicates that you are trying to access the style property of a variable or expression that currently holds the value null. This usually happens when you try to manipulate the style of an HTML element that doesn't exist or hasn't been found in the DOM.

The error report shows that this error occurred at line 3734 in the file https://yaron-cayouf-portal.netlify.app/admin.html.

The provided code for sendErrorReport is not the direct cause of the TypeError. This function is being called because the TypeError happened elsewhere in your code, likely within the admin.html file around line 3734, and your error reporting mechanism is catching and reporting it.

How to verify
Open your web application in Chrome.
Open DevTools and go to the "Elements" tab.
Examine the HTML structure of your page to confirm whether the element you are trying to access around line 3734 of your JavaScript code actually exists and has the expected ID, class, or tag name.
In the "Console" tab, click on the link next to the error message (https://yaron-cayouf-portal.netlify.app/admin.html:3734:19) to jump to the exact line of code where the error occurred. Inspect the variable or expression that is null right before the access to the .style property.
Suggested fix
The fix involves identifying the line of code around line 3734 where you are attempting to access the style property and ensuring that the element you are targeting actually exists before trying to manipulate its style.

Locate the code around line 3734 in your admin.html file (or a JavaScript file sourced by it). Look for code that tries to access an element, likely using methods like document.getElementById, document.querySelector, or similar.

Here's a common pattern and how to fix it:

js

// Original code (example - not your exact code):
const myElement = document.getElementById('some-id');
myElement.style.display = 'none'; // This line would throw the error if myElement is null

// Suggested fix: Add a check to ensure the element exists
const myElement = document.getElementById('some-id');
if (myElement) { // Check if the element was found
  myElement.style.display = 'none';
} else {
  console.warn("Element with ID 'some-id' not found."); // Optional: Log a warning
}

Use code snippets with caution

Apply this pattern to the specific line causing the error in your code.

Summary
The Uncaught TypeError: Cannot read properties of null (reading 'style') error means you are trying to access the style property of something that is null. This is likely because an HTML element you expected to find was not found in the DOM. To fix this, ensure the element exists before attempting to modify its style, typically by adding a check for null or undefined after retrieving the element.

error 6 :

admin.html:3734 Uncaught TypeError: Cannot read properties of null (reading 'style')
    at window.toggleSection (admin.html:3734:19)
    at HTMLButtonElement.onclick (admin.html:1:1)
window.toggleSection	@	admin.html:3734
onclick	@	admin.html:1

Understanding the problem
The error "Uncaught TypeError: Cannot read properties of null (reading 'style')" means that you are trying to access the style property of a variable that is currently null. In this case, the variable is likely the content variable, which is supposed to represent an HTML element. This happens when document.getElementById(sectionId + '-content') does not find an element with the specified ID, and thus returns null.

Suggested fix
Ensure that the HTML element with the ID constructed from sectionId + '-content' actually exists on the page before attempting to access its style property. You can add a check to see if the element was found:

js

// Collapsible Section Management
    window.toggleSection = function(sectionId) {
      const content = document.getElementById(sectionId + '-content');
      const icon = document.getElementById(sectionId + '-icon');

      // Add a check to ensure the element exists
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
          if (icon) { // Also check if the icon element exists
            icon.textContent = '🔽';
          }
          sessionStorage.setItem(`section-${sectionId}`, 'expanded');
        } else {
          content.style.display = 'none';
          if (icon) { // Also check if the icon element exists
            icon.textContent = '🔼';
          }
          sessionStorage.setItem(`section-${sectionId}`, 'collapsed');
        }
      } else {
        console.error(`Element with ID ${sectionId}-content not found.`);
      }
    };

Use code snippets with caution

Summary
The error occurs because document.getElementById() returned null. The fix is to check if the element was found before trying to access its properties.

**estimate console**
estimate-builder.html:7102 🎯 3-bulk system functions loaded and ready
estimate-builder.html:7664 📄 Section Save/Refresh functionality initialized
levi-floating.js:2 🚀 Levi floating script starting...
levi-floating.js:639 🔧 Defining toggleLeviReport function...
car-details-floating.js:2 🚗 Car Details Floating Module loaded
car-details-floating.js:1265 ✅ Car Details Floating Module initialized successfully
estimate-builder.html:5610 🚀 Initializing EstimateCalculations object first
estimate-builder.html:6877 🚀 Initializing 3-bulk system...
estimate-builder.html:8015 🔘 Expertise button state initialized: {expertiseExists: undefined}
estimate-builder.html:8053 📝 Estimate Builder: Initializing with ENHANCED helper integration...
estimate-builder.html:8088 🏗️ Builder state initialized from helper data
estimate-builder.html:1 [DOM] Password field is not contained in a form: (More info: https://goo.gl/9p2vKq)
estimate-builder.html:1766 ✅ Base price populated FROM helper.valuation.base_price: 118000
estimate-builder.html:1772 ✅ Basic price field populated with levi base price: 118000
estimate-builder.html:1779 ✅ Market value populated FROM helper.vehicle.market_value: 78877
estimate-builder.html:1783 ✅ Issue date populated FROM helper.case_info.issue_date: 
estimate-builder.html:1811 💰 Loaded claims data: {from_claims_data: {…}, from_calculations: {…}}
estimate-builder.html:5484 🔍 Updating gross market value field: {vehicleValueGross: 0, helperCalculations: {…}}
estimate-builder.html:5503 🔧 Got vehicle_value_gross from leviPriceList field: 0
estimate-builder.html:5521 ⚠️ No vehicle_value_gross found after all fallback attempts
updateGrossMarketValueField @ estimate-builder.html:5521
loadDataFromHelper @ estimate-builder.html:1817
(anonymous) @ estimate-builder.html:5614
setTimeout
(anonymous) @ estimate-builder.html:5613
estimate-builder.html:1836 ✅ All contact fields populated FROM helper structure
estimate-builder.html:2091 🔄 loadDepreciationData called with helper: {meta: {…}, vehicle: {…}, case_info: {…}, stakeholders: {…}, damage_assessment: {…}, …}
estimate-builder.html:2092 🔄 helper.estimate_depreciation: undefined
estimate-builder.html:2120 ❌ No saved depreciation data, trying to populate from damage centers
estimate-builder.html:2125 🔍 Full helper structure: {
  "meta": {
    "plate": "221-84-003",
    "case_id": "YC-221-84-003-2025",
    "original_plate": "",
    "plate_locked": false,
    "plate_protection_source": "",
    "created_at": "2025-07-23T15:38:20.661Z",
    "last_updated": "2025-07-24T07:52:41.239Z",
    "last_webhook_update": "SUBMIT_LEVI_REPORT",
    "damage_date": "2025-07-23",
    "location": "מקום האירוע",
    "source": "general_info_form",
    "last_levi_processed": "2025-07-23T16:13:45.315Z",
    "levi_report_available": true
  },
  "vehicle": {
    "plate": "221-84-003",
    "manufacturer": "טויוטה",
    "model": "C-HR",
    "model_code": "413765",
    "model_type": "פנאי-שטח",
    "trim": "",
    "year": "06/2024",
    "chassis": "JTPAAAAA00R022495",
    "engine_volume": "1798",
    "fuel_type": "בנזין",
    "transmission": "",
    "is_automatic": "כן",
    "drive_type": "4X2",
    "km": "ק\"מ 137719 (+18700) (מס ק\"מ: 1.1)",
    "office_code": "839-337",
    "ownership_type": "פרטי",
    "registration_date": "",
    "category": "פנאי שטח",
    "features": "",
    "condition": "",
    "market_value": "₪ 78,877",
    "created_at": "",
    "updated_at": "",
    "vehicle_type": "פרטי",
    "vehicle_model_code": "ZYX20L",
    "engine_model": "2ZR",
    "מספר תיק": "YC-69842003-2025",
    "inspection_date": "2025-07-23T18:11:20.330+02:00",
    "owner": "כרמל כיוף",
    "inspection_location": "מקום האירוע",
    "location": "מקום האירוע",
    "damage_date": "2025-07-23",
    "plate_number": "221-84-003",
    "full_model_name": "טויוטה קורולה קרוס ACTIVE140 כ\"ס (97 כ\"ס בנזין) (1798) הברידי אוטו'"
  },
  "case_info": {
    "case_id": "YC-221-84-003-2025",
    "plate": "69842003",
    "status": "active",
    "damage_date": "2025-07-23",
    "inspection_date": "2025-07-23T18:11:20.330+02:00",
    "submission_date": "",
    "created_at": "",
    "inspection_location": "מקום האירוע",
    "damage_type": "תאונה",
    "report_type": "",
    "report_type_display": ""
  },
  "stakeholders": {
    "owner": {
      "name": "כרמל כיוף",
      "address": "עספיא",
      "phone": "כרמל כיוף",
      "email": ""
    },
    "garage": {
      "name": "FARCAR",
      "contact_person": "",
      "phone": "0988888",
      "email": "garage@garage.com",
      "address": ""
    },
    "insurance": {
      "company": "הראל",
      "email": "הראל",
      "policy_number": "",
      "claim_number": "",
      "agent": {
        "name": "גוג שון",
        "phone": "09888989",
        "email": "agent@agent.com"
      }
    }
  },
  "damage_assessment": {
    "summary": {
      "total_damage_amount": 0,
      "damage_percentage": 0,
      "is_total_loss": false,
      "classification": "",
      "assessment_notes": ""
    },
    "centers": []
  },
  "valuation": {
    "source": "levi_yitzhak",
    "report_date": "",
    "valuation_date": "",
    "base_price": "₪ 118,000",
    "final_price": "₪ 78,877",
    "currency": "ILS",
    "levi_code": "413765",
    "levi_model_code": "",
    "code": "",
    "market_conditions": "",
    "comparable_vehicles": [],
    "adjustments": {
      "registration": {
        "percent": "0",
        "amount": "₪ 4,000",
        "cumulative": "₪ 132,620",
        "reason": "",
        "date": "",
        "description": "עליה לכביש",
        "value": "11/2022"
      },
      "mileage": {
        "percent": "-26.88%",
        "amount": "₪ -29,588",
        "cumulative": "₪ 80,487",
        "reason": "",
        "km_value": 0,
        "description": "מס ק\"מ",
        "value": "ק\"מ 137719 (+18700) (מס ק\"מ: 1.1)",
        "percentage": "ק\"מ 137719 (+18700) (מס ק\"מ: 1.1)"
      },
      "ownership_type": {
        "percent": "-17%",
        "amount": "₪ -22,545",
        "cumulative": "₪ 110,075",
        "reason": "",
        "type": "",
        "description": "בעלות",
        "value": "חברה, עמותות ואגודות שיתופיות למיניהן | או לשעבר",
        "percentage": "בעלות"
      },
      "ownership_history": {
        "percent": "-2%",
        "amount": "₪ -1,610",
        "cumulative": "₪ 78,877",
        "reason": "",
        "owner_count": "02",
        "description": "מספר בעלים",
        "value": "02"
      },
      "features": {
        "percent": "9%",
        "amount": "₪ 10,620",
        "cumulative": "₪ 128,620",
        "reason": "",
        "feature_list": [],
        "description": "מאפיינים",
        "percentage": "מאפיינים"
      },
      "market_factors": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      },
      "road_registration": {
        "percentage": "עליה לכביש"
      },
      "previous_owners": {
        "percentage": "מספר בעלים"
      }
    },
    "depreciation": {
      "global_percentage": 0,
      "global_amount": 0,
      "work_days_impact": 0,
      "total_depreciation": 0
    },
    "calculations": {
      "gross_price": {
        "base": 0,
        "features_total": 0,
        "registration_total": 0,
        "total": 0
      },
      "market_price": {
        "gross_total": 0,
        "mileage_adjustme
estimate-builder.html:2126 🔍 Checking helper.expertise?.damage_blocks: undefined
estimate-builder.html:2127 🔍 Checking helper.damage_blocks: undefined
estimate-builder.html:2128 🔍 Checking helper.expertise?.damage_centers: undefined
estimate-builder.html:2129 🔍 Checking helper.damage_centers: undefined
estimate-builder.html:2174 🔍 Extracted damage center names: []
estimate-builder.html:2181 ❌ No damage center names found to populate depreciation
estimate-builder.html:2436 🔄 loadAllAdjustments called (will be debounced) from: at loadDataFromHelper (https://yaron-cayouf-portal.netlify.app/estimate-builder.html:1875:9)
estimate-builder.html:1887 Error loading data from helper: ReferenceError: helper is not defined
    at autoPopulateFromLeviSummary (estimate-builder.html:3844:7)
    at loadDataFromHelper (estimate-builder.html:1878:9)
    at estimate-builder.html:5614:9
loadDataFromHelper @ estimate-builder.html:1887
(anonymous) @ estimate-builder.html:5614
setTimeout
(anonymous) @ estimate-builder.html:5613
estimate-builder.html:3631 📎 No saved attachments found, keeping default
estimate-builder.html:6611 📥 Loading helper data: {meta: {…}, vehicle: {…}, case_info: {…}, stakeholders: {…}, damage_assessment: {…}, …}
estimate-builder.html:6633 ⚠️ No BASE PRICE found in helper - this field requires Levi base price, not market value
loadHelperData @ estimate-builder.html:6633
(anonymous) @ estimate-builder.html:6882
setTimeout
(anonymous) @ estimate-builder.html:6880
estimate-builder.html:6645 ⚠️ No base price found in helper, basic price field will be empty
loadHelperData @ estimate-builder.html:6645
(anonymous) @ estimate-builder.html:6882
setTimeout
(anonymous) @ estimate-builder.html:6880
estimate-builder.html:6646 Debug helper data: {levi_report: {…}, expertise: {…}, levisummary: {…}, car_details: {…}}
estimate-builder.html:6654 🔍 FULL HELPER STRUCTURE DEBUG
estimate-builder.html:6655 Complete helper object keys: (21) ['meta', 'vehicle', 'case_info', 'stakeholders', 'damage_assessment', 'valuation', 'financials', 'parts_search', 'documents', 'estimate', 'levi_data', 'calculations', 'raw_webhook_data', 'system', 'car_details', 'general', 'damage_info', 'levisummary', 'expertise', 'claims_data', 'levi_report']
estimate-builder.html:6656 Helper size: 11663
estimate-builder.html:6659 All possible base price locations:
estimate-builder.html:6660 - helper.levi_report?.base_price: 
estimate-builder.html:6661 - helper.expertise?.levi_report?.base_price: 
estimate-builder.html:6662 - helper.levisummary?.base_price: 0
estimate-builder.html:6663 - helper.car_details?.base_price: undefined
estimate-builder.html:6664 - helper.vehicle?.base_price: undefined
estimate-builder.html:6665 - helper.calculations?.base_price: undefined
estimate-builder.html:6666 - helper.expertise?.calculations?.base_price: undefined
estimate-builder.html:6669 All possible vehicle_value_gross locations:
estimate-builder.html:6670 - helper.calculations?.vehicle_value_gross: 0
estimate-builder.html:6671 - helper.expertise?.calculations?.vehicle_value_gross: 0
estimate-builder.html:6674 All possible damage data locations:
estimate-builder.html:6675 - helper.expertise?.damage_blocks: undefined
estimate-builder.html:6676 - helper.damage_centers: undefined
estimate-builder.html:6677 - helper.damage_sections: undefined
estimate-builder.html:6680 Raw sessionStorage helper: {"meta":{"plate":"221-84-003","case_id":"YC-221-84-003-2025","original_plate":"","plate_locked":false,"plate_protection_source":"","created_at":"2025-07-23T15:38:20.661Z","last_updated":"2025-07-24T07:52:41.239Z","last_webhook_update":"SUBMIT_LEVI_REPORT","damage_date":"2025-07-23","location":"מקום האירוע","source":"general_info_form","last_levi_processed":"2025-07-23T16:13:45.315Z","levi_report_available":true},"vehicle":{"plate":"221-84-003","manufacturer":"טויוטה","model":"C-HR","model_code":"413765","model_type":"פנאי-שטח","trim":"","year":"06/2024","chassis":"JTPAAAAA00R022495","engine_volume":"1798","fuel_type":"בנזין","transmission":"","is_automatic":"כן","drive_type":"4X2","km":"ק\"מ 137719 (+18700) (מס ק\"מ: 1.1)","office_code":"839-337","ownership_type":"פרטי","registration_date":"","category":"פנאי שטח","features":"","condition":"","market_value":"₪ 78,877","created_at":"","updated_at":"","vehicle_type":"פרטי","vehicle_model_code":"ZYX20L","engine_model":"2ZR","מספר תיק":"YC-69842003-2025","inspection_date":"2025-07-23T18:11:20.330+02:00","owner":"כרמל כיוף","inspection_location":"מקום האירוע","location":"מקום האירוע","damage_date":"2025-07-23","plate_number":"221-84-003","full_model_name":"טויוטה קורולה קרוס ACTIVE140 כ\"ס (97 כ\"ס בנזין) (1798) הברידי אוטו'"},"case_info":{"case_id":"YC-221-84-003-2025","plate":"69842003","status":"active","damage_date":"2025-07-23","inspection_date":"2025-07-23T18:11:20.330+02:00","submission_date":"","created_at":"","inspection_location":"מקום האירוע","damage_type":"תאונה","report_type":"","report_type_display":""},"stakeholders":{"owner":{"name":"כרמל כיוף","address":"עספיא","phone":"כרמל כיוף","email":""},"garage":{"name":"FARCAR","contact_person":"","phone":"0988888","email":"garage@garage.com","address":""},"insurance":{"company":"הראל","email":"הראל","policy_number":"","claim_number":"","agent":{"name":"גוג שון","phone":"09888989","email":"agent@agent.com"}}},"damage_assessment":{"summary":{"total_damage_amount":0,"damage_percentage":0,"is_total_loss":false,"classification":"","assessment_notes":""},"centers":[]},"valuation":{"source":"levi_yitzhak","report_date":"","valuation_date":"","base_price":"₪ 118,000","final_price":"₪ 78,877","currency":"ILS","levi_code":"413765","levi_model_code":"","code":"","market_conditions":"","comparable_vehicles":[],"adjustments":{"registration":{"percent":"0","amount":"₪ 4,000","cumulative":"₪ 132,620","reason":"","date":"","description":"עליה לכביש","value":"11/2022"},"mileage":{"percent":"-26.88%","amount":"₪ -29,588","cumulative":"₪ 80,487","reason":"","km_value":0,"description":"מס ק\"מ","value":"ק\"מ 137719 (+18700) (מס ק\"מ: 1.1)","percentage":"ק\"מ 137719 (+18700) (מס ק\"מ: 1.1)"},"ownership_type":{"percent":"-17%","amount":"₪ -22,545","cumulative":"₪ 110,075","reason":"","type":"","description":"בעלות","value":"חברה, עמותות ואגודות שיתופיות למיניהן | או לשעבר","percentage":"בעלות"},"ownership_history":{"percent":"-2%","amount":"₪ -1,610","cumulative":"₪ 78,877","reason":"","owner_count":"02","description":"מספר בעלים","value":"02"},"features":{"percent":"9%","amount":"₪ 10,620","cumulative":"₪ 128,620","reason":"","feature_list":[],"description":"מאפיינים","percentage":"מאפיינים"},"market_factors":{"percent":0,"amount":0,"reason":""},"road_registration":{"percentage":"עליה לכביש"},"previous_owners":{"percentage":"מספר בעלים"}},"depreciation":{"global_percentage":0,"global_amount":0,"work_days_impact":0,"total_depreciation":0},"calculations":{"gross_price":{"base":0,"features_total":0,"registration_total":0,"total":0},"market_price":{"gross_total":0,"mileage_adjustment":0,"ownership_type_adjustment":0,"ownership_history_adjustment":0,"market_factors_adjustment":0,"total":0}},"levi_report_date":"19/12/2024"},"financials":{"costs":{"parts_total":0,"repairs_total":0,"works_total":0,"subtotal":0},"fees":{"photography":{"count":0,"unit_price":0,"total":0},"office":{"fixed_fee":0,"percentage":0,"total":0},"travel":{"count":0,"unit_price":0,"total":0},"assessment":{"hours":0,"hourly_rate":0,"total":0},"subtotal":0},"taxes":{"vat_percentage":18,"vat_amount":0},"totals":{"before_tax":0,"after_tax":0,"total_compensation":0,"salvage_value":0,"net_settlement":0},"calculation_date":"","calculation_method":"","overrides":[{"fieldId":"km","value":"120000","origin":"general_info","timestamp":"2025-07-23T16:11:50.031Z","type":"manual_override"},{"fieldId":"damage_date_new","value":"2025-06-29","origin":"general_info","timestamp":"2025-07-23T16:11:56.190Z","type":"manual_override"},{"fieldId":"owner_address","value":"עספיא","origin":"general_info","timestamp":"2025-07-23T16:11:57.527Z","type":"manual_override"},{"fieldId":"garage_name","value":"FARCAR","origin":"general_info","timestamp":"2025-07-23T16:11:59.637Z","type":"manual_override"},{"fieldId":"garage_phone","value":"0988888","origin":"general_info","timestamp":"2025-07-23T16:12:00.710Z","type":"manual_override"},{"fieldId":"garage_email","value":"garage@garage.com","origin"
estimate-builder.html:6709 ✅ Helper data loaded successfully
estimate-builder.html:6747 🔗 Adding field change listeners...
estimate-builder.html:6868 ✅ Field change listeners added successfully
estimate-builder.html:2456 🔄 Loading all adjustments (immediate)
estimate-builder.html:2470 🧹 Helper cleaned up and saved, proceeding with load...
estimate-builder.html:2478 🧹 Container cleared, current children count: 0
estimate-builder.html:2498 📄 No Levi adjustments found in helper.levi_report.adjustments
estimate-builder.html:2518 📄 No custom adjustments found in helper.levi.custom_adjustments
estimate-builder.html:4895 Uncaught TypeError: Cannot read properties of undefined (reading 'getGrossMarketValue')
    at updateGrossPercentageFromGrossValue (estimate-builder.html:4895:54)
    at refreshSecondBulkFields (estimate-builder.html:5412:7)
    at estimate-builder.html:6916:17
updateGrossPercentageFromGrossValue @ estimate-builder.html:4895
refreshSecondBulkFields @ estimate-builder.html:5412
(anonymous) @ estimate-builder.html:6916
setTimeout
(anonymous) @ estimate-builder.html:6915
(anonymous) @ estimate-builder.html:6912
childList
loadDamageCentersSummary @ estimate-builder.html:2208
loadDataFromHelper @ estimate-builder.html:1872
(anonymous) @ estimate-builder.html:5614
setTimeout
(anonymous) @ estimate-builder.html:5613
estimate-builder.html:4709 🔧 Loading features adjustments from Levi: []
estimate-builder.html:4744 🔧 Loading registration adjustments from Levi: []
estimate-builder.html:4854 Error loading gross calculation data: TypeError: helper.levisummary.adjustments.forEach is not a function
    at loadGrossCalculationData (estimate-builder.html:4804:42)
    at estimate-builder.html:1823:11
loadGrossCalculationData @ estimate-builder.html:4854
(anonymous) @ estimate-builder.html:1823
setTimeout
loadDataFromHelper @ estimate-builder.html:1820
(anonymous) @ estimate-builder.html:5614
setTimeout
(anonymous) @ estimate-builder.html:5613
estimate-builder.html:5622 🚀 Initializing adjustment system on page load
estimate-builder.html:2766 🔗 Adding event listeners to 0 adjustment inputs
estimate-builder.html:4895 Uncaught TypeError: Cannot read properties of undefined (reading 'getGrossMarketValue')
    at updateGrossPercentageFromGrossValue (estimate-builder.html:4895:54)
    at refreshSecondBulkFields (estimate-builder.html:5412:7)
    at estimate-builder.html:6947:9
updateGrossPercentageFromGrossValue @ estimate-builder.html:4895
refreshSecondBulkFields @ estimate-builder.html:5412
(anonymous) @ estimate-builder.html:6947
setTimeout
updateAllCostDisplays @ estimate-builder.html:6946
(anonymous) @ estimate-builder.html:1821
setTimeout
loadDataFromHelper @ estimate-builder.html:1820
(anonymous) @ estimate-builder.html:5614
setTimeout
(anonymous) @ estimate-builder.html:5613
car-details-floating.js:1174 🚀 Auto-persisting car data on page load (not opening screen)...
car-details-floating.js:1182 ✅ Found car data - persisting automatically (screen remains closed)
car-details-floating.js:1205 💾 Persisted data from sessionStorage
estimate-builder.html:4709 🔧 Loading features adjustments from Levi: []
estimate-builder.html:4744 🔧 Loading registration adjustments from Levi: []
estimate-builder.html:4854 Error loading gross calculation data: TypeError: helper.levisummary.adjustments.forEach is not a function
    at loadGrossCalculationData (estimate-builder.html:4804:42)
    at estimate-builder.html:6890:9
loadGrossCalculationData @ estimate-builder.html:4854
(anonymous) @ estimate-builder.html:6890
setTimeout
(anonymous) @ estimate-builder.html:6889
estimate-builder.html:6891 ✅ Bulk 1 & 2 initialized
estimate-builder.html:2766 🔗 Adding event listeners to 0 adjustment inputs
estimate-builder.html:5108 🔄 Loading full market value data...
estimate-builder.html:5109 📊 Helper levi_report adjustments: []
estimate-builder.html:5110 📊 Helper custom full_market_adjustments: undefined
estimate-builder.html:5132 🧹 Cleared allAdjustmentsList container, children count: 0
estimate-builder.html:5139 🔄 Setting loading flag on container
estimate-builder.html:5189 📊 Total unique adjustments to load: 0
estimate-builder.html:5099 Error calculating full market value: TypeError: Cannot read properties of undefined (reading 'getGrossMarketValue')
    at updateFullMarketValueCalculation (estimate-builder.html:5041:56)
    at loadFullMarketValueData (estimate-builder.html:5209:9)
    at estimate-builder.html:6903:9
updateFullMarketValueCalculation @ estimate-builder.html:5099
loadFullMarketValueData @ estimate-builder.html:5209
(anonymous) @ estimate-builder.html:6903
setTimeout
(anonymous) @ estimate-builder.html:6902
estimate-builder.html:5216 ✅ Full market value data loading completed
estimate-builder.html:6904 ✅ Bulk 3 initialized
estimate-builder.html:6905 ✅ Complete 3-bulk system initialized
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: נתוני הרכב (collapsible: false)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: פרטי קשר (collapsible: true)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: מרכזי נזק (collapsible: false)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: חישוב אחוז נזק ברוטו (collapsible: true)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: תוצאת חישוב ברוטו (collapsible: true)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: חישוב ערך השוק המלא (collapsible: true)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: חישוב ירידת ערך לפי מוקדי נזק (collapsible: false)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: סיכום האומדן (collapsible: false)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: הערות נוספות (collapsible: false)
estimate-builder.html:7652 ✅ Added Save/Refresh buttons to section: טקסט משפטי (collapsible: false)
car-details-floating.js:1254 📌 Data already persisted, stopping periodic checks
estimate-builder.html:1262 Toggling floating screen: leviReport
levi-floating.js:783 🔄 updateLeviDisplay called with result: {plate: '221-84-003', manufacturer: 'טויוטה', model: 'C-HR', model_code: '', model_type: 'פנאי-שטח', …}
levi-floating.js:791 📊 DEBUG: Found percentage fields in webhook data: (7) ['עליה לכביש %', 'מאפיינים %', 'בעלות %', 'מס ק״מ %', 'מספר בעלים %', 'מס ק"מ %', 'מחיר מאפיינים %']
levi-floating.js:793    עליה לכביש %: 0
levi-floating.js:793    מאפיינים %: 0
levi-floating.js:793    בעלות %: -17%
levi-floating.js:793    מס ק״מ %: 0
levi-floating.js:793    מספר בעלים %: -2%
levi-floating.js:793    מס ק"מ %: -26.88%
levi-floating.js:793    מחיר מאפיינים %: 9%
levi-floating.js:801 🔧 DEBUG: Helper valuation adjustments:
levi-floating.js:802    Registration %: 0
levi-floating.js:803    Ownership %: -17%
levi-floating.js:804    Mileage %: -26.88%
levi-floating.js:805    Owners %: -2%
levi-floating.js:806    Features %: 9%
levi-floating.js:648 🚫 Refresh functionality disabled to prevent loops
estimate-builder.html:1262 Toggling floating screen: carDetails
car-details-floating.js:599 📌 Using persisted car data
car-details-floating.js:877 🔄 ENHANCED updateCarDisplay called with: {vehicle: {…}, carDetails: {…}, stakeholders: {…}, meta: {…}, valuationData: {…}}
car-details-floating.js:882 🔍 Vehicle data available: (34) ['plate', 'manufacturer', 'model', 'model_code', 'model_type', 'trim', 'year', 'chassis', 'engine_volume', 'fuel_type', 'transmission', 'is_automatic', 'drive_type', 'km', 'office_code', 'ownership_type', 'registration_date', 'category', 'features', 'condition', 'market_value', 'created_at', 'updated_at', 'vehicle_type', 'vehicle_model_code', 'engine_model', 'מספר תיק', 'inspection_date', 'owner', 'inspection_location', 'location', 'damage_date', 'plate_number', 'full_model_name']
car-details-floating.js:883 🔍 CarDetails data available: (31) ['plate', 'מספר תיק', 'inspection_date', 'manufacturer', 'model', 'model_type', 'vehicle_type', 'trim', 'chassis', 'year', 'owner', 'ownership_type', 'engine_volume', 'fuel_type', 'vehicle_model_code', 'engine_model', 'drive_type', 'inspection_location', 'office_code', 'location', 'damage_date', 'ownerAddress', 'ownerPhone', 'insuranceCompany', 'agentName', 'insurance_agent_phone', 'insurance_agent_email', 'garageName', 'garagePhone', 'report_date', 'basic_price']
car-details-floating.js:884 🔍 Stakeholders data available: (3) ['owner', 'garage', 'insurance']
car-details-floating.js:885 🔍 Meta data available: (13) ['plate', 'case_id', 'original_plate', 'plate_locked', 'plate_protection_source', 'created_at', 'last_updated', 'last_webhook_update', 'damage_date', 'location', 'source', 'last_levi_processed', 'levi_report_available']
car-details-floating.js:916 🆔 Plate values check: {vehicle.plate: '221-84-003', meta.plate: '221-84-003', carDetails.plate: '69842003', final plateValue: '221-84-003'}
car-details-floating.js:956 🔍 Model Code vs Levi Code Debug: {carDetails.vehicle_model_code: 'ZYX20L', vehicle.vehicle_model_code: 'ZYX20L', meta.vehicle_model_code: undefined, carDetails.model_code: undefined, vehicle.model_code: '413765', …}
car-details-floating.js:969 🔍 Full carDetails object: {plate: '69842003', מספר תיק: 'YC-69842003-2025', inspection_date: '2025-07-23T18:11:20.330+02:00', manufacturer: 'טויוטה', model: 'C-HR', …}
car-details-floating.js:970 🔍 Full vehicle object: {plate: '221-84-003', manufacturer: 'טויוטה', model: 'C-HR', model_code: '413765', model_type: 'פנאי-שטח', …}
car-details-floating.js:971 🔍 Full meta object: {plate: '221-84-003', case_id: 'YC-221-84-003-2025', original_plate: '', plate_locked: false, plate_protection_source: '', …}
car-details-floating.js:972 🔍 Full valuationData object: {}
car-details-floating.js:995 🚗 Model Code final value: ZYX20L
car-details-floating.js:1005 📊 Levi Code final value: -
car-details-floating.js:1110 ✅ Populated 61 out of 64 fields
estimate-builder.html:1296 🔄 toggleSection called with: grossCalc
estimate-builder.html:1302 Section grossCalc is now visible
estimate-builder.html:1296 🔄 toggleSection called with: grossCalc
estimate-builder.html:1302 Section grossCalc is now hidden
