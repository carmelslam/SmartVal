export const KEY_STRING = 'encryption-key';


async function getKey() {
  const enc = new TextEncoder().encode(KEY_STRING);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt','decrypt']);
}

export async function encryptPassword(password) {
  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(password);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    
    
    return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
  } catch (error) {
    throw error;
  }
}

export async function decryptPassword(json) {
  try {
    const { iv, data } = JSON.parse(json);
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw error;
  }
}
