'use strict';

const { detectIntent, extractFilters, buildResponse } = require('../services/assistantService');

/**
 * POST /api/assistant
 * Thin controller — all logic in assistantService.
 */
async function assistantRoutes(fastify, options) {
  fastify.post(
    '/api/assistant',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message:        { type: 'string', minLength: 1 },
            currentFilters: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { message, currentFilters } = request.body;

      console.log('\n========== ASSISTANT CALLED ==========');
      console.log('Message:', message);
      console.log('Current Filters:', currentFilters);

      fastify.log.info(
        { userId: request.user.id, message, currentFilters },
        'AI assistant called'
      );

      // Integration point: swap detectIntent / extractFilters with LangChain agents
      console.log('🔍 Detecting intent...');
      const intent  = await detectIntent(message);
      console.log('✅ Detected intent:', intent);

      console.log('🔍 Extracting filters...');
      const filters = await extractFilters(message, currentFilters);
      console.log('✅ Extracted filters:', filters);

      console.log('🔍 Building response...');
      const result  = buildResponse(intent, filters);
      console.log('✅ Response ready:', { reply: result.reply.substring(0, 50) + '...', action: result.action, filters: result.filters });
      console.log('========================================\n');

      // Enforce consistent response shape
      return reply.code(200).send({
        reply:   result.reply,
        action:  result.action,
        filters: result.filters,
      });
    }
  );
}

module.exports = assistantRoutes;
