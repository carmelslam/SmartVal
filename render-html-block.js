export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderHTMLBlock(html, map) {
  return html.replace(/{{([^}]+)}}/g, (match, key) => {
    const val = key.split('.').reduce((o, k) => (o ? o[k] : ''), map);
    return val !== undefined ? escapeHTML(val) : match;
  });
}

// Basic sanitization to strip script tags and event attributes
export function sanitizeHTML(html) {
  return String(html)
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}
