import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

const MAX_ATTEMPTS = 5;
const COOLDOWNS_SEC = [15, 30, 60, 120]; // escalating per batch

interface ThrottleRecord {
  failures: number; // total failures in current session
  lockedUntil: number; // timestamp when lockout expires (0 = not locked)
  batch: number; // how many times user has been locked out
}

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  private readonly records = new Map<string, ThrottleRecord>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const email = req.body?.email?.toLowerCase?.();
    if (!email) return true;

    const now = Date.now();
    const record = this.records.get(email);
    if (!record) return true;

    // Check if currently locked out
    if (record.lockedUntil > now) {
      const retryAfterSec = Math.ceil((record.lockedUntil - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many login attempts. Try again in ${retryAfterSec}s.`,
          retryAfter: retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  recordFailure(email: string) {
    const key = email.toLowerCase();
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { failures: 0, lockedUntil: 0, batch: 0 };
      this.records.set(key, record);
    }

    // If previous lockout has expired, just increment failures
    record.failures++;

    // Every 5 failures → escalate lockout
    if (record.failures >= MAX_ATTEMPTS) {
      const cooldown =
        COOLDOWNS_SEC[Math.min(record.batch, COOLDOWNS_SEC.length - 1)];
      record.lockedUntil = now + cooldown * 1000;
      record.batch++;
      record.failures = 0; // reset counter for next batch
    }

    this.cleanup(now);
  }

  clearAttempts(email: string) {
    this.records.delete(email.toLowerCase());
  }

  private cleanup(now: number) {
    if (this.records.size <= 100) return;
    for (const [key, record] of this.records) {
      // Remove entries that are unlocked and have no recent failures
      if (record.lockedUntil < now && record.failures === 0) {
        this.records.delete(key);
      }
    }
  }
}
