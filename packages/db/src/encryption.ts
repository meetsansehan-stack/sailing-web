import crypto from 'crypto';

/**
 * 구독자 이메일 암호화/복호화 유틸리티
 * ENCRYPTION_KEY는 32자 16진수 문자열이어야 함
 * 예: 0123456789abcdef0123456789abcdef
 */

const ALGORITHM = 'aes-256-cbc';

export function encryptEmail(email: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(email, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // IV + 암호화된 데이터를 함께 저장 (복호화할 때 필요)
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptEmail(encryptedEmail: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  const [ivHex, encrypted] = encryptedEmail.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * ENCRYPTION_KEY 생성 헬퍼
 * 개발 환경에서만 사용 (생성된 키를 .env에 저장해야 함)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
