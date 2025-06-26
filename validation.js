// validation.js — Smart validation engine for report finalization (with bulk+per-type field logic)

const ValidationEngine = {
  validate(helper) {
    const errors = [];
    const meta = helper.meta || {};
    const reportType = meta.report_type || 'unknown';

    // --- Basic Required Info (global) ---
    if (!helper.vehicle?.plate_number) errors.push("מספר רכב חסר");
    if (!helper.client?.name) errors.push("שם בעל הרכב חסר");

    // --- Bulk Screen: Car Details ---
    const car = helper.car_details || {};
    const requiredCarFields = ["make", "model", "year", "market_value"];
    requiredCarFields.forEach(key => {
      if (!car[key]) errors.push(`פרט רכב חסר: ${key} (מסך פרטי רכב)`);
    });

    // --- Bulk Screen: Damage Center Logic ---
    const damageSections = helper.damage_sections || [];
    if (damageSections.length === 0) {
      errors.push("אין אזורי נזק מתועדים (מסך מרכז נזק)");
    } else {
      damageSections.forEach((section, i) => {
        if (!section.works?.length) errors.push(`חסרות עבודות באזור נזק #${i + 1}`);
        if (!section.repairs?.length) errors.push(`חסרים תיקונים באזור נזק #${i + 1}`);
        if (!section.parts?.length) errors.push(`חסרים חלקים באזור נזק #${i + 1}`);
      });
    }

    // --- Bulk Screen: Depreciation ---
    const dep = helper.depreciation || {};
    if (!dep.global_amount || dep.global_amount <= 0) {
      errors.push("נתוני ירידת ערך חסרים או לא חוקיים (מסך ירידת ערך)");
    }

    // --- Bulk Screen: Legal Text ---
    if (!meta.legal_block || meta.legal_block.trim() === '') {
      errors.push("חסר בלוק משפטי (מסך משפטי)");
    }

    // --- Image Files ---
    if (!helper.files || helper.files.length < 1) errors.push("לא צורפו תמונות");

    // --- Levi Report ---
    if (!helper.levi_report?.adjustments?.length) errors.push("לא צורף דוח לוי יצחק");

    // --- Invoice Logic ---
    if (helper.invoice_uploaded) {
      if (!helper.invoice_summary?.total_damage) errors.push("סך נזק מתוך חשבונית חסר");
      if (!helper.invoice_calculations) errors.push("נתוני חשבונית לא חושבו");
    }

    // --- Finalization Lock ---
    if (reportType && meta.status !== 'final') {
      errors.push("לא ניתן להוציא דוח סופי במצב טיוטה");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  showIssues(errors) {
    if (!errors.length) return;
    alert("שגיאות במילוי:\n" + errors.map(e => `• ${e}`).join("\n"));
  }
};

window.validationEngine = ValidationEngine;
console.log("✅ validation.js loaded with bulk + report-type field validation");