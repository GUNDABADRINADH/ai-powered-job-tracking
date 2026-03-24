'use strict';

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');

/**
 * Generic helper to read a JSON data file
 */
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Safe atomic write: write to a temp file then rename over the real file.
 * Prevents JSON corruption if the process crashes mid-write.
 */
function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath  = filePath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

module.exports = { readData, writeData };
