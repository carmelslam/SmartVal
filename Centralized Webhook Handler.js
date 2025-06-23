// 🌐 Central Webhook Module

const WEBHOOKS = {
  START_CASE: 'https://hook.eu2.make.com/zhvqbvx2yp69rikm6euv0r2du8l6sh61',
  // Add more identifiers as needed
};

export async function sendToWebhook(id, payload) {
  const url = WEBHOOKS[id];
  if (!url) throw new Error(`Webhook ID not defined: ${id}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error(`Webhook [${id}] failed`, err);
    return null;
  }
}

export function registerWebhook(id, url) {
  WEBHOOKS[id] = url;
}
