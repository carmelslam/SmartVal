export function saveAdjustmentsToHelper() {
  try {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.valuation = helper.valuation || {};
    const adjustments = { registration: {}, features: {} };

    const featureRows = document.querySelectorAll('#featuresAdjustmentsList > div');
    const features = [];
    let featuresPercent = 0;
    let featuresAmount = 0;
    featureRows.forEach(row => {
      const inputs = row.querySelectorAll('input');
      const select = row.querySelector('select');
      if (inputs.length >= 3) {
        const description = inputs[0].value.trim();
        const percent = parseFloat(inputs[1].value) || 0;
        const value = parseFloat(inputs[2].value.replace(/[₪,]/g, '')) || 0;
        const type = select ? select.value : 'plus';
        if (description || percent || value) {
          const adjValue = type === 'minus' ? -Math.abs(value) : Math.abs(value);
          features.push({ description, amount: adjValue, percent: type === 'minus' ? -Math.abs(percent) : Math.abs(percent) });
          featuresPercent += type === 'minus' ? -Math.abs(percent) : Math.abs(percent);
          featuresAmount += adjValue;
        }
      }
    });

    adjustments.features = {
      percent: featuresPercent,
      amount: featuresAmount,
      feature_list: features
    };

    const regRows = document.querySelectorAll('#registrationAdjustmentsList > div');
    let regPercent = 0;
    let regAmount = 0;
    let regDesc = '';
    regRows.forEach(row => {
      const inputs = row.querySelectorAll('input');
      const select = row.querySelector('select');
      if (inputs.length >= 3) {
        regDesc = inputs[0].value.trim();
        const percent = parseFloat(inputs[1].value) || 0;
        const value = parseFloat(inputs[2].value.replace(/[₪,]/g, '')) || 0;
        const type = select ? select.value : 'plus';
        const adjValue = type === 'minus' ? -Math.abs(value) : Math.abs(value);
        regPercent += type === 'minus' ? -Math.abs(percent) : Math.abs(percent);
        regAmount += adjValue;
      }
    });

    adjustments.registration = {
      percent: regPercent,
      amount: regAmount,
      description: regDesc
    };

    helper.valuation.adjustments = adjustments;
    sessionStorage.setItem('helper', JSON.stringify(helper));
  } catch (err) {
    console.error('Error saving adjustments to helper:', err);
  }
}

// expose globally for inline handlers
window.saveAdjustmentsToHelper = saveAdjustmentsToHelper;
