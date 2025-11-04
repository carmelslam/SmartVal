// Test case lookup - paste this in browser console
console.log("🧪 Testing case lookup...");

async function testCaseLookup() {
    if (!window.supabase) {
        console.error("❌ Supabase not available");
        return;
    }
    
    // Check what's in helper
    console.log("📋 Helper status:", {
        available: !!window.helper,
        plate: window.helper?.meta?.plate,
        vehicle_plate: window.helper?.vehicle?.plate,
        case_info: window.helper?.case_info
    });
    
    const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
    if (!plate) {
        console.error("❌ No plate found in helper");
        return;
    }
    
    const normalizedPlate = plate.replace(/[\s-]/g, '');
    console.log(`🔍 Looking for plate: "${plate}" → normalized: "${normalizedPlate}"`);
    
    try {
        // Query cases table
        const { data: casesData, error: caseError } = await window.supabase
            .from('cases')
            .select('id, filing_case_id, plate, created_at')
            .eq('plate', normalizedPlate)
            .order('created_at', { ascending: false });
        
        if (caseError) {
            console.error("❌ Cases query error:", caseError);
            return;
        }
        
        console.log("📋 Cases found:", casesData);
        
        if (casesData && casesData.length > 0) {
            console.log("✅ Found case ID:", casesData[0].id);
            
            // Test if this case has invoice documents
            const { data: docsData, error: docsError } = await window.supabase
                .from('invoice_documents')
                .select('id, filename, created_at')
                .eq('case_id', casesData[0].id)
                .limit(5);
            
            if (!docsError) {
                console.log("📄 Invoice documents for this case:", docsData);
            }
            
            // Test if this case has mappings
            const { data: mappingsData, error: mappingsError } = await window.supabase
                .from('invoice_damage_center_mappings')
                .select('id, damage_center_id, field_type')
                .eq('case_id', casesData[0].id)
                .limit(5);
            
            if (!mappingsError) {
                console.log("🔗 Damage center mappings for this case:", mappingsData);
            }
            
        } else {
            console.log("❌ No cases found for this plate");
            
            // Show what plates DO exist
            const { data: allCases, error: allError } = await window.supabase
                .from('cases')
                .select('plate, id, created_at')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (!allError && allCases) {
                console.log("📋 Recent plates in database:", 
                    allCases.map(c => `"${c.plate}" (${c.id.substring(0,8)}...)`));
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run the test
testCaseLookup();

// Also provide manual test functions
window.debugInvoiceCase = {
    testLookup: testCaseLookup,
    setRealPlate: (plate) => {
        if (!window.helper) window.helper = { meta: {} };
        if (!window.helper.meta) window.helper.meta = {};
        window.helper.meta.plate = plate;
        console.log("✅ Set plate:", plate);
        testCaseLookup();
    },
    openFloating: () => {
        if (window.toggleInvoiceDetails) {
            window.toggleInvoiceDetails();
        } else {
            console.error("❌ toggleInvoiceDetails not available");
        }
    }
};