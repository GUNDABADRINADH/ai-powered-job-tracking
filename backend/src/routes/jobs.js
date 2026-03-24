'use strict';

const { readData } = require('../utils/dataStore');
const { getFilteredJobs } = require('../services/jobService');

/**
 * GET /api/jobs
 * Thin controller — all logic lives in jobService.
 */
async function jobsRoutes(fastify, options) {
  fastify.get(
    '/api/jobs',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            title:      { type: 'string' },
            skills:     { type: 'string' },
            datePosted: { type: 'string', enum: ['anytime', '24h', 'week', 'month'] },
            jobType:    { type: 'string' },
            workMode:   { type: 'string' },
            location:   { type: 'string' },
            matchScore: { type: 'string', enum: ['all', 'high', 'medium', 'low'] },
            skillsOnly: { type: 'string', enum: ['true', 'false'] },
            page:       { type: 'integer', minimum: 1, default: 1 },
            limit:      { type: 'integer', minimum: 1, maximum: 100, default: 40 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      // Load user's resume text so jobService can enrich match data
      const users    = readData('users.json');
      const user     = users.find((u) => u.id === request.user.id);
      const resumeText = user?.resumeText || '';

      const result = await getFilteredJobs(request.query, resumeText);
      return reply.code(200).send(result);
    }
  );
}

module.exports = jobsRoutes;
