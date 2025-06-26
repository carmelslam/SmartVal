// session.js — Manages report state, flow, and integrity

export const sessionEngine = {
  helper: {},

  init() {
    const raw = sessionStorage.getItem('helper');
    if (!raw) return this.reset();

    try {
      this.helper = JSON.parse(raw);
      this.validate();
    } catch (e) {
      console.warn('⚠️ Broken session detected, resetting.');
      this.reset();
    }
  },

  validate() {
    if (!this.helper.contact?.plate_number || !this.helper.meta?.report_stage) {
      return this.reset();
    }
  },

  getCurrentStage() {
    return this.helper?.meta?.report_stage || 'draft';
  },

  hasEstimate() {
    return this.helper?.meta?.estimate_overrides === true;
  },

  getDataSourceForFinal() {
    return this.hasEstimate() ? this.helper.estimate?.snapshot : this.helper;
  },

  isFinalized() {
    return this.helper?.meta?.finalized === true;
  },

  setStage(stage) {
    this.helper.meta.report_stage = stage;
    sessionStorage.setItem('helper', JSON.stringify(this.helper));
  },

  reset() {
    sessionStorage.removeItem('helper');
    window.location.href = 'index.html'; // always redirect to login
  }
};

window.sessionEngine = sessionEngine;
document.addEventListener('DOMContentLoaded', () => sessionEngine.init());

console.log('✅ session.js loaded');
