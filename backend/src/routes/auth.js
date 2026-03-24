'use strict';

const { readData, writeData } = require('../utils/dataStore');
const crypto = require('crypto');

/**
 * Helper: Hash password using crypto
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/auth/register
 * Register a new user with name, email, password
 */
async function authRoutes(fastify, options) {
  fastify.post('/api/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { name, email, password } = request.body;
    const users = readData('users.json');

    // Check if email already exists
    if (users.some((u) => u.email === email)) {
      return reply.code(400).send({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = {
      id: `user-${crypto.randomUUID()}`,
      name,
      email,
      password: hashPassword(password),
      avatar: name.substring(0, 2).toUpperCase(),
      resumeText: '',
      resumeSkills: [],
      resumeFileName: '',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeData('users.json', users);

    // Sign JWT — expires in 7 days
    const token = fastify.jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      { expiresIn: '7d' }
    );

    const { password: _pwd, ...safeUser } = newUser;
    return reply.code(201).send({ token, user: safeUser });
  });

  /**
   * POST /api/auth/login
   * Validates credentials and returns a JWT token
   */
  fastify.post('/api/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                avatar: { type: 'string' },
                resumeText: { type: 'string' },
                resumeSkills: { type: 'array', items: { type: 'string' } },
                resumeFileName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;
    const users = readData('users.json');
    const hashedPassword = hashPassword(password);
    
    // Find user and check password (support both plaintext and hashed for compatibility)
    const user = users.find((u) => 
      u.email === email && (u.password === password || u.password === hashedPassword)
    );

    if (!user) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    // Sign JWT — expires in 7 days
    const token = fastify.jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      { expiresIn: '7d' }
    );

    const { password: _pwd, ...safeUser } = user;
    return reply.code(200).send({ token, user: safeUser });
  });
}

module.exports = authRoutes;
