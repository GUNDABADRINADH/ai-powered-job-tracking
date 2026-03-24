'use strict';

const { getNearbyLocationsWithDistance } = require('../services/nearbyLocationsService');

/**
 * GET /api/locations/nearby
 * Get nearby cities for job search expansion
 */
async function locationsRoutes(fastify, options) {
  fastify.get(
    '/api/locations/nearby',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            radius: { type: 'integer', default: 200 },
          },
          required: ['city'],
        },
      },
    },
    async (request, reply) => {
      const { city, radius = 200 } = request.query;

      console.log(`📍 Getting nearby locations for ${city} within ${radius}km`);
      
      try {
        const nearbyLocations = getNearbyLocationsWithDistance(city, radius);
        
        return reply.code(200).send({
          city,
          radius,
          nearby: nearbyLocations,
          message: `Found ${nearbyLocations.length} locations including nearby areas`,
        });
      } catch (err) {
        console.error('Error getting nearby locations:', err);
        return reply.code(500).send({
          error: 'Failed to get nearby locations',
        });
      }
    }
  );
}

module.exports = locationsRoutes;
