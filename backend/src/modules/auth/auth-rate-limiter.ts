import { db } from '../../config/database';

interface AttemptRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export class AuthRateLimiter {
  private static MAX_ATTEMPTS = 5;
  private static WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
  private static memoryStore = new Map<string, AttemptRecord>();

  private static getKey(ip: string, identifier: string): string {
    return `${ip.trim()}:${identifier.trim().toLowerCase()}`;
  }

  public static async isLocked(ip: string, identifier: string, profileId?: string): Promise<{ locked: boolean; remainingSeconds: number }> {
    const now = Date.now();
    const key = this.getKey(ip, identifier);

    // 1. Check in-memory state
    const record = this.memoryStore.get(key);
    if (record && record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    // 2. Check DB persistent state if profileId provided
    if (profileId) {
      try {
        const res = await db.query(
          `SELECT locked_until FROM profiles WHERE id = $1 AND locked_until > now() LIMIT 1`,
          [profileId]
        );
        if (res.rows.length > 0 && res.rows[0].locked_until) {
          const lockedUntilMs = new Date(res.rows[0].locked_until).getTime();
          if (lockedUntilMs > now) {
            const remainingSeconds = Math.ceil((lockedUntilMs - now) / 1000);
            return { locked: true, remainingSeconds };
          }
        }
      } catch (err) {
        console.warn('DB lockout check fallback:', (err as any)?.message);
      }
    }

    return { locked: false, remainingSeconds: 0 };
  }

  public static async recordFailure(ip: string, identifier: string, profileId?: string): Promise<{ locked: boolean; attempts: number; remainingSeconds: number }> {
    const now = Date.now();
    const key = this.getKey(ip, identifier);

    let record = this.memoryStore.get(key);
    if (!record || (now - record.firstAttemptAt > this.WINDOW_MS && !record.lockedUntil)) {
      record = { attempts: 1, firstAttemptAt: now };
    } else {
      record.attempts += 1;
    }

    let isLocked = false;
    let remainingSeconds = 0;

    if (record.attempts >= this.MAX_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_MS;
      isLocked = true;
      remainingSeconds = Math.ceil(this.LOCKOUT_MS / 1000);
    }

    this.memoryStore.set(key, record);

    // Update DB persistent profile tracking
    if (profileId) {
      try {
        if (isLocked) {
          await db.query(
            `UPDATE profiles 
             SET failed_login_attempts = $1, 
                 locked_until = now() + interval '15 minutes', 
                 updated_at = now() 
             WHERE id = $2`,
            [record.attempts, profileId]
          );
        } else {
          await db.query(
            `UPDATE profiles 
             SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1, 
                 updated_at = now() 
             WHERE id = $1`,
            [profileId]
          );
        }
      } catch (err) {
        console.warn('DB record failure fallback:', (err as any)?.message);
      }
    }

    return { locked: isLocked, attempts: record.attempts, remainingSeconds };
  }

  public static async reset(ip: string, identifier: string, profileId?: string): Promise<void> {
    const key = this.getKey(ip, identifier);
    this.memoryStore.delete(key);

    if (profileId) {
      try {
        await db.query(
          `UPDATE profiles 
           SET failed_login_attempts = 0, 
               locked_until = NULL, 
               updated_at = now() 
           WHERE id = $1`,
          [profileId]
        );
      } catch (err) {
        console.warn('DB reset failure attempts fallback:', (err as any)?.message);
      }
    }
  }
}
