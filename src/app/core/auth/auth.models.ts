export type Role = 'admin' | 'viewer';

export interface DemoAccount {
  readonly username: string;
  readonly role: Role;
  readonly displayName: string;
  /** base64, 16 random bytes */
  readonly salt: string;
  /** base64, PBKDF2-SHA256 derived key (32 bytes) */
  readonly hash: string;
}

export interface Session {
  username: string;
  displayName: string;
  role: Role;
  /** epoch ms */
  issuedAt: number;
  /** epoch ms */
  expiresAt: number;
}

export type LoginResult = { ok: true } | { ok: false; reason: 'invalid' | 'locked' | 'unsupported'; retryInSec?: number };
