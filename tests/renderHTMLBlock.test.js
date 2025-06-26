import assert from 'assert';
import { renderHTMLBlock, sanitizeHTML } from '../render-html-block.js';

const result1 = renderHTMLBlock('Hello {{user.name}}', { user: { name: '<b>Alice</b>' } });
assert.equal(result1, 'Hello &lt;b&gt;Alice&lt;/b&gt;');

const result2 = renderHTMLBlock('{{content}}', { content: '<img src=x onerror="alert(1)"/>' });
assert.equal(result2, '&lt;img src=x onerror=&quot;alert(1)&quot;/&gt;');

const unsanitized = '<div onclick="evil()"><script>alert(1)</script>Hello</div>';
const sanitized = sanitizeHTML(unsanitized);
assert.equal(sanitized, '<div>Hello</div>');

console.log('All tests passed');
