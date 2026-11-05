import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Derives a 256-bit encryption key from userId and email using PBKDF2
 */
function deriveKey(userId: string, email: string): Buffer {
  const keyMaterial = `${userId}:${email}`;
  const salt = crypto.createHash('sha256').update(keyMaterial).digest();
  return crypto.pbkdf2Sync(keyMaterial, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts an object (env vars) using AES-256-GCM
 * Returns a base64 encoded string containing salt, iv, tag, and encrypted data
 */
export function encryptEnvVars(envVars: Record<string, string>, userId: string, email: string): string {
  const key = deriveKey(userId, email);
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const jsonString = JSON.stringify(envVars);
  let encrypted = cipher.update(jsonString, 'utf8', 'binary');
  encrypted += cipher.final('binary');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'binary')]);
  return combined.toString('base64');
}

/**
 * Decrypts env vars from base64 encoded string
 * Returns the original object with environment variables
 */
export function decryptEnvVars(encryptedData: string, userId: string, email: string): Record<string, string> {
  try {
    const key = deriveKey(userId, email);
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = combined.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.subarray(ENCRYPTED_POSITION);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('[Encryption] Failed to decrypt env vars:', error);
    return {};
  }
}

/**
 * Checks if a string is encrypted (base64 format with expected length)
 */
export function isEncrypted(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  try {
    const decoded = Buffer.from(data, 'base64');
    // Minimum length: salt(64) + iv(16) + tag(16) + some data
    return decoded.length >= SALT_LENGTH + IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}
