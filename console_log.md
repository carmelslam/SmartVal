report selection page issues :

uplaod button errors : 

Understanding the problem
The error message "Failed to request expertise report: undefined" indicates that the response variable in your console.error statement is undefined. This happens because the sendToWebhook function likely threw an error or did not return a value when an error occurred during the webhook call.

Suggested fix
Modify the catch block to handle potential errors during the webhook call and provide a more informative error message in the console.

js

const response = await sendToWebhook('CALL_EXPERTISE', payload);

        if (response?.success) {
          alert('חוות הדעת נשלחה בהצלחה! בדוק את האימייל שלך לקבלת הקובץ.');
          console.log('✅ Expertise report requested successfully');
        } else {
          alert('שגיאה בשליחת בקשה לחוות דעת. אנא נסה שוב.');
          // Log the entire response object if it exists, otherwise log the error
          console.error('❌ Failed to request expertise report:', response || 'Error during webhook call');
        }

Use code snippets with caution

Summary
The error "Failed to request expertise report: undefined" means the response from sendToWebhook was undefined. The fix involves ensuring the catch block logs a meaningful message, potentially including the actual error, when the webhook call fails.
 