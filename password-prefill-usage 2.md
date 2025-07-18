# Password Prefill System Usage Guide

## Overview
The password prefill system automatically fills password fields across all user modules when a user logs in through the main gate. This eliminates the need for users to re-enter their password in each module.

## How It Works
1. **Main Gate Login**: User enters password at main login
2. **Password Storage**: Password is stored in `sessionStorage` as `prefillPassword`
3. **Auto-Fill**: All user modules automatically fill password fields
4. **Exclusions**: Admin and Dev modules are excluded from auto-fill for security

## Implementation in Modules

### 1. Include the Script
Add this line before the closing `</body>` tag in ALL user modules:

```html
<script src="password-prefill.js"></script>
```

### 2. Module Examples

#### For Report Selection Page (✅ Already Done)
```html
<script src="logout-sound.js"></script>
<script src="password-prefill.js"></script>
</body>
</html>
```

#### For Other User Modules
```html
<!-- Add to all modules EXCEPT admin.html and dev-module.html -->
<script src="password-prefill.js"></script>
</body>
</html>
```

### 3. Supported Password Field IDs
The system automatically detects these password field selectors:
- `#passwordInput`
- `#password`
- `#platePassword`
- `#casePassword`
- `#accessPassword`
- `input[type="password"]`
- `input[type="text"][placeholder*="סיסמה"]`
- `input[type="text"][placeholder*="password"]`

## Security Features

### ✅ Included Modules (Auto-Fill Enabled)
- report-selection.html
- estimate-builder.html
- depreciation-module.html
- validation-dashboard.html
- expertise-summary.html
- final-report-builder.html
- All other user modules

### ❌ Excluded Modules (Auto-Fill Disabled)
- admin.html
- dev-module.html
- Any module with "Admin" or "Dev" in the title
- Any module with "admin" or "dev" in the URL path

## Manual Control

### Store Password Manually
```javascript
// Store password from main gate
sessionStorage.setItem('prefillPassword', userPassword);
```

### Prefill Manually
```javascript
// Manually trigger prefill
window.prefillUserPassword();
```

### Check Current Status
```javascript
// Check if password is stored
const hasPassword = sessionStorage.getItem('prefillPassword');
console.log('Password available:', !!hasPassword);
```

## Implementation Checklist

For each user module:
- [ ] Add `<script src="password-prefill.js"></script>` before `</body>`
- [ ] Test that password fields are automatically filled
- [ ] Verify admin/dev modules are excluded
- [ ] Confirm no console errors

## Troubleshooting

### Password Not Filling
1. Check console for error messages
2. Verify `sessionStorage.getItem('prefillPassword')` returns a value
3. Ensure password field has a supported ID/selector
4. Check if module is incorrectly excluded (contains "admin" or "dev")

### Debug Mode
```javascript
// Enable debug logging
console.log('Password prefill debug:', {
  hasPassword: !!sessionStorage.getItem('prefillPassword'),
  passwordFields: document.querySelectorAll('input[type="password"]'),
  isAdminModule: window.location.pathname.includes('admin')
});
```

## Benefits
- ✅ **User Experience**: No need to re-enter passwords
- ✅ **Security**: Admin/Dev modules remain secure
- ✅ **Automatic**: Works across all user modules
- ✅ **Flexible**: Supports multiple password field types
- ✅ **Consistent**: Same password across all user workflows