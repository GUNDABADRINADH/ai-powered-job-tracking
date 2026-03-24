'use strict';

const fp = require('fastify-plugin');

/**
 * JWT authentication decorator.
 * Attaches `fastify.authenticate` hook used to protect routes.
 */
async function authPlugin(fastify, options) {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized — invalid or expired token' });
    }
  });
}

module.exports = fp(authPlugin);
