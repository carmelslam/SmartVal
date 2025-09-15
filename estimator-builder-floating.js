// Estimator Builder Floating Window
// This script provides PiP functionality for the estimator-builder.html

let estimatorBuilderWindow = null;

window.openEstimatorBuilderPiP = function(section = '') {
  console.log('🏗️ Opening Estimator Builder in PiP mode with section:', section);

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Calculate PiP window dimensions (80% of screen)
  const pipWidth = Math.round(screenWidth * 0.8);
  const pipHeight = Math.round(screenHeight * 0.8);
  
  // Center the window
  const left = Math.round((screenWidth - pipWidth) / 2);
  const top = Math.round((screenHeight - pipHeight) / 2);
  
  // Build URL with section anchor if provided
  let url = './estimator-builder.html';
  if (section) {
    url += '#' + section;
  }
  
  // Window features for PiP mode
  const features = [
    `width=${pipWidth}`,
    `height=${pipHeight}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
    'status=yes',
    'menubar=no',
    'toolbar=no',
    'location=no',
    'directories=no'
  ].join(',');
  
  try {
    // Close existing window if open
    if (estimatorBuilderWindow && !estimatorBuilderWindow.closed) {
      estimatorBuilderWindow.close();
    }
    
    // Open new PiP window
    estimatorBuilderWindow = window.open(url, 'estimatorBuilder', features);
    
    if (estimatorBuilderWindow) {
      console.log('✅ Estimator Builder PiP window opened successfully');
      
      // Focus the new window
      estimatorBuilderWindow.focus();
      
      // Set up message passing for data synchronization
      setupDataSync();
      
      // Set up window close handler
      const checkClosed = setInterval(() => {
        if (estimatorBuilderWindow.closed) {
          console.log('🔒 Estimator Builder PiP window closed');
          clearInterval(checkClosed);
          estimatorBuilderWindow = null;
          
          // Refresh validation data when window closes
          if (typeof refreshValidationData === 'function') {
            refreshValidationData();
          }
        }
      }, 1000);
      
      return true;
    } else {
      console.error('❌ Failed to open Estimator Builder PiP window');
      showAlert('לא ניתן לפתוח חלון עריכה. אנא בדוק את הגדרות החסימה של הדפדפן.', 'error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error opening Estimator Builder PiP:', error);
    showAlert('שגיאה בפתיחת חלון עריכה: ' + error.message, 'error');
    return false;
  }
};

// Set up bidirectional data synchronization between windows
function setupDataSync() {
  if (!estimatorBuilderWindow) return;
  
  // Send current helper data to the PiP window
  const syncData = () => {
    if (estimatorBuilderWindow && !estimatorBuilderWindow.closed) {
      try {
        const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
        
        // Send data via postMessage
        estimatorBuilderWindow.postMessage({
          type: 'SYNC_HELPER_DATA',
          data: helper
        }, '*');
        
        console.log('📤 Sent helper data to Estimator Builder PiP');
      } catch (error) {
        console.error('❌ Error syncing data to PiP:', error);
      }
    }
  };
  
  // Initial sync after a short delay to ensure window is loaded
  setTimeout(syncData, 1000);
  
  // Listen for data updates from PiP window
  window.addEventListener('message', (event) => {
    if (event.source === estimatorBuilderWindow) {
      if (event.data.type === 'UPDATE_HELPER_DATA') {
        try {
          // Update local helper data
          sessionStorage.setItem('helper', JSON.stringify(event.data.data));
          console.log('📥 Received helper data update from Estimator Builder PiP');
          
          // Refresh validation display if function exists
          if (typeof refreshValidationDisplay === 'function') {
            refreshValidationDisplay();
          }
          
          // Trigger validation refresh for updated sections
          if (event.data.updatedSections && Array.isArray(event.data.updatedSections)) {
            event.data.updatedSections.forEach(sectionName => {
              if (typeof validateSection === 'function') {
                setTimeout(() => validateSection(sectionName), 500);
              }
            });
          }
          
        } catch (error) {
          console.error('❌ Error processing helper data update:', error);
        }
      }
    }
  });
}

// Toggle Estimator Builder PiP window
window.toggleEstimatorBuilderPiP = function(section = '') {
  if (estimatorBuilderWindow && !estimatorBuilderWindow.closed) {
    console.log('🔒 Closing existing Estimator Builder PiP window');
    estimatorBuilderWindow.close();
    estimatorBuilderWindow = null;
  } else {
    openEstimatorBuilderPiP(section);
  }
};

// Section anchor mapping for proper navigation
const sectionAnchors = {
  'vehicle': 'vehicleData',
  'levi': 'vehicleData', // Levi data is part of vehicle section
  'damage': 'damageCentersSummary',
  'depreciation': 'depreciationSection',
  'estimate': 'estimate-type',
  'legal_text': 'legal-text'
};

// Open specific section in PiP
window.openEstimatorSection = function(sectionName) {
  const anchor = sectionAnchors[sectionName] || sectionName;
  return openEstimatorBuilderPiP(anchor);
};

// Refresh validation display after PiP updates
function refreshValidationDisplay() {
  try {
    // Re-populate validation items for all sections
    const populateFunctions = [
      'populateEnhancedValidationItems',
      'populateLeviValidationItems', 
      'populateDamageValidationItems',
      'populateDepreciationValidationItems',
      'populateEstimateValidationItems'
    ];
    
    populateFunctions.forEach(funcName => {
      if (typeof window[funcName] === 'function') {
        try {
          window[funcName]();
        } catch (error) {
          console.warn(`⚠️ Error refreshing ${funcName}:`, error);
        }
      }
    });
    
    console.log('🔄 Validation display refreshed after PiP update');
  } catch (error) {
    console.error('❌ Error refreshing validation display:', error);
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    openEstimatorBuilderPiP,
    toggleEstimatorBuilderPiP,
    openEstimatorSection,
    setupDataSync
  };
}

console.log('✅ Estimator Builder Floating script loaded');