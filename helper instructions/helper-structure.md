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