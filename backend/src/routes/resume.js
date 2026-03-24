'use strict';

const path = require('path');
const fs   = require('fs');
const { pipeline } = require('stream/promises');
const { parseResumeText, updateUserResume, getUserResume } = require('../services/resumeService');

/**
 * Resume routes — thin controllers, all logic in resumeService.
 */
async function resumeRoutes(fastify, options) {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // POST /api/resume/upload
  fastify.post(
    '/api/resume/upload',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const allowedTypes = ['application/pdf', 'text/plain'];
      if (
        !allowedTypes.includes(data.mimetype) &&
        !data.filename.endsWith('.txt') &&
        !data.filename.endsWith('.pdf')
      ) {
        return reply.code(400).send({ error: 'Only PDF and TXT files are supported' });
      }

      // Write to temp file for parsing
      const tempPath = path.join(uploadsDir, `resume_${Date.now()}_${data.filename}`);
      await pipeline(data.file, fs.createWriteStream(tempPath));

      let extractedText = '';
      try {
        if (data.filename.endsWith('.pdf') || data.mimetype === 'application/pdf') {
          const pdfParse  = require('pdf-parse');
          const fileBuffer = fs.readFileSync(tempPath);
          const pdfData   = await pdfParse(fileBuffer);
          extractedText   = pdfData.text;
        } else {
          extractedText = fs.readFileSync(tempPath, 'utf-8');
        }
      } catch (err) {
        fastify.log.error('Resume parsing error:', err);
        try { extractedText = fs.readFileSync(tempPath, 'utf-8'); } catch { extractedText = ''; }
      } finally {
        try { fs.unlinkSync(tempPath); } catch {}
      }

      const { skills, name, email, location } = parseResumeText(extractedText);

      try {
        updateUserResume(request.user.id, {
          extractedText,
          skills,
          name,
          filename: data.filename,
          location, // Pass extracted location
        });
      } catch (err) {
        return reply.code(err.statusCode || 500).send({ error: err.message });
      }

      return reply.code(200).send({
        message:       'Resume uploaded successfully',
        filename:      data.filename,
        extractedText,
        skills,
        charCount:     extractedText.length,
        resumeExtractedName: name,
        email,
        location,
      });
    }
  );

  // GET /api/resume
  fastify.get(
    '/api/resume',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const resumeData = getUserResume(request.user.id);
        return reply.code(200).send(resumeData);
      } catch (err) {
        return reply.code(err.statusCode || 500).send({ error: err.message });
      }
    }
  );
}

module.exports = resumeRoutes;
