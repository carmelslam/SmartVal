Architecture: 
    1. Locate parts : using the paths :
        1. suppose table that hosts catalogs from known suppliers = main search source, 
        2. make.com conducts web search ( name nd image based), 
        3. car-part.co.il done on frame in the system , returns a pdf that goes to make.com OCR - search results then behave like web search .  We need to upgrade the system/ parts search module  form creation and the export to car part site .
    2. Select parts - Catalog results and search will show in a UI with checklist- checked items will go to selected parts table and from there will be assigned to damage centers ( option ) or sent for print/ one drive save.
    3. Capture search results  from all paths in supabase table - search results parts . 
    4. Capture selected parts in selected table in supabase per plate
    5. Capture selected parts in selected parts in helper . 
    6. Connect suggestive logic to supabase instead of helper search results -
    7. Suggestive logic combines all paths results for suggestions.
    8. Then part selection create the list for the specific case and assigns to damage centers.
    9. Parts floating screen: has to tabs : selected parts search results tab - search result tab has a field for part name - filtered search results from search results table. 
    10. All identifications are plate number associated - so the tables display the parts search results and selected for the specific car only. There is an option of general search that doesn’t  associate with plate.
    11. supabase tables for search results / selected are associated to car plate , for general search that is not associated to a car plate we need to think if we include in the table with plate numbers or create a new table for general (unassociated) search results and selected 

PDF PARSED TABLES:
Table headers: pdf headers : Pcode, CatNumDesc, מחיר מעודכן =price, Expr2 = source, make   , 
also add OEM, availability , location , comments ,

PARTS QUERY ACCORDING TO THE SCREENSHOT 

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


For the java script on the search module :
"Your app" refers to whatever application you're building that needs to search the catalog data - could be:
* Your SmartVal web application (the HTML/JavaScript files)
* A new search interface you create
* The parts search module in your existing system
When users search for parts in your application, you'll query the catalog_search_view we just created instead of directly querying catalog_items.
For example, if you have a search box in your SmartVal HTML:
// In your SmartVal JavaScript files (like parts-module.js)
async function searchParts(searchTerm) {
    const { data, error } = await supabase
        .from('catalog_search_view')  // Use the view, not catalog_items
        .select('*')
        .ilike('cat_num_desc', `%${searchTerm}%`)
        .limit(50);
    
    // Now data will have supplier_name as "M-Pines" not a UUID
    displayResults(data);
}
Or if you're using Make.com webhooks to search, they would query catalog_search_view to get results with supplier names included.
The parsed PDF data is stored permanently in your Supabase catalog_items table. The view just makes it easier to display with supplier names when searching.


OR 

javascript
// When searching from your parts search module
const { data } = await supabase.rpc('search_parts_for_plate', {
  p_plate: '221-84-003',
  p_part_name: 'בולם דלת מטען',
  p_make: 'COROLLA CROSS'
});


How will it work with catalogs: 
1. Simple : use direct suggestions from table : user types name - get suggestion, chooses parts , chosen parts go to a list . 
2. Make.com: user send a query to make.com, automation normalizes the query to table structure and names, automation think scans the table , sends back to user a list of all the items, user selects, selection goes to list, unselected items go to “unselected list” .
Technical requirements :
1. English - Hebrew translation if the details are in English 
2. Make/ manufacturer has its own column - no problem, trim / model/ year are combined inside the description of the the part - requires parsing - query will look for those parameters inside description.
3. Pcode and OEM - Pcode or OEM populate code cell in results sheet / 
