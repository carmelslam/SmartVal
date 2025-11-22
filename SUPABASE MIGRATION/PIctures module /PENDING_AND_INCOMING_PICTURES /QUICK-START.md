# EVALIX PENDING IMAGES - QUICK START CHECKLIST

## 🎯 YOUR NEXT ACTIONS (In Order)

---

## ✅ TODAY (30 minutes)

### 1. DATABASE SETUP
- [ ] Open Supabase SQL Editor: https://supabase.com/dashboard/project/nvqrptokmwdhvpiufrad/sql
- [ ] Copy/paste SQL from `DEPLOYMENT-GUIDE.md` Phase 1
- [ ] Run all SQL (creates tables, RLS, indexes)
- [ ] Verify: `SELECT * FROM pending_images;` (should return empty, not error)

### 2. CREATE STORAGE BUCKET
- [ ] Supabase Dashboard → Storage → New Bucket
- [ ] Name: `pending-images`
- [ ] Public: YES
- [ ] Create it

### 3. GET YOUR CREDENTIALS
- [ ] Supabase → Settings → API → Copy **service_role** key (save securely)
- [ ] Run SQL: `SELECT id FROM auth.users WHERE email = 'your-admin-email';`
- [ ] Save your UUID (you'll need it multiple times)

---

## ✅ THIS WEEK (2-3 hours)

### 4. DEPLOY FRONTEND
- [ ] Download all files from `/mnt/user-data/outputs/`
- [ ] Upload to your Netlify site:
  - `lib/supabaseClient.js` (verify credentials match)
  - `pending-images.html`
  - `pending-images.js`
- [ ] Modify `selection.html` - add alert code from `selection-html-integration.html`
- [ ] Deploy via Git or Netlify dashboard
- [ ] Test: Visit `https://yaron-cayouf-portal.netlify.app/pending-images.html`

### 5. CREATE ONEDRIVE FOLDERS
- [ ] Open OneDrive for Business
- [ ] Create: `/EVALIX-System/WhatsApp-Admin/`
- [ ] Create: `/EVALIX-System/Processed/`
- [ ] Set permissions (you: edit, others: none for now)

### 6. BUILD MAKE.COM SCENARIO - WHATSAPP
- [ ] Create new scenario in Make.com
- [ ] Follow `EVALIX-IMPLEMENTATION-GUIDE.md` Part 3, Scenario A
- [ ] Replace ALL placeholders:
  - Folder: `/EVALIX-System/WhatsApp-Admin/`
  - `assigned_to_user`: Your UUID
  - Supabase URL: `https://nvqrptokmwdhvpiufrad.supabase.co`
  - Service key: Your service_role key
- [ ] Activate scenario
- [ ] Test: Upload image to OneDrive folder manually

### 7. BUILD MAKE.COM SCENARIO - EMAIL
- [ ] Clone WhatsApp scenario
- [ ] Change trigger to Email Watch
- [ ] Add plate number extraction (regex module)
- [ ] Activate scenario
- [ ] Test: Send email with image attachment to yourself

### 8. BUILD MAKE.COM SCENARIO - PROCESSING WEBHOOK
- [ ] Create webhook scenario
- [ ] Follow `EVALIX-IMPLEMENTATION-GUIDE.md` Part 3, Scenario C
- [ ] Copy webhook URL (looks like: `https://hook.us1.make.com/...`)
- [ ] Update `pending-images.js` line 15 with YOUR webhook URL
- [ ] Re-deploy to Netlify
- [ ] Activate scenario

---

## ✅ NEXT WEEK (Testing & Refinement)

### 9. END-TO-END TEST
- [ ] Insert test image in database (see DEPLOYMENT-GUIDE.md Phase 5, Test 1)
- [ ] Open `pending-images.html` - should see test image
- [ ] Select a case, click Accept
- [ ] Verify status changed to 'accepted' in database
- [ ] Check Make.com webhook ran successfully

### 10. REAL WHATSAPP TEST
- [ ] Configure your phone (OneDrive auto-upload)
- [ ] Send yourself WhatsApp image
- [ ] Wait 5 minutes
- [ ] Check database: `SELECT * FROM pending_images ORDER BY received_at DESC LIMIT 1;`
- [ ] Check frontend - should appear
- [ ] Accept it - should process

### 11. SELECTION PAGE INTEGRATION TEST
- [ ] Ensure you have pending images
- [ ] Visit `selection.html`
- [ ] Should see orange alert with count
- [ ] Click button - should navigate to pending-images.html

---

## ✅ WHEN READY (Adding More Users)

### 12. ONBOARD FIRST ASSESSOR
- [ ] Follow `NEW-ASSESSOR-ONBOARDING-MANUAL.md`
- [ ] Create their auth user
- [ ] Create their OneDrive folder
- [ ] Clone both Make scenarios (WhatsApp + Email)
- [ ] Update UUIDs
- [ ] Configure their phone
- [ ] Test end-to-end

---

## 📋 CRITICAL THINGS TO NOT FORGET

### ⚠️ Security
- [ ] NEVER expose service_role key in frontend code
- [ ] Only use in Make.com (server-side)
- [ ] Frontend uses anon key only

### ⚠️ UUIDs
- [ ] Each Make scenario needs correct user UUID in `assigned_to_user`
- [ ] Wrong UUID = images won't appear for that user
- [ ] Verify with: `SELECT id, email FROM auth.users;`

### ⚠️ Webhook URL
- [ ] Must update `pending-images.js` with real webhook URL
- [ ] Without this, Accept button won't process images
- [ ] Test webhook separately with curl first

### ⚠️ RLS Policies
- [ ] If users can't see their images, check RLS
- [ ] Test queries as authenticated user
- [ ] Verify user_id matches in pending_images.assigned_to_user

---

## 🆘 IF SOMETHING BREAKS

### Error: "משתמש לא מחובר"
→ Check user is logged in, verify auth session

### Error: "שגיאה בטעינת תמונות"
→ Check RLS policies, verify user UUID, check browser console

### Images not syncing from WhatsApp
→ Check OneDrive app logged in, camera upload enabled, folder permissions

### Webhook fails (Accept doesn't work)
→ Verify webhook URL in code, check Make scenario active, test with curl

### Case dropdown empty
→ Check cases table has data, verify RLS allows user to see their cases

---

## 📚 DOCUMENTATION FILES

**You have 4 guide files in `/mnt/user-data/outputs/`:**

1. **DEPLOYMENT-GUIDE.md** ← START HERE
   - Your specific setup instructions
   - Phase-by-phase deployment
   - Exact credentials and URLs

2. **EVALIX-IMPLEMENTATION-GUIDE.md**
   - Complete technical reference
   - All Make.com scenarios in detail
   - Database schemas
   - Troubleshooting

3. **NEW-ASSESSOR-ONBOARDING-MANUAL.md**
   - Step-by-step for adding new users
   - 30-minute checklist per assessor
   - Copy-paste SQL queries

4. **selection-html-integration.html**
   - Code to add to selection.html
   - Creates pending images alert

---

## 🎯 SUCCESS METRICS

After deployment, you should have:

✅ Database tables created with RLS working  
✅ Frontend loading without errors  
✅ WhatsApp images auto-appearing in pending queue  
✅ Email images auto-appearing with plate extraction  
✅ Accept flow completing successfully  
✅ Images moving to case gallery after acceptance  
✅ Selection page showing alert when images pending  
✅ Real-time updates working (new images appear instantly)

---

## 💡 TIPS

**Start Small:**
- Deploy for just yourself (admin) first
- Test thoroughly before adding assessors
- One assessor at a time to catch issues

**Documentation:**
- Keep these guides accessible
- Update when you make changes
- Share relevant sections with assessors

**Monitoring:**
- Check Make.com execution history weekly
- Monitor Supabase storage usage
- Review denied/deleted images for patterns

**Support:**
- Screenshot errors when they occur
- Check browser console (F12)
- Look at Make.com execution details
- Query database to verify data flow

---

## 🚀 READY TO START?

1. Open `DEPLOYMENT-GUIDE.md`
2. Start with Phase 1 (Database Setup)
3. Work through each phase methodically
4. Test after each phase before moving on
5. Celebrate when it works! 🎉

**Estimated total time:** 3-4 hours for full deployment

---

## 📞 NEED HELP?

Check the troubleshooting sections in:
- DEPLOYMENT-GUIDE.md (Phase-specific issues)
- EVALIX-IMPLEMENTATION-GUIDE.md (Technical deep-dive)

**Common issues are documented with solutions.**

---

Good luck! You've got everything you need. 💪

