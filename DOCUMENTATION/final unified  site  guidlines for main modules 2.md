

Modifications: 


Site url live : https://yaron-cayouf-portal.netlify.app/index.htm
New url for this version : https://yaron-cayouf-shamaut.netlify.app/

Login screen :
Webhook -> returns login successful / Error
 https://hook.eu2.make.com/ho2ogzkuwxg66klgkin7nattl1nr7o6y
Mandatory to have confirmation for successful / error log In


Start a report page - the same structure as today with addition to be detailed below.


Pages structures : 

Initiate report screen : 
1. Entrance screen : 
- Plate number 
- Owner name 
- Date of inspection ( by default shows today) but has a date picker option 
- Location of inspection  

Start report button : Webhook -> : https://hook.eu2.make.com/ho2ogzkuwxg66klgkin7nattl1nr7o6y
. 

There is a response webhook 

The post returns car details  in a floating screen that can be pulled out through the process with full output 


    - Optional field for the user : האם להעלות את דו"ח יצחק לוי עכשיו ?  Yes -->
      
       - upload Levi izhak report page: 
        -  Upload image field
        - Send ( to webhook https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9

        - if the user upload the report - 3 additional data need to be posted back in the floating                  
            screen:
            * Price 
            * Model code 
            * Car type : private/ company leasing . 
            - This will update the floating screen in the details via the same post from the first    
             page : 
                
       
  - User confirms . Move to next page - פרטים כלליים  page: General information.HTML

2. General information input : 
   Fields with the following list - and text field for input: 
    -  מד אוץ
‏                            DD/MM/YYY    - תאריך הנזק   - date picker that  shows today by default - 
    - כתובת בעל הרכב
    - טלפון בעל הרכב 
    - מוסך מטפל
    - אימייל מוסך
    - סוג נזק
    - חברת ביטוח  :- dropdown 
    - הראל, איילון, הפניקס, מנורה, מגדל, ליברה, כלל ביטוח, ביטוח ישיר, אחרת  
    - Ability to add manually 
    - סוכן ביטוח
    - מקום בדיקה  

    - Continue button תיאור הנזק  page :  damage_description.html

3.Damage center no .1  -for car no. ( automatically ) drop box with option 
Title : תיאור הנזק
מוקד נזק 1
(-),חזית, קדמי ימין, ימין קדמי, ימין, אחורי ימין, ימין אחורי, אחורי, אחורי שמאל, שמאל אחורי, שמאל, שמאל קדמי, קדמי שמאל, סביב הרכב, פנים הרכב, מיכאני, אחר 

Page =  damage_description.html - תיאור כללי

    - Description of the damage ( predefined text with the damage center name from the drop box 
בבדיקת הרכב הנדון נוכחנו בנזקים תאונתיים לחלקו      )הקדמי  (   של הרכב.    …………….input.. נמצאו ניזוקים וטעונים תיקון .
    - Free text 
    - 
   Continue button - עבודות וחלקים    page :repairs_parts.html  
    -   
Section title :  page :repairs_parts.html 

 עבודות וחלקים רכב מס. ------ Sessionstorsge-------==
 
Page title :   -------תיקונים רכב מס.  page :repairs.html 

4. Repairs : 
    - Free input fields , repairs no. 1 : name , description , cost - in   Hebrew 
    - Option to add another field : repair no. 2 : name,  description , cost
    - …… and so on 

Continue button -  חלקים. page :parts.html 

5.Parts : -----   חלקים רכב מס      page :parts.html  

 
    - Free input fields , part no. 1 : name , description , source 
    - Source from a dropdown :
חליפי/מקורי,חליפי/משומש,חדש מקורי,חליפי,משומש,ריק

    - Option to add another field : part no. 2 : name description 
    - …… and so on 

Continue button -  עבודות   page :work.html 

6.Works :  -----   עבודות  רכב מס.  page :work.html 

    - ( תקנה 389 ) only options/ dropdown:  yes/ no / not applicable  .
    - Add button:
    - Dropbox with options : 
כל עבודות הפחחות כולל פירוקים והרכבות
        * עבודות צבע
        * עבודות חשמל
        * עבודות מכונאות
        * עבודות מזגן
        * עבודות ריפוד
        * עבודות זגגות
        * איטום וזיפות
        * בדיקת מתלה
        * הנזק מחייב תקנה 309
        * כיול רדאר
        * העברת חיישנים
        * אחר:
        - Input fields 
    - Add button:
    - Dropbox with options
        - Input fields 
    - Add button: and so on .. 
    - 
“ADD DAMAGE” BUTTON: 
The same bulk like the previous one opens - empty - ( from damage center part till the works part) 
- 
7. Damage center no .2  -for car no. ( automatically ) drop box with option 
    - Description of the damage ( predefined text with the damage center name from the drop box 
    - Free text 
    Continue 

8. Repairs : 
    - Free input fields , repairs no. 1 : name , description 
    - Option to add another field : repair no. 2 : name description 
    - …… and so on 
9. Parts : 
    - Free input fields , part no. 1 : name , description 
    - Option to add another field : part no. 2 : name description 
    - …… and so on 
10. Works : 
    - ( תקנה 389 ) only options yes/ no / not applicable 
    - Add button:
    - Dropbox with options
        - Input fields 
    - Add button:
    - Dropbox with options
        - Input fields 
    - Add button: and so on .. 
ADD DAMAGE BUTTON: AND SO ON  
 Continue button ----> הערות כלליות page: General_comments.html

.The damage centers section instructions :
 General information input : 
   Fields with the following list - and text field for input: 
    -  מד אוץ
                            DD/MM/YYY    - תאריך הנזק   - date picker that  shows today by default - 
    - כתובת בעל הרכב
    - טלפון בעל הרכב 
    - מוסך מטפל
    - אימייל מוסך
    - סוג נזק
    - חברת ביטוח  :- dropdown 
    - הראל, איילון, הפניקס, מנורה, מגדל, ליברה, כלל ביטוח, ביטוח ישיר, אחרת  
    - Ability to add manually 
    - סוכן ביטוח
    - מקום בדיקה  

    - Continue button תיאור הנזק  page :  damage_description.html

3.Damage center no .1  -for car no. ( automatically ) drop box with option 
Title : תיאור הנזק
מוקד נזק 1
(-),חזית, קדמי ימין, ימין קדמי, ימין, אחורי ימין, ימין אחורי, אחורי, אחורי שמאל, שמאל אחורי, שמאל, שמאל קדמי, קדמי שמאל, סביב הרכב, פנים הרכב, מיכאני, אחר 

 תיאור כללי

    - Description of the damage ( predefined text with the damage center name from the drop box 
בבדיקת הרכב הנדון נוכחנו בנזקים תאונתיים לחלקו      )הקדמי  (   של הרכב.    …………….input.. נמצאו ניזוקים וטעונים תיקון .
    - Free text 
    - 
   Continue button - עבודות וחלקים    page :repairs_parts.html  


Each page has a home button to the navigation page. Directory.html

General instructions: 
1. keep the same design and layout as the current version - All Rights Reserved @ Carmel Cayouf, logos and color , fonts to be identical.
2. Maintain the visuality including favicon and design - everything needs to be smooth and fluent 
3The name of the site to : 
ירון כיוף שמאות- פורטל
4. Business name is :      ירון כיוף  -  שמאות והערכת נזקי רכב ורכוש     
5. Once the user is inside the system and after he puts in the password - the password is static through out the session till he either logs out or 10 min without activity . 
6. The plate number , the owners name and the date are also stable  through the session  till either logs out or 10 min without activity  and the user doesn’t need to enter them again . 
7. Make sure to be mobile friendly 
8. Make sure it’s in Hebrew by default (  right to left) 
9. All data in the report can be overridden by the user . 
10. The floating screen is an idea , the important thing is that the data that comes back from the post webhook, to  be visible to the user by demand . - can be a button on the top of screen - פרטי הרכב : once clicked the detail screen appears - and can be closed by the user 
11. Add the onesignal code to the html :   For push notifications to user -


11. General comments : הערות כלליות page: General_comments.html
    - Text box 
12. Status : 
Dropbox with option :
ללא סטטוס, לתיקון, טוטאלוס TL, לא לתיקון בשלב זה להכין הצעת מחיר, אובדן להלכה, מכירה במצבו הניזוק, 
להכין הצעת מחיר

Confirm expertise  button - brings up digital signature -> sends load from part 2 till the last  to the same webhook - 
 https://hook.eu2.make.com/4oed2jgnczuwwtvdko15fpwtef9avixm

returns - report submitted successfully/ if error returns error . 

Signature and stamp url :  https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp


All the details in the input till now, except the initial data  that was already sent - are stored till the user submits the report and sends to MAKE again

The data then gets processed through the automation and fills the excel sheet . 

The other pages - 
Levi report page: no change  webhook : https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9
 

Upload pictures : no change - webhook :  https://hook.eu2.make.com/o6lzg98bepsxulwlxhgkepikypyhetfl

------------------
NEW PAGE : 
depreciation and evaluation data for car no. (search box) : from this directory : טבלת מעקב גלובלית.xlsx

In the top of the screen : 

Pulled from the data in the טבלת מעקב גלובלית.xlsx
Car no : 
מס. רכב  
תאריך הבדיקה  
תאריך חוו״ד  
שם היצרן  
שנת ייצור  
ערך הרכב  
שם בעל הרכב  
מוסך  

Page layout - A screen with fields : 

The subject field : drop down box with option 

 % ירידת הערך  נזק 1
 % ירידת הערך  נזק 2
 % ירידת הערך  נזק 3
 % ירידת הערך  נזק 4
 % ירידת הערך  נזק 5
——————————
 % ירידת הערך גלובלי
—————————
Option to change the number on the damge description and add more .
The input field - free text ( text and numbers ) . 
Add button ( the same ) and so
Comments : free text box 
Confirm - > sends webhook to make : https://hook.eu2.make.com/odmxgzv43p7gtbzqwwmdp4x4ft96m1ml


New page - final report  חוות דעת 

on the top of the screen : 
Pulled from the data in the טבלת מעקב גלובלית.xlsx
Car no : 
מס. רכב  
תאריך הבדיקה  
תאריך חוו״ד  
שם היצרן  
שנת ייצור  
ערך הרכב  
שם בעל הרכב  
מוסך  

            Button- סגור חוות דעת 

Opens a second page :  alert and confirmation request 

האם אתה בטוח שברצונך לסגור את  חוות הדעת: הפעולה הזו תסגור את חוות הדעת , תפיק דו״ח PDF ותתייק בתיקיית הרכב - באפשרותך תמיד לערוך ידנית במידת הצורך : 
 
         Confirm button - webhook to make https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh



New page : send reminders and messages 
Organized by case number : plate number 
To: garage / client / other : 
Number of car 
Date of inspection 
Message : 

Add files button 

Webhook to make :https://hook.eu2.make.com/6x3rihgkra2vu5v1jbwr3dt679k2akm7


New page : reminders and notes  = personal management 
 Dropdown: for a case plate number  search Pulled from the data in the טבלת מעקב גלובלית.xlsx
                      General  
Organized by plate number : 
Plate number :
Text 
Date 

General notes:
      Text 
      Date 

Webhook to make https://hook.eu2.make.com/6x3rihgkra2vu5v1jbwr3dt679k2akm7

****can consider to be in one page and to make 2 tabs : personal  אישי/ professional עסקי


Go to folder : no change .
Logout 

Webhooks : 
Start report  button in block 1 - and confirm expertise button - both send to the same we hook 
Send :  https://hook.eu2.make.com/4oed2jgnczuwwtvdko15fpwtef9avixm
Receive: https://hook.eu2.make.com/urzpd316748hb4m6c5qx4uf8trqlbyf9
 . 
Levi izahk report : both in block one or in the page , send to the same webhook . 
 https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9

Upload images - No change 
 https://hook.eu2.make.com/o6lzg98bepsxulwlxhgkepikypyhetfl


Depreciation and evaluation data - new webhook :
  https://hook.eu2.make.com/odmxgzv43p7gtbzqwwmdp4x4ft96m1ml


Reminders and messages :  https://hook.eu2.make.com/6x3rihgkra2vu5v1jbwr3dt679k2akm7

Go to folder - no change - simple link to folder 
תיקים פתוחים

Instructions: 
1. keep the same design and layout as the current version - All Rights Reserved @ Carmel Cayouf, logos and color , fonts to be identical.
2. Maintain the visuality including favicon and design - everything needs to be smooth and fluent 
3The name of the site to : 
ירון כיוף שמאות- פורטל
4. Business name is :      ירון כיוף  -  שמאות והערכת נזקי רכב ורכוש     
5. Once the user is inside the system and after he puts in the password - the password is static through out the session till he either logs out or 10 min without activity . 
6. The plate number , the owners name and the date are also stable  through the session  till either logs out or 10 min without activity  and the user doesn’t need to enter them again . 
7. Make sure to be mobile friendly 
8. Make sure it’s in Hebrew by default (  right to left) 
9. All data in the report can be overridden by the user . 
Each page has a home button to the navigation page. Directory.html
10. The floating screen is an idea , the important thing is that the data that comes back from the post webhook, to  be visible to the user by demand . - can be a button on the top of screen - פרטי הרכב : once clicked the detail screen appears - and can be closed by the user 
11. Add the onesignal code to the html :   For push notifications to user -


<!-- OneSignal Push -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#ffffff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">

<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "3b924b99-c302-4919-a97e-baf909394696",
    });
  });
</script>


Webhook post : 
Notifications will be sent to the user on the phone or computer . 
Push notification to device - Notifications : new webhook :  
https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd


**********


The expertise process : 
1. The user enters :

    * Plate number 
    * Owner name 
    * Date of inspection ( date picker) 
    * Date of damage ( optional)
    * Inspection location 
    * Password 
2. The submit button triggers make :
    * Car core details
    * Creating a filing system 
    * Posting back to the users screen the details of the car 
    * The user needs to confirm .
3. The app opens The general details section : this section is filled manually 
    * Owner address 
    * Owner phone number 
    * Garage name 
    * Garage email 
    * Inspection location 
    * Insurance company ( drop down selection ) 
    * Insurance agent - manually 
    * Damge classification ( drop down selection ) 
    * Clicks ‘continue’
4. The app opens the damage description module : this module is filled manually 
    * The user enters manually :
    * Damage center : name and id (number) ( drop down selection ) 
    * General description: a predefined format that changes according to the damage center : בבדיקת הרכב הנדון נוכחנו בנזקים תאונתיים לחלקו
    *  ( fills dynamically )של הרכב. (Fills manually) נמצאו ניזוקים וטעונים תיקון
    * Repairs needed
    * Parts 
    * Work classifications - ( drop down selection ) 
5. After that the system asks to open a new damage center -if there is another one , the system opens the same module format as before. When the user finishes all the damaged center’s description and classifications - he enters the date again ( date picker) clicks ‘finish’
6. The app opens the conclusion and legal part :
    * The user define the status of the damage ( drop down selection) 
    * The user confirms expertise - 
7. Trigger sent to make : option 1 
    * MAKE fetches the initial expertise from stage 2
    * The webhook receives structured data 
    * Uses aggregator or pattern matching or another module to sort out the incoming data. 
    * Fills out the expertise automatically with all the details.
    * The template already has the desired structure and legal disclaimers.
    * Convert to PDF 
    * Sends email to the garage 
    * Files the expertise . 
    * MAKE sends all details ( by mapping to the helper table that is in the folder ) 
8. Trigger sent to make : option 2
    * ALL information is sent to MAKE including the first part of the car details .
    * The webhook receives structured data 
    * MAKE AGGREGATES all incoming data.
    * Uses aggregator or pattern matching or another module to sort out the incoming data. 
    * Perform dynamic html generation that organizes the expertise according to sections and the desired structure 
    * The html will include legal disclaimers and sections disclaimers. 
    * The html adds the signature and stamp of the user ( scanned and printed) 
    * The html will include branding and logo and business informations ( like in the excel sheet) 
    * The html is parsed to text and converted  to PDF . 
    * Sends email to the garage 
    * Files the expertise . 
    * MAKE creates a helper excel table and file it in the folder . 

Summary : 
1. This way we have a full control over data and their traffic also it would make the modular creation of the final report more efficient. 
2. The user doesn’t jump between platform and all is managed on one screen .
3. A much clearer overview on the damage center analysis and more efficient in creating the final analysis - requires less dependencies .
4. An HTML generated expertise is the best option if we can make sure it maintain the same format of logic and branding.
5. An HYML generated report is much easier for manipulations and modifications in the process with less independencies and ability to pin point a specific detail in the report . 

Questions and challenges: 
1. The LEVI Izhak report is a crucial part of the data extraction , it completes some missing parameters in the first part of the expertise that are crucial for evaluation : 
    * model code, basic price, vehicle classification ( private / commercial) ownership type( private, company, leasing) , 
    * All the the other data in the Levi report that need to be utilized in the final report : 
        * Subtractions and Additions value adjustments according to :  Properties , mileage , ownership, date of issue , number of owners 
        * . [
  {
    "עליה לכביש": "",
    "ערך": "",
    "עליה לכביש %": "",
    "שווי מצטבר": ""
  },
  {
    "בעלות": "",
    "ערך": "",
    "בעלות %": "",
    "שווי מצטבר": ""
  },
  {
    "מס ק\"מ": "",
    "ערך": "",
    "מס ק\"מ %": "",
    "שווי מצטבר": ""
  },
  {
    "מספר בעלים": "",
    "ערך": "",
    "מספר בעלים %": "",
    "שווי מצטבר": ""
  },
  {
    "מחיר מאפיינים בש״ח": "",
    "ערך": "",
    "מחיר מאפיינים %": "",
    "שווי מצטבר": ""
  
  * The Levi report provides the accumulated value of the car and the final market value . 
    * All these elements are aggregated to the helper table ( it’s already happening now) and pulled out for the final report .
    * In case we go on html format all these details are not included in the expertise but used in the final report . 
* The problem :  as for today the integration of the Levi report comes in a separate automation and this mainly due to the fact that it might not be avian the field and we don’t want to delay the expertise because of this - the data that is pulled from the other source is sufficient for the expertise. 
* We need to consider a local app data scraping or if not , integrate the attaching of the report in the process - the problem that the report is handled by OCR and it’s a longer process . Also the report needs to update the missing values in the expertise and store the others for the final report - today it’s working like this - a change maybe required . 

1. Integration with parts details and catalogs : in the process of creating the expertise , the user writes the parts of each damage center - that is given . I want to create a side html or excel that takes the parts as listed by the user - go to a site (https://www.ilcats.ru) -> https://www.ilcats.ru/?vin=1G4HD57258U196450&VinAction=Search&language=en) -> ( https://www.ilcats.ru/peugeot/?function=getGroups&model=1PT1&body=B0DA3&engine=B0F7X&language=en) and scrape the parts and returns : official name of the part , catalog number, source, available and price . This flow needs to know how to take the Hebrew listed parts , translates to English /find the proper name according to the car / list the query in the site/ scrape / translate back to Hebrew / arrange in the damage centers tables and wait!  This is a side process , as we discussed in the final report the parts and work and costs are according to the garage invoice. But it will be a reference especially for insurance companies claim .- I will generate a document called ‘estimation ‘ for the insurance companies when they ask for one its like  the final report but it has less informations and just estimate costs . 


Experties summary 


11. General comments : הערות כלליות page: General_comments.html
    - Text box 
12. Status : 
Dropbox with option :
ללא סטטוס, לתיקון, טוטאלוס TL, לא לתיקון בשלב זה להכין הצעת מחיר, אובדן להלכה, מכירה במצבו הניזוק, 
להכין הצעת מחיר
Status needs to be visible like a  watermark or panel on all page before I will give the names of the pages 

Confirm expertise  button - brings up digital signature -> sends load from part 2 till the last  to the same webhook - 

Submit experties שלח אקספירטיזה button open a page :

פעולה זו תסגור את האקספירטיזה, תשלח אימייל למוסך ותיצור חוות דעת לרכב מס. ------
לתאריך ------.

האם אתה בטוח שאפשר להמשיך?
Send button linked to webhook 
https://hook.eu2.make.com/lvlni0nc6dmas8mjdvd39jcbx4rlsxon
Take the set up from https://sendformtomake.netlify.app/?plate=5785269&date=2025-04-04&email=carmel.cayouf@gmail.com 
And the html attached.
returns - report submitted successfully/ if error returns error . 

Each page has a home button to the navigation page. Directory.html

Signature and stamp url :  https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp

The last stage needs to ensure from the programming stand that all the data that was stored during the session is structured and organized and sent to make.com as one load which is the expertise .

 The eexperties needs to be created digitally and sent to make from the platform ready to be processed 
General instructions: 
1. keep the same design and layout as the current version - All Rights Reserved @ Carmel Cayouf, logos and color , fonts to be identical.
2. Maintain the visuality including favicon and design - everything needs to be smooth and fluent 
3The name of the site to : 
ירון כיוף שמאות- פורטל
4. Business name is :      ירון כיוף  -  שמאות והערכת נזקי רכב ורכוש     
5. Once the user is inside the system and after he puts in the password - the password is static through out the session till he either logs out or 10 min without activity . 
6. The plate number , the owners name and the date are also stable  through the session  till either logs out or 10 min without activity  and the user doesn’t need to enter them again . 
7. Make sure to be mobile friendly 
8. Make sure it’s in Hebrew by default (  right to left) 
9. All data in the report can be overridden by the user . 
10. The floating screen is an idea , the important thing is that the data that comes back from the post webhook, to  be visible to the user by demand . - can be a button on the top of screen - פרטי הרכב : once clicked the detail screen appears - and can be closed by the user 
11. Add the onesignal code to the html :   For push notifications to user -


************


All the parts of the value and evaluation calculation need to be done on the  app locally, some variables are extracted from the helper , but even though the helper has all the variables since the parameters in the evaluations are changing and case sensitive we need to extract all the metrics of subtraction and addition to price to the app, present them to the user before the stage of the calculations or the depreciation, then the user needs to confirm - once he is confirming the values and THEIR TITLES need to populate the table, we need to find a way that the tables are fitting themselves according to content imported , it is also possible  not to use tables just a clean and clear paragraph with the calculation like in the pdf in the files . 
The fee and administrative costs in the beginning, need to have a screen that is basically showing the 3 costs, photos, office services and transportation , the user input the costs and the data goes in the table in the final report directly , the only thing I that the sum and vat calculations need to be done locally based on simple formula .
The part of the damage analysis , work, parts and etc as we discussed, since in the expertise the evaluator already put what needs to be done , this data is extracted to the app, at this stage the app doesn’t  insert in table but it store the data in secondary screen - when the user fills the report , he needs to go through this screen and confirm the list maybe sources changed or parts were added or subtracted , the costs of this part is in the garage invoice - he needs to put manual = another way that can be is that the parts don't come to the app in the first phase with all the data but when the user gets the invoice he passes it through OCR automation much like the Levi report then the state comes back to the app presented to these with prices, these just need to assign the parts to the range centers - since each damage center has its own section. I think this is a better way , even though not always the invoice is available, in this case the user puts everything manually.
As for the depreciation- YOU WERE RIGHT a depreciation percentage is assigned to each damage center, and the global depreciation is calculated after . That means like you first say , when the user reviews the sections of damage he needs to assign depreciation value, those are aggregated locally to a summary table of depreciation and the values are filled
Also, when we have multi damage case the total costs of labor and parts is calculated serially for each center, and the total table list the costs of each damage and summarize them .
So in conclusion the quality data that determine the evacuation scope are highly unstable and change from one case to another in an extreme way , the good news is that all these metrics and percentages are in the LEVI report , so we just ca pull the data to the user in the right moment and he confirms and the app places them and make the calculations. 

GENERAL THINSG :
All tables need to have the ability to adjust to content meaning that they can have 3 rows or 10 rows depending on the content, as long as content is assigned to a specific table the table needs to know how to contain
 . 
All costs require a separate visualization of the vat value from the price, the vat in Israel is 18% so the calculation should be straightforward and not complicate d, however since vat is not a constant rate and can change , the admin hub should have amity to change the vat rate, I don't know if confirming the vat each case is the right way to go or one central hug, but we can think together,

********
ADMIN, SEARCH AND INVOICES  

the admin gives permissions to users , from here the admin decides if to switch to manual , and from here he needs to have the interface to pull a case from the computer and finalize it - since I dit say in the engining but finalization is never in the span of the session it can be 2 month after . thats is why the metadata is important so the case can be pulled with all its data since the data doesn’t  stay in the system inc the session is closed . also the user can pull the case at any time, work on it and not finalize , what ever he worked on needs to sent back to the matadata and update - the work itself is saved in the report html or meta . in a session , the only sure product is the experties , it sa report that have to be finalized and sent in the span f the session , all the other data and process products 1. construct the case metadata 2. fill the final report draft except the depreciation - the last page ( NOT LEVI) .ANOTHER module that is missing , is the invoices module , this also shied be in the old version, what is the invoice module do and why its important : without the invoice from the garage the evaluator cannot finalize the report - basically this is why its takes so ling in real world application to close the report .2. the invoice details the actual parts, repairs and works of the case , remember that what we have in the draft is just the estimation and general direction of the user IT IS NOT the actual work .so what we made is like this : the user gets the invoice then invoice goes in the amke automation in 2 optional methods: 1, the automation watches the email for invoice on the plate number , 2. the user has the invoice hard copy and he upload it as png to the automation, the automation then needs to OCR - even though each invoice can be different from another since every garage has its own invoice , but the main details don't change , work will always be work so as the parts , the costs the vat and so on , so the OCR looks for those things parse them and do 2 things :1. it sends the data to a google sheet  and tracking sheet 2. it sends back to the system - if the user is working on the case the parsed lines will pop up and be stored in the system - then AND HERE IS THE GENIUS THING OF JAKE , the parsed lines need to replace the estimated lines in the damages tables. this way the actual costs of the dance repairs parts and work are fully relevant - this is the backbone of the evaluation and the compensation determination due to the customer . another important logic we made is that in the process of finalization the final report (not the expertise) the system need to ask for confirmation, so each block the user wants to finalize he need to confirm it first , and that includes the damge repairs and stuff . so in short the admin hub is important and its from here the user calls the case from the computer and from here he manages the permissions , notifications and so on , 2 the invoice module is missing and needs work , 3, the finalization process requires the user to confirm each step : costs, depreciation , car details , accuracy of data and so on . -  till ow we made the search as a separate module , the search is key by 2 fields both optional but one of them needs to be filled , the first field is the plate , and this is meant for search the is exclusively regarding a specific case :  didi the customer , pay , what are the damages , is it going to court and so on - the other field is textual field in which the user asks more Genaro questions : what is my bottle net k, how many cases didn't pay me, which is the most worked with garage and son , ofcourse he can combine the plate with etch text if he wants a drill done on a specific case - so till now to was a separate module, but if you think its better it can be in the admin hub - that why we have all these webhooks : 
- Webhook :Password page new version :https://hook.eu2.make.com/ho2ogzkuwxg66klgkin7nattl1nr7o6y
- Webhhok for step 1   : https://hook.eu2.make.com/zhvqbvx2yp69rikm6euv0r2du8l6sh61
- Web hook to activate the Levi flow   : https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9 
- Submit expertise and open final report draft : https://hook.eu2.make.com/lvlni0nc6dmas8mjdvd39jcbx4rlsxon
- Webhook to activate the multi picture flow  : https://hook.eu2.make.com/o6lzg98bepsxulwlxhgkepikypyhetfl
- Webhook Final report complete  :https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh
- Webhook Depreciation % integration :https://hook.eu2.make.com/odmxgzv43p7gtbzqwwmdp4x4ft96m1ml
- OCR invoices : https://hook.eu2.make.com/sqai1jt79ujmh6v7jqf83uew71jxq2mk
- Filling final report : https://hook.eu2.make.com/bd81gxcw37qavq62avte893czvgjuwr5
- 
- Upload pictures: https://hook.eu2.make.com/yksx9gtoxggvpalsjw2n1ut4kdi4jt24
- Transform pictures : https://hook.eu2.make.com/pum6ogmlxfe2edi8wd5i1d9oybcus76f
- Create pdf: https://hook.eu2.make.com/uzc5fd69shl29muu0t45mm92gq3r2ogb
- Instead of notifications-> used for Search module : https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd
   
- meta update processing to your reserve endpoint - post to system (NOT MAKE ):: https://hook.eu2.make.com/ms1enok8y3y88md8qfttd6m6yljc9ijx
- Jake 2 : https://hook.eu2.make.com/8qtnpiepudjayauywnhh8a8qimugac8x

—parts agent : https://hook.eu2.make.com/wmnlx5x5zse5gnffirv9doq9ou5vupsh
- Parts meta filing : https://hook.eu2.make.com/px61cd6iwav8bomjq6wquylctph2v1lv.  and another thing I forgot : IMPORTANT the image module has 3 stages : one button to submit pictures into the file , and then we have more options button: 1. send to optimization, 2. create a pdf . maybe I made some mess but I discuss these things with so many assistants I forget with whom I talked ,,,

*************



The fina report :
The final report is the most important document in the process, its the the summary of the whole evaluation process and its aggregating data and findings from all other channels including direct communications channels with Insurrance companies, garages , owners and etc. 
The final report is based on 3 main data types :
1. The row data - this is the data gathered in the beginning and most of it is in the expertise - the data comes from 2 sources :1. sending an automated  query to an external site and the other is the Levi report :
The Levi report's importance is more to the final report rather than the experties, addiction to it listing thee row data , its real importance in the value adjustments according to properties, parameter  and features - those actually is the only source from which the value of a given car can be determined - in this regard special importance is given to the MODEL CODE  this identification doesn’t  exist nowhere other than the Levi report and its basically the bedrock on which the value of the car is determined , the Levi report gives us the percentages of the value adjustments , those metrics are crucial to the summary of the report . We need to use those figures in specific calculations to determine the compensation, depreciation and updated market value of the car. 
This brings us to data type 2 : 
data type 2 is the 'smart' data that is responsible of the determination of the value . The formulas and calculations are basically simple and are based on the row data and the decision of the evaluator on the percentage of depreciation he finds appropriate to the general damage of the car taking in considerations the adjustments needed according to the Levi report .the depreciation percentages are dextrine din the end of the process after repairs have been finished and a garage invoice has been issued . Just then the evaluator can really evaluate the depreciation , market valuer and compensation - this a legal matter , everything needs to be organized argued for and explained, that is why the the structure format and the methodical process are very important - it is normal to the evaluator to find himself on the court to defend his report because of a dispute  with the insurance company, 
The process in general and the structural management of data is crucial . 
In this type of data we also include the costs of the repairs , works and parts, the tables that summarize those costs are based on 2 sources : 
1. The initial expoerties - which is the field report , that is why we want the field finding to be pushed to the final report draft as a reference 
2, the avail execution of works and repairs- it is possible that during work the garage get stew evaluator permission to add a job or to change the source of a part, once the evaluator gives his approval , this overrides the initial field directive and needs to be implanted in the fine report - we will ahem the report template starting with draft that is filled with the field finding , and update it according to ideal work. 
The update needs to be easy - the best way is that first we create a dedicated process for draft and another for finalization . In the draft phase , data is aggregated automatically and placeholders are filled technically. the draft is a work in progress that the evaluator can work on update and change backwards and forth,- no obligation we can look at it as 'demo mode' , once the evaluator is ready to finalize he turns on the 'live mode' - and what the system should  now  do is pulling the last demo version and start confirming data = : 
Row data is a given there no confirmation , but then see shield go through the process to make sure the classification of the car is correct once he confirms the second block of confirmation I s coming :this the block of the damage centers and their associated costs- the number of verifications blocks in this part is equal to the number of the damages center o the system will present ti the =user the least vision - if the user didn't update or work ob the report then its gonna pull out the eexperties version if he updated then the last update will be shown- it an easy process the user need to check a confirmation to each thing he last update and since the expertise is automatically filled after the field inspection then the dat is kept in the demo mode on the computer = and every other adjustment that was should be implemented and updated in the draft. So when the live mode begins the report presented is almost finalized 0 in this stage the evaluator  based on the invoice can update and close the cost tables :
Method : 
The demo mode starts with the initial aggregated data .
We have some options  for ongoing adjustments:
1. The user has an adjustment module that is connected to to the report fields and automatically update - or are kept in a storage to be pulled once the live mode is on 
2. The user updates the draft manually and before going live mode feeding the last draft to the system.
3, digital processing of the invoice and updating the tables - the user feeds the system with the invoice and the associate plat number - the system OCR or scrape the invoice - depends on the document quality and layers and pulls the details of the work and parts as listed in the invoice to update the fields in the draft
4. Other ideas are welcomed 
Where is the challenge here - the system doesn’t  have memory or storage its an interface - 
1. How would the system control past dat and cases ?
2. Hoe would the system actually update cases that are not in its process anymore ?
3. How would a dedicated module manipulate the data in the report ?
Solutions we can think of :
1. Modules in the app that send triggers to make that pulled the draft and update 
2, search trigger to make - post from make to the app , update the final report module on the app - send back two are and file till the next update or the finalization 
3. Local interface between the desktop app to a shred onedrive directory - search ability and editing ability 

The app should know how to calculate and summarize the sections according to range centers and after that a subtotal table for all the centers - this is done with and without vat calculations in the table *('as shown in the final report format attached)  

In summary the user needs to confirm and move on - the system doesn’t  determine the data , the user has the legal responsibility on confirming their accuracy.
Next we move in this type of data to the last part - the evolution process
As I explained before this is a crucial stage . The app should be pre programmed with the exact formulas for each  parameter , knows hoe to pull the exact variable of the exact parameter used in the specific calculation- the formulas are basic and they can be easily pr programmed .
After the user confirms the damage part costs, the system moves to an interactive screen that pulls the relevant data of the car as reference (floating page or toggle) 
This info - again- is not available to the system at this point so the system needs to use the same method we decide for the previous block to interface this block:
The data pulled and shown in the top of this page or in a floating page are :
  
תאריך הבדיקה  
תאריך חוו״ד  
שם היצרן  
שנת ייצור  
דגם 
קוד דכם
ערך הרכב  
שם בעל הרכב  
מוסך  
-----------
The summary of damages and costs 
A specific part of the Levi report that is managed to day on my helper - we can either import it or build it - basically there are the adjustments of the car value,
The user is presented only with the relevant adjustment to that car 
 פרמטר עליה לכביש 
 עליה לכביש  
 עליה לכביש  %
ערך כספי  עליה לכביש
שווי מצטבר עליה לכביש
 פרמטר  מס' ק"מ  
 מס' ק"מ 
 מס' ק"מ %
ערך כספי  מס' ק"מ
שווי מצטבר מס' ק"מ
 פרמטר  בעלות
סוג בעלות 
 בעלות %
ערך כספי  בעלות
שווי מצטבר בעלות
 פרמטר מס' בעלים 
 מס' בעלים 
 מס' בעלים %
ערך כספי   מס' בעלים
שווי מצטבר  מס' בעלים 
 פרמטר מאפיינים 
 מאפיינים 
 מאפיינים %
ערך כספי    מאפיינים 
שווי מצטבר   מאפיינים 
NOT ALL PARAMETERS ARE RELEVANT -  MOST OF THE CASE THERE ARE 3 PARAMETERS ONLY

After that the user has the interactive screen for depreciation 
Its starts with the calculations based on the list above - fully done for you - needs confirmation of the user to move on 
After that it moves to the depreciation decision, the user is presented with a format that prompt him to fill in the following : 

The subject field : drop down box with option of the damages and the global option and inout field of rte percentage he wants 

 % ירידת הערך  נזק 1
 % ירידת הערך  נזק 2
 % ירידת הערך  נזק 3
 % ירידת הערך  נזק 4
 % ירידת הערך  נזק 5
——————————
 % ירידת הערך גלובלי
—————————

Needs to have the Option to change the number on the damage description and add more .
The input field - free text ( text and numbers ) . 
Add button ( the same ) and so

Comments : free text box 

Last interface in this module is taking the data from above and actually implant them in the formulas and sections in the final report - according to the template .

3. The last type of data or input is the text in the final report = most of the text is templet that doesnt  change - the final report module will have this text in place according to the format we have . 
In this part is important to pay attention to the following :
1. There are "hidden" figures inserted in the ext - so the text goes as template and then when the txt talks about the depreciation , costs for value the number there needs to be the actual number from the calculations and it need to be dynamically mapped.
2. The text is a legal format we need t make sure that it's readable , organized and clearly sectioned.
3. the user can change the text - the user need to be able to delete add for change the pre inserted text
4. Signatures, stamps , dates, case numbers and other legal requirement needs to be a core in the construction if the digital form 
5. Branding , logo , banners and all the other branding details need to be a part of the construction , THIS IS TRE ALSO FO RTEH DIGITAL expertise FORM , WHEN ITS finalized it looks lie the current format . 

Decencies and connections :
1.The final report depends on the row data, invoices that without them it cannot be finalized and ongoing negotiations with the Insurrance companies , garages and owners 
2.the final report needs to be connected to an automation that actually finalize the process with external people 
3. It needs to be included in the tracking system as for follow ups on :
 - payment - it needs to be monitored for payment - usually payment is due 90 days from the date of issue.
 - closure with the insurance company - compensation to the owner 
 - any law suites that are associated with the report and the case 
  = and geneartak things

4.The means the  report needs to be connected to the reminders, notification sand tracking it is less done on the system but it needs to be synchronized.
5. The report needs to have flexibility and modularity so it can be adjusted to the case - the dissection of the data depends on a modular structure , clear and pre assigned associations, placeholders style. 
5. The interaction with the workspace of the user is important though limited - we need ti find the best way to do it .
6. The system and the automation is already connected to push notification to the phone and desktop .
7. The process will also have a monitoring automation for emails to scrape  content based on a plate number , initiate notification and file a log in the correspondences folder .
8. Webhooks to make are already assigned - need to be given to you when ready and after determining the strategy 
9. Most important : the visual aspect of the report meaning all the documentary pictures taken of the car damage , the work and the parts are attached to the final report - those pictures are accumulated in the pictures folder of the case and have minimal interaction with the app other than the uploading module we have and need to improve (after testing - I find it needs improvements _


In the end of the report :
  Button- סגור חוות דעת 

Opens a second page :  alert and confirmation request 

האם אתה בטוח שברצונך לסגור את  חוות הדעת: הפעולה הזו תסגור את חוות הדעת , תפיק דו״ח PDF ותתייק בתיקיית הרכב - באפשרותך תמיד לערוך ידנית במידת הצורך : 
 
         Confirm button - webhook to make https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh



The module is a another module in the system - it is not the system 
After that I want to develop the admin hub as we talked and add new module :

 send reminders and messages 
Organized by case number : plate number 
To: garage / client / other : 
Number of car 
Date of inspection 
Message : 

Add files button 

Webhook to make :https://hook.eu2.make.com/6x3rihgkra2vu5v1jbwr3dt679k2akm7


New page : reminders and notes  = personal management 
 Dropdown: for a case plate number  search Pulled from the data in the טבלת מעקב גלובלית.xlsx
                      General  
Organized by plate number : 
Plate number :
Text 
Date 

General notes:
      Text 
      Date 

Webhook to make https://hook.eu2.make.com/6x3rihgkra2vu5v1jbwr3dt679k2akm7

****can consider to be in one page and to make 2 tabs : personal  אישי/ professional עסקי




Webhooks : 


Depreciation and evaluation data - new webhook :
  https://hook.eu2.make.com/odmxgzv43p7gtbzqwwmdp4x4ft96m1ml



Go to folder - no change - simple link to folder 
תיקים פתוחים


General Instructions: 
1. keep the same design and layout as the current version - All Rights Reserved @ Carmel Cayouf, logos and color , fonts to be identical.
2. Maintain the visuality including favicon and design - everything needs to be smooth and fluent 
3The name of the site to : 
ירון כיוף שמאות- פורטל
4. Business name is :      ירון כיוף  -  שמאות והערכת נזקי רכב ורכוש     
5. Once the user is inside the system and after he puts in the password - the password is static through out the session till he either logs out or 10 min without activity . 
6. The plate number , the owners name and the date are also stable  through the session  till either logs out or 10 min without activity  and the user doesn’t need to enter them again . 
7. Make sure to be mobile friendly 
8. Make sure it’s in Hebrew by default (  right to left) 
9. All data in the report can be overridden by the user . 
Each page has a home button to the navigation page. Directory.html
10. The floating screen is an idea , the important thing is that the data that comes back from the post webhook, to  be visible to the user by demand . - can be a button on the top of screen - פרטי הרכב : once clicked the detail screen appears - and can be closed by the user 
11. Add the onesignal code to the html :   For push notifications to user -


<!-- OneSignal Push -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#ffffff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">

<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
<script>
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "3b924b99-c302-4919-a97e-baf909394696",
    });
  });
</script>


Webhook post : 
Push Notifications will be sent to the user on the phone or computer . 
Push notification to device - Notifications : new webhook :  
https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd


Layout and formats :

Page 1 - under the fees: 

שכר שמאי לפי זמן המושקע בתיק ( שעת עבודה 280 ש"ח)
נסיעות לפי " חשב" ) הוצאות משרד על פי תחשיב יועץ מס (
ה חשבונית מס.
וו
חשבון זה אינו מה
חשבונית מס תומצא לאחר קבלת התשלום.
כוי מס במקור
י פטור מלא מנ
חוות דעת זו הינה רכושה הבלעדי של "ירון כיוף שמאות", חל איסור מוחלט לבצע
בו כל שימוש, באים לא שולם מלוא התמורה וזו נפרעה בפועל בגינו.
חל איסור מוחלט להעתיק, לצלם, למסור או לעשות שימוש בדו"ח זה, או בחלק
ממנו למי שאינו מוסמך ורשאי לכך, לרבות באים לא שילם את התמורה כאמור.


‏This part if you can find the most recent legal template for Israeli evaluators and based on laws article will be great if not keep it as is 
‏Signature and stamp 

‏Page 2 - under the car details ( car batiks show in page 1 and in page 2 

 שמאי בודק ירון כיוף מס' רשיון 1097
פרטי השכלתי וניסיוני:
1097 אני החתום מטה ירון כיוף שמאי בעל רישיון משרד התחבורה מס'
בוגר היחידה ללימודי חוץ.
, שמאי רכוש
חקלאות
חוקר תאונות דרכים ובטיחות, מכללת משלב.
מרצה שמאות רכב מכללת עתיד.
בוגר ביה"ס מקצועי למכונאות רכב (בוגר מצטיין).
מכללת עתיד.
בוגר הקורס לשמאות רכב,
עד מומחה לבית המשפט, תחום שמאות רכב ורכוש. מכללת אפיק.
, מכללת עתיד.
3
מכונאי רכב סוג
בוחן רכב בשירות קבע צה"ל.
בוגר קורס הסמכה וניהול מוסכים, מכללת עתיד.
בציוד כבד.
‏ABS
השתלמות במערכות בלמים אוויר ו
השתלמות מערכות מתקדמות וחידוש טכנולוגיים ברכב, המכללה הטכנולוגית לרכב.
השתלמות ברכב היברידי וחשמלי, המכללה הטכנולוגית לרכב.
בוגר השתלמויות שונות במנועי בנזין, דיזל, רכב חשמלי / היברידי ותורת החומרים 

‏Page 3 from the top :
‏Fixed template:
בהתאם להוראתך / כם בדקנו את נזקי הרכב הנדון כפי שהוצגו לפנינו
והערכנו אותם כמפורט להלן.

‏According to the case details :

תאור הנזק:
בבדיקת הרכב הנדון נוכחנו בנזקים תאונתיים
של הרכב.
לחלקו האחורי שמאל, חלקו השמאלי וחילקו הימין אחורי
שמ' פח אחורי
ופינה
פח משקף אחורי שמ',
,דלת מטען, כנף אחורי שמ'
. 1 מוקד
ועמוד קד' שמ'
קד' שמ'
מכסה מנוע, כנף
. 3
– קד' שמ'
מוקד
דלת
. 2 מוקד
יזוקים וטעונים תיקון. נ
וספוילר דלת מטען נמצאו
. כנף אחורי ימין
4
מוקד
החלקים הרשומים ברשימת החלקים נפגעו ללא אפשרות ו/או כדאיות תיקון והיה
צורך להחליפם


‏Fixed :
הערכת הנזק:
לאור ממצאי בדיקתנו , הערכתנו כדלקמן

‏And then the damage tables start :

‏After the damage tables there is a  summary of all the works, parts and repairs costs of all the damages centers together 


‏After that comes the price adjustments calculations - here we insert the adjustments from Levi, and according to what o relevant to the car - each case is different but the Levi report gives us what we need . We already have ethos stat in the storage 


‏After that we have the depreciation block - this is filled from the depreciation  module and from calculations inside the document itself for example :
סה"כ תביעה שהוגשה is the subtotal of the costs of all damages centers 
פיצוי בגין ירידת ערך is the subtotal of the depreciation after deciding on the global depreciation percentage and  calculating it  according to the car market value that was calculated in the previous page with Levi .

‏In this page we also have the depreciation percentages by damage centrist as we input in the depreciation mode 

‏Last page - legal disclaimer :

הערות:
ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות
.
1
הרכב בעבר וארוע תאונתי.
מחירי החלפים נבדקו על ידינו בתוכנת מולטיקט חלפים.
.
2
הנדון חלפים
לאור בדיקותינו מצאנו כי לא ניתן היה להשיג לרכב
.3
. משומשים ו/או תחליפיים, מצורף גלגלים
מערך הרכב המצויין
5.50
חוות דעתינו כוללת סעיף י"ע בשיעור %
.4
באירוע הנדון.
לעיל
כמפורט
לעיל
.5
תייחסות לשעתון מוסך מתקן. ה בהה חוות דעתינו נערכ
.6
לנזקים כפי שהוצגו בפנינו , ולנסיבות המקרה כפי הערכתנו מתייחסת
לא ידוע לנו נסיבות המקרה.
שתוארו לנו ע"י בעל הרכב אשר לדבריו.
מוקדי הנזק מאירוע הנדון.
4
לטענת בעל הרכב
.7
ימי עבודה
6
להערכתינו זמן השהייה במוסך לצורך תיקון
.8
הצהרה
. 1097
אני החת"מ : ירון כיוף תעודת שמאי מס'
נותן על פי בקשתך / כם חוות דעתי במקום עדות בשבועה בבית משפט. הנני
מצהיר כי ידוע לי היטב על פי הוראות החוק הפלילי בדבר מתן עדות שקר
בבית משפט. דין חוות דעת זו כשהיא חתומה על ידי, כדין עדות בשבועה
בבית משפט.
לוטה
תצלומי הרכב הניזוק
חשבוניות תיקון
ערך רכב ממוחשב
חיפוש חלפים משומשים
צילום רישיון הרכב
חשכ"ט



‏Signature 



‏Again if you find better and more legal binding text the adjust if not keep as is  










 
