import assert from 'assert';
import { calculate } from '../math.js';

const baseParams = {
  baseDamage: 1000,
  depreciation: 100,
  fees: { transport: 50, office: 50, photos: 0 },
  marketValue: 0,
  shavehPercent: 0
};

function runCase(vatRate, expected) {
  const res = calculate({ ...baseParams, vatRate });
  const total_before_vat = res.total_compensation;
  const total_with_vat = res.compensation_with_vat;
  const vat_amount = Math.round((total_with_vat - total_before_vat) * 100) / 100;

  assert.strictEqual(total_before_vat, expected.total_before_vat);
  assert.strictEqual(vat_amount, expected.vat_amount);
  assert.strictEqual(total_with_vat, expected.total_with_vat);
}

runCase(17, { total_before_vat: 1000, vat_amount: 170, total_with_vat: 1170 });
runCase(10, { total_before_vat: 1000, vat_amount: 100, total_with_vat: 1100 });
runCase(0, { total_before_vat: 1000, vat_amount: 0, total_with_vat: 1000 });

console.log('feeCalculation.test.js passed');
