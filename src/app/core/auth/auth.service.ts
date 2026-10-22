import { Injectable, computed, signal } from '@angular/core';
import { DEMO_ACCOUNTS, PBKDF2_ITERATIONS } from './auth.config';
import { LoginResult, Role, Session } from './auth.models';

const SESSION_KEY = 'agrisense.session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

/**
 * Demo access gate (there is no backend). Passwords are verified against salted PBKDF2-SHA256 hashes with WebCrypto.
 * The session lives in sessionStorage with an expiry and role; it is re-validated on every read.
 * Client-side checks can always be bypassed by someone with DevTools — this protects a demo, not real data.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _session = signal<Session | null>(this.readSession());
  private failedAttempts = 0;
  private lockedUntil = 0;

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly role = computed<Role | null>(() => this._session()?.role ?? null);
  readonly canWrite = computed(() => this._session()?.role === 'admin');

  async login(username: string, password: string): Promise<LoginResult> {
    const now = Date.now();
    if (now < this.lockedUntil) {
      return { ok: false, reason: 'locked', retryInSec: Math.ceil((this.lockedUntil - now) / 1000) };
    }
    if (!globalThis.crypto?.subtle) {
      return { ok: false, reason: 'unsupported' };
    }

    const name = username.trim().toLowerCase();
    const account = DEMO_ACCOUNTS.find((a) => a.username === name);
    // Always run the KDF (against a dummy salt when the user is unknown) so timing does not reveal valid usernames.
    const salt = account?.salt ?? DEMO_ACCOUNTS[0].salt;
    const derived = await this.derive(password, salt);
    const valid = !!account && this.constantTimeEqual(derived, this.fromBase64(account.hash));

    if (!valid || !account) {
      this.failedAttempts++;
      if (this.failedAttempts >= MAX_ATTEMPTS) {
        this.failedAttempts = 0;
        this.lockedUntil = Date.now() + LOCK_MS;
        return { ok: false, reason: 'locked', retryInSec: LOCK_MS / 1000 };
      }
      return { ok: false, reason: 'invalid' };
    }

    this.failedAttempts = 0;
    const session: Session = {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      issuedAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    this.writeSession(session);
    this._session.set(session);
    return { ok: true };
  }

  logout(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage unavailable */
    }
    this._session.set(null);
  }

  /** Re-reads and validates the stored session (expiry, shape, known account + matching role). */
  hasValidSession(): boolean {
    const s = this.readSession();
    if (!s) {
      if (this._session() !== null) this._session.set(null);
      return false;
    }
    return true;
  }

  private readSession(): Session | null {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      const s = JSON.parse(raw) as Partial<Session>;
      const account = DEMO_ACCOUNTS.find((a) => a.username === s.username);
      const valid =
        !!account &&
        s.role === account.role &&
        typeof s.issuedAt === 'number' &&
        typeof s.expiresAt === 'number' &&
        s.expiresAt > Date.now() &&
        s.expiresAt - s.issuedAt <= SESSION_TTL_MS;
      if (!valid) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return {
        username: account.username,
        displayName: account.displayName,
        role: account.role,
        issuedAt: s.issuedAt!,
        expiresAt: s.expiresAt!,
      };
    } catch {
      return null;
    }
  }

  private writeSession(s: Session): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable — session stays in memory only */
    }
  }

  private async derive(password: string, saltB64: string): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: this.fromBase64(saltB64), iterations: PBKDF2_ITERATIONS },
      key,
      256
    );
    return new Uint8Array(bits);
  }

  private fromBase64(b64: string): Uint8Array {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  private constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }
}
