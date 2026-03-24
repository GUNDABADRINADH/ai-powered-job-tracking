'use strict';

const {
  getUserApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  VALID_STATUSES,
} = require('../services/applicationService');

/**
 * Application routes — thin controllers, all logic in applicationService.
 */
async function applicationsRoutes(fastify, options) {
  // GET /api/applications
  fastify.get(
    '/api/applications',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const applications = getUserApplications(request.user.id);
      return reply.code(200).send({ applications });
    }
  );

  // POST /api/applications
  fastify.post(
    '/api/applications',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['jobId', 'jobTitle', 'company'],
          properties: {
            jobId:     { type: 'string' },
            jobTitle:  { type: 'string' },
            company:   { type: 'string' },
            location:  { type: 'string' },
            applyUrl:  { type: 'string' },
            appliedAt: { type: 'string' },
            status:    { type: 'string', enum: VALID_STATUSES },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const { application, created } = createApplication(request.user.id, request.body);
        const code = created ? 201 : 200;
        const msg  = created ? undefined : 'Already tracked';
        return reply.code(code).send({ application, ...(msg ? { message: msg } : {}) });
      } catch (err) {
        return reply.code(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  // PATCH /api/applications/:id
  fastify.patch(
    '/api/applications/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            status:    { type: 'string', enum: VALID_STATUSES },
            note:      { type: 'string' },
            appliedAt: { type: 'string' },
            notes:     { type: 'string' },
            timestamp: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const app = updateApplication(request.params.id, request.user.id, request.body);
        return reply.code(200).send({ application: app });
      } catch (err) {
        return reply.code(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  // DELETE /api/applications/:id
  fastify.delete(
    '/api/applications/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const deleted = deleteApplication(request.params.id, request.user.id);
      if (!deleted) return reply.code(404).send({ error: 'Application not found' });
      return reply.code(200).send({ message: 'Application removed' });
    }
  );
}

module.exports = applicationsRoutes;
