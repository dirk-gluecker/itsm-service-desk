import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { prisma } from './lib/prisma.js';
import { authRoutes } from './routes/auth.js';
import { ticketRoutes } from './routes/tickets.js';
import { commentRoutes } from './routes/comments.js';
import { userRoutes } from './routes/users.js';
import type { JWTPayload } from './types/fastify.js';

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // Configure based on your needs
  });

  // Rate limiting (global)
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sign: {
      expiresIn: '24h',
    },
  });

  // OpenAPI documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'ITSM Service Desk API',
        description: 'REST API for ITSM Service Desk application',
        version: '1.0.0',
      },
      servers: [
        {
          url: process.env.BASE_URL || 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await server.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

// Decorate request with JWT verification
server.decorateRequest('verifyJWT', async function verify(this: { jwtVerify: () => Promise<unknown> }) {
  try {
    return await this.jwtVerify();
  } catch (err) {
    throw err;
  }
});

// Add user to request after JWT verification
async function attachUser(request: any, _reply: any) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return;
  }
  
  try {
    const decoded = await (request as any).jwtVerify();
    request.user = {
      userId: (decoded as JWTPayload).userId,
      email: (decoded as JWTPayload).email,
      role: (decoded as JWTPayload).role,
    };
  } catch {
    // Invalid token - leave request.user undefined
    return;
  }
}

// Health check
server.get('/health', async (_request, reply) => {
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API v1 routes
async function registerV1Routes() {
  server.addHook('preHandler', attachUser);
  
  // Version prefix
  server.route({
    method: 'GET',
    url: '/api/v1',
    handler: (_request, reply) => {
      return reply.send({
        version: '1.0.0',
        endpoints: [
          '/api/v1/auth/register',
          '/api/v1/auth/login',
          '/api/v1/auth/logout',
          '/api/v1/auth/me',
          '/api/v1/tickets',
          '/api/v1/tickets/:id',
          '/api/v1/tickets/:id/audit',
          '/api/v1/tickets/:id/comments',
          '/api/v1/users',
          '/api/v1/users/:id',
        ],
      });
    },
  });

  // Register route groups
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(ticketRoutes, { prefix: '/api/v1/tickets' });
  await server.register(commentRoutes, { prefix: '/api/v1' });
  await server.register(userRoutes, { prefix: '/api/v1/users' });
}

// Error handler
server.setErrorHandler((error: Error & { statusCode?: number; name?: string }, request, reply) => {
  server.log.error(error);

  if (error.statusCode === 401) {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }

  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (error as any).errors,
      },
    });
  }

  return reply.status(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerV1Routes();

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📖 API Documentation at http://${host}:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
