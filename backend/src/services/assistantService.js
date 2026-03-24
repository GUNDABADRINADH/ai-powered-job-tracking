'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

let lastMessage = ''; // Cache to handle routes passing intent instead of message

/**
 * assistantService.js
 * Keyword-based stub for AI assistant logic.
 *
 * Integration points:
 *   - detectIntent()    → replace with LangChain intent classifier
 *   - extractFilters()  → replace with LangChain structured filter extraction
 *   - buildResponse()   → replace with LangGraph agent reply generation
 */

// Valid action enum — enforced in buildResponse
const VALID_ACTIONS = ['search_jobs', 'update_filters', 'help', 'clear_filters'];

/**
 * Detect the intent of an incoming message.
 * Uses Gemini API with keyword-based fallback for robustness.
 *
 * @param {string} message
 * @returns {string} intent key
 */
async function detectIntent(message) {
  lastMessage = message;

  // Always try keyword-based detection first - it's more reliable
  const keywordIntent = keywordBasedIntent(message);
  console.log('📌 Keyword detection result:', keywordIntent);
  
  // If keyword detection found something specific (not 'help'), use it
  if (keywordIntent !== 'help') {
    console.log(`✅ Using keyword intent: ${keywordIntent}`);
    return keywordIntent;
  }

  // Only use Gemini API for ambiguous cases if key exists
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ No Gemini API key, returning keyword result:', keywordIntent);
    return keywordIntent;
  }

  try {
    console.log('🌐 Calling Gemini API for intent classification...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Classify user intent from message. Return ONLY one exact word: search_jobs, update_filters, help, clear_filters
Message: "${message}"`;
    const result = await model.generateContent(prompt);
    let intent = result.response.text().trim().toLowerCase();
    
    // Clean response
    intent = intent.replace(/[^a-z_]/g, '').trim();
    
    if (['search_jobs', 'update_filters', 'help', 'clear_filters'].includes(intent)) {
      console.log(`✅ Gemini intent: ${intent}`);
      return intent;
    }
  } catch (err) {
    console.error("❌ Gemini detectIntent error:", err.message);
  }

  // If everything fails, use keyword detection result
  console.log(`✅ Fallback to keyword result: ${keywordIntent}`);
  return keywordIntent;
}

/**
 * Keyword-based intent detection as fallback
 * @param {string} message
 * @returns {string} intent key
 */
function keywordBasedIntent(message) {
  const msg = message.toLowerCase();
  
  // Clear filters - highest priority
  if (/clear|reset|remove.*filter|show.*all/i.test(msg)) {
    return 'clear_filters';
  }
  
  // Update/filter intent - ANY of these keywords trigger filter update
  // Location keywords
  if (/location|city|cities|place|area|region|hyderabad|bangalore|bengaluru|delhi|mumbai|pune|chennai|kolkata|hydera|banglore/i.test(msg)) {
    return 'update_filters';
  }
  
  // Work mode keywords
  if (/remote|onsite|on-site|hybrid|work.*mode|working.*from/i.test(msg)) {
    return 'update_filters';
  }
  
  // Job type keywords
  if (/full.?time|part.?time|contract|freelance|permanent|temporary|job type/i.test(msg)) {
    return 'update_filters';
  }
  
  // Skill keywords
  if (/skill|language|technology|framework|library|tool|react|python|java|node|sql|aws/i.test(msg)) {
    return 'update_filters';
  }
  
  // Filter/experience keywords
  if (/filter|experience|salary|minimum|maximum|year|require|looking for|want|prefer/i.test(msg)) {
    return 'update_filters';
  }
  
  // Search intent
  if (/search|find|show|get|list|display|browse|job|role|position/i.test(msg)) {
    return 'search_jobs';
  }
  
  // Default to help
  return 'help';
}

/**
 * Extract filter parameters from the message.
 * Uses Gemini API with keyword-based fallback for robustness.
 *
 * @param {string} message
 * @param {object} currentFilters
 * @returns {object}
 */
async function extractFilters(message, currentFilters = {}) {
  const normalized = { ...currentFilters };
  
  // ALWAYS try keyword-based extraction first
  console.log('🔍 Attempting keyword-based filter extraction...');
  
  // Extract location keywords - check for common job search locations
  const locationMap = {
    'hyderabad': 'Hyderabad',
    'bangalore': 'Bangalore',
    'bengaluru': 'Bangalore',
    'delhi': 'Delhi',
    'mumbai': 'Mumbai',
    'pune': 'Pune',
    'chennai': 'Chennai',
    'kolkata': 'Kolkata',
    'new york': 'New York',
    'california': 'California',
    'london': 'London',
    'toronto': 'Toronto',
    'sydney': 'Sydney',
    'remote': 'Remote'
  };
  
  const msgLower = message.toLowerCase();
  const foundLocations = [];
  
  // Check for each location keyword in the message
  for (const [keyword, displayName] of Object.entries(locationMap)) {
    if (msgLower.includes(keyword)) {
      foundLocations.push(displayName);
    }
  }
  
  if (foundLocations.length > 0) {
    normalized.location = foundLocations.join(',');
    console.log('✅ Keyword extraction found location:', normalized.location);
    return normalized;
  }

  // If no Gemini API key, return early
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ No Gemini API key, returning current filters:', normalized);
    return normalized;
  }

  // Try Gemini extraction as secondary method
  try {
    console.log('🌐 Attempting Gemini API filter extraction...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const prompt = `Extract job search filters from this message. Return valid JSON only.
Supported filters: title, skills, location, jobType, workMode, datePosted

Rules:
- For locations like "Hyderabad and Bangalore", use: "location": "Hyderabad,Bangalore"
- For skills like "React and Python", use: "skills": "React,Python"  
- For jobType, use values like: "Full-time", "Part-time", "Contract" (comma-separated)
- For workMode, use values like: "Remote", "Onsite", "Hybrid" (comma-separated)
- Return only {} if no filters found

Message: "${message}"`;

    const result = await model.generateContent(prompt);
    const extractedStr = result.response.text();
    console.log('Gemini extracted raw:', extractedStr);
    
    // Clean response - remove markdown code blocks if present
    const cleanedStr = extractedStr
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const extracted = JSON.parse(cleanedStr);
    console.log('Gemini extracted JSON:', extracted);
    
    // Convert comma-separated strings to arrays for specific fields
    if (extracted.skills && typeof extracted.skills === 'string') {
      normalized.skills = extracted.skills.split(',').map(s => s.trim()).filter(Boolean);
    } else if (extracted.skills) {
      normalized.skills = extracted.skills;
    }
    
    if (extracted.jobType && typeof extracted.jobType === 'string') {
      normalized.jobType = extracted.jobType.split(',').map(s => s.trim()).filter(Boolean);
    } else if (extracted.jobType) {
      normalized.jobType = extracted.jobType;
    }
    
    if (extracted.workMode && typeof extracted.workMode === 'string') {
      normalized.workMode = extracted.workMode.split(',').map(s => s.trim()).filter(Boolean);
    } else if (extracted.workMode) {
      normalized.workMode = extracted.workMode;
    }
    
    // Keep location and title as strings
    if (extracted.location) {
      normalized.location = extracted.location;
      console.log('✅ Gemini found location:', extracted.location);
    }
    if (extracted.title) {
      normalized.title = extracted.title;
    }
    if (extracted.datePosted) {
      normalized.datePosted = extracted.datePosted;
    }
    
    console.log("✅ Final normalized filters from Gemini:", normalized);
    return normalized;
  } catch (err) {
    console.error("❌ Gemini extractFilters error:", err.message);
    console.log('⚠️ Falling back to keyword extraction...');
    return normalized;
  }
}

/**
 * Build the structured assistant response.
 * Always returns { reply: string, action: string, filters: object|null }.
 * action is always one of: search_jobs | update_filters | help | clear_filters
 *
 * @param {string} intent
 * @param {object|null} filters
 * @returns {{ reply: string, action: string, filters: object|null }}
 */
function buildResponse(intent, filters) {
  const VALID_ACTIONS = ['search_jobs', 'update_filters', 'help', 'clear_filters'];

  // Map intent → action (only valid enum values)
  const actionMap = {
    clear_filters: 'clear_filters',
    search_jobs:   'search_jobs',
    update_filters:'update_filters',
    help:          'help',
  };

  const replyMap = {
    clear_filters: "Filters cleared! 🧹 Showing all available jobs again.",
    search_jobs:   "Searching across all available jobs now! 🔍 Let me know if you want to narrow it down.",
    update_filters:"I've updated your filters based on your request! 🎯",
    help:          "I'm your AI job search assistant! 🤖 Try: \"Show me remote React jobs\" or \"What are my best matches?\"",
  };

  const action = VALID_ACTIONS.includes(actionMap[intent]) ? actionMap[intent] : 'help';
  const reply  = replyMap[intent] ?? replyMap.help;

  return { reply, action, filters };
}

module.exports = { detectIntent, extractFilters, buildResponse };
