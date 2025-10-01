Test 1 :
[
  {
    "check_type": "Function Deployment Status:",
    "function_name": "fix_hebrew_text",
    "parameters": "input_text text",
    "function_type": "🔤 Hebrew fix function"
  },
  {
    "check_type": "Function Deployment Status:",
    "function_name": "process_catalog_item_complete",
    "parameters": "",
    "function_type": "⚙️ Trigger function"
  },
  {
    "check_type": "Function Deployment Status:",
    "function_name": "smart_parts_search",
    "parameters": "make_param text, model_param text, free_query_param text, part_param text, oem_param text, family_param text, limit_results integer, car_plate text, engine_code_param text, engine_type_param text, engine_volume_param text, model_code_param text, quantity_param integer, source_param text, trim_param text, vin_number_param text, year_param text",
    "function_type": "🔍 Main search function"
  }
]

Test 2 :
[
  {
    "check_type": "Sample Makes:",
    "make": "VAG",
    "count": 6907
  },
  {
    "check_type": "Sample Makes:",
    "make": "ינימ / וו.מ.ב",
    "count": 3169
  },
  {
    "check_type": "Sample Makes:",
    "make": "ןגווסקלופ",
    "count": 3106
  },
  {
    "check_type": "Sample Makes:",
    "make": "טויוטה",
    "count": 2981
  },
  {
    "check_type": "Sample Makes:",
    "make": "סדצרמ",
    "count": 2847
  },
  {
    "check_type": "Sample Makes:",
    "make": "יונדאי",
    "count": 2683
  },
  {
    "check_type": "Sample Makes:",
    "make": "דרופ",
    "count": 2451
  },
  {
    "check_type": "Sample Makes:",
    "make": "ידוא",
    "count": 2133
  },
  {
    "check_type": "Sample Makes:",
    "make": "מזדה",
    "count": 1713
  },
  {
    "check_type": "Sample Makes:",
    "make": "קיה",
    "count": 1380
  }
]

Test 3 :

[
  {
    "test_type": "Hebrew Fix Function Test:",
    "input": "הלהת",
    "output": "תהלה",
    "status": "❌ Not working correctly"
  }
]

Test 4 :

[
  {
    "test_name": "Test 4 - Free query search:",
    "result_count": 10,
    "status": "✅ Returns results"
  }
]

Test 5 :

[
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "014-016 לבינרק - תיזח חפ",
    "make": "קיה",
    "part_name": "014-016 לבינרק - תיזח חפ",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "16 המיטפוא רצירפש לכימ",
    "make": "קיה",
    "part_name": "16 המיטפוא רצירפש לכימ",
    "part_family": "חלקי מרכב"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "018- המיטפוא - 'מי לפרע יוסיכ",
    "make": "קיה",
    "part_name": "ערפל",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "R 500 D-5 'חא ןגמ רקלק",
    "make": "טאיפ",
    "part_name": "מגן",
    "part_family": "מגנים ופגושים"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "021- לבינרק - 'מי 'דק הנטיב",
    "make": "קיה",
    "part_name": "021- לבינרק - 'מי 'דק הנטיב",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "14 ג'אטרופס-מי ריוא סנוכ",
    "make": "קיה",
    "part_name": "פס",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "12 זא'טרופס-'מש 'חא הנטיב",
    "make": "קיה",
    "part_name": "פס",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "6-019 'זאטרופס - תיזח חפב 'מש םפש ךמות",
    "make": "קיה",
    "part_name": "פס",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "16- 'גטרופס R לפרע יוסיכ",
    "make": "קיה",
    "part_name": "ערפל",
    "part_family": "לא מוגדר"
  },
  {
    "analysis_type": "Sample cat_num_desc:",
    "cat_num_desc": "05/2009 ימ וטנרוס - תיזח חפ",
    "make": "קיה",
    "part_name": "05/2009 ימ וטנרוס - תיזח חפ",
    "part_family": "לא מוגדר"
  }
]

Test 6 :

[
  {
    "test_name": "Multi-word Test 2 (פנס איתות):",
    "result_count": 10,
    "status": "✅ Fixed - Returns results"
  }
]

Test 7 :

[
  {
    "status_type": "Field Extraction Status:",
    "total_records": 48272,
    "has_part_name": 48272,
    "has_extracted_year": 10463,
    "has_model_display": 48272,
    "part_name_percentage": "100.0",
    "extraction_status": "✅ Good extraction"
  }
]

Test 8 :

[
  {
    "sample_type": "Sample Search Results:",
    "id": "5f2ae558-20f6-4d22-8f7e-49b20bd14742",
    "cat_num_desc": "ביטנה כנף קד' ימ' 2X4 - היילקס 50-20",
    "make": "טויוטה",
    "part_family": "דלתות וכנפיים",
    "extracted_year": "02-05",
    "model_display": "X2 (02-05)",
    "match_score": 20
  },
  {
    "sample_type": "Sample Search Results:",
    "id": "ded4792d-37f8-4424-950c-6a973da9c792",
    "cat_num_desc": "ביטנה כנף קד' ימ' - היילקס 10-89 2X4",
    "make": "טויוטה",
    "part_family": "דלתות וכנפיים",
    "extracted_year": "98-01",
    "model_display": "X2 (98-01)",
    "match_score": 20
  },
  {
    "sample_type": "Sample Search Results:",
    "id": "a6d1561e-2d90-4fa0-b34b-d65d5bbdcf07",
    "cat_num_desc": "ביטנה כנף קד' ימ' - היילקס 10-89 4X4",
    "make": "טויוטה",
    "part_family": "דלתות וכנפיים",
    "extracted_year": "98-01",
    "model_display": "X4 (98-01)",
    "match_score": 20
  },
  {
    "sample_type": "Sample Search Results:",
    "id": "4f5bdde0-ff2f-4a96-bb4a-7b641c2390a5",
    "cat_num_desc": "ביטנה כנף קד' ימ' - היילקס 79-29 2X4",
    "make": "טויוטה",
    "part_family": "דלתות וכנפיים",
    "extracted_year": "92-97",
    "model_display": "X2 (92-97)",
    "match_score": 20
  },
  {
    "sample_type": "Sample Search Results:",
    "id": "dd14c5df-1706-489c-9c5b-86d277bfd634",
    "cat_num_desc": "ביטנה כנף קד' שמ' - היילקס 79-29 2X4",
    "make": "טויוטה",
    "part_family": "דלתות וכנפיים",
    "extracted_year": "92-97",
    "model_display": "X2 (92-97)",
    "match_score": 20
  }
]



