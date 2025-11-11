# Phase 6 Authentication - Troubleshooting Guide

**Quick Reference for Common Issues**

---

## 🚨 Page Redirects to Login Immediately

### Symptoms:
- Page loads completely
- All scripts initialize
- Then immediately redirects to index.html

### Diagnosis:
1. Check console for "🚫 PAGE UNLOAD DETECTED" messages
2. Look at stack trace to find redirect source

### Common Causes:
- **security-manager.js calling logout()** - Most common (fixed in Session 67)
- Missing auth data in sessionStorage
- Supabase session validation failing

### Solutions:
```javascript
// Check if security-manager is auto-logging out
// Look in security-manager.js validateSession() method
// Should NOT call this.logout() except from handleSessionExpiry()

// Check auth data exists
const authData = sessionStorage.getItem('auth');
console.log('Auth data:', authData ? 'EXISTS' : 'MISSING');

// Check if Supabase session valid
const auth = JSON.parse(authData);
console.log('User:', auth.user);
console.log('Session:', auth.session);
```

### Fixed in Session 67:
- security-manager.js no longer calls logout() from validateSession()
- Only timeout (handleSessionExpiry) triggers logout

---

## 💾 Save Operations Fail with "Password Error"

### Symptoms:
- Can access page normally
- Clicking save button throws error
- Error message: "שגיאה בפענוח הסיסמה" or "password not correct"

### Diagnosis:
Check save handler code for:
```javascript
// OLD PATTERN (WRONG):
if (!password) {
  try {
    password = await decryptPassword(encryptedPassword);
  } catch (error) {
    alert("שגיאה בפענוח הסיסמה");
    return;
  }
}
```

### Solution:
Remove password validation entirely for Supabase auth:
```javascript
// NEW PATTERN (CORRECT):
// Password not needed for Supabase auth - skip password check entirely

// Just proceed with save operation
const payload = {
  // ... your data fields
  // Do NOT include password
};

await sendToWebhook('YOUR_WEBHOOK', payload);
```

### Fixed Files in Session 67:
- general_info.html (line 311-312)
- open-cases.html (line 359-369)

---

## 🔒 "Must Change Password" Loop

### Symptoms:
- User changes password successfully
- But gets prompted again on next login
- Infinite password change loop

### Root Cause:
`must_change_password` flag not being cleared in database

### Solution:
Check authService.js changePassword() method:
```javascript
// Must include this code:
const { data: { user } } = await supabase.auth.getUser();

const { error: profileError } = await supabase
  .from('profiles')
  .update({ must_change_password: false })
  .eq('user_id', user.id);

// Also update sessionStorage:
const authData = sessionStorage.getItem('auth');
if (authData) {
  const parsed = JSON.parse(authData);
  if (parsed.profile) {
    parsed.profile.must_change_password = false;
    sessionStorage.setItem('auth', JSON.stringify(parsed));
  }
}
```

### Fixed in Session 66:
- authService.js changePassword() method updated
- Both database and sessionStorage updated

---

## 👤 User Creation - No Credentials Shown

### Symptoms:
- Click "Create User" button
- Success message appears but closes immediately
- Can't see/copy credentials

### Root Cause:
- Auto-close timeout or modal not scrollable
- Credentials window hidden

### Solution:
Check admin.html user creation success handler:
```javascript
// Modal should:
1. Display credentials prominently
2. NOT auto-close (remove setTimeout)
3. Be scrollable (overflow-y: auto)
4. Have manual close button
5. Have copy-to-clipboard button
```

### Fixed in Session 66:
- admin.html modal made scrollable
- Auto-close removed
- Copy button added
- Manual close button added

---

## 🔑 Login Fails - Wrong Credentials

### Check:
1. **Email format**: Must match exactly (case-sensitive)
2. **Password**: Check for typos, spaces
3. **Account status**: Must be "active" in profiles table
4. **Supabase Auth**: Check dashboard for user

### Verify in Supabase:
```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'user@example.com';

-- Check profile status
SELECT * FROM profiles WHERE user_id = 'user-id-here';
```

### Common Issues:
- Email has extra spaces
- Password not matching (case-sensitive)
- Account status is 'suspended' or 'inactive'
- User not in auth.users table

---

## 🌐 Email Provider Not Working

### Status:
**Email delivery is OPTIONAL** - Manual credential delivery works perfectly.

### Current Workaround:
1. Admin creates user in admin.html
2. Credentials shown in modal
3. Admin clicks "Copy Credentials"
4. Admin sends to user via WhatsApp/SMS/etc.

### If You Need Email:
1. Configure SMTP in Supabase Dashboard
2. Update email templates (see Phase6_Auth/README.md)
3. Test with new user

**Recommendation:** Keep manual delivery - it's more reliable and gives admins control.

---

## 🔐 Session Timeout Issues

### Too Frequent Logouts:
Check security-manager.js:
```javascript
this.securityConfig = {
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  autoLogoutEnabled: true
};
```

### Disable Auto-Logout (if needed):
```javascript
// In browser console:
window.securityManager.disableAutoLogout();

// Or in code:
this.securityConfig.autoLogoutEnabled = false;
```

### Activity Tracking:
User activity resets timeout on:
- Click, keypress, scroll, mousemove
- Input, change, focus, blur events

---

## 📱 Role-Based Access Not Working

### Status:
**Not yet implemented** - Coming in Session 68

### Workaround:
All authenticated users have full access for now.

### When Implemented:
```javascript
// Check user role:
const role = authService.getUserRole();

// Check permissions:
if (!authService.canEditCases()) {
  alert('אין לך הרשאה לעריכת תיקים');
  window.location.href = 'selection.html';
}
```

---

## 🛠️ Debug Mode

### Enable Detailed Logging:
```javascript
// In browser console:
localStorage.setItem('DEBUG_AUTH', 'true');

// Reload page - will show detailed auth logs
```

### Check Auth State:
```javascript
// In console:
const auth = JSON.parse(sessionStorage.getItem('auth'));
console.log('Auth state:', {
  user: auth.user,
  session: auth.session,
  profile: auth.profile,
  loginTime: auth.loginTime
});

// Check Supabase session:
const { data } = await supabase.auth.getSession();
console.log('Supabase session:', data);
```

### Test Auth Service:
```javascript
// In console:
const isValid = await authService.validateSession();
console.log('Session valid:', isValid);

const profile = authService.getCurrentProfile();
console.log('Current profile:', profile);

const role = authService.getUserRole();
console.log('User role:', role);
```

---

## 🔗 Quick Links

- **Full Session 67 Details:** [SESSION_67_AUTH_FIXES.md](SESSION_67_AUTH_FIXES.md)
- **Remaining Tasks:** [SESSION_68_PHASE6_TODO.md](SESSION_68_PHASE6_TODO.md)
- **Phase 6 Overview:** [README.md](README.md)
- **Database Setup:** [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

---

## 📞 Still Stuck?

1. Check console for error messages
2. Enable redirect blocker (line 1758 in final-report-builder.html)
3. Check Supabase Dashboard for user/session data
4. Review session documentation for similar issues
5. Add console.log statements to trace execution

**Most issues are either:**
- Missing auth data (check sessionStorage)
- Old password code (remove it)
- security-manager auto-logout (fixed in Session 67)
