export const KEY_STRING = 'encryption-key';

// Import logging system if available
let Logger;
try {
  import('./logging-system.js').then(module => {
    Logger = module.Logger;
  });
} catch (error) {
  console.warn('Logging system not available in auth module');
}

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
    
    if (Logger) {
      Logger.systemEvent('auth', 'password_encrypted', 'Password encrypted successfully');
    }
    
    return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
  } catch (error) {
    if (Logger) {
      Logger.error('auth', 'encrypt_failed', `Password encryption failed: ${error.message}`, {
        error: error.message
      });
    }
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
    
    if (Logger) {
      Logger.systemEvent('auth', 'password_decrypted', 'Password decrypted successfully');
    }
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (Logger) {
      Logger.error('auth', 'decrypt_failed', `Password decryption failed: ${error.message}`, {
        error: error.message
      });
    }
    throw error;
  }
}
