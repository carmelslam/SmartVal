// math.js — Core Calculation Engine for Report Values

export const MathEngine = {
  round(num) {
    return Math.round((parseFloat(num) || 0) * 100) / 100;
  },

  formatCurrency(num) {
    return `${MathEngine.round(num).toLocaleString('he-IL')} ₪`;
  },

  computeDamagePercentage(totalDamage, marketValue) {
    if (!marketValue || marketValue <= 0) return 0;
    return MathEngine.round((totalDamage / marketValue) * 100);
  },

  computeNetValueAfterShaveh(marketValue, shavehPercent) {
    const shaveh = (marketValue * (shavehPercent || 0)) / 100;
    return MathEngine.round(marketValue - shaveh);
  },

  computeTotalCompensation(totalDamage, depreciation, fees = {}) {
    const base = totalDamage - (depreciation || 0);
    const totalFees = (fees.transport || 0) + (fees.office || 0) + (fees.photos || 0);
    return MathEngine.round(base + totalFees);
  },

  applyVAT(value, vatRate) {
    return MathEngine.round(value * (1 + (vatRate || 0) / 100));
  },

  calculateAll({ baseDamage, depreciation, fees, marketValue, shavehPercent, vatRate }) {
    const damage_percent = MathEngine.computeDamagePercentage(baseDamage, marketValue);
    const total_compensation = MathEngine.computeTotalCompensation(baseDamage, depreciation, fees);
    const compensation_with_vat = MathEngine.applyVAT(total_compensation, vatRate);
    const net_value_post_shaveh = MathEngine.computeNetValueAfterShaveh(marketValue, shavehPercent);

    return {
      damage_percent,
      total_compensation,
      compensation_with_vat,
      net_value_post_shaveh,
      market_value: MathEngine.round(marketValue),
      vehicle_value_gross: MathEngine.round(baseDamage)
    };
  }
};

console.log('✅ math.js loaded');
