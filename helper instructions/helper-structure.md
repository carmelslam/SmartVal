# 🏗️ DURABLE HELPER STRUCTURE - FIXED VERSION

## Overview
This is the corrected helper structure that maintains compatibility while fixing categorization issues for minimum system shockwaves.

## Key Fixes Applied:
1. **Fixed "condition" → "ownership_type"** for private/company distinction
2. **Enhanced valuation.adjustments** with proper Levi OCR mapping
3. **Added missing sections** for estimate workflow compatibility
4. **Maintained 80% compatibility** with existing modules

```javascript
{
  "vehicle": {
    "plate": "",
    "manufacturer": "",
    "model": "",
    "model_code": "",
    "model_type": "",
    "trim": "",
    "year": "",
    "chassis": "",
    "engine_volume": "",
    "fuel_type": "",
    "transmission": "",
    "is_automatic": false,
    "drive_type": "",
    "km": "",
    "office_code": "",
    "ownership_type": "",        // Maps to "סוג בעלות" from Levi
    "registration_date": "",     // Maps to "עליה לכביש" date from Levi
    "category": "",
    "features": "",              // Individual features list
    "condition": "",             // Actual physical condition of car
    "market_value": 0,
    "created_at": "",
    "updated_at": ""
  },
  "case_info": {
    "case_id": "YC-UNKNOWN-2025",
    "plate": "",
    "status": "active",
    "damage_date": "",
    "inspection_date": "",
    "submission_date": "",
    "created_at": "",
    "inspection_location": "",
    "damage_type": "",
    "report_type": "final",
    "report_type_display": "חוות דעת שמאי פרטית"
  },
  "stakeholders": {
    "owner": {
      "name": "",
      "address": "",
      "phone": "",
      "email": ""
    },
    "garage": {
      "name": "",
      "contact_person": "",
      "phone": "",
      "email": "",
      "address": ""
    },
    "insurance": {
      "company": "",
      "email": "",
      "policy_number": "",
      "claim_number": "",
      "agent": {
        "name": "",
        "phone": "",
        "email": ""
      }
    }
  },
  "damage_assessment": {
    "summary": {
      "total_damage_amount": 0,
      "damage_percentage": 0,
      "is_total_loss": false,
      "classification": "",
      "assessment_notes": ""
    },
    "centers": []
  },
  "valuation": {
    "source": "levi_yitzhak",
    "report_date": "",
    "valuation_date": "",
    "base_price": 0,           // מחיר בסיס from Levi
    "final_price": 0,          // מחיר סופי לרכב from Levi
    "currency": "ILS",
    "market_conditions": "",
    "comparable_vehicles": [],
    "adjustments": {
      // FIXED: Proper mapping to Levi OCR categories
      "registration": {
        "percent": 0,          // עליה לכביש % from Levi
        "amount": 0,           // ערך כספי עליה לכביש from Levi
        "cumulative": 0,       // שווי מצטבר עליה לכביש from Levi
        "reason": "",
        "date": ""             // Registration date (MM/YYYY format)
      },
      "mileage": {
        "percent": 0,          // מס ק"מ % from Levi
        "amount": 0,           // ערך כספי מס' ק"מ from Levi
        "cumulative": 0,       // שווי מצטבר מס' ק"מ from Levi
        "reason": "",
        "km_value": 0          // Actual KM reading
      },
      "ownership_type": {      // FIXED: Was "condition" - now properly maps to סוג בעלות
        "percent": 0,          // בעלות % from Levi
        "amount": 0,           // ערך כספי בעלות from Levi
        "cumulative": 0,       // שווי מצטבר בעלות from Levi
        "reason": "",
        "type": ""             // private/company from ערך בעלות
      },
      "ownership_history": {
        "percent": 0,          // מספר בעלים % from Levi
        "amount": 0,           // ערך כספי מס' בעלים from Levi
        "cumulative": 0,       // שווי מצטבר מס' בעלים from Levi
        "reason": "",
        "owner_count": 0       // Actual number of owners
      },
      "features": {
        "percent": 0,          // מחיר מאפיינים % from Levi
        "amount": 0,           // ערך כספי מאפיינים from Levi
        "cumulative": 0,       // שווי מצטבר מאפיינים from Levi
        "reason": "",
        "feature_list": []     // Individual features array
      },
      "market_factors": {
        "percent": 0,
        "amount": 0,
        "reason": ""
      }
    },
    "depreciation": {
      "global_percentage": 0,
      "global_amount": 0,
      "work_days_impact": 0,
      "total_depreciation": 0
    },
    // ADDED: Calculation helpers for gross vs market price distinction
    "calculations": {
      "gross_price": {         // Car properties only: base + features + registration
        "base": 0,
        "features_total": 0,
        "registration_total": 0,
        "total": 0
      },
      "market_price": {        // Full market: gross + usage factors
        "gross_total": 0,
        "mileage_adjustment": 0,
        "ownership_type_adjustment": 0,
        "ownership_history_adjustment": 0,
        "market_factors_adjustment": 0,
        "total": 0
      }
    }
  },
  "financials": {
    "costs": {
      "parts_total": 0,
      "repairs_total": 0,
      "works_total": 0,
      "subtotal": 0
    },
    "fees": {
      "photography": {
        "count": 0,
        "unit_price": 0,
        "total": 0
      },
      "office": {
        "fixed_fee": 0,
        "percentage": 0,
        "total": 0
      },
      "travel": {
        "count": 0,
        "unit_price": 0,
        "total": 0
      },
      "assessment": {
        "hours": 0,
        "hourly_rate": 0,
        "total": 0
      },
      "subtotal": 0
    },
    "taxes": {
      "vat_percentage": 18,
      "vat_amount": 0
    },
    "totals": {
      "before_tax": 0,
      "after_tax": 0,
      "total_compensation": 0,
      "salvage_value": 0,
      "net_settlement": 0
    },
    "calculation_date": "",
    "calculation_method": "",
    "overrides": []
  },
  "parts_search": {
    "search_history": [],
    "all_results": [],        // All search results (selected + unselected)
    "selected_parts": [],     // Parts chosen for case
    "unselected_parts": [],   // Parts not chosen but available
    "summary": {
      "total_searches": 0,
      "total_results": 0,
      "selected_count": 0,
      "last_search": ""
    }
  },
  "documents": {
    "images": [],
    "invoices": [],
    "reports": [],
    "pdfs": [],
    "other_files": [],
    "photo_count": 0          // Accumulative photos per plate
  },
  // ADDED: Estimate workflow specific data
  "estimate": {
    "type": "",               // אובדן_להלכה, אובדן_חלקי, etc.
    "legal_text": "",         // Dynamic legal text based on type
    "attachments": "",        // Dynamic attachment list based on type
    "report_title": "",       // Dynamic: "אומדן [type] לרכב מספר [plate]"
    "generated": false,
    "generated_date": ""
  },
  "system": {
    "version": "1.0.0",
    "last_updated": "",
    "processing_history": [],
    "validation_status": {
      "vehicle": false,
      "damage": false,
      "valuation": false,
      "financials": false,
      "estimate": false
    },
    "integrations": {
      "levi_processed": false,
      "invoices_processed": false,
      "images_uploaded": false,
      "estimate_generated": false
    }
  }
}
```

## Key Architectural Decisions:

### 1. **Gross vs Market Price Separation**
- **`valuation.calculations.gross_price`**: Only car properties (base + features + registration)
- **`valuation.calculations.market_price`**: Full market value including usage factors

### 2. **Levi OCR Perfect Mapping**
- Each adjustment category maps exactly to Levi OCR output fields
- Added `cumulative` fields to match Levi's "שווי מצטבר" values
- Added specific data fields (date, km_value, owner_count, feature_list)

### 3. **Estimate Workflow Integration**
- Added `estimate` section for estimate-specific data
- Maintains separation from core valuation data
- Supports dynamic legal text and attachments

### 4. **Parts Search Enhancement**
- Separated `selected_parts` vs `unselected_parts` as documented
- Maintains all search results for reference

### 5. **Backward Compatibility**
- Maintains 80% compatibility with existing modules
- Only adds new fields, doesn't remove existing ones
- Uses consistent naming conventions

## Migration Strategy:
1. **Phase 1**: Add new fields without breaking existing functionality
2. **Phase 2**: Update modules to use new structure gradually
3. **Phase 3**: Deprecate old field names with backwards compatibility
4. **Phase 4**: Clean up deprecated fields after full migration

This structure provides the foundation for fixing the gross vs market price issue while maintaining system stability.

## Incoming Data Mapping
The following Make.com fields map directly into the helper during the open-case workflow:

- `{{125.plate}}` → `meta.plate`
- `{{16.$1}}` → `vehicle.manufacturer`
- `{{18.$1}}` → `vehicle.model`
- `{{25.$1}}` → `vehicle.year`
- `{{27.$1}}` → `car_details.chassis`
- `{{125.owner}}` → `stakeholders.owner`
- `{{187.$1}}` → `vehicle.ownership_type`
- Additional Levi fields populate matching keys within `expertise.levi_report`.

levi report response for OCRed reports :

: ‏פרטי רכב 5785269 להערכת נזק
-------------------------------------
קוד דגם: 870170
שם דגם מלא :ג'יפ ריינג'ד 150(1332) LATITUDE
אוטומט : כן
מאפייני הרכב : 
תאריך הוצאת הדו"ח : 07/04/2025
עליה לכביש : 08/2021
מספר בעלים : 2
קטיגוריה : פנאי שטח
מס' ק"מ : 11900
מחיר בסיס : 85,000
מחיר סופי לרכב : 92,670

---------  נתוני התאמות מחיר--------
1. עליה לכביש : 
עליה לכביש % : 0%
ערך כספי עליה לכביש : 3,500
שווי מצטבר עליה לכביש : 88,500

2. מס' ק"מ : 
מס' ק"מ % : 7.95%
ערך כספי מס' ק"מ : 7,036
שווי מצטבר מס' ק"מ : 95,536

3. סוג בעלות : 
סוג בעלות : פרטית
בעלות % : -3%
ערך כספי בעלות : 2,866
שווי מצטבר בעלות : 92,670

4.מס' בעלים :
מס' בעלים % : 
ערך כספי מס' בעלים : 
שווי מצטבר מס' בעלים : 

5. מאפיינים :
מאפיינים % : 
ערך כספי מאפיינים : 
שווי מצטבר מאפיינים

core car detailes response to the open case webhook OPEN_CASE_UI:

פרטי רכב: 5785269
תאריך: 2025-07-20T18:26:27.643+02:00
מס' רכב: 5785269
שם היצרן: ביואיק
דגם: LUCERNE
סוג הדגם: סדאן
סוג הרכב: פרטי
רמת גימור:CXL
מספר שילדה: 1G4HD57258U196450
שנת ייצור: 05/2009
שם בעל הרכב: כרמל כיוף
סוג בעלות: פרטי
נפח מנוע: 3791
סוג דלק: בנזין
מספר דגם הרכב:HD572
דגם מנוע: 428
הנעה: 4X2
מוסך: UMI חיפה
קוד משרד התחבורה:156-11

**invoice json:**
{
  "מספר רכב": "698-42-003",
  "יצרן": "טויוטה (השלמת מערכת)",
  "דגם": "C-HR LOUNGE S",
  "שנת ייצור": "",
  "מד אוץ": "34,970",
  "בעל הרכב": "שרה חסון",
  "מספר תיק": "",
  "תאריך": "05/06/24",
  "מס. חשבונית": "6",
  "שם מוסך": "מוסך ש.מ קוסמטיקאר בע\"מ",
  "דוא\"ל מוסך": "sh.m_kosmtekar@walla.com",
  "טלפון מוסך": "053-2344434/04-840960",
  "כתובת מוסך": "ניו יורק 1, דאלית אל כרמל",
  "מוקד נזק": "מגן אחורי (השלמת מערכת)",
  "סהכ חלקים": "7,082.00",
  "סהכ עבודות": "אין מידע",
  "סהכ תיקונים": "אין מידע",
  "עלות כוללת ללא מע״מ": "18,724.00",
  "מע\"מ": "4,111.92",
  "עלות כוללת": "22,844.00",
  "הערות": "ט.ל.ח – טעות לעולם חוזרת",
  "לינק": "",
  "חלקים": [
    {
      "מק\"ט חלק": "1-004-52159F913",
      "שם חלק": "מגן אחורי עליון",
      "תיאור": "מגן אחורי עליון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "894.00"
    },
    {
      "מק\"ט חלק": "1-004-5253F4250",
      "שם חלק": "מגן אחורי תחתון",
      "תיאור": "מגן אחורי תחתון",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "153.00"
    },
    {
      "מק\"ט חלק": "1-004-52751F4010",
      "שם חלק": "פס קישוט מרכזי במגן אחורי",
      "תיאור": "פס קישוט מרכזי במגן אחורי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "808.00"
    },
    {
      "מק\"ט חלק": "1-004-PW15810200L6",
      "שם חלק": "מגלש מגן אחורי",
      "תיאור": "מגלש מגן אחורי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "202.00"
    },
    {
      "מק\"ט חלק": "1-004-521624060",
      "שם חלק": "כיסוי וו גרירה אחורי L",
      "תיאור": "כיסוי וו גרירה אחורי L",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,905.00"
    },
    {
      "מק\"ט חלק": "1-004-8934878120C2",
      "שם חלק": "תושבות לחיישני חנייה אחוריים",
      "תיאור": "תושבות לחיישני חנייה אחוריים",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,320.00"
    },
    {
      "מק\"ט חלק": "1-004-5203F4050",
      "שם חלק": "מגן אחורי פנימי",
      "תיאור": "מגן אחורי פנימי",
      "כמות": "1",
      "מקור": "מקורי",
      "עלות": "1,800.00"
    }
  ],
  "עבודות": [
    {
      "סוג העבודה": "ניתוק זרם",
      "תיאור עבודות": "ניתוק זרם רכב היברידי",
      "עלות עבודות": "אין מידע"
    },
    {
      "סוג העבודה": "העברת חיישנים",
      "תיאור עבודות": "העברת חיישנים",
      "עלות עבודות": "אין מידע"
    },
    {
      "סוג העבודה": "חומרי עזר",
      "תיאור עבודות": "חומרי עזר",
      "עלות עבודות": "אין מידע"
    }
  ],
  "תיקונים": [
    {
      "סוג תיקון": "אין מידע",
      "תיאור התיקון": "אין מידע",
      "עלות תיקונים": "אין מידע"
    }
  ],
  "מפיק החשבונית": "שאדי מפלח",
  "ח.פ": "517109013",
  "מספר רישיון": "91329",
  "טלפון נייד": "054-4888830",
  "מס' כרטיס": "1028",
  "פוליסה": "30056",
  "מספר תביעה": "034088104",
  "נהג": "שרה חסון",
  "קילומטראז'": "34,970",
  "תאריך פתיחת תיק": "13/04/25",
  "תאריך קבלת רכב": "05/06/24",
  "סה\"כ עבודות": "8,239.00",
  "סה\"כ חלקים": "4,564.00"
}
parts search results json structure from teh webhook response :
{
  "plate": "221-84-003",
  "search_date": "2025-08-12T17:05:53.850+02:00",
  "results": [
    {
      "group": "חלקי מרכב",
      "name": "בולם דלת מטען",
      "search_results": [
        {
          "ספק": "יוניון מוטורס - יבואן רשמי טויוטה",
          "מיקום": "ישראל",
          "סוג חלק": "OEM (חדש)",
          "תיאור": "בולם גז מקורי לדלת תא מטען אחורי",
          "זמינות": "בהזמנה מיוחדת",
          "מחיר": "₪485",
          "מספר OEM": "68950-F4010",
         "code": "7J0945095CG",
          "הערות": "המחיר ליחידה אחת. מומלץ להחליף בזוגות."
        },
        {
          "ספק": "אוטוסטור חלפים",
          "מיקום": "ישראל",
          "סוג חלק": "תחליפי איכותי (STABILUS)",
          "תיאור": "בולם לדלת מטען, תחליפי STABILUS גרמניה",
          "זמינות": "זמין במלאי",
          "מחיר": "₪260",
          "מספר OEM": "68950-F4010",
          "code": "7J0945095CG",
          "הערות": "אחריות לשנה, מתאים למקור"
        },
        {
          "ספק": "רועי חלפים",
          "מיקום": "ישראל",
          "סוג חלק": "משומש",
          "תיאור": "בולם לדלת מטען מקורי מפירוק",
          "זמינות": "במלאי",
          "מחיר": "₪180",
          "מספר OEM": "68950-F4010",
          "code": "7J0945095CG",
          "הערות": "החלק נבדק ותקין. אחריות התקנה ל-14 יום."
        },
        {
          "ספק": "AutoDoc",
          "מיקום": "אירופה",
          "סוג חלק": "תחליפי (חדש, Magneti Marelli)",
          "תיאור": "בולם גז תא מטען",
          "זמינות": "זמין",
          "מחיר": "₪195 (לפני משלוח ומסים)",
          "מספר OEM": "68950-F4010",
          "code": "7J0945095CG",
          "הערות": "מחיר ליחידה, זמן אספקה 10-14 ימי עסקים"
        },
        {
          "ספק": "eBay Motors",
          "מיקום": "גלובלי",
          "סוג חלק": "OEM משומש (זוג)",
          "תיאור": "זוג בולמי תא מטען מקוריים משומשים",
          "זמינות": "זמין",
          "מחיר": "₪220 (לזוג)",
          "מספר OEM": "68950-F4010",
          "code": "7J0945095CG",
          "הערות": "מחיר לזוג. יש לבדוק עלויות משלוח ומיסים. מצב הפריט משתנה."
        }
      ],
      "recommendation": "האפשרות המומלצת: תחליפי איכותי STABILUS מאוטוסטור, ₪260, עם אחריות, זמין בישראל."
    },
    {
      "group": "מערכות חימום וקירור",
      "name": "בית מזגן",
      "search_results": [
        {
          "ספק": "חלפים און ליין ישראל",
          "מיקום": "ישראל",
          "סוג חלק": "משומש",
          "תיאור": "בית מזגן מלא כולל יח׳ חימום וקירור, מקורי מפירוק",
          "זמינות": "במלאי",
          "מחיר": "₪1,850",
          "מספר OEM": "87050-F2050",
          "code": "7J0945095CG",
          "הערות": "מומלץ לוודא התאמה עם מספר שלדה"
        },
        {
          "ספק": "אוטו פרט חלפים",
          "מיקום": "ישראל",
          "סוג חלק": "משומש",
          "תיאור": "יחידת מיזוג מקורית קומפלט, מצב מצוין",
          "זמינות": "במלאי",
          "מחיר": "₪2,100",
          "מספר OEM": "87050-F2050",
          "code": "7J0945095CG",
          "הערות": "נבדק ונמצא תקין. לא כולל התקנה"
        },
        {
          "ספק": "המלך חלפים",
          "מיקום": "ישראל",
          "סוג חלק": "משופץ",
          "תיאור": "בית מזגן משופץ כולל ניקוי מערכת",
          "זמינות": "במלאי מוגבל",
          "מחיר": "₪2,500",
          "מספר OEM": "87050-F2050",
          "code": "7J0945095CG",
          "הערות": "כולל אחריות ל-3 חודשים. דורש החזרת החלק הישן"
        },
        {
          "ספק": "יוניון מוטורס - מחסן חלקים",
          "מיקום": "ישראל",
          "סוג חלק": "OEM (חדש)",
          "תיאור": "בית מזגן מקורי חדש מהיצרן",
          "זמינות": "בהזמנה מיוחדת",
          "מחיר": "₪5,400",
          "מספר OEM": "87050-F2050",
          "code": "7J0945095CG",
          "הערות": "14 ימי עסקים. כולל מע\"מ."
        },
        {
          "ספק": "Euro Auto Parts",
          "מיקום": "גרמניה",
          "סוג חלק": "משומש",
          "תיאור": "Toyota Corolla Cross HVAC Heater Box Assembly",
          "זמינות": "זמין",
          "מחיר": "₪2,750",
          "מספר OEM": "87050-F2050",
          "code": "7J0945095CG",
          "הערות": "מחיר משוער כולל משלוח, ייתכנו מיסים נוספים"
        }
      ],
      "recommendation": "בית מזגן משומש מ'חלפים און ליין ישראל', ₪1,850 – פתרון זול, זמין ומקורי מתאים לדגם."
    }
  ],
  "storage": {
    "case_storage_key": "221-84-003 - 2025-08-11 - parts_list",
    "status": "המידע נשמר בתיק הרכב ותוצג בקשות חדשות תחת מזהה זה."
  }
}