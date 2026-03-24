'use strict';

const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/dataStore');

const VALID_STATUSES = ['applied', 'interview', 'offer', 'rejected'];

/**
 * applicationService.js
 * All CRUD logic for job applications.
 */

/**
 * Get all applications for a user, sorted by most recent first.
 * @param {string} userId
 * @returns {object[]}
 */
function getUserApplications(userId) {
  const all = readData('applications.json');
  return all
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

/**
 * Create a new application. Returns existing record if already tracked.
 * @param {string} userId
 * @param {object} body
 * @returns {{ application: object, created: boolean }}
 */
function createApplication(userId, body) {
  const { jobId, jobTitle, company, location, applyUrl, appliedAt, status } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const all      = readData('applications.json');
  const existing = all.find((a) => a.jobId === jobId && a.userId === userId);
  if (existing) return { application: existing, created: false };

  const resolvedStatus = status || 'applied';
  const resolvedDate   = appliedAt || new Date().toISOString();

  const newApp = {
    id:       uuidv4(),
    userId,
    jobId,
    jobTitle,
    company,
    location:  location  || '',
    applyUrl:  applyUrl  || '',
    status:    resolvedStatus,
    appliedAt: resolvedDate,
    timeline: [
      { status: resolvedStatus, timestamp: resolvedDate, note: 'Application submitted' },
    ],
    notes: '',
  };

  all.push(newApp);
  writeData('applications.json', all);
  return { application: newApp, created: true };
}

/**
 * Partially update an application (status, appliedAt, notes).
 * @param {string} id
 * @param {string} userId
 * @param {object} body
 * @returns {object} updated application
 */
function updateApplication(id, userId, body) {
  const { status, note, appliedAt, notes, timestamp } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const all      = readData('applications.json');
  const idx      = all.findIndex((a) => a.id === id && a.userId === userId);

  if (idx === -1) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }

  const app = all[idx];

  if (status) {
    app.status = status;
    app.timeline.push({
      status,
      timestamp: timestamp || new Date().toISOString(),
      note:      note || `Status updated to ${status}`,
    });
  }

  if (appliedAt) {
    app.appliedAt = appliedAt;
    if (app.timeline.length > 0) app.timeline[0].timestamp = appliedAt;
  }

  if (notes !== undefined) app.notes = notes;

  all[idx] = app;
  writeData('applications.json', all);
  return app;
}

/**
 * Delete an application by id + userId.
 * @param {string} id
 * @param {string} userId
 * @returns {boolean} true if deleted
 */
function deleteApplication(id, userId) {
  let all    = readData('applications.json');
  const prev = all.length;
  all        = all.filter((a) => !(a.id === id && a.userId === userId));
  if (all.length === prev) return false;
  writeData('applications.json', all);
  return true;
}

module.exports = { getUserApplications, createApplication, updateApplication, deleteApplication, VALID_STATUSES };
