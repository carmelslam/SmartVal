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


**auto calcultion in the תוספות מאפיינים and עליה לכביש and התאמות אומדן (הצג/הסתר):**

error 1:
estimate-builder.html:3402 Error updating helper from adjustments: TypeError: Assignment to constant variable.
    at updateHelperFromAdjustments (estimate-builder.html:3235:22)
    at HTMLSelectElement.onchange (estimate-builder.html:1:38)
updateHelperFromAdjustments	@	estimate-builder.html:3402
onchange	@	estimate-builder.html:1
Explanation

Understanding the problem
This error message, TypeError: Assignment to constant variable., indicates that you are attempting to reassign a value to a variable that was declared using const. Variables declared with const are read-only and cannot be reassigned after their initial declaration.

Suggested fix
Identify the variable within the updateHelperFromAdjustments function that is causing this error. If the variable needs to be reassigned, change its declaration from const to let.

js

// Change const to let for variables that need to be reassigned.
let myVariable = 'initial value';
myVariable = 'new value'; // This is now allowed
Use code snippets with caution

Summary
You cannot reassign a value to a variable declared with const. Use let instead if the variable's value will change.

error 2: estimate-builder.html:4013 Uncaught TypeError: Cannot set properties of undefined (setting 'value')
    at calculateEstimateAdjustmentValue (estimate-builder.html:4013:26)
    at HTMLInputElement.onchange (estimate-builder.html:1:1)
calculateEstimateAdjustmentValue	@	estimate-builder.html:4013
onchange	@	estimate-builder.html:1
Explanation

Understanding the problem
The error "Uncaught TypeError: Cannot set properties of undefined (setting 'value')" indicates that you are trying to access or set the value property of a variable that is currently undefined.

In this specific case, the line valueInput.value = ... is causing the error. This means that the variable valueInput is undefined when this line of code is executed.

Looking at the code, valueInput is assigned the value inputs[2]. This suggests that the array inputs, which is populated by row.querySelectorAll('input'), does not have an element at index 2 (the third element). This typically happens if the row element does not contain at least three <input> elements.

How to verify
You can verify this by inspecting the inputs variable within the if block using the DevTools debugger. Set a breakpoint on the line valueInput.value = .... When the code execution pauses, hover over or inspect the inputs variable in the Scope panel to see its contents and length. If the length is less than 3, this confirms the issue. You can also inspect the row element to understand its structure and the inputs it contains.

Suggested fix
Ensure that the row element always contains at least three <input> elements when this function is called and the if condition is met. If the structure of your HTML is dynamic, you might need to add checks to ensure inputs[2] exists before attempting to access its value property.

js

const basicPrice = parseFloat(basicPriceInput.value.replace(/[₪,]/g, '')) || 0;
      const percentage = parseFloat(percentageInput.value) || 0;

      if (percentage && basicPrice) {
        const calculatedValue = basicPrice * percentage / 100;
        const inputs = row.querySelectorAll('input');
        // Check if inputs[2] exists before accessing its value property
        if (inputs.length > 2) {
          const valueInput = inputs[2]; // value field is the third input
          valueInput.value = `₪${calculatedValue.toLocaleString()}`;
        } else {
          console.error("Could not find the third input element in the row.");
          // Handle the case where the third input is missing,
          // perhaps by logging an error or updating a different element.
        }
      }

Use code snippets with caution

Summary
The error "Cannot set properties of undefined (setting 'value')" occurred because you attempted to set the value property on an undefined variable valueInput. This was caused by row.querySelectorAll('input') returning an array with fewer than three elements, meaning inputs[2] was undefined. The suggested fix adds a check to ensure the third input element exists before trying to access its value property.

error 3:

estimate-builder.html:3402 Error updating helper from adjustments: TypeError: Assignment to constant variable.
    at updateHelperFromAdjustments (estimate-builder.html:3235:22)
    at updateEstimateAdjustments (estimate-builder.html:4043:7)
    at HTMLInputElement.onchange (estimate-builder.html:1:41)
updateHelperFromAdjustments	@	estimate-builder.html:3402
updateEstimateAdjustments	@	estimate-builder.html:4043
onchange	@	estimate-builder.html:1
Explanation

Understanding the problem
This error message, TypeError: Assignment to constant variable., indicates that you are attempting to reassign a value to a variable that was declared using const. Variables declared with const are read-only and cannot be reassigned after their initial declaration.

The console message shows the error occurring within the updateHelperFromAdjustments function, specifically at line 3235. The traceback also shows that this function was called by updateEstimateAdjustments, which was triggered by an onchange event on an HTMLInputElement.

How to verify
To verify this, examine the code within the updateHelperFromAdjustments function (around line 3235 of estimate-builder.html). Look for any variable declared with const that is later being assigned a new value.

Suggested fix
Identify the variable declared with const that is causing the issue. If you intend to modify the variable's value, change its declaration from const to let.

For example, if your code looks like this:

js

const myValue = 10;
// ... some code ...
myValue = newValue; // This will cause the error
Use code snippets with caution

Change it to:

js

let myValue = 10;
// ... some code ...
myValue = newValue; // This is allowed
Use code snippets with caution

Summary
The error "Assignment to constant variable" occurs when you try to reassign a value to a variable declared with const. To fix this, change the variable declaration from const to let if you need to modify its value.

new errors : estimate-builder.html:3401 Uncaught SyntaxError: Identifier 'registrationRows' has already been declared (at estimate-builder.html:3401:15)
xplanation

Understanding the problem
This error indicates that you are trying to declare a variable named registrationRows using let or const within a scope where registrationRows has already been declared. This is not allowed in JavaScript.

Suggested fix
Review the code around line 3401 in estimate-builder.html and the surrounding scope (e.g., the current function or the global scope) to identify where registrationRows is being declared multiple times.

If you intended to reassign a value to the existing variable, use registrationRows = ... instead of let registrationRows = ... or const registrationRows = ....
If you intended to declare a new variable with a similar name but in a different scope, consider using a different variable name or ensuring the variable is declared within a block scope (e.g., inside an if statement or loop) to avoid conflicts.
Summary
The error "Identifier 'registrationRows' has already been declared" occurs when you attempt to declare a variable with the same name using let or const in the same scope more than once. To fix this, either reassign the variable's value instead of redeclaring it or use a different variable name if a new variable is intended.

error 2 : 
estimate-builder.html:793 Uncaught ReferenceError: toggleSection is not defined
    at HTMLButtonElement.onclick (estimate-builder.html:793:90)
onclick	@	estimate-builder.html:793
Explanation

Understanding the problem
This error indicates that the JavaScript function toggleSection was called, but it could not be found in the current scope. This usually happens because the function is not defined within a <script> tag or linked script file that is accessible to the HTML element that is trying to call it.

Suggested fix
Define the toggleSection function in a script that is loaded before or within the HTML page. Ensure the function is globally accessible or defined within a scope that the onclick handler can reach.

Here's an example of how you might define the toggleSection function:

html

<script>
  function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    } else {
      console.error(`Section with ID '${sectionId}' not found.`);
    }
  }
</script>

<button class="collapsible-btn" type="button" onclick="toggleSection('grossCalc')">חישוב אחוז הנזק (הצג/הסתר)</button>

Use code snippets with caution

Alternatively, instead of using inline onclick, you can add an event listener using JavaScript:

html

<button class="collapsible-btn" type="button" data-section-id="grossCalc">חישוב אחוז הנזק (הצג/הסתר)</button>

<script>
  function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    } else {
      console.error(`Section with ID '${sectionId}' not found.`);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.collapsible-btn');
    if (button) {
      button.addEventListener('click', () => {
        const sectionId = button.getAttribute('data-section-id');
        if (sectionId) {
          toggleSection(sectionId);
        }
      });
    }
  });
</script>

Use code snippets with caution

This second approach separates HTML structure from JavaScript behavior and is generally considered a better practice.

Summary
The Uncaught ReferenceError: toggleSection is not defined error means the toggleSection JavaScript function could not be found when the button's onclick event fired. To fix this, ensure the toggleSection function is defined and accessible within the scope where it's being called.

**duplicated field error**
full console L
estimate-builder.html:6172 🎯 3-bulk system functions loaded and ready
internal-browser.js:215 An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing.
(anonymous) @ internal-browser.js:215
(anonymous) @ internal-browser.js:824
estimate-builder.html:4734 🚀 Initializing EstimateCalculations object first
estimate-builder.html:5947 🚀 Initializing 3-bulk system...
estimate-builder.html:1360 💰 Loaded claims data: {from_claims_data: {…}, from_calculations: {…}}
estimate-builder.html:4608 🔍 Updating gross market value field: {vehicleValueGross: 20400, helperCalculations: {…}}
estimate-builder.html:4635 📊 Updated leviPriceList field with gross market value: 20400
estimate-builder.html:4643 ✅ Updated helper with vehicle_value_gross: 20400
estimate-builder.html:1888 🔄 loadAllAdjustments called (will be debounced) from: at loadDataFromHelper (https://yaron-cayouf-portal.netlify.app/estimate-builder.html:1421:9)
estimate-builder.html:5681 📥 Loading helper data: {vehicle: {…}, case_info: {…}, stakeholders: {…}, damage_assessment: {…}, valuation: {…}, …}
estimate-builder.html:5700 📄 Found BASE PRICE in helper.car_details.base_price: 20000
estimate-builder.html:5708 ✅ Auto-filled basic price field: 20000
estimate-builder.html:5807 ✅ Damage centers loaded from helper: 1
estimate-builder.html:5779 ✅ Helper data loaded successfully
estimate-builder.html:5817 🔗 Adding field change listeners...
estimate-builder.html:5938 ✅ Field change listeners added successfully
estimate-builder.html:5144 📝 Added event listeners to: damage-center-name
estimate-builder.html:5144 📝 Added event listeners to: part-name
estimate-builder.html:5144 📝 Added event listeners to: part-desc
estimate-builder.html:5144 📝 Added event listeners to: part-price
estimate-builder.html:5144 📝 Added event listeners to: work-type
estimate-builder.html:5144 📝 Added event listeners to: work-note
estimate-builder.html:5144 📝 Added event listeners to: work-cost
estimate-builder.html:5144 📝 Added event listeners to: repair-text
estimate-builder.html:5144 📝 Added event listeners to: repair-cost
estimate-builder.html:1908 🔄 Loading all adjustments (immediate)
estimate-builder.html:1913 DOM element allAdjustmentsRows-estimate not found, skipping adjustments load
loadAllAdjustmentsImmediate @ estimate-builder.html:1913
(anonymous) @ estimate-builder.html:1898
setTimeout
loadAllAdjustments @ estimate-builder.html:1897
loadDataFromHelper @ estimate-builder.html:1421
(anonymous) @ estimate-builder.html:4738
setTimeout
(anonymous) @ estimate-builder.html:4737
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 0, totalClaim: 2950}
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 0 = 20000
estimate-builder.html:5204 💼 Work costs updated: ₪400
estimate-builder.html:5208 🔧 Parts costs updated: ₪1,300
estimate-builder.html:5212 🔨 Repairs costs updated (ONLY repairs): ₪800
estimate-builder.html:5216 💰 Total with VAT updated: ₪2,950
estimate-builder.html:5292 💰 Updated total claim with VAT: 2,500 → 2,950
estimate-builder.html:5292 💰 Updated total claim with VAT: 2,500 → 2,950
estimate-builder.html:3799 🔧 Loading basic price from helper: 20000
estimate-builder.html:3820 🔧 Loading features adjustments from Levi: [{…}]
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 0 = 20000
estimate-builder.html:3855 🔧 Loading registration adjustments from Levi: [{…}]
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 800 = 20800
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 400 = 20400
estimate-builder.html:5204 💼 Work costs updated: ₪400
estimate-builder.html:5208 🔧 Parts costs updated: ₪1,300
estimate-builder.html:5212 🔨 Repairs costs updated (ONLY repairs): ₪800
estimate-builder.html:5216 💰 Total with VAT updated: ₪2,950
estimate-builder.html:5292 💰 Updated total claim with VAT: 2,500 → 2,950
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4745 🚀 Initializing adjustment system on page load
estimate-builder.html:2216 🔗 Adding event listeners to 0 adjustment inputs
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:3799 🔧 Loading basic price from helper: 20000
estimate-builder.html:3820 🔧 Loading features adjustments from Levi: [{…}]
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 0 = 20000
estimate-builder.html:3855 🔧 Loading registration adjustments from Levi: [{…}]
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 800 = 20800
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 400 = 20400
estimate-builder.html:5961 ✅ Bulk 1 & 2 initialized
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 400 = 20400
estimate-builder.html:4218 🔄 Loading full market value data...
estimate-builder.html:4219 📊 Helper levi_report adjustments: (2) [{…}, {…}]
estimate-builder.html:4220 📊 Helper custom full_market_adjustments: (3) [{…}, {…}, {…}]
estimate-builder.html:4242 🧹 Cleared allAdjustmentsList container, children count: 0
estimate-builder.html:4249 🔄 Setting loading flag on container
estimate-builder.html:4271 ✅ Added Levi adjustment: sunroof 4 plus
estimate-builder.html:4271 ✅ Added Levi adjustment: 04/2020 2 minus
estimate-builder.html:4290 ✅ Added custom adjustment: 04/2020 2 minus
estimate-builder.html:4295 📊 Total unique adjustments to load: 3
estimate-builder.html:4299 📝 Loading adjustment 1/3: {description: 'sunroof', percentage: 4, value: 800, type: 'plus', source: 'levi'}
estimate-builder.html:4200 💰 Full Market Value: 20000 + 0 = 20000
estimate-builder.html:4308 ✅ Loaded row: sunroof - plus - 4% - ₪800
estimate-builder.html:4299 📝 Loading adjustment 2/3: {description: '04/2020', percentage: 2, value: -400, type: 'minus', source: 'levi'}
estimate-builder.html:4200 💰 Full Market Value: 20000 + 800 = 20800
estimate-builder.html:4308 ✅ Loaded row: 04/2020 - minus - 2% - ₪-400
estimate-builder.html:4299 📝 Loading adjustment 3/3: {description: '04/2020', percentage: 2, value: 400, type: 'minus', source: 'custom'}
estimate-builder.html:4200 💰 Full Market Value: 20000 + 400 = 20400
estimate-builder.html:4308 ✅ Loaded row: 04/2020 - minus - 2% - ₪400
estimate-builder.html:4200 💰 Full Market Value: 20000 + 0 = 20000
estimate-builder.html:4322 ✅ Full market value data loading completed
estimate-builder.html:5974 ✅ Bulk 3 initialized
estimate-builder.html:5975 ✅ Complete 3-bulk system initialized
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:4348 Cannot find value input field for full market adjustment calculation
calculateAdjustmentValue @ estimate-builder.html:4348
(anonymous) @ estimate-builder.html:3951
(anonymous) @ estimate-builder.html:3949
setTimeout
loadGrossCalculationData @ estimate-builder.html:3947
(anonymous) @ estimate-builder.html:5960
setTimeout
(anonymous) @ estimate-builder.html:5959
estimate-builder.html:4348 Cannot find value input field for full market adjustment calculation
calculateAdjustmentValue @ estimate-builder.html:4348
(anonymous) @ estimate-builder.html:3951
(anonymous) @ estimate-builder.html:3949
setTimeout
loadGrossCalculationData @ estimate-builder.html:3947
(anonymous) @ estimate-builder.html:5960
setTimeout
(anonymous) @ estimate-builder.html:5959
estimate-builder.html:3761 💰 Gross Market Value: 20000 + 400 = 20400
estimate-builder.html:4087 💰 Total claim from damage centers: 2950
estimate-builder.html:4011 🔍 Updating gross percentage from gross value: {grossMarketValue: 20400, totalClaim: 2950}
estimate-builder.html:4044 📊 Gross percentage updated: 2,950 ÷ 20,400 = 14.46%
estimate-builder.html:1060 🔄 toggleSection called with: fullMarketValue
estimate-builder.html:1066 Section fullMarketValue is now visible
estimate-builder.html:4200 💰 Full Market Value: 20000 + 0 = 20000
estimate-builder.html:4200 💰 Full Market Value: 20000 + 0 = 20000
estimate-builder.html:4355 🔄 calculateFullMarketAdjustmentValue called with: 1
estimate-builder.html:4371 📊 Using fullBasicPrice: 20000
estimate-builder.html:4398 💰 Calculation: {marketValue: 20000, percent: 1, calculatedValue: 200}
estimate-builder.html:4402 📝 Found inputs: 3
estimate-builder.html:4408 ✅ Set value input to: ₪200
estimate-builder.html:4200 💰 Full Market Value: 20000 + 200 = 20200
estimate-builder.html:4200 💰 Full Market Value: 20000 + 200 = 20200
estimate-builder.html:3093 Global depreciation calculation: {percent: 1, marketValue: 20200, calculation: 202}
estimate-builder.html:2742 📝 Field change detected: garageDays = "5"
estimate-builder.html:2550 🔄 Triggering floating screen refresh after helper update
estimate-builder.html:2602 Debug: Available refresh functions: {refreshLeviData: 'function', refreshCarData: 'function', refreshInvoiceData: 'undefined', refreshPartsResults: 'undefined'}
estimate-builder.html:2611 🔄 Refreshing Levi floating screen
levi-floating.js:360 🔄 Levi floating screen: refreshLeviData called
levi-floating.js:364 🔍 DEBUG: Helper structures in Levi floating screen: {vehicle: {…}, carDetails: {…}, leviReport: {…}, meta: {…}}
levi-floating.js:372 🔍 DEBUG: Hebrew adjustment keys in leviReport: {עליה לכביש: '', בעלות: '', מס ק״מ: '', מספר בעלים: '', מאפיינים: '4%'}
levi-floating.js:455 🔄 updateLeviDisplay called with: {vehicle: {…}, carDetails: {…}, leviReport: {…}, meta: {…}}
estimate-builder.html:2617 🔄 Refreshing Car Details floating screen
car-details-floating.js:236 🔄 Car Details floating screen: refreshCarData called
car-details-floating.js:240 🔍 DEBUG: Helper in Car Details floating screen: {vehicle: {…}, case_info: {…}, stakeholders: {…}, damage_assessment: {…}, valuation: {…}, …}
car-details-floating.js:241 🔍 DEBUG: Helper.car_details: {plate: '5785269', manufacturer: 'Buick', year: '2009', base_price: '20000', model: 'CXL', …}
car-details-floating.js:242 🔍 DEBUG: Helper.vehicle: {plate: '', manufacturer: 'Buick', model: 'CXL', model_code: '7456', model_type: '', …}
car-details-floating.js:243 🔍 DEBUG: Helper.meta: {plate: '5785269'}
car-details-floating.js:318 🔄 updateCarDisplay called with: {vehicle: {…}, carDetails: {…}, client: {…}, meta: {…}}
car-details-floating.js:323 🔍 DEBUG: Agent data (helper.client is source of truth): {PRIMARY - client.insurance_agent: 'משה כהן', PRIMARY - client.insurance_agent_phone: '0999999', SECONDARY - carDetails.agentName: 'משה כהן', SECONDARY - carDetails.insurance_agent_phone: '0999999'}
estimate-builder.html:2664 ✅ Helper updated with 3-bulk calculations: {grossMarketValue: 20400, fullMarketValue: 20200, totalClaim: 2950, grossPercentage: 14.46}
estimate-builder.html:2742 📝 Field change detected: garageDays = "5"
estimate-builder.html:2550 🔄 Triggering floating screen refresh after helper update
estimate-builder.html:2602 Debug: Available refresh functions: {refreshLeviData: 'function', refreshCarData: 'function', refreshInvoiceData: 'undefined', refreshPartsResults: 'undefined'}
estimate-builder.html:2611 🔄 Refreshing Levi floating screen
levi-floating.js:360 🔄 Levi floating screen: refreshLeviData called
levi-floating.js:364 🔍 DEBUG: Helper structures in Levi floating screen: {vehicle: {…}, carDetails: {…}, leviReport: {…}, meta: {…}}
levi-floating.js:372 🔍 DEBUG: Hebrew adjustment keys in leviReport: {עליה לכביש: '', בעלות: '', מס ק״מ: '', מספר בעלים: '', מאפיינים: '4%'}
levi-floating.js:455 🔄 updateLeviDisplay called with: {vehicle: {…}, carDetails: {…}, leviReport: {…}, meta: {…}}
estimate-builder.html:2617 🔄 Refreshing Car Details floating screen
car-details-floating.js:236 🔄 Car Details floating screen: refreshCarData called
car-details-floating.js:240 🔍 DEBUG: Helper in Car Details floating screen: {vehicle: {…}, case_info: {…}, stakeholders: {…}, damage_assessment: {…}, valuation: {…}, …}
car-details-floating.js:241 🔍 DEBUG: Helper.car_details: {plate: '5785269', manufacturer: 'Buick', year: '2009', base_price: '20000', model: 'CXL', …}
car-details-floating.js:242 🔍 DEBUG: Helper.vehicle: {plate: '', manufacturer: 'Buick', model: 'CXL', model_code: '7456', model_type: '', …}
car-details-floating.js:243 🔍 DEBUG: Helper.meta: {plate: '5785269'}
car-details-floating.js:318 🔄 updateCarDisplay called with: {vehicle: {…}, carDetails: {…}, client: {…}, meta: {…}}
car-details-floating.js:323 🔍 DEBUG: Agent data (helper.client is source of truth): {PRIMARY - client.insurance_agent: 'משה כהן', PRIMARY - client.insurance_agent_phone: '0999999', SECONDARY - carDetails.agentName: 'משה כהן', SECONDARY - carDetails.insurance_agent_phone: '0999999'}
estimate-builder.html:2664 ✅ Helper updated with 3-bulk calculations: {grossMarketValue: 20400, fullMarketValue: 20200, totalClaim: 2950, grossPercentage: 14.46}
