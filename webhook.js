// 🔗 Centralized Webhook Handler – Aligned with Make.com URLs

export const WEBHOOKS = {
  PASSWORD_PAGE: 'https://hook.eu2.make.com/7yjzw6g5p0p9nx4if96khsmipch7o1dk',
  OPEN_CASE_UI: 'https://hook.eu2.make.com/zhvqbvx2yp69rikm6euv0r2du8l6sh61',
  SUBMIT_LEVI_REPORT: 'https://hook.eu2.make.com/xtvmwp6m3nxqge422clhs8v2hc74jid9',

  UPLOAD_PICTURES: 'https://hook.eu2.make.com/yksx9gtoxggvpalsjw2n1ut4kdi4jt24',
  TRANSFORM_PICTURES: 'https://hook.eu2.make.com/pum6ogmlxfe2edi8wd5i1d9oybcus76f',
  CREATE_PDF: 'https://hook.eu2.make.com/alpsl6kcdkp8pddemmloohbbd3lxv43u',

  LAUNCH_EXPERTISE: 'https://hook.eu2.make.com/lvlni0nc6dmas8mjdvd39jcbx4rlsxon',
  SUBMIT_FINAL_REPORT: 'https://hook.eu2.make.com/humgj4nyifchtnivuatdrh6u9slj8xrh',
  OCR_INVOICES: 'https://hook.eu2.make.com/9xs0avqydq7uyq944189dyt584ccknm',
  FILL_FINAL_REPORT: 'https://hook.eu2.make.com/bd81gxcw37qavq62avte893czvgjuwr5',

  SEARCH_MODULE: 'https://hook.eu2.make.com/n3bbnj3izbymrmq6baj0vgaqhhin9fmd',
  PARTS_SEARCH: 'https://hook.eu2.make.com/xenshho1chvd955wpaum5yh51v8klo58',
  INTERNAL_PARTS_OCR: 'https://hook.eu2.make.com/w11tujdfbmq03co3vakb2jfr5vo4k6w6'
};

export async function sendToWebhook(id, payload) {
  const url = WEBHOOKS[id];
  if (!url) {
    console.error(`❌ Webhook [${id}] not registered.`);
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`📤 Webhook [${id}] sent:`, res.status);
  } catch (err) {
    console.error(`❌ Failed sending [${id}]`, err);
  }
}

export function sendPartSearch(data) {
  fetch(WEBHOOKS.PARTS_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task: 'part_search',
      payload: data
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    })
    .then(response => {
      console.log('✅ Part search request sent:', response);
      alert('הבקשה נשלחה בהצלחה!');
    })
    .catch(err => {
      console.error('❌ Error sending part search:', err);
      alert('שגיאה בשליחת הבקשה');
    });
}

export function sendSearchResultFile(file, meta = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('meta', JSON.stringify(meta));

  fetch(WEBHOOKS.INTERNAL_PARTS_OCR, {
    method: 'POST',
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    })
    .then(response => {
      console.log('✅ Search result uploaded:', response);
      alert('קובץ נשלח לניתוח בהצלחה');
    })
    .catch(err => {
      console.error('❌ Failed to send result file:', err);
      alert('שגיאה בשליחת קובץ החיפוש');
    });
}
