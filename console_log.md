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


**car-details-floating.js:334 Error loading car data: ReferenceError: client is not defined**
    at updateCarDisplay (car-details-floating.js:371:69)
    at loadCarData (car-details-floating.js:331:7)
    at window.toggleCarDetails (car-details-floating.js:224:7)
    at HTMLDivElement.onclick (upload-levi.html:2298:59)
loadCarData	@	car-details-floating.js:334
window.toggleCarDetails	@	car-details-floating.js:224
onclick	@	upload-levi.html:2298
Understanding the problem
The error message ReferenceError: client is not defined indicates that the variable client was used in the updateCarDisplay function without being declared or initialized first. This typically happens when a variable is accessed outside of its scope or before it has been assigned a value.

Suggested fix
Ensure that the client variable is declared and assigned a value within the scope where it is being used in the updateCarDisplay function, or passed into the function as an argument if it's defined elsewhere.

js

function updateCarDisplay(carData, client, locationData, otherData) {
  // ... rest of your code that uses 'client' ...
}

function loadCarData() {
  try {
    // ... your data fetching logic ...
    const client = "some value"; // Make sure client is defined and assigned a value
    updateCarDisplay(carData, client, locationData, otherData);
  } catch (error) {
    console.error("Error loading car data:", error);
    updateCarDisplay({}, undefined, {}, {}); // Pass undefined or a default value if client might not be available
  }
}

Use code snippets with caution

Summary
The ReferenceError: client is not defined error occurs when a variable is used before it has been declared or initialized. To fix this, ensure that the variable client is defined and has a value within the scope where it is being used.

error 2 : 
environment-config.js:398 💥 Error Report: 
{message: 'Uncaught ReferenceError: client is not defined', filename: 'https://yaron-cayouf-portal.netlify.app/car-details-floating.js', lineno: 371, colno: 69, error: 'ReferenceError: client is not defined\n    at updat…youf-portal.netlify.app/upload-levi.html:2298:59)', …}
sendErrorReport	@	environment-config.js:398
(anonymous)	@	environment-config.js:379
Understanding the problem
The error message Uncaught ReferenceError: client is not defined indicates that your code is trying to access a variable or object named client, but it hasn't been declared or initialized anywhere before being used. This happens at line 371, column 69 of the file car-details-floating.js.

The console output you provided is showing that an error report function (sendErrorReport) is being called due to this underlying ReferenceError. The sendErrorReport function itself is working as intended by logging the error, but the root cause is the undefined client variable.

How to verify
In the Chrome DevTools, go to the Sources tab.
Navigate to the file car-details-floating.js.
Go to line 371.
Examine the code at or around column 69 to see where client is being used. You will likely find a line of code attempting to access a property or call a method on client, like client.someMethod() or client.someProperty.
Suggested fix
You need to define or import the client variable before it's used at line 371 of car-details-floating.js. The exact fix depends on what client is supposed to represent. Here are a few possibilities:

If client is a library or SDK: Ensure the script tag for that library is included in your HTML before car-details-floating.js is loaded, or if you are using a module bundler, ensure the library is correctly imported at the top of car-details-floating.js.
If client is an object you created: Make sure the code that declares and initializes client runs before the line where the error occurs. This might mean moving the declaration to an earlier part of your script or ensuring a function that initializes it is called.
If client was a typo: Correct the variable name to the intended one.
Without seeing the code around line 371 of car-details-floating.js, a specific code fix cannot be provided. You will need to locate the usage of client in that file and ensure it's properly defined or imported.

Summary
The Uncaught ReferenceError: client is not defined error means the variable client is being used before it has been declared or initialized. To fix this, find where client is used in car-details-floating.js at line 371 and ensure it is properly defined or imported before that point in the execution of your script.

error 3 :
car-details-floating.js:371 Uncaught ReferenceError: client is not defined
    at updateCarDisplay (car-details-floating.js:371:69)
    at loadCarData (car-details-floating.js:335:7)
    at window.toggleCarDetails (car-details-floating.js:224:7)
    at HTMLDivElement.onclick (upload-levi.html:2298:59)
updateCarDisplay	@	car-details-floating.js:371
loadCarData	@	car-details-floating.js:335
window.toggleCarDetails	@	car-details-floating.js:224
onclick	@	upload-levi.html:2298
Understanding the problem
The error Uncaught ReferenceError: client is not defined means that the variable client was used in your code at line 371 of car-details-floating.js, but it had not been declared or assigned a value before that point. This happens because the JavaScript engine doesn't know what client refers to.

How to verify
You can verify this by setting a breakpoint on line 371 of car-details-floating.js in the Chrome DevTools Sources panel. When the debugger pauses at that line, hover over the variable client. DevTools will show that client is undefined.

Suggested fix
Based on the surrounding code and the comment // CORRECTED: Helper is source of truth - read from helper.client first, it seems like client should be a property of a variable named helper. The ReferenceError suggests that client was used directly instead of accessing it through helper.client.

Replace the lines where client is used with helper.client:

js

document.getElementById("garage-phone").textContent = formatValue(carDetails.garagePhone || vehicle.garage_phone);
    document.getElementById("insurance-company").textContent = formatValue(carDetails.insuranceCompany);
    // CORRECTED: Helper is source of truth - read from helper.client first
    document.getElementById("agent-name").textContent = formatValue(helper.client.insurance_agent || carDetails.agentName);
    document.getElementById("agent-phone").textContent = formatValue(helper.client.insurance_agent_phone || carDetails.insurance_agent_phone);

    // Update value styling
    document.querySelectorAll('.value').forEach(el => {
      if (el.textContent === "-") {
        el.classList.add('empty');
      } else {
        el.classList.remove('empty');
      }
    });

Use code snippets with caution

Summary
The error Uncaught ReferenceError: client is not defined occurred because the variable client was used without being declared or assigned a value. The fix is to access the client property from the helper object, which is likely where the client data is intended to be stored.


**Levi report upload console errors :**
security-manager.js:121 
 POST https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9 400 (Bad Request)
window.fetch	@	security-manager.js:121
window.fetch	@	error-handler.js:75
window.fetch	@	data-reception-debugger.js:301
processFileUpload	@	upload-levi.html:1394
processLevi	@	upload-levi.html:1366
(anonymous)	@	upload-levi.html:1007

Understanding the problem
The console message POST https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9 400 (Bad Request) indicates that a POST request was made to the specified URL, but the server responded with a 400 status code, which signifies a "Bad Request." This means the server could not process the request due to something being wrong with the request itself. This could be due to incorrect data format, missing required parameters, or invalid data.

The provided code return originalFetch(url, options); is part of a fetch wrapper function. This wrapper is likely adding some functionality (like logging or error handling) around the native fetch API. The error originates from the underlying fetch call being made to the Make.com hook URL.

Looking at the network request details, the Content-Type is multipart/form-data. This is commonly used for sending files or complex data structures. The 400 error from the Make.com endpoint suggests that the data being sent in the multipart/form-data body does not match the expected format or requirements of the Make.com webhook.

How to verify
Inspect the Request Payload: In DevTools, go to the "Network" tab, find the failed POST request to hook.eu2.make.com/..., and click on it. Go to the "Payload" tab to examine the exact data being sent in the request body.
Compare with Make.com Hook Expectations: Check the documentation or configuration of your Make.com webhook. Verify that the data being sent in the request payload (from step 1) matches the structure and expected data types that your Make.com scenario is configured to receive. Pay close attention to field names and whether they are expecting specific data types (e.g., string, number, file).
Suggested fix
The most likely cause is that the data being sent in the multipart/form-data request doesn't match what the Make.com hook is expecting. You need to ensure the data structure and types in your FormData object align with the Make.com webhook's requirements.

Here's a general approach to fix this:

Review Your FormData Creation: Examine the code where you are creating the FormData object that is used as the body for your fetch request.
Match Make.com Expectations: Add keys and values to the FormData object exactly as your Make.com webhook is configured to receive them. If you are sending a file, ensure you are appending the file correctly to the FormData.
Example (assuming you're sending a file and some other data):

js

const formData = new FormData();
formData.append('myFileName', file); // 'file' should be the File object
formData.append('anotherField', 'someValue'); // Add other necessary data

// Now use formData as the body in your fetch request options
fetch('https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9', {
  method: 'POST',
  body: formData // Use the formData object
  // Headers like Content-Type will be automatically set by fetch for FormData
});
Use code snippets with caution

Important: The key names ('myFileName', 'anotherField' in the example above) must exactly match what your Make.com webhook is configured to expect.

Summary
The 400 Bad Request error when POSTing to a Make.com webhook with multipart/form-data indicates that the data structure or content in the request body does not meet the webhook's requirements. The fix involves ensuring the FormData object created in your JavaScript code matches the expected inputs of your Make.com scenario.

error 2 :
upload-levi.html:1374 Levi processing error: Error: שגיאה בעיבוד דו"ח לוי יצחק
    at LeviProcessor.processFileUpload (upload-levi.html:1403:13)
    at async LeviProcessor.processLevi (upload-levi.html:1366:18)
processLevi	@	upload-levi.html:1374
await in processLevi		
(anonymous)	@	upload-levi.html:1007
Understanding the problem
The console message "Levi processing error: Error: שגיאה בעיבוד דו"ח לוי יצחק" indicates that an error occurred during the processing of a report named "Levi Yitzchak" (translated from Hebrew: "דו"ח לוי יצחק"). This error happened within the LeviProcessor.processFileUpload function, which was called by the LeviProcessor.processLevi function. The traceback shows the error originated from line 1403 of upload-levi.html.

Suggested fix
This error is application-specific and likely related to the content or format of the report being processed. To fix this, you'll need to:

Examine the report file: Check the "Levi Yitzchak" report file that was being processed. Look for any unusual characters, incorrect data formats, or missing information that might be causing the processing error.
Debug the LeviProcessor.processFileUpload function: Set a breakpoint in DevTools at line 1403 of upload-levi.html. Step through the code to understand what data is being processed and why the error is being thrown. The error message itself ("שגיאה בעיבוד דו"ח לוי יצחק") suggests a general processing failure, so you'll need to inspect the variables and execution flow within the function to pinpoint the exact issue.
Summary
The error "Levi processing error: Error: שגיאה בעיבוד דו"ח לוי יצחק" means that a specific report processing function failed. The fix involves inspecting the input file and debugging the code that handles its processing.


**genral info page errors :**
onesignal-integration.js:1164 📱 OneSignal Integration: System-wide integration loaded
math.js:210 ✅ math.js loaded with comprehensive calculation engine and VAT: 18%
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:486:26
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:486
helper.js:2103 ❌ Error marking field as manually modified: ReferenceError: updateHelperField is not defined
    at Module.markFieldAsManuallyModified (helper.js:2088:5)
    at general_info.html:503:24
markFieldAsManuallyModified @ helper.js:2103
(anonymous) @ general_info.html:503
