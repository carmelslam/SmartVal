# AI Image Recognition Feature - Implementation Guide

**Date:** 2025-11-21
**Purpose:** Add ChatGPT-based image recognition to identify parts and damage
**Feature:** Auto-rename files: `{plate}_{damage}_{part}.jpg`

---

## Current Make.com Feature

Your current Make.com TRANSFORM_PICTURES flow has:
1. ChatGPT Vision module that analyzes each image
2. Identifies: damage type, car part
3. Renames file: `12-345-67_scratch_front_bumper.jpg`

**This is a valuable feature for:**
- File organization
- Easy search/filtering
- Understanding image content
- OneDrive file structure

---

## Proposed Architecture (Hybrid Approach)

Keep the AI recognition in Make.com, but integrate it with the new Supabase-first flow:

```
┌─────────────────────────────────────────────────────────┐
│              USER UPLOADS IMAGE                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         STEP 1: IMMEDIATE SAVE (3 seconds)               │
│  • Upload to Supabase Storage                            │
│  • Create database record                                │
│  • Generate transformation URL                           │
│  • Show success to user ✅                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│      STEP 2: AI RECOGNITION (Background, 10-20 sec)      │
│  Send to UPLOAD_PICTURES webhook:                        │
│    - image_id                                            │
│    - supabase_url                                        │
│    - case_id, plate                                      │
│                                                          │
│  Make.com UPLOAD_PICTURES scenario:                      │
│    1. Download image from Supabase                       │
│    2. ChatGPT Vision analysis:                           │
│       - Identify damage type (scratch, dent, broken...)  │
│       - Identify car part (bumper, door, hood...)        │
│    3. Upload to OneDrive with smart name:                │
│       {plate}_{damage}_{part}.jpg                        │
│    4. Update Supabase database:                          │
│       - recognized_damage                                │
│       - recognized_part                                  │
│       - onedrive_path                                    │
│       - backup_status: 'backed_up'                       │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema Updates

Add AI recognition fields to `images` table:

```sql
ALTER TABLE images
ADD COLUMN IF NOT EXISTS recognized_damage TEXT,
ADD COLUMN IF NOT EXISTS recognized_part TEXT,
ADD COLUMN IF NOT EXISTS recognition_confidence DECIMAL,
ADD COLUMN IF NOT EXISTS recognition_status TEXT DEFAULT 'pending' CHECK (recognition_status IN ('pending', 'recognized', 'failed'));

-- Add index for filtering by recognized data
CREATE INDEX IF NOT EXISTS idx_images_recognized_part
ON images(case_id, recognized_part)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_images_recognized_damage
ON images(case_id, recognized_damage)
WHERE deleted_at IS NULL;
```

---

## Updated RPC Function

Update `update_backup_status()` to include AI recognition data:

```sql
CREATE OR REPLACE FUNCTION update_backup_status(
  p_image_id UUID,
  p_onedrive_path TEXT,
  p_backup_status TEXT DEFAULT 'backed_up',
  p_recognized_damage TEXT DEFAULT NULL,
  p_recognized_part TEXT DEFAULT NULL,
  p_recognition_confidence DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update image record with OneDrive backup info + AI recognition
  UPDATE images
  SET
    onedrive_path = p_onedrive_path,
    backup_status = p_backup_status,
    recognized_damage = COALESCE(p_recognized_damage, recognized_damage),
    recognized_part = COALESCE(p_recognized_part, recognized_part),
    recognition_confidence = COALESCE(p_recognition_confidence, recognition_confidence),
    recognition_status = CASE
      WHEN p_recognized_damage IS NOT NULL OR p_recognized_part IS NOT NULL
      THEN 'recognized'
      ELSE recognition_status
    END,
    updated_at = now()
  WHERE id = p_image_id;

  -- Log the update
  RAISE NOTICE 'Updated backup status for image %: % (damage: %, part: %)',
    p_image_id, p_backup_status, p_recognized_damage, p_recognized_part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Make.com UPLOAD_PICTURES Scenario (UPDATED)

### Module 1: Webhook Trigger
**Receives:**
- `image_id` (UUID)
- `supabase_url` (24hr signed URL)
- `case_id` (UUID)
- `plate` (String)
- `action` ('backup_to_onedrive')

---

### Module 2: HTTP Get - Download Image
**Configuration:**
- URL: `{{1.supabase_url}}`
- Method: GET
- Parse response: No (binary data)

**Output:** Image file data

---

### Module 3: OpenAI - ChatGPT Vision Analysis
**Configuration:**
- Model: `gpt-4-vision-preview` or `gpt-4o`
- Image: `{{2.data}}` (from HTTP Get)
- Prompt:
```
Analyze this car damage image and provide:
1. Damage type (scratch, dent, broken, crack, missing, rust, etc.)
2. Car part (front_bumper, rear_bumper, hood, door, fender, mirror, etc.)

Return ONLY in this format (no extra text):
damage: {damage_type}
part: {part_name}

Use lowercase and underscores. Be specific and concise.
Examples:
damage: deep_scratch
part: front_bumper

damage: large_dent
part: driver_door
```

**Output:**
- Full response text

---

### Module 4: Text Parser - Extract Damage and Part
**Configuration:**
- Pattern: `damage:\s*(\w+)\s*\n\s*part:\s*(\w+)`
- Text: `{{3.choices[].message.content}}`

**Set Variables:**
```javascript
damage = {{4.$1}} // First capture group
part = {{4.$2}}   // Second capture group
```

**Fallback if parsing fails:**
```javascript
damage = "unknown"
part = "unidentified"
```

---

### Module 5: OneDrive - Upload File
**Configuration:**
- File: `{{2.data}}` (original image data)
- Folder Path: `/EVALIX/Cases/{{1.plate}}/Images/`
- File Name: `{{1.plate}}_{{damage}}_{{part}}.jpg`
- Overwrite: `true`

**Example filename:** `12-345-67_deep_scratch_front_bumper.jpg`

**Output:**
- `webUrl`: OneDrive file URL

---

### Module 6: Supabase - Update Database
**Configuration:**
- URL: `https://[project].supabase.co/rest/v1/rpc/update_backup_status`
- Method: POST
- Headers:
  - `apikey`: `[ANON_KEY]`
  - `Authorization`: `Bearer [ANON_KEY]`
  - `Content-Type`: `application/json`
- Body:
```json
{
  "p_image_id": "{{1.image_id}}",
  "p_onedrive_path": "{{5.webUrl}}",
  "p_backup_status": "backed_up",
  "p_recognized_damage": "{{damage}}",
  "p_recognized_part": "{{part}}",
  "p_recognition_confidence": 0.9
}
```

---

### Module 7: Error Handler (Optional)
**If ChatGPT or OneDrive fails:**
- Still update database with backup_status: 'failed'
- Set recognition_status: 'failed'
- Log error for manual review

---

## Example ChatGPT Responses

### Example 1: Front Bumper Scratch
**Input:** Image of scratched front bumper

**ChatGPT Response:**
```
damage: deep_scratch
part: front_bumper
```

**Result:**
- Database: `recognized_damage = 'deep_scratch'`, `recognized_part = 'front_bumper'`
- OneDrive file: `12-345-67_deep_scratch_front_bumper.jpg`

---

### Example 2: Broken Side Mirror
**Input:** Image of broken side mirror

**ChatGPT Response:**
```
damage: broken
part: side_mirror
```

**Result:**
- Database: `recognized_damage = 'broken'`, `recognized_part = 'side_mirror'`
- OneDrive file: `12-345-67_broken_side_mirror.jpg`

---

### Example 3: Dented Door
**Input:** Image of dented door

**ChatGPT Response:**
```
damage: large_dent
part: passenger_door
```

**Result:**
- Database: `recognized_damage = 'large_dent'`, `recognized_part = 'passenger_door'`
- OneDrive file: `12-345-67_large_dent_passenger_door.jpg`

---

## UI Enhancements (Future Phase 1B)

### Display Recognition Results in Image Gallery

```javascript
// Get images with AI recognition data
const { data: images } = await supabase
  .from('images')
  .select('*')
  .eq('case_id', caseId)
  .is('deleted_at', null)
  .order('display_order');

// Display in gallery
images.forEach(img => {
  const badge = document.createElement('div');
  badge.className = 'recognition-badge';

  if (img.recognition_status === 'recognized') {
    badge.innerHTML = `
      <span class="damage-tag">${img.recognized_damage}</span>
      <span class="part-tag">${img.recognized_part}</span>
    `;
  } else if (img.recognition_status === 'pending') {
    badge.innerHTML = '<span class="pending-tag">מזהה...</span>';
  }

  imageCard.appendChild(badge);
});
```

### Filter by Recognized Part/Damage

```javascript
// Filter images by part
const { data: bumperImages } = await supabase
  .from('images')
  .select('*')
  .eq('case_id', caseId)
  .eq('recognized_part', 'front_bumper')
  .is('deleted_at', null);

// Filter images by damage type
const { data: scratchedImages } = await supabase
  .from('images')
  .select('*')
  .eq('case_id', caseId)
  .ilike('recognized_damage', '%scratch%')
  .is('deleted_at', null);
```

---

## Cost Considerations

### ChatGPT Vision API Pricing
- **GPT-4o Vision:** ~$0.01 per image
- **GPT-4-Vision-Preview:** ~$0.02 per image

**For 100 images/month:**
- Cost: $1-2 per month
- Very affordable!

### Make.com Operations
- Each image upload = 2-3 operations (HTTP Get, ChatGPT, OneDrive, Supabase update)
- Most Make.com plans include 10,000+ operations/month

---

## Benefits of This Approach

### ✅ Pros:
1. **Keeps existing ChatGPT integration** (no need to rebuild)
2. **User gets immediate feedback** (upload complete in 3 seconds)
3. **AI processing happens in background** (user doesn't wait)
4. **Smart file naming** (easy to find images in OneDrive)
5. **Database searchable** (filter by part/damage)
6. **Minimal code changes** (just update Make.com scenario)

### ⚠️ Cons:
1. **Slight delay** (10-20 seconds for AI recognition)
2. **Depends on Make.com** (not fully Supabase-native)
3. **Extra cost** (ChatGPT API ~$0.01/image)

---

## Alternative Approaches

### Option 2: Supabase Edge Function with OpenAI
**Pros:** Fully Supabase-native, no Make.com dependency
**Cons:** Need to build Edge Function, manage API keys

### Option 3: Client-Side AI (Browser)
**Pros:** Instant recognition, no server cost
**Cons:** Limited accuracy, requires user's API key

**Recommendation:** Stick with **Option 1 (Hybrid Make.com)** because:
- ✅ Keeps your working AI integration
- ✅ Minimal changes needed
- ✅ User doesn't notice delay (background processing)

---

## Implementation Steps

1. **Run SQL migration** (add recognition columns)
   ```sql
   ALTER TABLE images
   ADD COLUMN recognized_damage TEXT,
   ADD COLUMN recognized_part TEXT,
   ADD COLUMN recognition_status TEXT DEFAULT 'pending';
   ```

2. **Update RPC function** (add recognition parameters)

3. **Update Make.com UPLOAD_PICTURES scenario:**
   - Add ChatGPT Vision module
   - Add text parser
   - Update OneDrive filename format
   - Update Supabase RPC call

4. **Test with sample images:**
   - Upload image with front bumper scratch
   - Wait 10-20 seconds
   - Check database for recognized_damage and recognized_part
   - Check OneDrive for smart filename

5. **Optional: Add UI filters** (Phase 1B)
   - Filter by part
   - Filter by damage type
   - Display recognition badges

---

## Testing Checklist

- [ ] SQL columns added successfully
- [ ] RPC function updated with recognition parameters
- [ ] Make.com ChatGPT module configured
- [ ] Upload test image (front bumper scratch)
- [ ] Database shows recognized_damage and recognized_part
- [ ] OneDrive file has smart name (plate_damage_part.jpg)
- [ ] Upload test image (broken mirror)
- [ ] Recognition works correctly
- [ ] Upload 5 images at once
- [ ] All recognized correctly
- [ ] OneDrive has 5 files with smart names

---

**Status:** 📋 Design Complete - Ready for Implementation
**Estimated Time:** 30 minutes (SQL + Make.com updates)
**Cost:** ~$0.01 per image (ChatGPT Vision API)

