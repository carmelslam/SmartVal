import assert from 'assert';

// setup global window for validation.js
global.window = {};
// stub alert to avoid errors
global.alert = function() {};

const validationModule = await import('../validation.js');
const { validate } = window.validationEngine;

const baseHelper = {
  meta: { report_type: 'final', status: 'final', legal_block: 'x' },
  vehicle: { plate: '123' },
  client: { name: 'John' },
  car_details: { manufacturer: 'Mazda', model: '3', year: '2020', market_value: 1000 },
  damage_sections: [ { works: [1], repairs: [1], parts: [1] } ],
  depreciation: { global_amount: 1 },
  files: [1],
  levi_report: { model_code: 'ABC' }
};

let res = validate(baseHelper);
assert.equal(res.valid, true);

res = validate({ ...baseHelper, levi_report: null });
assert.equal(res.valid, false);
assert.ok(res.errors.includes('לא צורף דוח לוי יצחק'));

res = validate({ ...baseHelper, levi_report: {} });
assert.equal(res.valid, false);

res = validate({ ...baseHelper, levi_report: { model_code: 'XYZ' } });
assert.equal(res.valid, true);

console.log('Validation tests passed');
