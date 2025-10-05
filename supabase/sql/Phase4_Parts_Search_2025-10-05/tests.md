Get exact parameters :

[
  {
    "function_name": "smart_parts_search",
    "number_of_parameters": 17,
    "parameter_names": [
      "make_param",
      "model_param",
      "free_query_param",
      "part_param",
      "oem_param",
      "family_param",
      "limit_results",
      "car_plate",
      "engine_code_param",
      "engine_type_param",
      "engine_volume_param",
      "model_code_param",
      "quantity_param",
      "source_param",
      "trim_param",
      "vin_number_param",
      "year_param",
      "id",
      "cat_num_desc",
      "supplier_name",
      "pcode",
      "price",
      "oem",
      "make",
      "model",
      "part_family",
      "side_position",
      "version_date",
      "availability",
      "extracted_year",
      "model_display",
      "match_score",
      "year_from",
      "year_to"
    ],
    "parameter_types": "[0:16]={text,text,text,text,text,text,integer,text,text,text,text,text,integer,text,text,text,text}"
  }
]

Simple data check :

Test 1 :

[
  {
    "issue": "Part Description Check",
    "pcode": "VB89011622",
    "cat_num_desc": "011-017 קאיין - ראשי לפנס שפם",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VB89022622",
    "cat_num_desc": "016- פאנמרה - ראשי לפנס תפס",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE4512426",
    "cat_num_desc": "M-3 ראשי לפנס צמה",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE3137226G",
    "cat_num_desc": "13 קרוסובר- קד ערפל לפנס חוטים צמה",
    "part_family": "פנסים",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE3220610G",
    "cat_num_desc": "020- בלייזר - ראשי לפנס קסנון מחשב",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE430201",
    "cat_num_desc": "IS250H 014-018 - 'ימ ראשי פנס מחשב",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE5320602",
    "cat_num_desc": "D RS3 017-020 - 'שמ ראשי פנס לד מחשב",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE5320602",
    "cat_num_desc": "D RS3 017-020 - 'שמ ראשי פנס לד מחשב",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE5320603",
    "cat_num_desc": "A3 017-020 - 'ימ ראשי פנס לד מחשב",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  },
  {
    "issue": "Part Description Check",
    "pcode": "VBE5320603",
    "cat_num_desc": "A3 017-020 - 'ימ ראשי פנס לד מחשב",
    "part_family": "חלקי מרכב",
    "question": "Is word order backwards?"
  }
]

Test 2 ;

[
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "09-015 ~ )970( פאנמרה מנוע מגן",
    "year_from": 2015,
    "year_to": 2015,
    "year_range": "10-90",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "011-017 קאיין - ראשי לפנס שפם",
    "year_from": 2011,
    "year_to": 2017,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "כונס אויר קד' - קאיין (859) 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "גריל קד' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "כיסוי מתיז שמ' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "כיסוי ערפל שמ' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "גריל אמצע למגן קד' - קאין 410-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "חיזוק קד' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "מגן ק' חיצ'(מתיזים וחישנים) - קאיין 410-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "ספוילר קד' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "חיזוק פנ' למגן אח' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "מגן אח' תח' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "ספוילר מגן אח' קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "קישוט תח' למגן קד' - קאיין 710-110",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "עונמ ררוואמ + סנוכ הרמנאפ 510-90 (079)",
    "year_from": 2010,
    "year_to": 1990,
    "year_range": "10-90",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "11-017 קאיין - )חיישנים+מתזים עם( 'קד מגן",
    "year_from": 2017,
    "year_to": 2017,
    "year_range": "10-11",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "510-90 הרמנפ - 'נפ 'חא קוזיח",
    "year_from": 1990,
    "year_to": 2010,
    "year_range": "10-90",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "09-015 פנמרה - 'קד במגן מרכזי גריל",
    "year_from": 2015,
    "year_to": 2015,
    "year_range": "10-90",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "מגן קד' - מקאן 710-510",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  },
  {
    "issue": "Year Reversal Check",
    "cat_num_desc": "סט נעלי בלם אח' - אטראז' 910-410",
    "year_from": 2010,
    "year_to": 2010,
    "year_range": "10-10",
    "question": "Are years reversed like 810 instead of 018?"
  }
]

Test 3 :

[
  {
    "issue": "Source Field Check",
    "source": "יפילח",
    "count": 28195,
    "question": "Is Hebrew reversed?"
  },
  {
    "issue": "Source Field Check",
    "source": "חליפי",
    "count": 18985,
    "question": "Is Hebrew reversed?"
  },
  {
    "issue": "Source Field Check",
    "source": "ירוקמ םאות",
    "count": 647,
    "question": "Is Hebrew reversed?"
  },
  {
    "issue": "Source Field Check",
    "source": "תואם מקורי",
    "count": 394,
    "question": "Is Hebrew reversed?"
  },
  {
    "issue": "Source Field Check",
    "source": "רטומ) יפילח",
    "count": 13,
    "question": "Is Hebrew reversed?"
  }
]