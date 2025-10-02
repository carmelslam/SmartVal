Test 1 :
[
  {
    "function_name": "advanced_parts_search",
    "parameters": "search_part_name text, search_limit integer, id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, part_name text, side_position text, front_rear text, version_date text, source text, extracted_year text, year_from integer, year_to integer, model_display text, match_score integer, cascade_level text, search_message text, search_trim text, search_model_code text, search_part_family text, search_source text, search_make text, search_model text, search_year integer"
  },
  {
    "function_name": "fix_hebrew_text",
    "parameters": "input_text text"
  },
  {
    "function_name": "normalize_make",
    "parameters": "make_input text"
  },
  {
    "function_name": "process_catalog_item_complete",
    "parameters": null
  },
  {
    "function_name": "reverse_hebrew",
    "parameters": "input_text text"
  },
  {
    "function_name": "simple_parts_search",
    "parameters": "year_to integer, search_make text, search_part_name text, search_limit integer, id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, part_name text, side_position text, front_rear text, version_date text, source text, extracted_year text, year_from integer, model_display text, match_score integer, cascade_level text, search_message text"
  },
  {
    "function_name": "smart_parts_search",
    "parameters": "model_param text, free_query_param text, part_param text, oem_param text, family_param text, limit_results integer, car_plate text, engine_code_param text, engine_type_param text, engine_volume_param text, model_code_param text, quantity_param integer, source_param text, trim_param text, vin_number_param text, year_param text, id uuid, cat_num_desc text, supplier_name text, pcode text, price numeric, oem text, make text, model text, part_family text, side_position text, version_date text, source text, extracted_year text, model_display text, match_score integer, make_param text"
  }
]


Test 2 :

[
  {
    "total_records": 48272,
    "unique_makes": 80,
    "unique_suppliers": 1,
    "oldest_record": "2025-09-30 16:05:43.923366+00",
    "newest_record": "2025-09-30 16:07:27.037217+00"
  }
]


Test 3 :

[
  {
    "make": "VAG",
    "record_count": 6878,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "ינימ / וו.מ.ב",
    "record_count": 3164,
    "status": "❌ REVERSED (should be BMW / מיני)"
  },
  {
    "make": "פולקסווגן",
    "record_count": 3106,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "טויוטה",
    "record_count": 2981,
    "status": "✅ CORRECT"
  },
  {
    "make": "מרצדס",
    "record_count": 2847,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "יאדנוי",
    "record_count": 2683,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "פורד",
    "record_count": 2451,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "אודי",
    "record_count": 2133,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "הדזמ",
    "record_count": 1713,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "היק",
    "record_count": 1380,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "ניסן",
    "record_count": 1334,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "ונר",
    "record_count": 1331,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "ישיבוצימ",
    "record_count": 1144,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "הדנוה",
    "record_count": 1116,
    "status": "⚠️ UNKNOWN"
  },
  {
    "make": "הדוקס",
    "record_count": 1104,
    "status": "⚠️ UNKNOWN"
  }
]

Test 4 :

[
  {
    "total_records": 48272,
    "has_part_name": 48272,
    "part_name_pct": "100.0",
    "has_part_family": 34829,
    "part_family_pct": "72.2",
    "has_model": 9686,
    "model_pct": "20.1",
    "has_year": 13828,
    "year_pct": "28.6",
    "has_oem": 121,
    "oem_pct": "0.3",
    "has_side": 36474,
    "side_pct": "75.6",
    "has_source": 48272,
    "source_pct": "100.0",
    "has_availability": 0,
    "availability_pct": "0.0"
  }
]

Test 5 :

[
  {
    "source": "חליפי",
    "record_count": 47225,
    "status": "✅ CORRECT (aftermarket)"
  },
  {
    "source": "תואם מקורי",
    "record_count": 1041,
    "status": "✅ CORRECT (original compatible)"
  },
  {
    "source": "יפיQלח4",
    "record_count": 4,
    "status": "⚠️ UNKNOWN"
  },
  {
    "source": "יפ(יWלח2",
    "record_count": 1,
    "status": "⚠️ UNKNOWN"
  },
  {
    "source": "יפי(לWח",
    "record_count": 1,
    "status": "⚠️ UNKNOWN"
  }
]


Test 6 :

[
  {
    "make": "טויוטה",
    "model": "קורולה",
    "year_from": 2005,
    "year_to": 2007,
    "part_name": "מגן",
    "part_family": "םישוגפו םינגמ",
    "source": "חליפי",
    "availability": null,
    "price": "1297.76",
    "cat_num_desc_sample": "ןגמ 'דק - הלורוק D5 סקנר 70-50"
  },
  {
    "make": "טויוטה",
    "model": null,
    "year_from": null,
    "year_to": null,
    "part_name": "קישוט",
    "part_family": "לירג",
    "source": "חליפי",
    "availability": null,
    "price": "470.35",
    "cat_num_desc_sample": "לירג 'דק םע טושיק רוחש וגייא -410"
  },
  {
    "make": "טויוטה",
    "model": null,
    "year_from": null,
    "year_to": null,
    "part_name": "מנוע",
    "part_family": "עונמ יקלחו עונמ",
    "source": "חליפי",
    "availability": null,
    "price": "414.12",
    "cat_num_desc_sample": "םלוב 'מי הסכמל עונמ ירמאק 510"
  },
  {
    "make": "טויוטה",
    "model": "X4",
    "year_from": null,
    "year_to": null,
    "part_name": "מנוע",
    "part_family": "עונמ יקלחו עונמ",
    "source": "חליפי",
    "availability": null,
    "price": "15453.08",
    "cat_num_desc_sample": "הסכמ עונמ - 220- X4ZB(אלומיניום)"
  },
  {
    "make": "טויוטה",
    "model": "0A",
    "year_from": null,
    "year_to": null,
    "part_name": "כיסוי",
    "part_family": "לא מוגדר",
    "source": "חליפי",
    "availability": null,
    "price": "12542.0112",
    "cat_num_desc_sample": "יוסיכ וו הרירג דק 'מש הלורוק 80)0A051218"
  }
]


Test 7 :

ERROR:  42703: column "part_name" does not exist
LINE 15:     part_name,

Test 8 :
[
  {
    "cascading_status": "❌ cascading_parts_search NOT FOUND"
  }
]

Test 9 :

[
  {
    "part_family": "לא מוגדר",
    "count": 13443,
    "status": "⚠️ NOT EXTRACTED"
  },
  {
    "part_family": "םישוגפו םינגמ",
    "count": 12941,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "הרואתו םיסנפ",
    "count": 6520,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "םייפנכו תותלד",
    "count": 6359,
    "status": "❌ REVERSED"
  },
  {
    "part_family": "לירג",
    "count": 2292,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "עונמ יקלחו עונמ",
    "count": 1658,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "הארמ",
    "count": 1205,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "מגנים ופגושים",
    "count": 1085,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "מנוע וחלקי מנוע",
    "count": 614,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "יוגיהו המילב תוכרעמ",
    "count": 575,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "שוגפ",
    "count": 376,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "תוארמו תונולח",
    "count": 263,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "דלתות וכנפיים",
    "count": 241,
    "status": "✅ CORRECT"
  },
  {
    "part_family": "פנסים ותאורה",
    "count": 228,
    "status": "⚠️ UNKNOWN"
  },
  {
    "part_family": "םיגימצו םילגלג",
    "count": 204,
    "status": "⚠️ UNKNOWN"
  }
]

Test 10:

[
  {
    "year_from": 2008,
    "year_to": 2010,
    "count": 259,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2006,
    "year_to": 2010,
    "count": 246,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2005,
    "year_to": 2008,
    "count": 228,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2009,
    "year_to": 2012,
    "count": 204,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2007,
    "year_to": 2010,
    "count": 201,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2008,
    "year_to": 2012,
    "count": 184,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2004,
    "year_to": 2008,
    "count": 179,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2003,
    "year_to": 2005,
    "count": 171,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2009,
    "year_to": 2011,
    "count": 163,
    "status": "✅ VALID RANGE"
  },
  {
    "year_from": 2010,
    "year_to": 2012,
    "count": 162,
    "status": "✅ VALID RANGE"
  }
]
