import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  console.warn('ENCRYPTION_KEY not found, using default for development');
}

const key = ENCRYPTION_KEY || 'development-key-32-characters!!';

// Ensure key is exactly 32 characters
const normalizedKey = key.padEnd(32, '0').substring(0, 32);

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(normalizedKey), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Return base64 encoded as fallback
    return Buffer.from(text).toString('base64');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    
    // If it's not in the expected format, try base64 decode as fallback
    if (parts.length !== 2) {
      return Buffer.from(encryptedData, 'base64').toString('utf8');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(normalizedKey), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return as-is if decryption fails (for development)
    return encryptedData;
  }
}
