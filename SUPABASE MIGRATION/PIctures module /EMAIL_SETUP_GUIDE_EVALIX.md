# Email Setup Guide - evalix.io Domain
**Date**: November 22, 2025
**Domain**: evalix.io
**Purpose**: Send full-resolution images via email from Pictures Module

---

## Overview

This guide explains how to set up email functionality for the Pictures Module using the evalix.io domain.

---

## Step 1: Choose Email Service Provider

### Recommended Options:

#### Option A: SendGrid (Recommended - Easy Setup)
- **Pros**: Simple, generous free tier (100 emails/day), good deliverability
- **Cons**: Requires account verification
- **Free Tier**: 100 emails/day
- **Website**: sendgrid.com

#### Option B: Mailgun
- **Pros**: Developer-friendly, good for Make.com integration
- **Cons**: More complex setup
- **Free Tier**: 5,000 emails/month (first 3 months)
- **Website**: mailgun.com

#### Option C: AWS SES (Simple Email Service)
- **Pros**: Cheap ($0.10 per 1,000 emails), scalable
- **Cons**: Requires AWS account, sandbox mode initially
- **Cost**: Pay-as-you-go
- **Website**: aws.amazon.com/ses

**RECOMMENDATION**: Start with **SendGrid** for simplicity.

---

## Step 2: Domain DNS Configuration

### DNS Records Required (Example for SendGrid):

Go to your domain registrar (where you bought evalix.io) and add these DNS records:

#### CNAME Records for Email Authentication:
```
Type: CNAME
Name: em8765.evalix.io (SendGrid will provide specific subdomain)
Value: u8765432.wl123.sendgrid.net (SendGrid will provide specific value)
TTL: 3600
```

```
Type: CNAME
Name: s1._domainkey.evalix.io
Value: s1.domainkey.u8765432.wl123.sendgrid.net
TTL: 3600
```

```
Type: CNAME
Name: s2._domainkey.evalix.io
Value: s2.domainkey.u8765432.wl123.sendgrid.net
TTL: 3600
```

#### MX Records (if you want to receive emails):
```
Type: MX
Name: @
Value: mx.sendgrid.net
Priority: 10
TTL: 3600
```

**NOTE**: The exact values will be provided by SendGrid after you add your domain.

---

## Step 3: SendGrid Account Setup

### 3.1: Create Account
1. Go to sendgrid.com
2. Sign up (free account)
3. Verify your email address

### 3.2: Add Domain
1. Navigate to: **Settings → Sender Authentication → Authenticate Your Domain**
2. Select your DNS host (e.g., GoDaddy, Namecheap, Cloudflare)
3. Enter domain: `evalix.io`
4. Follow instructions to add DNS records
5. Click "Verify" (may take up to 48 hours for DNS propagation)

### 3.3: Create API Key
1. Navigate to: **Settings → API Keys**
2. Click "Create API Key"
3. Name: "SmartVal Pictures Module"
4. Permission: **Full Access** (or restricted to Mail Send only)
5. **COPY THE API KEY** - you won't see it again!

---

## Step 4: Make.com Integration

### Option A: Use Make.com Email Module (Recommended)

#### Create New Scenario:
1. **Trigger**: Webhooks - Custom Webhook
   - Webhook name: `EMAIL_IMAGES`

2. **Module 1**: Iterator
   - Array: `{{1.images}}`

3. **Module 2**: HTTP - Get a File (for each image)
   - URL: `{{2.url}}`

4. **Module 3**: SendGrid - Send an Email
   - API Key: (paste your SendGrid API key)
   - From: `noreply@evalix.io`
   - From Name: `SmartVal by Evalix`
   - To: `{{1.recipient_email}}`
   - Subject: `תמונות לרכב מספר {{1.plate}}`
   - Content Type: `HTML`
   - HTML Content:
```html
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>תמונות לרכב מספר {{1.plate}}</h1>
    <p>תיק מספר: {{1.filing_case_id}}</p>
  </div>
  <div class="content">
    <p>שלום,</p>
    <p>מצורפות {{1.total_images}} תמונות ברזולוציה מלאה לרכב מספר {{1.plate}}.</p>
    <p>התמונות צולמו בתאריך: {{formatDate(1.date_taken; "DD/MM/YYYY")}}</p>
    <p><strong>מוקדי נזק:</strong> {{1.damage_centers}}</p>
  </div>
  <div class="footer">
    <p>נוצר באמצעות SmartVal by Evalix</p>
    <p>evalix.io</p>
  </div>
</body>
</html>
```
   - Attachments: `{{3.data}}` (from HTTP module - the image file)

### Option B: Direct API Call from Browser (Alternative)

If you want to call SendGrid directly from upload-images.html without Make.com:

```javascript
async function sendEmailWithImages(recipientEmail, images, caseDetails) {
  const SENDGRID_API_KEY = 'SG.xxxxx'; // Store in environment/config

  const attachments = images.map((img, index) => ({
    content: img.base64, // Base64 encoded image
    filename: img.filename,
    type: img.mime_type,
    disposition: 'attachment'
  }));

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: recipientEmail }],
        subject: `תמונות לרכב מספר ${caseDetails.plate}`
      }],
      from: {
        email: 'noreply@evalix.io',
        name: 'SmartVal by Evalix'
      },
      content: [{
        type: 'text/html',
        value: `<html>...</html>` // Your HTML template
      }],
      attachments: attachments
    })
  });

  return response.ok;
}
```

**WARNING**: Don't hardcode API key in frontend! Use Make.com instead for security.

---

## Step 5: Update upload-images.html

### Add Email Button:
```html
<button type="button" class="btn btn-primary" onclick="emailImages()"
        style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
  📧 שלח תמונות במייל
</button>
```

### Add Email Function:
```javascript
async function emailImages() {
  // Show email input dialog
  const email = prompt('הזן כתובת אימייל לשליחה:');
  if (!email) return;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('❌ כתובת אימייל לא תקינה');
    return;
  }

  // Get active images
  const activeImages = galleryManager.images.filter(img => !img.deleted_at);

  if (activeImages.length === 0) {
    alert('❌ אין תמונות לשליחה');
    return;
  }

  // Prepare image URLs (use original_url or signed URLs)
  const imageData = await Promise.all(activeImages.map(async (img) => {
    // Get signed URL from Supabase if needed
    const { data: urlData } = await supabase.storage
      .from(img.documents.bucket_name)
      .createSignedUrl(img.documents.storage_path, 86400);

    return {
      url: urlData?.signedUrl || img.original_url,
      filename: img.filename,
      smart_name: `${img.recognized_part || ''} - ${img.recognized_damage || ''}`.trim()
    };
  }));

  // Get case details
  const caseId = sessionStorage.getItem('case_id');
  const { data: caseData } = await supabase
    .from('cases')
    .select('filing_case_id, plate')
    .eq('id', caseId)
    .single();

  // Send to Make.com
  const webhookUrl = getWebhook('EMAIL_IMAGES');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient_email: email,
      images: imageData,
      plate: caseData.plate,
      filing_case_id: caseData.filing_case_id,
      total_images: imageData.length,
      damage_centers: [...new Set(activeImages.map(img => img.damage_centers?.name))].join(', '),
      date_taken: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('שגיאה בשליחת המייל');
  }

  alert(`✅ ${activeImages.length} תמונות נשלחו בהצלחה לכתובת ${email}`);
}
```

### Add to helper.js (webhook config):
```javascript
EMAIL_IMAGES: 'https://hook.eu2.make.com/xxxxx' // Get from Make.com
```

---

## Step 6: Testing

### Pre-launch Checklist:
- [ ] DNS records verified in SendGrid
- [ ] Test email sent successfully from SendGrid dashboard
- [ ] Make.com scenario created and tested
- [ ] Webhook URL added to helper.js
- [ ] Email button appears in upload-images.html
- [ ] Email validation works
- [ ] Images attach correctly (full resolution)
- [ ] HTML email renders properly (test in Gmail, Outlook)
- [ ] Hebrew text displays correctly (RTL)
- [ ] Error handling works (invalid email, no images, etc.)

### Test Cases:
1. Send email with 1 image
2. Send email with 10+ images
3. Test with various email providers (Gmail, Outlook, Yahoo)
4. Test on mobile email clients
5. Verify attachments are full-resolution (not thumbnails)

---

## Troubleshooting

### Issue: DNS not verified
**Solution**: Wait up to 48 hours for DNS propagation. Check DNS records with: `nslookup -type=CNAME em8765.evalix.io`

### Issue: Emails going to spam
**Solutions**:
- Ensure SPF, DKIM, DMARC records are set correctly
- Use verified sender address (noreply@evalix.io)
- Don't use spammy words in subject/content
- Test with mail-tester.com

### Issue: SendGrid API key not working
**Solutions**:
- Verify API key has "Mail Send" permission
- Check if key was copied correctly (no extra spaces)
- Regenerate API key if needed

### Issue: Images too large for email
**Solutions**:
- Compress images before sending
- Send links instead of attachments (use signed URLs)
- Split into multiple emails if > 25MB total

---

## Cost Estimation

### SendGrid Free Tier:
- 100 emails/day = 3,000 emails/month
- Sufficient for small/medium usage

### If Exceeding Free Tier:
- SendGrid Essentials: $19.95/month (50,000 emails)
- SendGrid Pro: $89.95/month (1.5M emails)

### Typical Usage:
- Average 5-10 emails per case
- 20 cases/month = 100-200 emails/month
- **Free tier is sufficient**

---

## Security Best Practices

1. **Never expose API keys in frontend code**
   - Use Make.com as middleware
   - Or use serverless function (Supabase Edge Functions)

2. **Rate limiting**
   - Limit emails per user per day
   - Prevent abuse

3. **Email validation**
   - Verify email format
   - Optional: Send confirmation before attaching images

4. **Data privacy**
   - Don't log recipient emails
   - Use BCC for multiple recipients
   - GDPR compliance

---

## Next Steps

1. Purchase/configure evalix.io domain ✅ DONE
2. Sign up for SendGrid
3. Add DNS records to domain
4. Verify domain in SendGrid (wait 24-48h)
5. Create API key
6. Set up Make.com scenario
7. Test email functionality
8. Deploy to production

---

**Status**: 🟡 READY TO IMPLEMENT (waiting for DNS setup)
**Estimated Setup Time**: 2-3 hours
**Estimated Development Time**: 2-3 hours
