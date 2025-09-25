Fix Parts Module 

Task: Fix Parts Module Data Synchronization and Integrity Issues
File Scope
Files:
* Damage wizard (parts required step)
* Parts search module
* Related helper update functions
Current Critical Problems
Data Integrity Issues:
1. Incomplete deletion: Deleting parts in UI doesn't remove from all helper locations (current_damage_center, parts_search.selected_parts, parts_search.damage_centers_summary)
2. Total cost not updating: Deletion doesn't trigger recalculation
3. Description field overwritten: Part name overwrites user-entered descriptions
4. Wrong part count: Shows 6 when there are 7 parts
5. Wrong damage center numbers: Edit mode shows next center number (3) instead of current (1)
6. Edits create duplicates: Each edit creates new entry instead of updating
7. Double parts on save: selected_parts doubles on each save (12 parts instead of 7)
8. No edit vs create distinction: System can't differentiate between new and existing
9. Missing bidirectional sync: parts_search and current_damage_center not synced
10. Can't handle volume: No cleanup or deduplication logic
Implementation Plan - Execute One Phase at a Time
Phase 0: Investigation (DO FIRST)
// Add diagnostic logging to understand current state
console.log('=== PARTS MODULE DIAGNOSTIC ===');
console.log('Current damage center:', helper.current_damage_center);
console.log('Selected parts count:', helper.parts_search.selected_parts?.length);
console.log('Damage centers summary:', helper.parts_search.damage_centers_summary);
console.log('Parts in UI:', document.querySelectorAll('.part-row').length);

// Document where each write operation happens
// Find all instances of:
// - helper.parts_search.selected_parts.push()
// - helper.current_damage_center.parts = 
// - helper.parts_search.damage_centers_summary.push()
STOP HERE - Test and report findings
Phase 1: Fix Damage Center Number (Problem 5)
// In wizard step 1, fix edit mode detection
function initializeDamageCenter(mode, centerId) {
    if (mode === 'edit' && centerId) {
        // Set to CURRENT center number immediately
        document.getElementById('damage_center_number').value = centerId;
        helper.current_damage_center.number = centerId;
        helper.edit_mode = 'edit';
        helper.editing_center_id = centerId;
    } else {
        // Only use next number for NEW centers
        const nextNum = getNextCenterNumber();
        document.getElementById('damage_center_number').value = nextNum;
        helper.edit_mode = 'create';
    }
}
STOP HERE - Test edit vs create mode
Phase 2: Implement Update vs Create Logic (Problems 6, 7, 8)
// Add unique identifier strategy
function savePartWithDuplicateCheck(part, centerId) {
    // Create unique key
    const partKey = `${centerId}_${part.partNumber}`;
    
    // Check if exists in selected_parts
    const existingIndex = helper.parts_search.selected_parts
        .findIndex(p => `${p.centerId}_${p.partNumber}` === partKey);
    
    if (existingIndex >= 0) {
        // UPDATE existing part
        helper.parts_search.selected_parts[existingIndex] = {
            ...helper.parts_search.selected_parts[existingIndex],
            ...part,
            centerId: centerId
        };
    } else {
        // CREATE new part
        helper.parts_search.selected_parts.push({
            ...part,
            centerId: centerId
        });
    }
}
STOP HERE - Test no duplicates on edit
Phase 3: Fix Delete Operations (Problems 1, 2)
function deletePartCompletely(partIndex, centerId) {
    // 1. Remove from current_damage_center
    if (helper.current_damage_center?.parts) {
        helper.current_damage_center.parts = 
            helper.current_damage_center.parts.filter((_, i) => i !== partIndex);
    }
    
    // 2. Remove from parts_search.selected_parts
    const partKey = `${centerId}_${helper.parts_search.selected_parts[partIndex]?.partNumber}`;
    helper.parts_search.selected_parts = 
        helper.parts_search.selected_parts.filter(p => 
            `${p.centerId}_${p.partNumber}` !== partKey
        );
    
    // 3. Update damage_centers_summary
    const summary = helper.parts_search.damage_centers_summary
        .find(dc => dc.center_number === centerId);
    if (summary?.parts) {
        summary.parts = summary.parts.filter((_, i) => i !== partIndex);
    }
    
    // 4. Recalculate totals
    updateTotalCost();
    updatePartCount();
}
STOP HERE - Test deletion from all locations
Phase 4: Fix Description Field (Problem 3)
// Ensure description is separate field
function updatePartInfo(part) {
    // Add description field if missing
    if (!part.hasOwnProperty('description')) {
        part.description = '';
    }
    
    // Don't overwrite description with name
    const descInput = document.getElementById(`desc_${part.id}`);
    if (descInput) {
        descInput.value = part.description; // NOT part.name
    }
}
STOP HERE - Test description persistence
Phase 5: Implement Bidirectional Sync (Problem 9)
function syncPartsBetweenModules() {
    // Only sync when in wizard context
    if (helper.context === 'wizard') {
        // Sync current_damage_center ↔ parts_search
        helper.parts_search.selected_parts = 
            helper.parts_search.selected_parts.map(part => {
                if (part.centerId === helper.current_damage_center.number) {
                    // Find matching part in current center
                    const centerPart = helper.current_damage_center.parts
                        ?.find(cp => cp.partNumber === part.partNumber);
                    return centerPart ? {...part, ...centerPart} : part;
                }
                return part;
            });
    }
}
STOP HERE - Test bidirectional sync
Phase 6: Fix Counts and Cleanup (Problems 4, 10)
// Fix part count
function updatePartCount() {
    const actualCount = helper.parts_search.selected_parts.length;
    document.querySelector('.parts-total-count').textContent = actualCount;
}

// Remove duplicates
function removeDuplicateParts() {
    const seen = new Map();
    helper.parts_search.selected_parts = 
        helper.parts_search.selected_parts.filter(part => {
            const key = `${part.centerId}_${part.partNumber}`;
            if (seen.has(key)) {
                return false;
            }
            seen.set(key, true);
            return true;
        });
}
STOP HERE - Final testing
Critical Rules
* Execute ONE phase at a time
* Test after EACH phase
* Report results before proceeding
* Don't skip diagnostic phase
* If something breaks, STOP immediately
Success Criteria Per Phase
* Phase 0: Full understanding of current data flow
* Phase 1: Edit shows correct center number
* Phase 2: No duplicates on edit
* Phase 3: Delete removes from all locations
* Phase 4: Description field separate from name
* Phase 5: Changes sync both ways
* Phase 6: Correct counts and no duplicates


