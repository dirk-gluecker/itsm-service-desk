# Authentication System Documentation

## Overview

This document describes the authentication system for the ITSM Service Desk application, implementing JWT-based authentication with the following security features:

- **JWT tokens** with 24-hour expiry
- **Bcrypt password hashing** with cost factor ≥10
- **Rate limiting**: 5 failed login attempts per IP blocks access for 15 minutes
- **Password validation** with complexity requirements
- **Token refresh mechanism** for seamless re-authentication

## Security Features

### JWT Configuration
| Setting | Value |
|---------|-------|
| Access Token Expiry | 24 hours |
| Refresh Token Expiry | 7 days |
| Algorithm | HS256 (HMAC-SHA256) |

### Password Requirements
Passwords must meet ALL of the following criteria:
- Minimum length: 8 characters
- Maximum length: 128 characters  
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&#\-_)

### Rate Limiting
| Parameter | Value |
|-----------|-------|
| Max Failed Attempts | 5 per IP |
| Block Duration | 15 minutes |
| Tracking Method | In-memory Map (per-process) |

**Note**: For production deployments behind load balancers, consider using Redis for distributed rate limiting.

## API Endpoints

### POST `/api/v1/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  },
  "expires_at": "2026-10-30T12:00:00.000Z"
}
```

**Errors:**
- `400`: Validation errors (missing fields, weak password)
- `409`: User already exists

---

### POST `/api/v1/auth/login`
Authenticate and receive access/refresh tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
Same structure as `/register` response.

**Rate Limited Response (429):**
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many failed login attempts. Try again in 900 seconds.",
    "retry_after": 900
  }
}
```

**Auth Failure Response (401):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password. 3 attempts remaining."
  }
}
```

---

### POST `/api/v1/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "token": "new-access-token",
  "refreshToken": "new-refresh-token",
  "user": { ... },
  "expires_at": "2026-10-30T12:00:00.000Z"
}
```

**Errors:**
- `400`: Missing refresh token
- `401`: Invalid/expired token or inactive user

---

### POST `/api/v1/auth/logout`
Logout current user (client-side token discard).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out successfully",
  "note": "Client should discard the JWT token"
}
```

---

### GET `/api/v1/auth/me`
Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "CUSTOMER",
  "createdAt": "2026-10-29T12:00:00.000Z",
  "lastLoginAt": "2026-10-29T13:00:00.000Z"
}
```

## Token Structure

Access Token Payload:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "ADMIN|STAFF|CUSTOMER",
  "type": "access",
  "iat": 1698600000,
  "exp": 1698686400
}
```

Refresh Token Payload:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "ADMIN|STAFF|CUSTOMER",
  "type": "refresh",
  "iat": 1698600000,
  "exp": 1699204800
}
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing (use strong random string)

Optional:
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment (development/production)

## Implementation Notes

### Password Hashing
- Uses bcrypt with salt rounds = 10
- Compliant with OWASP recommendations
- Hashes stored in `User.passwordHash` field

### Rate Limiting Implementation
- In-memory tracking per process instance
- Resets after block duration expires
- Returns precise retry-after header on block

### Security Headers
- Helmet.js for HTTP security headers
- CORS configured via Fastify CORS plugin
- HTTPS required in production

## Client Usage Example

```javascript
// Register
const registerRes = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password }),
});
const { token, refreshToken } = await registerRes.json();
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);

// Make authenticated request
const response = await fetch('/api/v1/tickets', {
  headers: { 'Authorization': `Bearer ${token}` },
});

// Auto-refresh token before expiry
async function refreshToken() {
  const res = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      refreshToken: localStorage.getItem('refreshToken') 
    }),
  });
  const data = await res.json();
  localStorage.setItem('accessToken', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
}
```

## Files Created/Modified

| File | Purpose |
|------|---------|
| `src/routes/auth.ts` | Main auth routes with full implementation |
| `src/lib/auth.ts` | JWT types and helpers |
| `src/middleware/auth.middleware.ts` | Authentication middleware |
| `src/middleware/rate-limit.middleware.ts` | Rate limit utilities |
| `src/auth/constants.ts` | Auth configuration constants |
| `src/auth/types.ts` | TypeScript type definitions |
| `src/auth/password.service.ts` | Password hashing/validation |
| `src/auth/token.service.ts` | JWT generation/verification |
| `src/auth/rate-limit.service.ts` | Rate limiting logic |
| `src/auth/auth.service.ts` | Auth business logic service |

## Production Considerations

1. **Token Blacklisting**: Implement Redis-based token blacklist for proper logout
2. **Distributed Rate Limiting**: Use Redis for shared rate limit state across instances
3. **HTTPS Enforcement**: Enable TLS 1.3 in production
4. **Secret Management**: Use environment-sealed secrets (e.g., AWS Secrets Manager)
5. **Audit Logging**: All auth events logged to audit log table
6. **Password Reset**: Implement secure password reset flow (not included in WP-A)
