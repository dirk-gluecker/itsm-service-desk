import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/rbac.js';
import { logAudit } from '../utils/audit.js';
import type { JWTPayload } from '../lib/auth.js';

const SALT_ROUNDS = 10;

// Rate limit tracking per IP
const failedLoginAttempts = new Map<string, { count: number; blockedUntil?: number }>();

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&#\-_]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*#?-_)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if IP is blocked due to too many failed attempts
 */
function isIPBlocked(ip: string): { blocked: boolean; retryAfter?: number } {
  const record = failedLoginAttempts.get(ip);
  
  if (!record) return { blocked: false };
  
  if (record.blockedUntil) {
    const now = Date.now();
    if (now >= record.blockedUntil) {
      // Block expired, clear it
      failedLoginAttempts.delete(ip);
      return { blocked: false };
    }
    return { 
      blocked: true, 
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000) 
    };
  }
  
  return { blocked: false };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(ip: string): { attemptsLeft: number; isBlocked: boolean } {
  const record = failedLoginAttempts.get(ip) || { count: 0 };
  record.count += 1;
  
  const maxAttempts = 5;
  const blockDuration = 15 * 60 * 1000; // 15 minutes
  
  if (record.count >= maxAttempts) {
    record.blockedUntil = Date.now() + blockDuration;
  }
  
  failedLoginAttempts.set(ip, record);
  
  return {
    attemptsLeft: Math.max(0, maxAttempts - record.count),
    isBlocked: record.blockedUntil !== undefined,
  };
}

/**
 * Reset failed attempts for an IP (on successful login)
 */
function resetFailedAttempts(ip: string): void {
  failedLoginAttempts.delete(ip);
}

export async function authRoutes(app: FastifyInstance) {
  // Rate limiting decorator for login endpoint
  const loginRateLimit = {
    max: 5,
    timeWindow: '15m',
    keyGenerator: (request: any) => request.ip,
  };

  /**
   * POST /api/v1/auth/register
   * Register a new user (CUSTOMER role by default)
   */
  app.post('/register', async (request, reply) => {
    const { name, email, password } = request.body as {
      name: string;
      email: string;
      password: string;
    };

    // Validate input presence
    if (!name || !email || !password) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Name, email, and password are required',
        },
      });
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_PASSWORD',
          message: validation.errors.join('. '),
        },
      });
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return reply.status(409).send({
        error: {
          code: 'CONFLICT',
          message: 'User with this email already exists',
        },
      });
    }

    // Hash password with cost factor >= 10
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'CUSTOMER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Log audit (use new user ID as actor since it now exists)
    await logAudit({
      actorId: user.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      ticketId: undefined,
      metadata: { email: user.email, role: user.role },
    });

    // Generate access token (24h expiry)
    const tokenPayload: JWTPayload & { type: 'access' } = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const token = app.jwt.sign(tokenPayload, { expiresIn: '24h' });

    // Generate refresh token (7d expiry)
    const refreshPayload: JWTPayload & { type: 'refresh' } = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };

    const refreshToken = app.jwt.sign(refreshPayload, { expiresIn: '7d' });

    return reply.status(201).send({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  /**
   * POST /api/v1/auth/login
   * Authenticate user and return JWT tokens
   */
  app.post(
    '/login',
    { preHandler: [app.rateLimit(loginRateLimit)] },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };
      const ip = request.ip;

      // Check if IP is blocked
      const blockCheck = isIPBlocked(ip);
      if (blockCheck.blocked && blockCheck.retryAfter) {
        return reply.status(429).send({
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many failed login attempts. Try again in ${blockCheck.retryAfter} seconds.`,
            retry_after: blockCheck.retryAfter,
          },
        });
      }

      if (!email || !password) {
        return reply.status(400).send({
          error: {
            code: 'BAD_REQUEST',
            message: 'Email and password are required',
          },
        });
      }

      // Find user
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      
      if (!user || !user.isActive) {
        const result = recordFailedAttempt(ip);
        let errorMessage = 'Invalid email or password';
        
        if (!result.isBlocked && result.attemptsLeft > 0) {
          errorMessage += `. ${result.attemptsLeft} attempts remaining.`;
        } else if (result.isBlocked) {
          errorMessage += `. Account temporarily locked. Try again in 15 minutes.`;
        }
        
        return reply.status(401).send({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: errorMessage,
          },
        });
      }

      // Verify password (cost >= 10)
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        const result = recordFailedAttempt(ip);
        let errorMessage = 'Invalid email or password';
        
        if (!result.isBlocked && result.attemptsLeft > 0) {
          errorMessage += `. ${result.attemptsLeft} attempts remaining.`;
        } else if (result.isBlocked) {
          errorMessage += `. Too many failed attempts. IP blocked for 15 minutes.`;
        }
        
        return reply.status(401).send({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: errorMessage,
          },
        });
      }

      // Success - reset failed attempts
      resetFailedAttempts(ip);

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate access token (24h expiry)
      const tokenPayload: JWTPayload & { type: 'access' } = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      };

      const token = app.jwt.sign(tokenPayload, { expiresIn: '24h' });

      // Generate refresh token (7d expiry)
      const refreshPayload: JWTPayload & { type: 'refresh' } = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
      };

      const refreshToken = app.jwt.sign(refreshPayload, { expiresIn: '7d' });

      return reply.send({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  );

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Refresh token is required',
        },
      });
    }

    try {
      // Verify refresh token
      const decoded = app.jwt.verify(refreshToken) as JWTPayload & { type: 'refresh' };

      if (decoded.type !== 'refresh') {
        return reply.status(401).send({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token type',
          },
        });
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || !user.isActive) {
        return reply.status(401).send({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found or inactive',
          },
        });
      }

      // Generate new tokens
      const newAccessToken = app.jwt.sign(
        { ...decoded, type: 'access' as const },
        { expiresIn: '24h' }
      );

      const newRefreshToken = app.jwt.sign(
        { ...decoded, type: 'refresh' as const },
        { expiresIn: '7d' }
      );

      return reply.send({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error: any) {
      return reply.status(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user (client should discard token)
   * In production, add token blacklisting via Redis
   */
  app.post('/logout', { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] }, async (request, reply) => {
    // TODO: Add token blacklisting in production
    // For now, logout is client-side (discard token)
    return reply.send({
      message: 'Logged out successfully',
      note: 'Client should discard the JWT token',
    });
  });

  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  app.get('/me', { preHandler: [requireRole('ADMIN', 'STAFF', 'CUSTOMER')] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return reply.send(user);
  });
}
