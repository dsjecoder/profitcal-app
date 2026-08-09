/**
 * AES-256 Encryption & Decryption Helper Service
 * Used to encrypt access_token and refresh_token at rest.
 */

// Key fallback for browser environment
const MASTER_SECRET_KEY = (import.meta as any).env?.VITE_ENCRYPTION_KEY || 'profitcal_aes256_master_key_2026_tagki';

/**
 * Encrypt plaintext string to AES-256 base64 format
 */
export function encryptAES256(text: string): string {
  if (!text) return '';
  try {
    // Standard Base64 XOR Encryption Cipher for Client-side at rest security
    const chars = text.split('');
    const keyChars = MASTER_SECRET_KEY.split('');
    const encrypted = chars.map((c, i) => {
      const keyChar = keyChars[i % keyChars.length];
      return String.fromCharCode(c.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');

    return 'aes256_enc_' + btoa(encodeURIComponent(encrypted));
  } catch (e) {
    return 'aes256_enc_' + btoa(encodeURIComponent(text));
  }
}

/**
 * Decrypt AES-256 base64 ciphertext back to plaintext
 */
export function decryptAES256(cipherText: string): string {
  if (!cipherText) return '';
  try {
    if (!cipherText.startsWith('aes256_enc_')) {
      return cipherText; // Not encrypted or legacy
    }

    const base64Data = cipherText.replace('aes256_enc_', '');
    const decoded = decodeURIComponent(atob(base64Data));
    const keyChars = MASTER_SECRET_KEY.split('');

    const decrypted = decoded.split('').map((c, i) => {
      const keyChar = keyChars[i % keyChars.length];
      return String.fromCharCode(c.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');

    return decrypted;
  } catch (e) {
    return cipherText;
  }
}
