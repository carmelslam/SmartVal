Depreciation module :ALL TYPES
Task :
Build a depreciation UI module that handles the user’s inputs and insert them in the final report template / builder .
This is a dynamic module that is expected to handle several types of reports and be adjusted based on selections and definitions.
All required data to be pulled and auto filled already exist in the helper.js - you need to adapt to the helper.
Default type: PRIVATE 
* Style - keep the style and feel of the system like the other modules exactly

* ADD selection of the final report type. Selection from dropdown : 
    * חוות דעת פרטית 
    * חוות דעת גלובלית 
    * חוות דעת מכירה מצבו הניזוק
    *  חוות דעת טוטלוסט
    * חוות דעת אובדן להלכה 
* Selecting a report type opens the corresponded summary as detailed in the summary sections by type. 

* ADD selection of the final report client : דו”ח לחברה 
    * כן
    * לא
****if no , nothing changes - its the default mode 
****if yes , we need to add the sum of all vats costs from all sections : fees, damage centers costs, price adjustments in the summary section and include them in the final report summary as a reduction. When the client is a compony the vat is not calculated. 

* Imported dynamic data from helper.js -( this helper data is pulled from the draft / estimate if estimate exists) : 
Layout :
Fixed window - car data 
 Title  - נתוני רכב   ( from helper) 
1.  מספר רכב 
2. תוצרת
3. דגם 
4. שנת ייצור 
5. מחיר בסיס
6. תאריך הפקה 

Collapsible  price data window :
 Title  - נתוני תביעה  ( from helper) 
1. סה״כ תביעה ( subtotal of damage centers costs )
2.  חישוב הערך לנזק גולמי: list of all the relevant Levi parameters for price adjustment + percentage + value 
3. חישוב האחוז הגולמי.  
4. מחיר שוק :  base price + list of all the relevant Levi parameters for price adjustment + percentage + value 
5. סה”כ תביעה - autofills from helper the expertise/estimate(if exists)  the actual cost authorized. 
6. ערך השוק של הרכב -  autofilled from helper from the Levi adjustments section in the final report ( one section before the depreciation section ) 

Collapsible contact data window :
Title -  נתוני התקשרות : ( from helper) 
1. שם בעל הרכב
2. כתובת בעל הרכב
3. טלפון בעל הרכב
4. חברת ביטוח 
5. אימייל חברת ביטוח 
6. סוכן ביטוח 
7. טלפון סוכן ביטוח 
8. אימייל  סוכן ביטוח

The Depreciation INPUT  UI fields : 
Rules and flow :
Dynamic relevant fields are pulled from the helper .

UI Fields for depreciation bulk : 
1. חישוב ירידת הערך של הנזק ( bulk) (table style)
    - field name :  “the name of מוקד נזק “ from the helper. ==>> Input percentage field beside it (Pull: damage center name ( autofilled) from helper (מוקדי נזק ) )
    - Add field option- optionally allows the user to add manually more fields ( keeping the same structure as the above cells) 
    - Field name : ירידת ערך גלובלי  ===>>  input percentage field beside it 

    - IMPORTANT :` ***** No depreciation for Global and total lost report ****: If selected report types are חוות דעת מצבו הניזוק or חוות דעת טוטלוסט then hide / disable depreciation bulk . 

UI Fields for סיכום חוות הדעת - by types :
This section is dynamically changing according to the selection made in the final report type Selection from dropdown.
1. Report type  - Private  report summary structure :
    - Field name ערך השוק של הרכב  ==>> Data Pulled  from the price data window
    - Field name סה״כ תביעה ==>> Data Pulled  from the price data window
    - Field name : פיצוי בגין ירידת ערך ===>> Data Pulled previous calculation  of the percentage damage value (above)
    - Field name :   תוספות והורדות   ===>> Data Pulled from helper / Levi adjustments - this may be more than just one line (dynamic)
    - Add field option- optionally allows the user to add manually more fields ( keeping the same structure as the above cells) 
    - Subtotal : field name : סה״כ נכלל בחוות הדעת 
    - Data auto calculated - sum of the values in the former fields . ( including the optional fields) 

2. Report type  - Global report summary structure : NO INVOICE NEEDED FOR FINALIZATION 
    - Field name ערך השוק של הרכב  ==>> Data Pulled  from the price data window
    - Field name סה״כ נכלל בחוות הדעת ==>> Data Pulled  from the price data window
    - Field name : פיצוי בגין ירידת ערך ===>> Data Pulled previous calculation  of the percentage damage value (above)
    - Field name :   תוספות והורדות   ===>> Data Pulled from helper / Levi adjustments - this may be more than just one line (dynamic)
    - Add field option- optionally allows the user to add manually more fields ( keeping the same structure as the above cells) 
    - Subtotal : field name : סה״כ נכלל בחוות הדעת 
    - Data auto calculated - sum of the values in the former fields . ( including the optional fields) 


3. Report type -  חוות דעת טוטלוסט summary structure : NO INVOICE NEEDED FOR FINALIZATION 
    - *** If selected  report type is חוות דעת טוטלוסט then the summary bulk will look like etch following  : 
    - Field name ערך השוק של הרכב  ==>> Data Pulled  from the price data window
    - Field name - ערך שרידי הרכב===>> Value -  manual input  (calculated in minus )
    - Field name : תוספת בגין גרירה ואחסנה===>> Value : input manually (calculated in plus)
    - Add field option- optionally allows the user to add manually more fields ( keeping the same structure as the above cells) 
    - Subtotal : field name : סה״כ  לאחר מכירת שרידים  
    - Data auto calculated - sum of the values in the former fields . ( including the optional fields) 

4. Report type  - Report type  חוות דעת מצבו הניזוק summary structure : NO INVOICE NEEDED FOR FINALIZATION 
    - ***If selected report type is חוות דעת מצבו הניזוק then the summary bulk will look like etch following  : 
    - Field name ערך השוק של הרכב  ==>> Data Pulled  from the price data window
    - Field name ערך המכירה במצבו הניזוק  ====>>> Value -  manual input  (calculated in minus )
    - Add field option- optionally allows the user to add manually more fields ( keeping the same structure as the above cells) 
    - Subtotal : field name : סה״כ לאחר מכירה  
    - Data auto calculated - sum of the values in the former fields . ( including the optional fields) 

More needed inputs  for different types of final report ( חוות דעת ) - those field are visible based on the type selected  . 

1. Estimated work days in garage : FOR ALL TYPES 
    - Field name : ימי עבודה במוסך===>> Value : input manually
2. For חוות דעת גלובלית :
    - Field name : סיכום התביעה (ללא חשבונית) ==>> Value : pulled from the global final report חוות דעת גלובלית summary bulk 
    - Field name : מספר מוקדי הנזק המוסכם ==>> Value : manually input 
    - Field name :ערך שרידי הרכב  ==>> Value : manually input 
3. For  מכירה מצבו הניזוק and חוות דעת טוטלוסט:
    - Field name : הערכת אחוז הנזק ===>> Value : input manually 
    - Field name : ירידת  ערך  צפויה===>> Value :math engine auto- calculate : הערכת אחוז הנזק X ערך השוק של הרכב  ( Data Pulled  from the price data window)
4. Add : בהסדר/ לא בהסדר ( check box)  
If no agreement is selected then add the following sentence to the end of the summary legal text :
“נבקש לצור עם משרדנו קשר למייל   office@yc-shamaut.co.il המשך טיפול ולגרירת הרכב הניזוק למגרש שהוא בהסדר עם חברתכם כדי שירשם מספר יומן  כדין, תודה על שיתוף הפעולה” 
The sentence needs to live in the depreciation_module.js  , once לא בהסדר is selected , the sentence needs to be injected in the end of the legal text pulled from final report legal text.js


NEW SECTION- DIFFERENTIALS SECTION

1. Add “differentials section” : an optional section .its the difference between the invoice costs , parts, works and repairs and the actual authorization given by the assessor - if the garage / owner adds more components than what the assessor authorized this will cause differentials leading to unauthorized costs . Structure - fields and inputs , math engine calculation and comment field . 
2. Tite : הפרשים
    1. Query : ? האם קיימים הפרשים 
    2.  Check box : yes / no 
    3. If yes ---->>
        1. Detailed structure : allow add entry for multiple differentials 
        2. Fields names and values: 
        3.  Filed name חלק -  value : manual input 
        4.  Filed name מהות ההפרש  -  value :manual input 
        5.  Filed name סיבת ההפרש -  value :manual input 
        6. Filed name - מחיר ללא מע”מ-  value :manual input 
        7. Filed name - ערך מע”מ-  value :math engine auto-calculate  based on the set vat = admin -> default 
        8. Filed name - מחיר עם מע”מ-  value :math engine auto-calculate 
    4.  If no ——>> no action needed 
3. differentials section formula for the math engine - 
4. Table layout with additional fields option : this layout will be injected in the final report builder also for הפרשים if exists.
    1. Part 1 of the table : 
        1. סה”כ הפרשי חלקים  - calculate the sum of the unauthorized parts/ works prices 
        2.  סה”כ הפרשי מע”מ-  calculate the sum of the unauthorized parts/ works vat value 
        3.  סה”כ הפרשים - calculate the sum of : הפרשי חלקים + הפרשי מע”מ
    2. Part 2 of the table- summary of values : 
        1. סה”כ תביעה - autofills from the price data window
        2.  סה”כ הפרשים - pulls the  סה”כ הפרשים  calculated earlier 
        3.   סה”כ נזק שנתבע  <==  : סה”כ נזק מאושר- (minus)  סה”כ הפרשים 




Add option and button  :
הפקת סוג נוסף של חוות הדעת  —>
Opens the UI AGAIN , imported data in all sections is fixed . 

Data Logic: 
All data exported to helper and captured by the final report engine and builder 
All values inside legal texts ( according to selected type) filled from helper according to the user input in the UI 

Build  also the depreciation_module.js that supports the dynamic functionality of the depreciation.html . 
Connect tp the helper.js logic
Add missing conditional fields to the final report html builder. Depending on the sections made in the depreciation module 
Connect the math engine to perform local calculations according to the instructions above .
Use the CSS as in the fee-module.html .
If needed , adjust the helper.js to fully support the UI and the modularity of the system .



