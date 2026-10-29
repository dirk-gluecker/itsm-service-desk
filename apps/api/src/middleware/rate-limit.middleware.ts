import { FastifyRequest, FastifyReply } from 'fastify';

// In-memory rate limit tracking (consider Redis for production)
const rateLimitStore = new Map<string, { attempts: number; blockedUntil?: number; lastAttempt: number }>();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const WINDOW_DURATION = 60 * 1000; // 1 minute

/**
 * Check if IP is currently blocked
 */
export function isBlocked(ip: string): boolean {
  const record = rateLimitStore.get(ip);
  if (!record || !record.blockedUntil) return false;
  
  if (Date.now() > record.blockedUntil) {
    rateLimitStore.delete(ip);
    return false;
  }
  
  return true;
}

/**
 * Get remaining block time in milliseconds
 */
export function getRemainingBlockTime(ip: string): number | null {
  const record = rateLimitStore.get(ip);
  if (!record || !record.blockedUntil) return null;
  
  const remaining = record.blockedUntil - Date.now();
  return remaining > 0 ? remaining : null;
}

/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string): { 
  attempts: number; 
  attemptsRemaining: number; 
  isBlocked: boolean;
  blockedUntil?: number;
} {
  const record = rateLimitStore.get(ip);
  
  if (!record) {
    return { attempts: 0, attemptsRemaining: MAX_ATTEMPTS, isBlocked: false };
  }
  
  // Check if block has expired
  if (record.blockedUntil && Date.now() > record.blockedUntil) {
    rateLimitStore.delete(ip);
    return { attempts: 0, attemptsRemaining: MAX_ATTEMPTS, isBlocked: false };
  }
  
  return {
    attempts: record.attempts,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempts),
    isBlocked: !!record.blockedUntil,
    blockedUntil: record.blockedUntil,
  };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(ip: string): { attemptsLeft: number; isBlocked: boolean } {
  const record = rateLimitStore.get(ip) || { attempts: 0, lastAttempt: Date.now() };
  record.attempts += 1;
  
  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = Date.now() + BLOCK_DURATION;
  }
  
  record.lastAttempt = Date.now();
  rateLimitStore.set(ip, record);
  
  return {
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.attempts),
    isBlocked: record.blockedUntil !== undefined,
  };
}

/**
 * Reset failed attempts for an IP (on successful login)
 */
export function resetFailedAttempts(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Extract client IP from request
 */
export function getClientIp(request: FastifyRequest): string {
  // Check X-Forwarded-For header (for proxied requests)
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  // Check X-Real-IP header
  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }
  
  // Fall back to socket remote address
  return request.ip || '127.0.0.1';
}
