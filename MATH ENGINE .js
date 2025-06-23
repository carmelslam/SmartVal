// 🧮 MATH ENGINE (FOUNDATION)
// This module provides local calculation utilities used throughout the system

export const MathEngine = {
  // Basic percentage calculation: returns percent of base
  percentOf(base, percent) {
    return ((+base || 0) * (+percent || 0)) / 100;
  },

  // Total adjustment: base - value
  adjustDown(base, adjustment) {
    return (+base || 0) - (+adjustment || 0);
  },

  // Accumulative addition (used for total pricing or summaries)
  accumulate(...values) {
    return values.reduce((sum, v) => sum + (+v || 0), 0);
  },

  // Format number to currency-like display
  formatCurrency(value) {
    return `₪${(+value || 0).toLocaleString('he-IL')}`;
  },

  // Round value to fixed decimals
  round(value, decimals = 2) {
    return Number((+value || 0).toFixed(decimals));
  }
};

console.log('✅ MathEngine loaded');
