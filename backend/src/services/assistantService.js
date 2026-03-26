'use strict';

const { StateGraph, START, END, MemorySaver } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

/**
 * assistantService.js
 * LangGraph-based AI assistant logic handling intent, filters, and responses.
 */

const VALID_ACTIONS = ['search_jobs', 'update_filters', 'help', 'clear_filters'];

// Fallback: Keyword-based intent detection
function keywordBasedIntent(message) {
  const msg = message.toLowerCase();
  if (/clear|reset|remove.*filter|show.*all/i.test(msg)) return 'clear_filters';
  if (/location|city|cities|place|area|region|hyderabad|bangalore|bengaluru|delhi|mumbai|pune|chennai|kolkata|hydera|banglore/i.test(msg)) return 'update_filters';
  if (/remote|onsite|on-site|hybrid|work.*mode|working.*from/i.test(msg)) return 'update_filters';
  if (/full.?time|part.?time|contract|freelance|permanent|temporary|job type/i.test(msg)) return 'update_filters';
  if (/skill|language|technology|framework|library|tool|react|python|java|node|sql|aws/i.test(msg)) return 'update_filters';
  if (/filter|experience|salary|minimum|maximum|year|require|looking for|want|prefer/i.test(msg)) return 'update_filters';
  if (/search|find|show|get|list|display|browse|job|role|position/i.test(msg)) return 'search_jobs';
  return 'help';
}

// Fallback: Keyword-based filter extraction
function keywordBasedExtraction(message, currentFilters = {}) {
  const normalized = { ...currentFilters };
  const locationMap = {
    'hyderabad': 'Hyderabad', 'bangalore': 'Bangalore', 'bengaluru': 'Bangalore', 
    'delhi': 'Delhi', 'mumbai': 'Mumbai', 'pune': 'Pune', 'chennai': 'Chennai', 
    'kolkata': 'Kolkata', 'new york': 'New York', 'california': 'California', 
    'london': 'London', 'toronto': 'Toronto', 'sydney': 'Sydney', 'remote': 'Remote'
  };
  const msgLower = message.toLowerCase();
  const foundLocations = [];
  for (const [keyword, displayName] of Object.entries(locationMap)) {
    if (msgLower.includes(keyword)) foundLocations.push(displayName);
  }
  if (foundLocations.length > 0) normalized.location = foundLocations.join(',');
  return normalized;
}

// 1. Define graph state channels
const GraphState = {
  message: { value: (x, y) => y ?? x, default: () => "" },
  intent: { value: (x, y) => y ?? x, default: () => "" },
  filters: { value: (x, y) => y ?? x, default: () => ({}) },
  response: { value: (x, y) => y ?? x, default: () => "" },
  action: { value: (x, y) => y ?? x, default: () => "" }
};

// 2. Define Nodes
const detectIntentNode = async (state) => {
  let intent = "help";
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("No API key");
    const model = new ChatGoogleGenerativeAI({ 
      modelName: "gemini-1.5-flash", 
      temperature: 0, 
      apiKey: process.env.GEMINI_API_KEY 
    });
    const prompt = PromptTemplate.fromTemplate(`Classify user intent from message. Return ONLY one exact word: search_jobs, update_filters, help, clear_filters
Rules:
- search_jobs: User wants to find or show brand new roles (e.g., "find jobs", "show jobs", "fullstack developer roles", "python developer jobs").
- update_filters: User wants to refine the current job list (e.g., "make it remote", "only in New York").
- clear_filters: Clear all current filters.
- help: General questions or help.
Message: "{message}"`);
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const res = await chain.invoke({ message: state.message });
    
    intent = res.trim().toLowerCase().replace(/[^a-z_]/g, '');
    if (!VALID_ACTIONS.includes(intent)) intent = 'help';
  } catch (err) {
    console.warn("LangChain intent fallback:", err.message);
    intent = keywordBasedIntent(state.message);
  }
  return { intent };
};

const extractFiltersNode = async (state) => {
  if (state.intent === 'clear_filters') return { filters: {} };
  if (state.intent === 'help') return { filters: state.filters };
  
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("No API key");
    const model = new ChatGoogleGenerativeAI({ 
      modelName: "gemini-1.5-flash", 
      temperature: 0, 
      apiKey: process.env.GEMINI_API_KEY 
    });
    
    const prompt = PromptTemplate.fromTemplate(`Extract job search filters as JSON. Supported formats: title, skills, location, jobType, workMode. Return ONLY valid JSON, no markdown code blocks. 
Rules: comma-separated list of strings for skills, jobType, and workMode. 
Message: "{message}"`);
    
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const res = await chain.invoke({ message: state.message });
    
    const cleanedStr = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const extracted = JSON.parse(cleanedStr || "{}");
    const normalized = { ...state.filters };
    
    if (extracted.skills) normalized.skills = Array.isArray(extracted.skills) ? extracted.skills : extracted.skills.split(',').map(s=>s.trim());
    if (extracted.jobType) normalized.jobType = Array.isArray(extracted.jobType) ? extracted.jobType : extracted.jobType.split(',').map(s=>s.trim());
    if (extracted.workMode) normalized.workMode = Array.isArray(extracted.workMode) ? extracted.workMode : extracted.workMode.split(',').map(s=>s.trim());
    if (extracted.location) normalized.location = extracted.location;
    if (extracted.title) normalized.title = extracted.title;
    
    return { filters: normalized };
  } catch (err) {
    console.warn("LangChain extraction fallback:", err.message);
    return { filters: keywordBasedExtraction(state.message, state.filters) };
  }
};

const buildResponseNode = async (state) => {
  const replyMap = {
    clear_filters: "Filters cleared! 🧹 Showing all available jobs again.",
    search_jobs:   "Searching across all available jobs now! 🔍 Let me know if you want to narrow it down.",
    update_filters:"I've updated your filters based on your request! 🎯",
    help:          "I'm your AI job search assistant! 🤖 Try: \"Show me remote React jobs\" or \"What are my best matches?\"",
  };
  return { 
    response: replyMap[state.intent] || replyMap.help,
    action: VALID_ACTIONS.includes(state.intent) ? state.intent : 'help'
  };
};

const routeNode = (state) => {
  return state.intent;
};

// 3. Build LangGraph
const workflow = new StateGraph({ channels: GraphState });

workflow.addNode("detectIntentNode", detectIntentNode);
workflow.addNode("extractFiltersNode", extractFiltersNode);
workflow.addNode("buildResponseNode", buildResponseNode);

// 4. Edges and conditionals
workflow.addEdge(START, "detectIntentNode");

workflow.addConditionalEdges("detectIntentNode", routeNode, {
  "search_jobs": "extractFiltersNode",
  "update_filters": "extractFiltersNode",
  "clear_filters": "extractFiltersNode",
  "help": "buildResponseNode"
});

workflow.addEdge("extractFiltersNode", "buildResponseNode");
workflow.addEdge("buildResponseNode", END);

// 5. Memory checkpointer for state
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

// 6. External API wrappers (Do NOT modify route expectation)
let latestGraphState = null;

async function detectIntent(message) {
  const state = await detectIntentNode({ message, intent: '', filters: {}, response: '', action: '' });
  return state.intent;
}

async function extractFilters(message, currentFilters = {}) {
  const finalState = await app.invoke(
    { message, intent: '', filters: currentFilters, response: '', action: '' },
    { configurable: { thread_id: "assistant-thread-1" } }
  );
  
  latestGraphState = finalState;
  return finalState.filters;
}

function buildResponse(intent, filters) {
  if (latestGraphState) {
    return {
      reply: latestGraphState.response,
      action: latestGraphState.action,
      filters: latestGraphState.filters
    };
  }
  return { reply: "Let's search for some jobs!", action: intent || 'help', filters };
}

module.exports = { detectIntent, extractFilters, buildResponse };
