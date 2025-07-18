
The fina report module:
The final report has 54types :
‎    * חוות דעת פרטית 
‎    * חוות דעת גלובלית 
‎    * חוות דעת מכירה מצבו הניזוק
‎    *  חוות דעת טוטלוסט
‎    * חוות דעת אובדן להלכה 
All types are built on the main template of the private final report 
Each type has its own legal text and conditions and it creates a standardized version of the base template according to those conditions and specifiocations
More info about the types is elaborated in the following files in the documentation :
Legacy Specification Document.md
Primary Specification Document.md
depreciation_module.md
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










 