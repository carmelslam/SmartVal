import assert from 'assert';

// Ensure browser-style global for validation.js
globalThis.window = globalThis;

// Load the validation engine which attaches itself to `window`
await import('../validation.js');
const validationEngine = globalThis.validationEngine;

// Base valid helper object
const baseHelper = {
  vehicle: { plate: '123' },
  client: { name: 'Alice' },
  car_details: { manufacturer: 'Toyota', model: 'Corolla', year: 2020, market_value: 5000 },
  damage_sections: [{ works: ['w'], repairs: ['r'], parts: ['p'] }],
  depreciation: { global_amount: 1000 },
  meta: { legal_block: 'text', report_type: 'final', status: 'final' },
  files: ['image.png'],
  levi_report: { model_code: 'X' },
  invoice_uploaded: false
};

// Valid helper should pass
const validResult = validationEngine.validate(baseHelper);
assert.strictEqual(validResult.valid, true);
assert.deepEqual(validResult.errors, []);

// Missing car detail should fail
const missingCar = JSON.parse(JSON.stringify(baseHelper));
missingCar.car_details.manufacturer = '';
const carResult = validationEngine.validate(missingCar);
assert.strictEqual(carResult.valid, false);
assert.ok(carResult.errors.includes('פרט רכב חסר: manufacturer (מסך פרטי רכב)'));

// Missing Levi report should fail
const missingLevi = JSON.parse(JSON.stringify(baseHelper));
missingLevi.levi_report = { model_code: '' };
const leviResult = validationEngine.validate(missingLevi);
assert.strictEqual(leviResult.valid, false);
assert.ok(leviResult.errors.includes('לא צורף דוח לוי יצחק'));

// Missing damage sections should fail
const missingDamage = JSON.parse(JSON.stringify(baseHelper));
missingDamage.damage_sections = [];
const damageResult = validationEngine.validate(missingDamage);
assert.strictEqual(damageResult.valid, false);
assert.ok(damageResult.errors.includes('אין אזורי נזק מתועדים (מסך מרכז נזק)'));

// Invoice uploaded without summary
const missingInvoice = JSON.parse(JSON.stringify(baseHelper));
missingInvoice.invoice_uploaded = true;
const invoiceResult = validationEngine.validate(missingInvoice);
assert.strictEqual(invoiceResult.valid, false);
assert.ok(invoiceResult.errors.includes('סך נזק מתוך חשבונית חסר'));
assert.ok(invoiceResult.errors.includes('נתוני חשבונית לא חושבו'));

console.log('validation.test.js passed');
