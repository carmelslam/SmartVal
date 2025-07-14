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


**car validation errors**
error 1 from the builder car deatils :
estimate-builder.html:1743 Error updating helper from field: TypeError: Cannot read properties of undefined (reading 'target')
    at updateHelperFromField (estimate-builder.html:1678:31)
    at HTMLInputElement.<anonymous> (estimate-builder.html:1628:13)
updateHelperFromField	@	estimate-builder.html:1743
Explanation

Understanding the problem
This error message, TypeError: Cannot read properties of undefined (reading 'target'), indicates that your code is trying to access the target property of a variable that is currently undefined.

In this specific case, the error occurs within the updateHelperFromField function, which is likely being called from an event listener attached to an HTML input element. The traceback suggests that the event object (which should contain the target property representing the element that triggered the event) is not being properly passed or is undefined at the point where target is accessed.

Suggested fix
Ensure that the function updateHelperFromField is receiving an event object when it's called, and that this event object is valid and contains the target property. If this function is being called from an event listener, the event object should be automatically passed as an argument.

Verify the code in your event listener (around line 1628 of estimate-builder.html) to confirm that the event object is being correctly passed to updateHelperFromField.

For example, if your event listener looks something like this:

js

someElement.addEventListener('input', function() {
  updateHelperFromField(); // Missing event object
});
Use code snippets with caution

It should be updated to pass the event object:

js

someElement.addEventListener('input', function(event) { // 'event' is the event object
  updateHelperFromField(event); // Pass the event object
});
Use code snippets with caution

Also, check the signature of the updateHelperFromField function (around line 1678) to make sure it's expecting and accepting the event object as an argument.

js

function updateHelperFromField(event) { // Ensure it accepts the event object
  // ... code that uses event.target ...
}
Use code snippets with caution

Summary
The error "Cannot read properties of undefined (reading 'target')" arises when trying to access the target property on an undefined value, likely an event object that wasn't correctly passed to a function in an event listener. The fix involves ensuring the event object is passed to the function and that the function is set up to receive it.

**from the car validation section**
error 1 :
💥 Error Report: {message: 'Uncaught TypeError: Assignment to constant variable.', filename: 'https://yaron-cayouf-portal.netlify.app/estimate-validation.html', lineno: 1682, colno: 22, error: 'TypeError: Assignment to constant variable.\n    at…rtal.netlify.app/estimate-validation.html:2449:9)', …}
sendErrorReport @ environment-config.js:398
(anonymous) @ environment-config.js:379
Understanding the problem
The error message Uncaught TypeError: Assignment to constant variable. indicates that you are trying to reassign a value to a variable that was declared using const. Variables declared with const are read-only and cannot be reassigned after their initial declaration.

The code snippet you provided (sendErrorReport) is the function that reports the error, not the code that causes the error. The error itself is happening on line 1682, column 22 of your estimate-validation.html file. The sendErrorReport function is simply logging the fact that this error occurred.

How to verify
Open the estimate-validation.html file in your code editor.
Navigate to line 1682.
Examine the code on that line and the surrounding lines to identify a variable declared with const that is being assigned a new value.
Suggested fix
Locate the const variable on line 1682 of estimate-validation.html that is being reassigned. Change the declaration of this variable from const to let or var if you intend to reassign it later in the code. If you do not intend to reassign it, review your logic to avoid the reassignment.

For example, if your code on or around line 1682 looks like this:

js

const myValue = 10;
// ... some other code ...
myValue = 20; // This line will cause the error
Use code snippets with caution

You should change the declaration to:

js

let myValue = 10;
// ... some other code ...
myValue = 20; // This is now allowed
Use code snippets with caution

Summary
The Uncaught TypeError: Assignment to constant variable. error occurs when you attempt to reassign a variable declared with const. The error originates from line 1682 of estimate-validation.html. To fix this, change the variable declaration on that line from const to let or var if reassignment is necessary, or modify your code to avoid the reassignment.

error 2 : 


estimate-validation.html:1682 Uncaught TypeError: Assignment to constant variable.
    at window.startInlineEdit (estimate-validation.html:1682:22)
    at HTMLButtonElement.onclick (estimate-validation.html:2449:9)
window.startInlineEdit	@	estimate-validation.html:1682
onclick	@	estimate-validation.html:2449
Explanation

Understanding the problem
The error "Uncaught TypeError: Assignment to constant variable." occurs because you are trying to reassign a value to a variable declared with const. In JavaScript, variables declared with const are constants and their value cannot be changed after initialization.

In this case, the variable currentValue is declared as a const here:

js

const currentValue = currentElement.textContent.trim();
Use code snippets with caution

Then, you attempt to reassign its value here:

js

if (currentValue === 'לא זמין') {
  currentValue = '';
}
Use code snippets with caution

This attempt to change the value of currentValue after it has been declared as a constant leads to the TypeError.

Suggested fix
To fix this, declare the currentValue variable using let instead of const. The let keyword allows you to declare variables whose values can be reassigned.

js

let currentElement = document.getElementById(`current-${fieldKey}`);
      let currentValue = currentElement.textContent.trim();

      if (currentValue === 'לא זמין') {
        currentValue = '';
      }

      // Create inline edit input
      currentElement.innerHTML = `
        <input type="text" class="inline-edit-input" value="${currentValue}"
               onblur="saveInlineEdit('${fieldKey}', this.value)"
               onkeypress="if(event.key==='Enter') saveInlineEdit('${fieldKey}', this.value)"
               data-original="${currentValue}" />
      `;

      // Focus the input
      const input = currentElement.querySelector('.inline-edit-input');
      input.focus();

Use code snippets with caution

Summary
The "Uncaught TypeError: Assignment to constant variable." error happens when you try to assign a new value to a variable declared with const. To fix this, use let instead of const for variables whose values need to be changed.

Data used to understand this message
Use search instead
AI tools may generate inaccurate info that doesn't represent Google's views. The content you submit and that is generated by this feature will not be used to improve Google’s AI models. Open settings or learn more



**estimate builder page - update helper errors**
estimate-builder.html:1611 Uncaught ReferenceError: updateHelperField is not defined
    at updateCustomAdjustmentInHelper (estimate-builder.html:1611:9)
    at calculateAdjustmentValue (estimate-builder.html:1537:9)
    at estimate-builder.html:1314:17
    at Array.forEach (<anonymous>)
    at estimate-builder.html:1311:44
updateCustomAdjustmentInHelper	@	estimate-builder.html:1611
calculateAdjustmentValue	@	estimate-builder.html:1537
(anonymous)	@	estimate-builder.html:1314
(anonymous)	@	estimate-builder.html:1311
setTimeout		
loadAllAdjustments	@	estimate-builder.html:1305
addCustomAdjustmentField	@	estimate-builder.html:1405
onclick	@	VM2869 estimate-builder.html:1
Explanation

Understanding the problem
The error Uncaught ReferenceError: updateHelperField is not defined means that the JavaScript function updateHelperField was called, but the browser couldn't find a function with that name in the current scope or anywhere accessible in the global scope. This typically happens when a function is called before it has been declared, or if the function is defined within a different script file that hasn't been loaded yet, or within a scope that is not accessible from where it is being called.

Suggested fix
Ensure that the updateHelperField function is defined and accessible in the scope where it is being called.

Here are a few common scenarios and their solutions:

Function defined later in the same file: Move the definition of updateHelperField to a point before it is called.
Function defined in a different script file: Make sure the script containing the updateHelperField function is loaded before the script that calls it. You can control the loading order by adjusting the order of <script> tags in your HTML.
Function defined within a different scope (e.g., inside another function or module): Ensure that updateHelperField is either defined in a global scope, or properly imported/exposed to the scope where it is being called.
Without seeing the definition of updateHelperField, I cannot provide specific code to fix it. However, you need to locate where updateHelperField is supposed to be defined and ensure it's available at the point of the call.

Summary
The error indicates that the function updateHelperField was called but not found. The fix involves ensuring the function is defined and accessible before it is called.

error 2 :

estimate-builder.html:1496 Uncaught ReferenceError: calculateSummaryTotals is not defined
    at HTMLInputElement.<anonymous> (estimate-builder.html:1496:11)
(anonymous)	@	estimate-builder.html:1496
Explanation

Understanding the problem
This error indicates that the function calculateSummaryTotals was called but could not be found within the current scope. This means the JavaScript engine doesn't know where to find the definition of calculateSummaryTotals when the 'change' event listener is triggered.

Suggested fix
Ensure that the calculateSummaryTotals function is defined and accessible in the scope where the event listener is being executed. This could involve:

Defining the function in the same script block as the event listener.
Ensuring the script defining calculateSummaryTotals is loaded before the script containing this event listener.
js

// Change event for final updates
        element.addEventListener('change', function() {
          // Trigger calculation update on change
          // Make sure calculateSummaryTotals is defined in a scope accessible here
          calculateSummaryTotals();

          // If adjustment type changed, reload to update display
          if (this.dataset.field === 'adjustmentType') {
            const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
            setTimeout(() => loadAllAdjustments(helper), 50);
          }
        });

        // Define calculateSummaryTotals if not already defined and accessible
        function calculateSummaryTotals() {
          // Your calculation logic here
          console.log("Calculating summary totals...");
        }

        // For percentage fields, trigger auto-calculation on focus out

Use code snippets with caution

Summary
The Uncaught ReferenceError means a function was called but not found. Define the calculateSummaryTotals function or ensure its definition is loaded before the code that calls it.

error 3 
estimate-builder.html:1611 Uncaught ReferenceError: updateHelperField is not defined
    at updateCustomAdjustmentInHelper (estimate-builder.html:1611:9)
    at HTMLInputElement.<anonymous> (estimate-builder.html:1484:11)
updateCustomAdjustmentInHelper	@	estimate-builder.html:1611
(anonymous)	@	estimate-builder.html:1484
Explanation

Understanding the problem
The error Uncaught ReferenceError: updateHelperField is not defined indicates that the JavaScript function updateHelperField was called, but the browser could not find its definition in the current scope. This usually means the function was not declared or is not accessible from where it is being called.

Suggested fix
Ensure that the updateHelperField function is defined within the same script, or included before the script where updateCustomAdjustmentInHelper is defined.

js

// Make sure updateHelperField is defined before it's called
function updateHelperField(fieldName, value) {
  // Function definition for updateHelperField goes here
  // For example:
  console.log(`Updating field ${fieldName} with value: ${value}`);
  // Add actual logic to update the field
}

function updateCustomAdjustmentInHelper(index, adjustment, field) {
    // Make sure 'index', 'adjustment', and 'field' are properly defined and passed
    updateHelperField(`levi.custom_adjustments.${index}.${field}`, adjustment[field]);
}

// Rest of your code...

Use code snippets with caution

Alternatively, if updateHelperField is defined in another script file, make sure that script file is loaded before the script containing updateCustomAdjustmentInHelper in your HTML file.

html

<script src="path/to/script/with/updateHelperField.js"></script>
<script src="path/to/script/with/updateCustomAdjustmentInHelper.js"></script>
Use code snippets with caution

Summary
The error "Uncaught ReferenceError: updateHelperField is not defined" means the updateHelperField function was called but not found. Define the function or ensure the script defining it is loaded before it's used.

**new console error for estimate builder**
estimate-builder.html:2481 Uncaught ReferenceError: loadLeviAdjustments is not defined
    at estimate-builder.html:2481:34
(anonymous)	@	estimate-builder.html:2481
Explanation

Understanding the problem
The error "Uncaught ReferenceError: loadLeviAdjustments is not defined" means that when the code at estimate-builder.html:2481:34 tried to access a function or variable named loadLeviAdjustments, it could not find it in the current scope or anywhere in the accessible global scope.

In your code, you are trying to assign loadLeviAdjustments to window.loadLeviAdjustments, effectively making it a global function. However, this operation fails because loadLeviAdjustments has not been defined anywhere before this line of code is executed.

How to verify
You can confirm this by opening the DevTools Console and typing loadLeviAdjustments. You will see the same "Uncaught ReferenceError: loadLeviAdjustments is not defined".

Suggested fix
Before the line where you try to assign loadLeviAdjustments to window.loadLeviAdjustments, you need to define the loadLeviAdjustments function. This could be done by declaring it using function loadLeviAdjustments() { ... } or as a variable holding a function expression, like const loadLeviAdjustments = () => { ... };.

js

// Define the loadLeviAdjustments function before making it global
function loadLeviAdjustments() {
    // Your function logic here
    console.log("loadLeviAdjustments is called!");
}

// Make functions global
window.loadDataFromHelper = loadDataFromHelper;
window.loadLegalText = loadLegalText;
window.loadLegalTextFromVault = loadLegalTextFromVault;
window.resetLegalText = resetLegalText;
window.addDepField = addDepField;
window.updateReportType = updateReportType;
window.addCustomSummaryField = addCustomSummaryField;
window.loadDamageCentersSummary = loadDamageCentersSummary;
window.loadLeviAdjustments = loadLeviAdjustments;
window.updateGlobalDepreciationCalculation = updateGlobalDepreciationCalculation;
window.calculateDamagePercentage = calculateDamagePercentage;
window.triggerGlobalDepreciationCalc = triggerGlobalDepreciationCalc;
window.showPartSuggestions = showPartSuggestions;
window.selectPartSuggestion = selectPartSuggestion;
window.openPartsSearchModule = openPartsSearchModule;
window.addPartRow = addPartRow;
window.addWorkRow = addWorkRow;
window.addRepairRow = addRepairRow;

Use code snippets with caution

Summary
The error "Uncaught ReferenceError: loadLeviAdjustments is not defined" occurs because you are attempting to use loadLeviAdjustments before it has been declared or defined. The fix is to ensure that loadLeviAdjustments is defined as a function before you assign it to window.loadLeviAdjustments.








