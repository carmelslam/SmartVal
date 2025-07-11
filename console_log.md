CALL BUTTONS FROM REPORT SELECTION PAGE :
webhook.js:130 ❌ Webhook CALL_ESTIMATE failed: SyntaxError: Unexpected token 'A', "Accepted" is not valid JSON
sendToWebhook	@	webhook.js:130
await in sendToWebhook		
window.requestEstimateReport	@	report-selection.html:1020
onclick	@	report-selection.html:347
Explanation

Understanding the problem
The error message "Webhook CALL_ESTIMATE failed: SyntaxError: Unexpected token 'A', 'Accepted' is not valid JSON" indicates that the code attempted to parse the string "Accepted" as JSON, but it failed because "Accepted" is not valid JSON. JSON requires data to be in key-value pairs, arrays, or basic data types like strings, numbers, booleans, or null, enclosed in curly braces {} or square brackets [] for objects or arrays respectively. A bare string like "Accepted" is not a valid JSON document.

The sendToWebhook function likely received a response from a webhook that was expected to be JSON, but instead received the plain string "Accepted". When it tried to parse this string using JSON.parse() or similar, the parsing failed, resulting in the SyntaxError.

Suggested fix
Ensure that the webhook endpoint you are communicating with returns a response that is valid JSON. If the webhook's successful response is truly meant to be "Accepted", you should handle this in your code by checking the response content directly without attempting to parse it as JSON. If the webhook is supposed to return structured data, investigate the webhook's implementation to ensure it's sending back a correctly formatted JSON response.

If the webhook is sending valid JSON, the issue might be with how your code is receiving or handling the response data before parsing.

Here's an example of how you might handle a non-JSON response like "Accepted":

js

console.error(`❌ Webhook ${id} failed:`, e);

    let errorMessage = 'Unknown error occurred';

    // Check if the response is the expected non-JSON success message
    if (e instanceof SyntaxError && e.message.includes('"Accepted" is not valid JSON')) {
        // Handle the "Accepted" response as a successful outcome
        console.log(`✅ Webhook ${id} succeeded with "Accepted" response.`);
        // You might want to return or handle this success differently
        // based on your application logic.
        return { success: true, message: "Estimate call accepted" };
    } else {
        // Always return a proper response object instead of throwing
        // For other errors, use the error message
        errorMessage = e.message || errorMessage;
    }

    return { success: false, message: errorMessage }; // Return an error object for actual errors

Use code snippets with caution

Alternatively, if the webhook is supposed to return JSON, fix the webhook's response to be valid JSON, for example:

json

{
  "status": "Accepted"
}
Use code snippets with caution

And then parse it in your code.

Summary
The SyntaxError: Unexpected token 'A', "Accepted" is not valid JSON occurs because your code attempted to parse the non-JSON string "Accepted" as if it were JSON. To fix this, ensure the webhook returns valid JSON, or modify your code to handle non-JSON responses correctly.

error 2 :

❌ Failed to request estimate report: {success: false, error: 'Invalid response format from server', webhook_id: 'CALL_ESTIMATE', timestamp: '2025-07-11T11:26:12.011Z'}
window.requestEstimateReport @ report-selection.html:1045
await in window.requestEstimateReport
onclick @ report-selection.html:347Understand this error

Understanding the problem
This message indicates that a request to a server endpoint (CALL_ESTIMATE) failed because the response received from the server was not in the expected format. The success: false and error: 'Invalid response format from server' fields in the logged object confirm this. The webhook_id suggests this might be related to a webhook or API call.

Suggested fix
The problem lies on the server-side, which is sending a response in an unexpected format. To fix this, you will need to investigate the server code that handles the CALL_ESTIMATE request and ensure it is returning data in the format expected by the client-side code that made the request. This might involve checking the data structure, content type, or any potential errors occurring on the server.

Summary
The "Failed to request estimate report: Invalid response format from server" error means the server sent data that the client couldn't understand. The fix requires debugging the server-side code to ensure it returns the correct data format.

error 3 :
webhook.js:130 ❌ Webhook CALL_EXPERTISE failed: SyntaxError: Unexpected token 'A', "Accepted" is not valid JSON
sendToWebhook	@	webhook.js:130
await in sendToWebhook		
window.reloadExpertiseReport	@	report-selection.html:939
onclick	@	report-selection.html:344

Understanding the problem
The error message indicates that a webhook call failed because the response received from the webhook endpoint was not valid JSON. Specifically, it encountered the text "Accepted" at the beginning of the response, which is not a valid starting character for a JSON object or array.

Suggested fix
The webhook endpoint needs to return a response that is properly formatted as JSON. This might involve:

Checking the server-side code for the webhook: Ensure that the code handling the webhook request on the server is setting the Content-Type header to application/json and that the response body is a valid JSON string.
Removing any extraneous output before the JSON: Sometimes, server-side scripts might output plain text or HTML before the actual JSON data, causing this error. Make sure only the JSON is being returned.
For example, if your server-side code is in PHP, ensure you are encoding your data with json_encode and setting the header:

Code

php
<?php
header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Data processed']);
?>

Use code snippets with caution

Summary
The "Unexpected token 'A', 'Accepted' is not valid JSON" error means the webhook received a response that was not in the expected JSON format. The fix involves ensuring the webhook endpoint returns a valid JSON response.

error 4 
Failed to request expertise report: {success: false, error: 'Invalid response format from server', webhook_id: 'CALL_EXPERTISE', timestamp: '2025-07-11T11:30:59.416Z'}
window.reloadExpertiseReport @ report-selection.html:964
await in window.reloadExpertiseReport
onclick @ report-selection.html:344Understand this error
Understanding the problem
The console message indicates that a request for an "expertise report" failed because the server returned data in an unexpected format. Your code is logging this error message, including the server's response which shows success: false and an error: 'Invalid response format from server'.

Suggested fix
This issue lies with the server's response, not your front-end code. The server needs to be updated to return data in the format that the front-end is expecting.

You should communicate with the backend developers to:

Understand the expected response format for the "expertise report" request.
Identify why the server is currently returning an "Invalid response format". This might involve checking the server-side code for errors in data processing or serialization.
Implement the necessary changes on the server to return the correct data format.
Summary
The "Failed to request expertise report: Invalid response format from server" error signifies a problem with the data format returned by the server, not an issue with your client-side JavaScript. The fix requires changes to the server-side code to ensure it sends data in the expected format.

