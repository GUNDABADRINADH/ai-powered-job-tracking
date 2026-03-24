'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');

// Plugins
const authPlugin = require('./plugins/auth');

// Routes
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const assistantRoutes = require('./routes/assistant');
const locationsRoutes = require('./routes/locations');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-ai-job-tracker-key-2026';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    },
  },
});

async function build() {
  // ── CORS ────────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      /\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── JWT ─────────────────────────────────────────────────────────────────────
  await fastify.register(jwt, { secret: JWT_SECRET });

  // ── Multipart (file uploads) ─────────────────────────────────────────────────
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 1,
    },
  });

  // ── Auth plugin (exposes fastify.authenticate) ───────────────────────────────
  await fastify.register(authPlugin);

  // ── Routes ───────────────────────────────────────────────────────────────────
  await fastify.register(authRoutes);
  await fastify.register(resumeRoutes);
  await fastify.register(jobsRoutes);
  await fastify.register(applicationsRoutes);
  await fastify.register(assistantRoutes);
  await fastify.register(locationsRoutes);

  // ── Health check ─────────────────────────────────────────────────────────────
  fastify.get('/health', async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  // ── Global error handler ─────────────────────────────────────────────────────
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.code(statusCode).send({
      error: error.message || 'Internal Server Error',
      statusCode,
    });
  });

  return fastify;
}

// Start server
build()
  .then((app) => {
    app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
      app.log.info(`🚀 AI Job Tracker API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
