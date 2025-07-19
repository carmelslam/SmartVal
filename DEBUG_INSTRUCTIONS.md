# Debug Instructions for Helper Data Flow

## Hidden Debug Logging Added

I've added hidden debug logging throughout the helper system to trace why data isn't being captured or displayed. Here's how to use it:

### 1. Test Data Flow

Open the browser console and run:
```javascript
// Test the complete data flow
testDataFlow()

// This will:
// - Simulate opening a case
// - Simulate Make.com webhook response
// - Check helper processing
// - Verify field population
```

### 2. Simulate Make.com Response

To simulate Make.com sending car data:
```javascript
// Simulate webhook response for plate 5785269
simulateMakeWebhookResponse('5785269')

// Or use custom plate
simulateMakeWebhookResponse('1234567')
```

### 3. Check Current Helper State

```javascript
// View current helper data
JSON.parse(sessionStorage.getItem('helper'))

// Check specific sections
helper.vehicle
helper.meta
helper.stakeholders
```

### 4. Debug Output to Look For

The hidden debug logs will show:
- 🐛 DEBUG checkForIncomingData - Shows what data sources are available
- 🐛 DEBUG refreshAllModuleForms - Shows what data is being used for form population
- 🐛 DEBUG populateFormFields - Shows which fields are being populated and why
- 🐛 DEBUG saveHelperToStorage - Shows what's being saved

### 5. Common Issues to Check

1. **No data in helper**: Check if makeCarData exists in sessionStorage
2. **Fields not found**: Check the debug log for "Element with ID 'X' not found"
3. **Data not processing**: Look for processIncomingData debug output

### 6. Manual Field Test

To manually populate a field:
```javascript
testPopulateField('ownerPhone', '050-1234567')
```

## Key Fixes Made

1. **Fixed field mapping**: Changed 'plate_number' to 'plate' everywhere
2. **Added Hebrew field translation**: Maps Hebrew field names from Make.com
3. **Fixed populateGeneralInfoFields**: Now checks current page and uses correct field IDs
4. **Added Make.com data priority**: Checks makeCarData first before URL params
5. **Enhanced debugging**: Added hidden logs throughout the data flow

## Testing Steps

1. Open open-cases.html
2. Fill in the form and submit
3. Watch console for webhook response
4. Navigate to general_info.html
5. Check console for population attempts
6. Run `testDataFlow()` to see complete diagnostic

The debug logs will help identify exactly where the data flow is breaking.