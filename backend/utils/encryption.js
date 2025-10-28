const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'journal-secret-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes for AES-256
const getKey = () => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
};

/**
 * Encrypt sensitive data (like SMTP passwords)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encrypted
 */
function encrypt(text) {
  if (!text) return '';
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param {string} text - Encrypted text in format: iv:encrypted
 * @returns {string} - Decrypted plain text
 */
function decrypt(text) {
  if (!text) return '';
  
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return '';
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    return '';
  }
}

module.exports = {
  encrypt,
  decrypt
};

