import assert from 'assert';

// Ensure browser-style global for validation.js
globalThis.window = globalThis;

// Load the validation engine which attaches itself to `window`
await import('../validation.js');
const validationEngine = globalThis.validationEngine;

// Base valid helper object
const baseHelper = {
  vehicle: { plate_number: '123' },
  client: { name: 'Alice' },
  car_details: { make: 'Toyota', model: 'Corolla', year: 2020, market_value: 5000 },
  damage_sections: [{ works: ['w'], repairs: ['r'], parts: ['p'] }],
  depreciation: { global_amount: 1000 },
  meta: { legal_block: 'text', report_type: 'final', status: 'final' },
  files: ['image.png'],
  levi_report: { adjustments: ['a'] },
  invoice_uploaded: false
};

// Valid helper should pass
const validResult = validationEngine.validate(baseHelper);
assert.strictEqual(validResult.valid, true);
assert.deepEqual(validResult.errors, []);

// Missing car detail should fail
const missingCar = JSON.parse(JSON.stringify(baseHelper));
missingCar.car_details.make = '';
const carResult = validationEngine.validate(missingCar);
assert.strictEqual(carResult.valid, false);
assert.ok(carResult.errors.includes('\u05e4\u05e8\u05d8 \u05e8\u05db\u05d1 \u05d7\u05e1\u05e8: make (\u05de\u05e1\u05da \u05e4\u05e8\u05d8\u05d9 \u05e8\u05db\u05d1)'));

// Missing Levi report should fail
const missingLevi = JSON.parse(JSON.stringify(baseHelper));
missingLevi.levi_report = { adjustments: [] };
const leviResult = validationEngine.validate(missingLevi);
assert.strictEqual(leviResult.valid, false);
assert.ok(leviResult.errors.includes('\u05dc\u05d0 \u05e6\u05d5\u05e8\u05e3 \u05d3\u05d5\u05d7 \u05dc\u05d5\u05d9 \u05d9\u05e6\u05d7\u05e7'));

// Invoice uploaded without summary
const missingInvoice = JSON.parse(JSON.stringify(baseHelper));
missingInvoice.invoice_uploaded = true;
const invoiceResult = validationEngine.validate(missingInvoice);
assert.strictEqual(invoiceResult.valid, false);
assert.ok(invoiceResult.errors.includes('\u05e1\u05da \u05e0\u05d6\u05e7 \u05de\u05ea\u05d5\u05da \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea \u05d7\u05e1\u05e8'));
assert.ok(invoiceResult.errors.includes('\u05e0\u05ea\u05d5\u05e0\u05d9 \u05d7\u05e9\u05d1\u05d5\u05e0\u05d9\u05ea \u05dc\u05d0 \u05d7\u05d5\u05e9\u05d1\u05d5'));

console.log('validation.test.js passed');

