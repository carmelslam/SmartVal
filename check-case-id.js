// Quick Case ID Checker - Run this in browser console
console.log("🔍 CASE ID DETECTION REPORT");
console.log("===========================");

// Check all possible case ID sources
const sources = {
    'window.helper?.cases?.id': window.helper?.cases?.id,
    'window.helper?.meta?.case_id': window.helper?.meta?.case_id,
    'window.helper?.case_info?.supabase_case_id': window.helper?.case_info?.supabase_case_id,
    'window.helper?.case_info?.case_id': window.helper?.case_info?.case_id,
    'window.helper?.damage_assessment?.case_id': window.helper?.damage_assessment?.case_id,
    'window.helper?.meta?.plate': window.helper?.meta?.plate,
    'sessionStorage.currentCaseId': sessionStorage.getItem('currentCaseId'),
    'localStorage.currentCaseId': localStorage.getItem('currentCaseId')
};

let foundCaseId = null;

Object.entries(sources).forEach(([source, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${source}: ${value || 'לא נמצא'}`);
    if (value && !foundCaseId) {
        foundCaseId = value;
    }
});

console.log("\n📋 WINDOW.HELPER STRUCTURE:");
if (window.helper) {
    console.log("Available helper keys:", Object.keys(window.helper));
    if (window.helper.case_info) {
        console.log("case_info keys:", Object.keys(window.helper.case_info));
    }
    if (window.helper.meta) {
        console.log("meta keys:", Object.keys(window.helper.meta));
    }
} else {
    console.log("❌ window.helper not available");
}

console.log("\n🎯 RECOMMENDED CASE ID:", foundCaseId || 'NONE FOUND');

// Function to set a real case ID for testing
window.setTestCaseId = function(caseId) {
    sessionStorage.setItem('currentCaseId', caseId);
    if (!window.helper) window.helper = {};
    if (!window.helper.cases) window.helper.cases = {};
    if (!window.helper.meta) window.helper.meta = {};
    if (!window.helper.case_info) window.helper.case_info = {};
    
    window.helper.cases.id = caseId;
    window.helper.meta.case_id = caseId;
    window.helper.case_info.supabase_case_id = caseId;
    
    console.log("✅ Set test case ID:", caseId);
    console.log("Now try opening the invoice floating screen!");
};

console.log("\n💡 TO SET A REAL CASE ID:");
console.log("setTestCaseId('YOUR_REAL_CASE_ID_HERE')");

// Quick test function
window.testInvoiceScreen = function() {
    if (window.toggleInvoiceDetails) {
        window.toggleInvoiceDetails();
        console.log("✅ Opened invoice floating screen");
    } else {
        console.log("❌ toggleInvoiceDetails function not found");
    }
};

console.log("💡 TO TEST FLOATING SCREEN: testInvoiceScreen()");