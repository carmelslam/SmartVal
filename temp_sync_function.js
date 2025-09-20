    function syncAdjustmentToHelper(element, category) {
      try {
        console.log(`🔥 syncAdjustmentToHelper called for category: ${category}, element:`, element);
        const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
        
        // Ensure structures exist
        if (!helper.valuation) helper.valuation = {};
        if (!helper.valuation.adjustments) helper.valuation.adjustments = {};
        if (!helper.estimate) helper.estimate = {};
        if (!helper.estimate.adjustments) helper.estimate.adjustments = {};
        if (!helper.final_report) helper.final_report = {};
        if (!helper.final_report.adjustments) {
          helper.final_report.adjustments = {
            features: [],
            registration: [],
            mileage: [],
            ownership_type: [],
            ownership_history: [],
            usage: [],
            additional: []
          };
        }
        
        // Map category to container ID - Check both full market and gross containers
        let containerId = '';
        if (category === 'features') {
          // Check if element is from gross section or full market section
          const row = element.closest('div');
          const grossContainer = document.getElementById('featuresAdjustmentsList');
          const fullContainer = document.getElementById('fullFeaturesAdjustmentsList');
          
          if (grossContainer && grossContainer.contains(row)) {
            containerId = 'featuresAdjustmentsList'; // Gross section
            console.log(`🎯 Detected GROSS features section for ${category}`);
          } else {
            containerId = 'fullFeaturesAdjustmentsList'; // Full market section
            console.log(`🎯 Detected FULL MARKET features section for ${category}`);
          }
        }
        else if (category === 'registration') {
          // Check if element is from gross section or full market section  
          const row = element.closest('div');
          const grossContainer = document.getElementById('registrationAdjustmentsList');
          const fullContainer = document.getElementById('fullRegistrationAdjustmentsList');
          
          if (grossContainer && grossContainer.contains(row)) {
            containerId = 'registrationAdjustmentsList'; // Gross section
            console.log(`🎯 Detected GROSS registration section for ${category}`);
          } else {
            containerId = 'fullRegistrationAdjustmentsList'; // Full market section
            console.log(`🎯 Detected FULL MARKET registration section for ${category}`);
          }
        }
        else if (category === 'mileage') containerId = 'mileageAdjustmentsList';
        else if (category === 'ownership_type') containerId = 'ownershipAdjustmentsList';
        else if (category === 'ownership_history') containerId = 'ownersAdjustmentsList';
        else if (category === 'additional') containerId = 'allAdjustmentsList';
        
        if (!containerId) {
          console.error('❌ Unknown category:', category);
          return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
          console.error('❌ Container not found:', containerId);
          return;
        }
        
        console.log(`🔄 Rebuilding ${category} from all UI rows in ${containerId}`);
        
        // ESTIMATOR PATTERN: Rebuild entire category array from ALL visible UI rows
        const allRows = Array.from(container.children);
        helper.estimate.adjustments[category] = [];
        helper.final_report.adjustments[category] = [];
        
        allRows.forEach((row, index) => {
          const inputs = row.querySelectorAll('input, select');
          if (inputs.length >= 4) {
            const adjustmentData = {
              value: inputs[0].value || '',
              type: inputs[1].value || 'plus',
              percentage: parseFloat(inputs[2].value) || 0,
              percent: parseFloat(inputs[2].value) || 0, // Backward compatibility
              amount_display: inputs[3].value || '',
              amount: parseFloat((inputs[3].value || '').replace(/[₪,-]/g, '')) || 0,
              source: 'manual',
              timestamp: new Date().toISOString()
            };
            
            // Apply sign based on type (CRITICAL FOR MINUS SIGNS)
            if (adjustmentData.type === 'minus') {
              adjustmentData.percentage = -Math.abs(adjustmentData.percentage);
              adjustmentData.percent = -Math.abs(adjustmentData.percent);
              adjustmentData.amount = -Math.abs(adjustmentData.amount);
            }
            
            // Calculate amount from percentage if needed
            if (adjustmentData.percentage && !adjustmentData.amount) {
              const baseValue = parseFloat(helper.estimate?.market_value_base) || 0;
              if (baseValue > 0) {
                const amount = Math.round((baseValue * Math.abs(adjustmentData.percentage)) / 100);
                adjustmentData.amount = adjustmentData.type === 'minus' ? -amount : amount;
              }
            }
            
            helper.estimate.adjustments[category].push(adjustmentData);
            helper.final_report.adjustments[category].push(adjustmentData);
            console.log(`📝 Added row ${index} to ${category}:`, adjustmentData.value);
          }
        });
        
        console.log(`✅ Rebuilt ${category}: ${helper.estimate.adjustments[category].length} items total`);
        console.log(`📊 Final estimate.adjustments.${category}:`, helper.estimate.adjustments[category]);
        
        // ESTIMATOR PATTERN: Update valuation.adjustments with first item (for backward compatibility)
        if (helper.estimate.adjustments[category].length > 0) {
          helper.valuation.adjustments[category] = helper.estimate.adjustments[category][0];
        } else {
          // Clear valuation if no items remain
          if (helper.valuation.adjustments[category]) {
            delete helper.valuation.adjustments[category];
          }
        }
        
        // Save to storage
        sessionStorage.setItem('helper', JSON.stringify(helper));
        window.helper = helper; // Update window.helper
        
      } catch (error) {
        console.error('Error in syncAdjustmentToHelper:', error);
      }
    }