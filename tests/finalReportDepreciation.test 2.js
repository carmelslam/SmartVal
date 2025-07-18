import assert from 'assert';
import fs from 'fs';

const html = fs.readFileSync('final report builder.html', 'utf8');
const match = html.match(/{{#each helper\.expertise\.depreciation\.centers}}([\s\S]*?){{\/each}}/);
assert.ok(match, 'depreciation block not found');
const rowTemplate = match[1];

function renderRow(template, item) {
  return template
    .replace(/{{this.part}}/g, item.part)
    .replace(/{{this.repair}}/g, item.repair)
    .replace(/{{percent this.percent}}/g, `${item.percent}%`)
    .replace(/{{this.center}}/g, item.center);
}

const helper = {
  expertise: {
    depreciation: {
      centers: [
        { part: 'Bumper', repair: 'Replace', percent: 10, center: 'Front' },
        { part: 'Door', repair: 'Repair', percent: 5, center: 'Left' }
      ]
    }
  }
};

const rows = helper.expertise.depreciation.centers.map(c => renderRow(rowTemplate, c)).join('');
assert.ok(rows.includes('<td>Bumper</td>'));
assert.ok(rows.includes('<td>Door</td>'));
assert.strictEqual((rows.match(/<tr>/g) || []).length, helper.expertise.depreciation.centers.length);
console.log('finalReportDepreciation.test.js passed');
