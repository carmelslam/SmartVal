# Phase 6: User Management & Authentication - Setup Instructions

**Date:** 2025-10-22  
**Status:** Manual Setup Required  
**Organization:** ירון כיוף - שמאות וייעוץ

---

## Overview

This phase migrates the system from single-password authentication to Supabase Auth with role-based access control.

**Authentication Method:** Email + Password (traditional login with biometric support)

---

## Setup Steps (Run in Order)

### Step 1: Enable Supabase Auth

1. **Go to Supabase Dashboard** → Authentication → Providers
2. **Enable Email Provider:**
   - Toggle ON "Email"
   - Toggle ON "Confirm email" (optional - recommended)
   - Save changes

3. **Configure Email Settings:**
   - Go to Authentication → Email Templates
   - Set "Sender email": `Office@yc-shamaut.co.il`
   - Set "Sender name": `SmartVal - ירון כיוף שמאות`

4. **Configure Site URL:**
   - Go to Authentication → URL Configuration
   - Set "Site URL": `https://yourdomain.com` (your actual domain)
   - Add redirect URL: `https://yourdomain.com/selection.html`

---

### Step 2: Run SQL Migrations

Run these SQL files **in order** in the Supabase SQL Editor:

#### Migration 1: Update Profiles Table
**File:** `01_update_profiles_table.sql`

Adds phone field and updates profile structure.

#### Migration 2: Create Organization & Developer User
**File:** `02_create_org_and_dev_user.sql`

⚠️ **IMPORTANT:** Before running this file:
1. Create your email account in Supabase Auth dashboard first
2. Go to Authentication → Users → Add User
3. Enter your email and password
4. Copy the User ID (UUID)
5. Edit `02_create_org_and_dev_user.sql` and replace `YOUR_USER_ID_HERE` with your actual UUID
6. Then run the SQL

#### Migration 3: Update RLS Policies
**File:** `03_update_rls_policies.sql`

Implements role-based access control:
- Assessors see only their cases
- Admin/Developer see all cases
- Assistant can view but not edit

#### Migration 4: Assign Existing Cases
**File:** `04_assign_existing_cases_to_dev.sql`

Assigns all existing cases in database to the developer user.

---

### Step 3: Customize Email Templates (Optional but Recommended)

**Go to:** Authentication → Email Templates

#### Welcome Email Template (New User Created)
```html
<h2 dir="rtl">שלום {{ .ConfirmationURL }}</h2>

<p dir="rtl">נוצר עבורך חשבון במערכת SmartVal של ירון כיוף - שמאות וייעוץ.</p>

<p dir="rtl"><strong>פרטי ההתחברות שלך:</strong></p>
<ul dir="rtl">
  <li>שם משתמש: {{ .Email }}</li>
  <li>תפקיד: {{ .Role }}</li>
</ul>

<p dir="rtl">
  <a href="{{ .SiteURL }}/index.html" style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
    כניסה למערכת
  </a>
</p>

<p dir="rtl">⚠️ בכניסה הראשונה תתבקש לשנות את הסיסמה הזמנית.</p>

<p dir="rtl">
  📱 במכשיר נייד: הדפדפן יציע לשמור את הסיסמה ולהשתמש ב-Face ID / Touch ID להתחברות מהירה.
</p>

<p dir="rtl">בברכה,<br>מערכת SmartVal<br>ירון כיוף - שמאות וייעוץ</p>

<hr>
<p dir="rtl" style="font-size: 12px; color: #666;">אם לא ביקשת חשבון זה, אנא התעלם מהודעה זו.</p>
```

#### Password Reset Template
```html
<h2 dir="rtl">איפוס סיסמה - SmartVal</h2>

<p dir="rtl">קיבלנו בקשה לאיפוס הסיסמה שלך במערכת SmartVal.</p>

<p dir="rtl">
  <a href="{{ .ConfirmationURL }}" style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
    אפס סיסמה
  </a>
</p>

<p dir="rtl">הקישור תקף ל-60 דקות.</p>

<p dir="rtl">אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו והסיסמה שלך תישאר ללא שינוי.</p>

<p dir="rtl">בברכה,<br>מערכת SmartVal</p>
```

---

## Verification Checklist

After completing setup, verify:

- [ ] Supabase Auth Email provider enabled
- [ ] Email settings configured with Office@yc-shamaut.co.il
- [ ] Site URL and redirect URLs configured
- [ ] All 4 SQL migrations run successfully
- [ ] Organization "ירון כיוף - שמאות וייעוץ" exists in `orgs` table
- [ ] Your developer profile exists in `profiles` table
- [ ] All existing cases assigned to developer user
- [ ] RLS policies updated and active
- [ ] Email templates customized (optional)

---

## User Roles Reference

| Role | Hebrew | Permissions |
|------|--------|-------------|
| `developer` | מפתח | Full access + code/config changes |
| `admin` | אדמין | Full case access, user management, all admin tools |
| `assessor` | שמאי | Create/edit own cases only |
| `assistant` | עוזר | View all cases, admin tools (no edit/delete) |

---

## Next Steps

After manual setup is complete:
1. Test login with your developer account
2. Access admin panel to create first assessor
3. Test role-based access
4. Verify email delivery

---

## Troubleshooting

**Email not sending?**
- Check SMTP settings in Supabase dashboard
- Verify sender email is verified
- Check spam folder

**Can't login?**
- Verify user exists in Authentication → Users
- Check if email is confirmed (if email confirmation required)
- Try password reset

**RLS blocking access?**
- Check user role in `profiles` table
- Verify org_id matches between user and cases
- Check RLS policies are active

---

## Support

For issues during setup, check:
1. Supabase logs (Dashboard → Logs)
2. Browser console for errors
3. SQL error messages

**Document Status:** Ready for Implementation  
**Last Updated:** 2025-10-22
