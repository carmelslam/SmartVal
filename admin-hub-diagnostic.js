// admin-hub-diagnostic.js
// Quick diagnostic script to test admin hub → iframe communication

console.log('🔍 Admin Hub Diagnostic Script Loaded');

// Diagnostic function to test iframe communication
window.testIframeCommunication = function() {
  console.log('🧪 Testing iframe communication...');
  console.log('══════════════════════════════════════');
  
  // Find all iframes
  const iframes = document.querySelectorAll('iframe');
  console.log(`📊 Found ${iframes.length} iframes on page`);
  
  if (iframes.length === 0) {
    console.log('❌ No iframes found - cannot test communication');
    return;
  }
  
  // Test each iframe
  iframes.forEach((iframe, index) => {
    console.log(`🔍 Testing iframe ${index}:`);
    console.log('  src:', iframe.src);
    console.log('  id:', iframe.id);
    console.log('  contentWindow available:', !!iframe.contentWindow);
    
    if (iframe.contentWindow) {
      try {
        // Send test message
        const testMessage = {
          type: 'VAT_RATE_UPDATED',
          vatRate: 19,
          timestamp: Date.now(),
          test: true,
          source: 'diagnostic'
        };
        
        iframe.contentWindow.postMessage(testMessage, '*');
        console.log(`  ✅ Test message sent to iframe ${index}`);
        
      } catch (e) {
        console.log(`  ❌ Failed to send message to iframe ${index}:`, e);
      }
    }
  });
  
  console.log('══════════════════════════════════════');
  console.log('🎯 Test messages sent. Check iframe console for responses.');
};

// Listen for responses from iframes
window.addEventListener('message', function(event) {
  if (event.data && event.data.test) {
    console.log('✅ Received test response from iframe:', event.data);
  }
});

// Auto-detect VAT buttons and add diagnostic logging
function diagnosticVatButtons() {
  console.log('🔍 Scanning for VAT-related elements...');
  
  // Look for elements with VAT-like text
  const allElements = document.querySelectorAll('*');
  const vatElements = [];
  
  allElements.forEach(el => {
    const text = el.textContent.trim();
    if (text.match(/^\d+%$/) && (text.includes('18') || text.includes('17') || text.includes('0'))) {
      vatElements.push({element: el, text: text});
    }
  });
  
  console.log(`📊 Found ${vatElements.length} potential VAT elements:`);
  vatElements.forEach(({element, text}, index) => {
    console.log(`  ${index}: "${text}"`, element);
  });
  
  // Add click listeners to these elements
  vatElements.forEach(({element, text}) => {
    element.addEventListener('click', function() {
      console.log('🖱️ VAT element clicked:', text);
      
      // Extract rate and broadcast
      const rateMatch = text.match(/(\d+)%/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1]);
        console.log('📡 Broadcasting VAT rate change:', rate + '%');
        
        // Send to all iframes
        const iframes = document.querySelectorAll('iframe');
        const message = {
          type: 'VAT_RATE_UPDATED',
          vatRate: rate,
          timestamp: Date.now(),
          source: 'diagnostic_click'
        };
        
        iframes.forEach((iframe, index) => {
          try {
            iframe.contentWindow.postMessage(message, '*');
            console.log(`📡 Sent VAT ${rate}% to iframe ${index}`);
          } catch (e) {
            console.warn(`❌ Failed to send to iframe ${index}:`, e);
          }
        });
      }
    });
  });
  
  return vatElements;
}

// Auto-run diagnostic after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      console.log('🚀 Running auto-diagnostic...');
      diagnosticVatButtons();
      testIframeCommunication();
    }, 1000);
  });
} else {
  setTimeout(() => {
    console.log('🚀 Running auto-diagnostic...');
    diagnosticVatButtons();
    testIframeCommunication();
  }, 1000);
}

console.log('🧪 Diagnostic functions available:');
console.log('- testIframeCommunication() - Test iframe communication');
console.log('- diagnosticVatButtons() - Find and instrument VAT buttons');