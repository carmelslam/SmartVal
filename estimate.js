// estimate.js — Standalone Estimate Report Engine

import { calculate } from './math.js';
import { sendToWebhook } from './webhook.js';

const EstimateEngine = {
  helper: {},

  init() {
    const raw = sessionStorage.getItem('helper');
    if (!raw) return alert('❌ No base data found (helper missing)');
    this.helper = JSON.parse(raw);

    // If already estimated, load modified view
    if (this.helper.meta?.report_stage === 'estimate') {
      this.loadEstimateSnapshot();
    }

    this.bindUI();
  },

  bindUI() {
    document.getElementById('save-estimate')?.addEventListener('click', () => this.save());
    // More bindings can be added here for editing damage center data, depreciation, etc.
  },

  loadEstimateSnapshot() {
    const snap = this.helper.estimate?.snapshot;
    if (!snap) return;

    // Merge overridden fields into main helper
    Object.keys(snap).forEach(key => {
      this.helper[key] = snap[key];
    });
  },

  collectChanges() {
    const overrides = {};

    // Editable during estimate phase
    const changeKeys = [
      'damage_sections', // includes works, parts, repairs, descriptions
      'car_details',     // allows override of valuation or year if needed
      'depreciation'     // this is manually added by user (distinct from Levi)
    ];

    changeKeys.forEach(key => {
      if (this.helper[key]) overrides[key] = this.helper[key];
    });

    return overrides;
  },

  save() {
    const snapshot = this.collectChanges();

    this.helper.meta.report_stage = 'estimate';
    this.helper.meta.estimate_overrides = true;
    this.helper.estimate = {
      modified_sections: Object.keys(snapshot),
      snapshot
    };

    // Recalculate math with overridden fields
    this.helper.calculations = calculate(this.helper);

    sessionStorage.setItem('helper', JSON.stringify(this.helper));

    sendToWebhook('ESTIMATE_SAVED', this.helper);
    alert('📝 טיוטת אומדן נשמרה בהצלחה');
  }
};

window.estimateEngine = EstimateEngine;
document.addEventListener('DOMContentLoaded', () => EstimateEngine.init());

console.log('✅ estimate.js loaded');
