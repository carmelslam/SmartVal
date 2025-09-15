// Estimator Builder Inline Frame
// This script provides inline iframe functionality for the estimator-builder.html

let estimatorBuilderFrame = null;
let estimatorBuilderOverlay = null;

window.openEstimatorBuilderPiP = function(section = '') {
  console.log('🏗️ Opening Estimator Builder in inline frame with section:', section);

  // Close existing frame if open
  if (estimatorBuilderOverlay) {
    closeEstimatorBuilderPiP();
  }

  // Create overlay container
  estimatorBuilderOverlay = document.createElement('div');
  estimatorBuilderOverlay.id = 'estimator-builder-overlay';
  estimatorBuilderOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
  `;

  // Create frame container
  const frameContainer = document.createElement('div');
  frameContainer.style.cssText = `
    width: 90%;
    height: 85%;
    max-width: 1100px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  `;

  // Create header with title and close button
  const frameHeader = document.createElement('div');
  frameHeader.style.cssText = `
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: between;
    align-items: center;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;

  const frameTitle = document.createElement('div');
  frameTitle.innerHTML = '🏗️ עורך האומדן';
  frameTitle.style.cssText = `
    font-size: 16px;
    font-weight: bold;
    flex-grow: 1;
  `;

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 15px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
  });

  closeButton.addEventListener('click', () => {
    closeEstimatorBuilderPiP();
  });

  frameHeader.appendChild(frameTitle);
  frameHeader.appendChild(closeButton);

  // Build URL with section anchor if provided
  let url = './estimator-builder.html';
  if (section) {
    url += '#' + section;
  }

  // Create iframe
  estimatorBuilderFrame = document.createElement('iframe');
  estimatorBuilderFrame.src = url;
  estimatorBuilderFrame.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    flex-grow: 1;
  `;

  // Assembly
  frameContainer.appendChild(frameHeader);
  frameContainer.appendChild(estimatorBuilderFrame);
  estimatorBuilderOverlay.appendChild(frameContainer);
  document.body.appendChild(estimatorBuilderOverlay);

  // Set up data sync
  setupDataSync();

  // Close on overlay click (but not on frame click)
  estimatorBuilderOverlay.addEventListener('click', (e) => {
    if (e.target === estimatorBuilderOverlay) {
      closeEstimatorBuilderPiP();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', escapeHandler);

  console.log('✅ Estimator Builder inline frame opened successfully');
  return true;
};

// Close inline frame
function closeEstimatorBuilderPiP() {
  if (estimatorBuilderOverlay) {
    document.removeEventListener('keydown', escapeHandler);
    document.body.removeChild(estimatorBuilderOverlay);
    estimatorBuilderOverlay = null;
    estimatorBuilderFrame = null;
    
    console.log('🔒 Estimator Builder inline frame closed');
    
    // Refresh validation data when frame closes
    if (typeof refreshValidationData === 'function') {
      refreshValidationData();
    }
  }
}

// Escape key handler
function escapeHandler(e) {
  if (e.key === 'Escape') {
    closeEstimatorBuilderPiP();
  }
}

// Set up bidirectional data synchronization between iframe and parent
function setupDataSync() {
  if (!estimatorBuilderFrame) return;
  
  // Send current helper data to the iframe
  const syncData = () => {
    if (estimatorBuilderFrame && estimatorBuilderFrame.contentWindow) {
      try {
        const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
        
        // Send data via postMessage to iframe
        estimatorBuilderFrame.contentWindow.postMessage({
          type: 'SYNC_HELPER_DATA',
          data: helper
        }, '*');
        
        console.log('📤 Sent helper data to Estimator Builder iframe');
      } catch (error) {
        console.error('❌ Error syncing data to iframe:', error);
      }
    }
  };
  
  // Initial sync after iframe loads
  estimatorBuilderFrame.onload = () => {
    setTimeout(syncData, 500);
  };
  
  // Listen for data updates from iframe
  window.addEventListener('message', (event) => {
    if (event.source === estimatorBuilderFrame.contentWindow) {
      if (event.data.type === 'UPDATE_HELPER_DATA') {
        try {
          // Update local helper data
          sessionStorage.setItem('helper', JSON.stringify(event.data.data));
          console.log('📥 Received helper data update from Estimator Builder iframe');
          
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

// Toggle Estimator Builder inline frame
window.toggleEstimatorBuilderPiP = function(section = '') {
  if (estimatorBuilderOverlay) {
    console.log('🔒 Closing existing Estimator Builder inline frame');
    closeEstimatorBuilderPiP();
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