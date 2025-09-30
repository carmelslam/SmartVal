# 🔍 Parts Search System Diagnostic Instructions

## EMERGENCY DIAGNOSTIC PROTOCOL

**CRITICAL**: Run these diagnostics BEFORE making any changes to understand the exact current state.

---

## 📋 DIAGNOSTIC CHECKLIST

### Phase 1: Database State Analysis (15 minutes)

1. **Run Master Database Diagnostic**
   - Open Supabase SQL Editor
   - Run `supabase/sql/MASTER_DIAGNOSTIC.sql`
   - **Expected Output**: Complete analysis of data state, field population, Hebrew encoding
   - **Save Results**: Copy all output to a text file

2. **Run Function Audit**
   - In Supabase SQL Editor  
   - Run `supabase/sql/FUNCTION_AUDIT.sql`
   - **Expected Output**: Which functions exist vs missing, dependency issues
   - **Critical Check**: Look for "STATUS: CRITICAL" message

3. **Initial Data Sample Review**
   - Check Hebrew text encoding in results
   - Note field population percentages
   - Identify price issues (astronomical values)

### Phase 2: UI Integration Testing (10 minutes)

1. **Open Browser Diagnostic Tool**
   - Open `current-state-analyzer.html` in browser
   - Ensure console is open (F12) to see any errors

2. **Run Service Tests** (in order):
   - Click "Test Service Loading" 
   - Click "Test Supabase Connection"
   - **Expected**: Green ✅ for Supabase, service availability status

3. **Run Search Tests**:
   - Click "Test Simple Search (פנס)"
   - Click "Test Advanced Search (טויוטה + פנס)" 
   - Click "Test RPC Function Directly"
   - **Critical**: Note if results are 0, astronomical prices, or unrelated

4. **Run Data Analysis**:
   - Click "Get Raw Data Samples"
   - Click "Test Hebrew Encoding"  
   - Click "Analyze Field Population"
   - **Check**: Hebrew text direction, field extraction status

5. **Test PiP Window**:
   - Click "Test PiP Window"
   - Click "Test PiP Scrolling"
   - **Verify**: Window opens, content scrolls properly

6. **Export Results**:
   - Click "Export All Findings" 
   - Click "Generate Summary Report"
   - **Save**: Both JSON and markdown files

### Phase 3: Analysis & Documentation (10 minutes)

1. **Compare Results**:
   - Database diagnostic vs UI test results
   - Function audit vs actual search behavior
   - Expected vs actual Hebrew encoding

2. **Identify Root Causes**:
   - Missing critical functions
   - Data extraction not working
   - Hebrew text reversal issues
   - Search logic problems

---

## 🚨 CRITICAL ISSUES TO LOOK FOR

### Database Issues:
- ❌ **Hebrew text completely reversed** (תלד instead of דלת)
- ❌ **Zero field extraction** (part_name, oem, side_position all NULL)
- ❌ **Astronomical prices** (> ₪100,000 for simple parts)
- ❌ **Source field reversed** (showing "ירוקמ" instead of "מקורי")

### Function Issues:
- ❌ **smart_parts_search missing** = No search will work
- ❌ **process_catalog_item missing** = No automatic extraction
- ❌ **reverse_hebrew missing** = Hebrew display broken
- ❌ **No triggers on catalog_items** = Manual processing only

### Search Issues:
- ❌ **Simple search returns 0** = Core search broken
- ❌ **Advanced search returns 0** = Filtering broken  
- ❌ **Results unrelated to query** = Search logic wrong
- ❌ **Make filtering not working** = Level 1 filtering broken

### UI Issues:
- ❌ **PiP window won't scroll** = CSS overflow issues
- ❌ **Service loading conflicts** = Multiple service files
- ❌ **RPC parameter mismatch** = Function signature vs service

---

## 📊 EXPECTED DIAGNOSTIC OUTCOMES

### If System is Working:
```
✅ Database: 48k+ records with extracted fields
✅ Functions: All 15 required functions present
✅ Search: Returns relevant results for Hebrew queries
✅ UI: PiP scrolls, services load correctly
✅ Prices: Reasonable range (₪50-₪5000 for most parts)
```

### If System is Broken (Current State):
```
❌ Database: Fields empty, Hebrew reversed
❌ Functions: Missing critical functions 
❌ Search: Returns 0 or unrelated results
❌ UI: PiP issues, service conflicts
❌ Prices: Astronomical or incorrect values
```

---

## 🔧 WHAT TO DO WITH RESULTS

### After Running Diagnostics:

1. **DO NOT FIX ANYTHING YET**
2. **Document all findings** in the exported files
3. **Share diagnostic results** before proceeding
4. **Identify which SQL files are safe to run** vs dangerous (containing DELETE)
5. **Plan targeted fixes** based on actual issues found

### Critical Decision Points:

- **If smart_parts_search missing**: Must deploy search functions first
- **If data completely reversed**: Must fix Hebrew encoding before search
- **If no automatic triggers**: Must deploy triggers before anything else
- **If PiP not scrolling**: CSS fix needed in UI files

---

## 📁 FILE LOCATIONS

### Database Diagnostics:
- `supabase/sql/MASTER_DIAGNOSTIC.sql` - Complete database analysis
- `supabase/sql/FUNCTION_AUDIT.sql` - Function existence check

### UI Diagnostics:  
- `current-state-analyzer.html` - Browser-based testing tool
- Downloads: diagnostic JSON + summary report

### Reference Files:
- `supabase migration/supbase and parts search module integration.md` - Requirements
- `DIAGNOSTIC_INSTRUCTIONS.md` - This file

---

## ⚠️ SAFETY WARNINGS

### DO NOT RUN:
- Any SQL files with DELETE statements
- Bulk UPDATE operations before diagnostics
- Complex deployment scripts without understanding current state

### SAFE TO RUN:
- SELECT-only diagnostic queries
- Browser testing tools (read-only)
- Function existence checks

### VERIFY BEFORE RUNNING:
- Always check SQL content for DELETE/DROP statements
- Test on small data samples first
- Have backup plan if things break

---

## 🎯 SUCCESS CRITERIA

**Diagnostics are complete when you can answer:**

1. ✅ How many catalog records exist and what condition are they in?
2. ✅ Which required functions exist vs missing?
3. ✅ Why does search return 0 or wrong results?
4. ✅ Is Hebrew text encoded correctly or reversed?
5. ✅ Are extracted fields populated or empty?
6. ✅ Does the UI connect properly to Supabase?
7. ✅ Can PiP window scroll and display results?
8. ✅ Are prices realistic or astronomical?

**Once you have clear answers to all 8 questions, you're ready to proceed with targeted fixes.**


**findings**

'supabase/sql/MASTER_DIAGNOSTIC.sql`
section 1:
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "column_name": "supplier_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "pcode",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "cat_num_desc",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "price",
    "data_type": "numeric",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "source",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "make",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "oem",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "availability",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "location",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "version_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "raw_row",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "row_hash",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "model",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "trim",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "vin",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "engine_volume",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "engine_code",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "part_family",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "supplier_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "engine_type",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "year_from",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "year_to",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "model_code",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "year_range",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "actual_trim",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "side_position",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "front_rear",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "catalog_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "part_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
]

section 2:
[
  {
    "check_type": "Records by Supplier:",
    "supplier_name": "מ.פינס בע\"מ",
    "record_count": 48272,
    "first_added": "2025-09-30 16:05:43.923366+00",
    "last_added": "2025-09-30 16:07:27.037217+00"
  }
]

section 3:
[
  {
    "total_records": 48272,
    "has_cat_num_desc": 48272,
    "has_part_name": 48272,
    "has_make": 48269,
    "has_model": 6810,
    "has_model_code": 3101,
    "has_trim": 0,
    "has_oem": 121,
    "has_year_from": 13828,
    "has_year_to": 13828,
    "has_year_range": 13828,
    "has_side_position": 2002,
    "has_front_rear": 1647,
    "has_part_family": 31289,
    "has_source": 48272,
    "has_price": 48251,
    "part_name_percent": "100.0",
    "oem_percent": "0.3",
    "year_extraction_percent": "28.6",
    "side_extraction_percent": "4.1",
    "family_extraction_percent": "64.8"
  }
]

section 4:
[
  {
    "analysis_type": "Make Field Analysis:",
    "make": "VAG",
    "count": 6907,
    "sample_desc": "- )'דק קלח בצינ( 'מש 'חא תלד ימוגל תבשות"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "ינימ / וו.מ.ב",
    "count": 3169,
    "sample_desc": "- ~ 5 הרדס LCI(G30( 'דק ןגמל היגרנא גפוס"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "ןגווסקלופ",
    "count": 3106,
    "sample_desc": "- )'דק קלח בצינ( 'מש 'חא תלד ימוגל תבשות"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "טויוטה",
    "count": 2981,
    "sample_desc": "- הלורוק - )לפרע אלל('מש לפרע סנפ תרגסמ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "סדצרמ",
    "count": 2847,
    "sample_desc": "- (W247) GLA - 'דק קלח 'מי 'חא ףנכ תשק"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "יונדאי",
    "count": 2683,
    "sample_desc": "- 016-018 הרטנליא - 'חת 'מש ימדק שלושמ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "דרופ",
    "count": 2451,
    "sample_desc": "- 015-018 גנטסומ - ילמשח יזכרמ ריוא סנוכ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "ידוא",
    "count": 2133,
    "sample_desc": "-017 ףלוג /Q3 /Q7 016 -015 - ןמש דירפמ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "מזדה",
    "count": 1713,
    "sample_desc": "- 3 הדזמ 'לד5 ןעטמ את הסכמב 'מש 'חא סנפ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "קיה",
    "count": 1380,
    "sample_desc": "- 'גאטרופס - 'מש רוא ריזחמ+'חא תותיא סנפ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "ןסינ",
    "count": 1334,
    "sample_desc": "- המיטלא תותיא סנפל רוח אלל 'מש 'דק ףנכ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "רנו",
    "count": 1331,
    "sample_desc": "- 014 ןאגמ- לד 5 'מי 'חא ןגמ ךמות"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "מיצובישי",
    "count": 1144,
    "sample_desc": "- 015-019 ןוטירט - 'דק קוזיחל 'מש 'לע ךמות"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "הונדה",
    "count": 1116,
    "sample_desc": "-03 דרוקא - 'ציח 'דק ןגמ"
  },
  {
    "analysis_type": "Make Field Analysis:",
    "make": "סקודה",
    "count": 1104,
    "sample_desc": "- הקטא/013-020 היבטקוא - יזכרמ עונמ ןגמ"
  }
]

section 5:

[
  {
    "info_type": "smart_parts_search Function Signature:",
    "arguments": "car_plate text DEFAULT NULL::text, make_param text DEFAULT NULL::text, model_param text DEFAULT NULL::text, model_code_param text DEFAULT NULL::text, trim_param text DEFAULT NULL::text, year_param text DEFAULT NULL::text, engine_volume_param text DEFAULT NULL::text, engine_code_param text DEFAULT NULL::text, engine_type_param text DEFAULT NULL::text, vin_number_param text DEFAULT NULL::text, oem_param text DEFAULT NULL::text, free_query_param text DEFAULT NULL::text, family_param text DEFAULT NULL::text, part_param text DEFAULT NULL::text, source_param text DEFAULT NULL::text, quantity_param integer DEFAULT 1, limit_results integer DEFAULT 50",
    "return_type": "TABLE(id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, front_rear text, year_range text, availability text, relevance_score integer, version_date date)"
  }
]

section 6:

[
  {
    "trigger_info": "Catalog_items Triggers:",
    "trigger_name": "01_catalog_items_set_supplier_name",
    "event_manipulation": "INSERT",
    "action_timing": "BEFORE",
    "action_statement": "EXECUTE FUNCTION _set_supplier_name()"
  },
  {
    "trigger_info": "Catalog_items Triggers:",
    "trigger_name": "01_catalog_items_set_supplier_name",
    "event_manipulation": "UPDATE",
    "action_timing": "BEFORE",
    "action_statement": "EXECUTE FUNCTION _set_supplier_name()"
  },
  {
    "trigger_info": "Catalog_items Triggers:",
    "trigger_name": "auto_process_catalog_item",
    "event_manipulation": "INSERT",
    "action_timing": "BEFORE",
    "action_statement": "EXECUTE FUNCTION process_catalog_item()"
  },
  {
    "trigger_info": "Catalog_items Triggers:",
    "trigger_name": "auto_process_catalog_item",
    "event_manipulation": "UPDATE",
    "action_timing": "BEFORE",
    "action_statement": "EXECUTE FUNCTION process_catalog_item()"
  },
  {
    "trigger_info": "Catalog_items Triggers:",
    "trigger_name": "auto_process_catalog_on_insert",
    "event_manipulation": "INSERT",
    "action_timing": "BEFORE",
    "action_statement": "EXECUTE FUNCTION auto_extract_catalog_data()"
  },
  {
    "trigger_info": "Catalog_items Triggers:",
    "trigger_name": "auto_process_catalog_on_update",
    "event_manipulation": "UPDATE",
    "action_timing": "BEFORE",
    "action_statement": "EXECUTE FUNCTION auto_extract_catalog_data()"
  }
]

section 7:

[
  {
    "part_type": "Toyota Parts Sample:",
    "id": "86d8f031-8201-43c7-a120-1425a1ebb51c",
    "cat_num_desc": "RV4 -011-מי ינוציח יאר",
    "make": "טויוטה",
    "model": null,
    "part_family": "מראה",
    "price": "1794.54",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "c3e267e2-24dc-4726-a5b1-0f1f3f1a639a",
    "cat_num_desc": "01-04 4-באר - 'מי 'דק ףנכ הנטיב",
    "make": "טויוטה",
    "model": null,
    "part_family": "פח",
    "price": "158.12",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "85196c94-d609-4584-a9eb-01055682b2f9",
    "cat_num_desc": "09-012 סיסנווא 'תיא+'שח ןימי הארמ",
    "make": "טויוטה",
    "model": null,
    "part_family": "מראה",
    "price": "1373.78",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "abd19a02-e9ff-49bb-a877-075e8335d541",
    "cat_num_desc": "SE ~ -018 ירמאק - 'מש ישאר סנפ",
    "make": "טויוטה",
    "model": null,
    "part_family": "פנס",
    "price": "7926.69",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "351fd513-974a-4dd8-885b-4c5642119f10",
    "cat_num_desc": "019- הלורוק - 'מי יעצמא לירג ךמות",
    "make": "טויוטה",
    "model": null,
    "part_family": "גריל",
    "price": "146.29",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "917b49b9-a335-4074-b8a2-040d19112bef",
    "cat_num_desc": "04-09 סויריפ יעצמא עונמ ןגמ",
    "make": "טויוטה",
    "model": null,
    "part_family": "פגוש",
    "price": "232.99",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "a74e1221-6a19-4e41-ae0d-a63d7e6e151b",
    "cat_num_desc": "018- ירמאק - 'חא ןגמ",
    "make": "טויוטה",
    "model": null,
    "part_family": "פגוש",
    "price": "7799.18",
    "oem": null
  },
  {
    "part_type": "Toyota Parts Sample:",
    "id": "ed1d1d49-adbf-4329-b202-debb1ca8cdb4",
    "cat_num_desc": "019- הלורוק - 'מש 'דק ץוב ןגמ",
    "make": "טויוטה",
    "model": null,
    "part_family": "פגוש",
    "price": "764.61",
    "oem": null
  }
]

Section 8 :
[
  {
    "sample_type": "High Price Samples:",
    "id": "f7cff6eb-e9af-4623-8b74-ab3d2e7908a0",
    "cat_num_desc": "ופס רבור'גנאר - 'חא הלתמל 'חת 'מש שלושמ",
    "make": "ר/רבורדנאל",
    "part_family": null,
    "price": "939000103.0",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "6f73c86c-b0d6-48de-a64d-0a173d96c2f8",
    "cat_num_desc": "W205 C-CLASS -020 - תבשות+'דק למס",
    "make": "סדצרמ",
    "part_family": null,
    "price": "234678011.891",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "5adcd08f-ccbf-4065-ab30-0d6ceeea8b69",
    "cat_num_desc": "רופס רבור'גנאר - 'חא הלתמל 'חת 'מי שלושמ",
    "make": "ר/רבורדנאל",
    "part_family": null,
    "price": "92940001.3",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "4aec17af-3494-4cbb-b8e3-ad60e536a364",
    "cat_num_desc": "G-CLASS ~ -018 - 'מי+'מש 'חא הטילפ דוד",
    "make": "סדצרמ",
    "part_family": null,
    "price": "34646603.9",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "21281439-b713-4f03-83e7-056d41354b88",
    "cat_num_desc": "06+ הטג - )בצינ( 'מש 'חא תלד ימוגל תבשות",
    "make": "ןגווסקלופ",
    "part_family": "פח",
    "price": "33721959.62",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "eb4d134b-1f83-42ac-8bf5-5f8e56805ffd",
    "cat_num_desc": "06+ הטג - )בצינ( 'מש 'חא תלד ימוגל תבשות",
    "make": "VAG",
    "part_family": "פח",
    "price": "33721959.62",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "32492ada-8674-4aed-a8bc-e5e42ffa1a37",
    "cat_num_desc": "דנלטואא - עבצל הנכה לקינ+ןעטמ תלד טושיק",
    "make": "מיצובישי",
    "part_family": "פח",
    "price": "13378091.92",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "bd8cf044-a333-4254-a8e5-810b13a82211",
    "cat_num_desc": "רדס )F30( - )שלושמ( 'מש 'דק הנטיב ךשמה",
    "make": "ינימ / וו.מ.ב",
    "part_family": null,
    "price": "12306178.835",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "407cafd8-3848-4d5a-a898-81eaf7a96347",
    "cat_num_desc": "ינשייח םע()W167) GLE-CLASS - 'חא ןגמ",
    "make": "סדצרמ",
    "part_family": "פגוש",
    "price": "11909199.13",
    "supplier_name": "מ.פינס בע\"מ"
  },
  {
    "sample_type": "High Price Samples:",
    "id": "99839fb4-676c-4843-9493-8938a9640aae",
    "cat_num_desc": "97-11היבטקוא/99-05הרוב 'מש עונמ תבשות",
    "make": "ןגווסקלופ",
    "part_family": null,
    "price": "9810264.83",
    "supplier_name": "מ.פינס בע\"מ"
  }
]

Section 9 :

[
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילח",
    "count": 47176,
    "sample_desc": "- 'גאטרופס - 'מש רוא ריזחמ+'חא תותיא סנפ"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "ירוקמ םאות",
    "count": 1041,
    "sample_desc": "-CLASS COUPE -019 - 'מי 'ציח 'חא סנפ"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "רטומ) יפילח",
    "count": 16,
    "sample_desc": "EJS4 -022 - 'דק יושיר תיחול תבשות"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילח(",
    "count": 12,
    "sample_desc": "-CLASS 4-018 - 'דק ןגמב 'חת לירג תרגסמ"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילחW",
    "count": 4,
    "sample_desc": "-CLASS( 012-018/)92 - 'דק ןגמב 'חת לירג"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפיQלח4",
    "count": 4,
    "sample_desc": "CK E-TRON -022 - 'דק ןגמל יזכרמ טושיק"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילח-",
    "count": 4,
    "sample_desc": "-CLASS COUPE - 'דק ןגמל 'חת 'מי טושיק"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילחQ",
    "count": 2,
    "sample_desc": "E-TRON/021 -22- קאינא - 'מש יארל סנפ"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפיל(Wח",
    "count": 2,
    "sample_desc": "CLASS 012-018 - 'מי ישאר סנפ םפש ךמות"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילח)",
    "count": 2,
    "sample_desc": "E-COUPE - 'מש 'דק לפרע יוסיכל 'חת טושיק"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילEחQ",
    "count": 1,
    "sample_desc": "247/E-CLASS/GLA/GLB - 'מש יאר תותיא"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילחE",
    "count": 1,
    "sample_desc": "W247) GLA/GLB -21 - תיזח חפל 'לע רשג"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילWח",
    "count": 1,
    "sample_desc": "OUPE - (EUR( -024( 'מש 'דק ןגמל רקלק"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפיל(חW",
    "count": 1,
    "sample_desc": "ASS COUPE -016 - 'דק ןגמל יזכרמ טושיק"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפי(לWח",
    "count": 1,
    "sample_desc": "ASS COUPE 14-018 - 'מי 'דק הלתמל עורז"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילPח",
    "count": 1,
    "sample_desc": "T8 XC60 -022 - 'מש ישאר סנפ םפש ךמות"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפ(יWלח2",
    "count": 1,
    "sample_desc": "SS COUPE 014-018 - 'דק המלצמ תבשות"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפיל)חW",
    "count": 1,
    "sample_desc": "ASS - ןעטמ תלד תחיתפל לגר ןשייח תבשות"
  },
  {
    "analysis_type": "Source Field Values:",
    "source": "יפילEח",
    "count": 1,
    "sample_desc": "167) GLE-COUPE-)לגלגב( ריוא ץחל ןשייח"
  }
]

Section 10 :
[
  {
    "test_type": "Direct Search Test - טויוטה:",
    "matching_records": 2981
  }
]

[

Summary 
  {
    "section": "=== DIAGNOSTIC SUMMARY ==="
  }
]


`current-state-analyzer.html` 
Test Service Loading
[23:49:25] 🔄 Testing service loading...
[23:49:25] ✅ Supabase client loaded successfully
[23:49:25] ✅ SimplePartsSearchService available
[23:49:25] ✅ SmartPartsSearchService available
[23:49:25] ❌ partsSearchService not available
[23:49:25] ✅ PiP functionality available

Test Supabase Connection
[23:49:57] ✅ Supabase connection successful
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=count&limit=1
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(0), selectFields: 'count'}

2. Search Function Analysis
[23:50:21] 🔄 Testing simple search for "פנס" (light)...
[23:50:21] Simple search returned 50 results
[23:50:21] Sample result: { "id": "fb70f0e3-6152-4d90-b723-a4fb31ef2050", "cat_num_desc": "CLASS COUPE -019 - 'מש 'ציח 'חא סנפ", "supplier_name": "מ.פינס בע\"מ", "pcode": "HEL2SD011786271", "price": 2925035.65, "oem": null, "make": "סדצרמ", "model": null, "part_family": "פנס", "side_position": null, "front_rear": null, "year_range": null, "availability": null, "relevance_score": 50, "version_date": "2025-09-30" }
[23:51:10] 🔄 Testing advanced search (Toyota + Light)...
[23:51:10] Advanced search returned 20 results
[23:51:10] Makes found: טויוטה
[23:51:10] Make filtering working: YES
[23:51:12] 🔄 Testing advanced search (Toyota + Light)...
[23:51:13] Advanced search returned 20 results
[23:51:13] Makes found: טויוטה
[23:51:13] Make filtering working: YES
[23:51:23] 🔄 Testing RPC function directly...
[23:51:23] ✅ RPC call successful, returned 10 results
[23:51:23] Sample RPC result: { "id": "fb70f0e3-6152-4d90-b723-a4fb31ef2050", "cat_num_desc": "CLASS COUPE -019 - 'מש 'ציח 'חא סנפ", "supplier_name": "מ.פינס בע\"מ", "pcode": "HEL2SD011786271", "price": 2925035.65, "oem": null, "make": "סדצרמ", "model": null, "part_family": "פנס", "side_position": null, "front_rear": null, "year_range": null, "availability": null, "relevance_score": 50, "version_date": "2025-09-30" }
 Console :
simplePartsSearchService.js:18 ✅ Supabase client initialized
simplePartsSearchService.js:50 🔍 Starting REAL search with params: {free_query: 'פנס'}
simplePartsSearchService.js:73 📤 Sending to RPC: {car_plate: null, make_param: null, model_param: null, model_code_param: null, trim_param: null, …}
supabaseClient.js:243 🔍 Supabase RPC request: smart_parts_search {car_plate: null, make_param: null, model_param: null, model_code_param: null, trim_param: null, …}
supabaseClient.js:260 ✅ RPC smart_parts_search success: 50 results
simplePartsSearchService.js:86 ✅ REAL search completed in 359ms, found 50 results
simplePartsSearchService.js:90 📋 Sample results: (2) [{…}, {…}]
simplePartsSearchService.js:91 🔍 Makes found: (10) ['סדצרמ', 'ינימ / וו.מ.ב', 'ןסינ', 'וולוו', 'ר/רבורדנאל', 'טויוטה', 'VAG', 'ןגווסקלופ', 'ידוא', 'מיצובישי']
simplePartsSearchService.js:18 ✅ Supabase client initialized
simplePartsSearchService.js:50 🔍 Starting REAL search with params: {make: 'טויוטה', free_query: 'פנס', limit: 20}
simplePartsSearchService.js:73 📤 Sending to RPC: {car_plate: null, make_param: 'טויוטה', model_param: null, model_code_param: null, trim_param: null, …}
supabaseClient.js:243 🔍 Supabase RPC request: smart_parts_search {car_plate: null, make_param: 'טויוטה', model_param: null, model_code_param: null, trim_param: null, …}
supabaseClient.js:260 ✅ RPC smart_parts_search success: 20 results
simplePartsSearchService.js:86 ✅ REAL search completed in 201ms, found 20 results
simplePartsSearchService.js:90 📋 Sample results: (2) [{…}, {…}]
simplePartsSearchService.js:91 🔍 Makes found: ['טויוטה']
supabaseClient.js:243 🔍 Supabase RPC request: smart_parts_search {free_query_param: 'פנס', limit_results: 10}
supabaseClient.js:260 ✅ RPC smart_parts_search success: 10 results


3. Data Sample Analysis

[23:53:25] 🔄 Getting raw data samples...
[23:53:26] ✅ Retrieved 5 sample records
[23:53:26] --- Sample 1 ---
[23:53:26] ID: 5f48e3f0-6430-45aa-8d63-22aaace7313c
[23:53:26] Cat_num_desc: 06- טפיוס - 'מש 'דק ףנכ
[23:53:26] Make: סוזוקי
[23:53:26] Part_family: פח
[23:53:26] Side_position: NULL
[23:53:26] Source: יפילח
[23:53:26] Price: 936.13
[23:53:26]
[23:53:26] --- Sample 2 ---
[23:53:26] ID: 70384488-dff5-45c4-bc47-7e809f37ef77
[23:53:26] Cat_num_desc: 09 דרוקא תיזח חפ יוסיכ
[23:53:26] Make: הונדה
[23:53:26] Part_family: NULL
[23:53:26] Side_position: NULL
[23:53:26] Source: יפילח
[23:53:26] Price: 407.79
[23:53:26]
[23:53:26] --- Sample 3 ---
[23:53:26] ID: cf89a5bc-7272-4ce6-89b5-d366082e5faf
[23:53:26] Cat_num_desc: R 205 ישאר סנפ ספת
[23:53:26] Make: פיג'ו
[23:53:26] Part_family: פנס
[23:53:26] Side_position: NULL
[23:53:26] Source: יפילח
[23:53:26] Price: 127.17
[23:53:26]
[23:53:26] --- Sample 4 ---
[23:53:26] ID: 67e18a84-100d-40a9-a97e-455d6cb94eca
[23:53:26] Cat_num_desc: 013- הלורוק ריווא תסינכ רוניצ
[23:53:26] Make: טויוטה
[23:53:26] Part_family: NULL
[23:53:26] Side_position: NULL
[23:53:26] Source: יפילח
[23:53:26] Price: 500
[23:53:26]
[23:53:26] --- Sample 5 ---
[23:53:26] ID: 23b50609-c247-49da-a01a-80c32523a81e
[23:53:26] Cat_num_desc: 011- ודארפ זיתמ לכימ
[23:53:26] Make: טויוטה
[23:53:26] Part_family: NULL
[23:53:26] Side_position: NULL
[23:53:26] Source: יפילח
[23:53:26] Price: 1055.31
[23:53:26]
[23:53:27] 🔄 Testing Hebrew text encoding...
[23:53:28] פנס (normal): 0 matches
[23:53:28] 🔄 Analyzing field population...
[23:53:28] סנפ (reversed): 0 matches
[23:53:29] דלת (normal): 0 matches
[23:53:29] Field Population Analysis (out of 1000 records):
[23:53:29] part_name: 1000 (100.0%)
[23:53:29] oem: 2 (0.2%)
[23:53:29] side_position: 488 (48.8%)
[23:53:29] front_rear: 315 (31.5%)
[23:53:29] part_family: 651 (65.1%)
[23:53:29] year_from: 159 (15.9%)
[23:53:29] year_to: 159 (15.9%)
[23:53:29] תלד (reversed): 0 matches
[23:53:29] טויוטה (normal): 0 matches

Console: supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?limit=5
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(0), selectFields: '*'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=cat_num_desc%2C+make&cat_num_desc=ilike.%25%25D7%25A4%25D7%25A0%25D7%25A1%25&limit=3
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(1), selectFields: 'cat_num_desc, make'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=cat_num_desc%2C+make&cat_num_desc=ilike.%25%25D7%25A1%25D7%25A0%25D7%25A4%25&limit=3
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(1), selectFields: 'cat_num_desc, make'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=part_name%2C+oem%2C+side_position%2C+front_rear%2C+part_family%2C+year_from%2C+year_to&limit=1000
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(0), selectFields: 'part_name, oem, side_position, front_rear, part_family, year_from, year_to'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=cat_num_desc%2C+make&cat_num_desc=ilike.%25%25D7%2593%25D7%259C%25D7%25AA%25&limit=3
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(1), selectFields: 'cat_num_desc, make'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=cat_num_desc%2C+make&cat_num_desc=ilike.%25%25D7%25AA%25D7%259C%25D7%2593%25&limit=3
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(1), selectFields: 'cat_num_desc, make'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=cat_num_desc%2C+make&cat_num_desc=ilike.%25%25D7%2598%25D7%2595%25D7%2599%25D7%2595%25D7%2598%25D7%2594%25&limit=3
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(1), selectFields: 'cat_num_desc, make'}


4. Price Analysis

[23:55:55] 🔄 Analyzing price distribution...
[23:55:55] 🔄 Getting high price samples...
[23:55:55] ❌ High price samples error: window.supabase.from(...).select(...).gt is not a function
[23:55:56] Price Analysis (1000 records):
[23:55:56] Min: ₪15.30
[23:55:56] Max: ₪2200109.00
[23:55:56] Average: ₪6836.94
[23:55:56] Median: ₪634.72
[23:55:56] Prices > ₪10,000: 13
[23:55:56] Prices > ₪100,000: 5
5

Console :

supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/catalog_items?select=price&price=not.is.null&limit=1000
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'catalog_items', filters: Array(1), selectFields: 'price'}


5. PiP Window & UI Test

[23:56:47] 🔄 Testing PiP window functionality...
[23:56:47] ✅ PiP window opened with 20 test items
[23:56:47] Check if PiP window is visible and scrollable
[23:57:03] 🔄 Testing PiP scrolling...
[23:57:04] ✅ Scroll test 1: Scrolled to middle
[23:57:04] ✅ Scroll test 2: Scrolled to bottom
[23:57:05] ✅ Scroll test 3: Scrolled back to top
[23:57:05] Scrolling appears to be working correctly
[23:57:07] ✅ PiP window closed


6. Complete Search Flow Test

[23:57:36] 🔄 Testing complete search flow...
[23:57:37] 🔄 Testing table population...
[23:57:37] ✅ parts_search_sessions table accessible
[23:57:37] ✅ parts_search_results table accessible
[23:57:37] ✅ selected_parts table accessible
[23:57:38] Step 1 - Search: 50 results
[23:57:38] Step 2/3 - Save operations failed: window.supabase.from(...).insert(...).select is not a function

Console :
simplePartsSearchService.js:18 ✅ Supabase client initialized
simplePartsSearchService.js:50 🔍 Starting REAL search with params: {make: 'טויוטה', free_query: 'פנס', plate: 'TEST-123-45'}
simplePartsSearchService.js:73 📤 Sending to RPC: {car_plate: 'TEST-123-45', make_param: 'טויוטה', model_param: null, model_code_param: null, trim_param: null, …}
supabaseClient.js:243 🔍 Supabase RPC request: smart_parts_search {car_plate: 'TEST-123-45', make_param: 'טויוטה', model_param: null, model_code_param: null, trim_param: null, …}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_sessions?select=count&limit=1
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'parts_search_sessions', filters: Array(0), selectFields: 'count'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/parts_search_results?select=count&limit=1
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'parts_search_results', filters: Array(0), selectFields: 'count'}
supabaseClient.js:336 🔍 Supabase GET request: https://nvqrptokmwdhvpiufrad.supabase.co/rest/v1/selected_parts?select=count&limit=1
supabaseClient.js:337 🔍 Request URL breakdown: {table: 'selected_parts', filters: Array(0), selectFields: 'count'}
supabaseClient.js:260 ✅ RPC smart_parts_search success: 50 results
simplePartsSearchService.js:86 ✅ REAL search completed in 1429ms, found 50 results
simplePartsSearchService.js:90 📋 Sample results: (2) [{…}, {…}]
simplePartsSearchService.js:91 🔍 Makes found: ['טויוטה']



7. Export Diagnostic Results

[23:58:32] ✅ Diagnostic data exported to JSON file
[23:58:32] File contains 10 diagnostic sections
[23:58:32] 🔄 Generating summary report...
[23:58:32] ✅ Summary report generated and downloaded




'supabase/sql/FUNCTION_AUDIT.sql` 

ERROR:  42883: function round(double precision, integer) does not exist
HINT:  No function matches the given name and argument types. You might need to add explicit type casts.
QUERY:  ROUND((existing_count::float / total_required * 100), 1)
CONTEXT:  PL/pgSQL function inline_code_block line 37 at RAISE

