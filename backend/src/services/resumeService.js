'use strict';

const { readData, writeData } = require('../utils/dataStore');
const { extractSkillsFromText } = require('./matchingService');

/**
 * resumeService.js
 * All resume parsing and user-profile update logic.
 */

/**
 * Extract structured data from raw resume text.
 * @param {string} text - raw resume text
 * @returns {{ skills: string[], name: string|null, email: string|null, location: string|null }}
 */
function parseResumeText(text) {
  const skills = extractSkillsFromText(text);

  // Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // Name: first non-empty line, max 50 chars
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let name = lines.length > 0 ? lines[0] : null;
  if (name && name.length > 50) name = name.substring(0, 50);

  // Location extraction - look for common location patterns
  // Patterns: "Location: City, Country" or "City, Country" or "Based in City"
  let location = null;
  
  // Common location keywords
  const locationKeywords = [
    'location',
    'based in',
    'located in',
    'living in',
    'from',
    'address',
    'city',
    'residence'
  ];
  
  // Common Indian cities (prioritized)
  const indianCities = [
    'Hyderabad', 'Bangalore', 'Bengaluru', 'Delhi', 'Mumbai', 'Pune', 
    'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh',
    'Indore', 'Surat', 'Nagpur', 'Visakhapatnam', 'Kochi', 'Coimbatore'
  ];
  
  // Common countries
  const countries = [
    'India', 'USA', 'United States', 'UK', 'United Kingdom', 'Canada',
    'Australia', 'Germany', 'France', 'Germany', 'Netherlands', 'Singapore'
  ];
  
  const textLower = text.toLowerCase();
  
  // Check for location patterns
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword}[:\\s]+([^\\n,]+(?:[,\\s]+[^\\n]+)?)`, 'i');
    const match = text.match(regex);
    if (match) {
      const extracted = match[1].trim();
      // Check if extracted text contains a city name
      for (const city of indianCities) {
        if (extracted.toLowerCase().includes(city.toLowerCase())) {
          location = city;
          break;
        }
      }
      if (location) break;
    }
  }
  
  // If no location found, try to find any Indian city in text
  if (!location) {
    for (const city of indianCities) {
      if (textLower.includes(city.toLowerCase())) {
        location = city;
        break;
      }
    }
  }

  return { skills, name, email, location };
}

/**
 * Persist resume data to the user record.
 * Does NOT overwrite user.name — stores extracted name as resumeExtractedName.
 *
 * @param {string} userId
 * @param {{ extractedText: string, skills: string[], name: string|null, filename: string, location: string|null }} data
 * @returns {object} updated user (password excluded)
 */
function updateUserResume(userId, { extractedText, skills, name, filename, location }) {
  const users     = readData('users.json');
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  users[userIndex].resumeText     = extractedText;
  users[userIndex].resumeSkills   = skills;
  users[userIndex].resumeFileName = filename;
  users[userIndex].resumeLocation = location; // Store extracted location
  // Protect user.name — store parsed name separately
  if (name) users[userIndex].resumeExtractedName = name;

  writeData('users.json', users);

  const { password: _pwd, ...safeUser } = users[userIndex];
  return safeUser;
}

/**
 * Get resume info for a user.
 * @param {string} userId
 * @returns {{ resumeText: string, skills: string[], filename: string }}
 */
function getUserResume(userId) {
  const users = readData('users.json');
  const user  = users.find((u) => u.id === userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    resumeText: user.resumeText     || '',
    skills:     user.resumeSkills   || [],
    filename:   user.resumeFileName || '',
  };
}

module.exports = { parseResumeText, updateUserResume, getUserResume };
