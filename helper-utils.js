export function saveAdjustmentsToHelper() {
  try {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    helper.valuation = helper.valuation || {};
    const encryptionKey = 'your-secure-key'; // Replace with a securely stored key
    const crypto = require('crypto');

    function encrypt(text, key) {
        const cipher = crypto.createCipher('aes-256-ctr', key);
       return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
   }

   function decrypt(text, key) {
       const decipher = crypto.createDecipher('aes-256-ctr', key);
       return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
   }

   if (helper.meta && helper.meta.phone_number) {
       helper.meta.phone_number = encrypt(helper.meta.phone_number, encryptionKey);
   }
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
    if (helper.meta && helper.meta.phone_number) {
        helper.meta.phone_number = decrypt(helper.meta.phone_number, encryptionKey);
    }
  } catch (err) {
    console.error('Error saving adjustments to helper:', err);
  }
}

// expose globally for inline handlers
window.saveAdjustmentsToHelper = saveAdjustmentsToHelper;
