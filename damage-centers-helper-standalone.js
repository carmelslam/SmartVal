// ============================================================================
// 🏗️ DAMAGE CENTERS HELPER - STANDALONE VERSION
// ============================================================================
// This file contains ALL the damage centers functions we built
// Can be integrated into any working helper.js as a separate section

// ============================================================================
// 🆕 DAMAGE CENTERS WIZARD FUNCTIONS
// ============================================================================

window.getDamageCenters = function() {
  if (!window.helper || !window.helper.damage_centers) {
    console.log('📋 No damage centers found - initializing empty array');
    return [];
  }
  
  const centers = window.helper.damage_centers;
  console.log(`📋 Retrieved ${centers.length} damage centers from helper`);
  return centers;
};

window.getDamageCenterById = function(centerId) {
  if (!window.helper || !window.helper.damage_centers) {
    return null;
  }
  
  return window.helper.damage_centers.find(center => center.id === centerId) || null;
};

window.deleteDamageCenter = function(centerId) {
  if (!window.helper || !window.helper.damage_centers) {
    console.warn('❌ No damage centers array found');
    return false;
  }
  
  const centerIndex = window.helper.damage_centers.findIndex(center => center.id === centerId);
  if (centerIndex === -1) {
    console.warn(`❌ Damage center with ID ${centerId} not found`);
    return false;
  }
  
  // Remove the center
  window.helper.damage_centers.splice(centerIndex, 1);
  console.log(`✅ Deleted damage center ${centerId}`);
  
  // Recalculate totals
  window.calculateAllDamageCentersTotals();
  
  return true;
};

window.getNextDamageCenterNumber = function() {
  const existingCenters = window.getDamageCenters();
  if (!existingCenters || existingCenters.length === 0) {
    return 1;
  }
  
  // Find the highest number and add 1
  const highestNumber = Math.max(...existingCenters.map(center => {
    return parseInt(center["Damage center Number"] || center.number || 0);
  }));
  
  return Math.max(1, highestNumber + 1);
};

window.syncDamageAssessmentCenters = function() {
  if (!window.helper) return;
  
  // Initialize damage_assessment if needed
  if (!window.helper.damage_assessment) {
    window.helper.damage_assessment = { centers: [] };
  }
  
  // Sync damage_centers to damage_assessment.centers
  if (window.helper.damage_centers) {
    window.helper.damage_assessment.centers = [...window.helper.damage_centers];
    console.log('✅ Synced damage_centers to damage_assessment.centers');
  }
};

window.buildComprehensiveDamageAssessment = function() {
  console.log('🏗️ Building comprehensive damage assessment with ALL damage center details...');
  
  try {
    const allCenters = window.getDamageCenters();
    
    if (allCenters.length === 0) {
      console.log('📋 No damage centers found - returning empty assessment');
      return {
        centers: [],
        totals: { all_centers_total: 0 },
        summary: { total_centers: 0 }
      };
    }
    
    // Build comprehensive assessment
    const assessment = {
      centers: allCenters,
      totals: {
        all_centers_subtotal: 0,
        all_centers_vat: 0,
        all_centers_total: 0
      },
      summary: {
        total_centers: allCenters.length,
        completed_centers: allCenters.filter(c => c.status === 'completed').length
      },
      metadata: {
        generated_at: new Date().toISOString(),
        version: '2.0.0'
      }
    };
    
    // Calculate totals
    allCenters.forEach(center => {
      const centerTotal = parseFloat(center.Summary?.["Total with VAT"] || center.total_with_vat || 0);
      assessment.totals.all_centers_total += centerTotal;
    });
    
    // Store in helper
    window.helper.damage_assessment = window.helper.damage_assessment || {};
    window.helper.damage_assessment.comprehensive = assessment;
    window.helper.damage_assessment.totals = assessment.totals;
    window.helper.damage_assessment.last_updated = new Date().toISOString();
    
    console.log('✅ Built comprehensive damage assessment:', assessment);
    return assessment;
    
  } catch (error) {
    console.error('❌ Error building comprehensive damage assessment:', error);
    return null;
  }
};

// ============================================================================
// 📊 DAMAGE CENTERS DATA STRUCTURE TO ADD TO HELPER
// ============================================================================
/*
ADD THESE TO THE HELPER STRUCTURE:

  // ✅ DAMAGE CENTERS
  damage_centers: [],
  current_damage_center: {}

ADD AFTER THE SYSTEM SECTION, BEFORE THE CLOSING BRACKET
*/

console.log('✅ Damage Centers Helper - Standalone version loaded successfully');