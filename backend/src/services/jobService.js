'use strict';

const { readData } = require('../utils/dataStore');
const { calculateMatch, getBestMatches } = require('./matchingService');

/**
 * jobService.js
 * All filtering, matching, and pagination logic for /api/jobs.
 */

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize raw query params into a clean, safe filter object.
 * All string values are trimmed and lowercased.
 * Missing or 'all' / 'anytime' values become null so downstream can skip them.
 *
 * @param {object} query - raw request.query
 * @returns {object} normalized filters
 */
function normalizeFilters(query = {}) {
  const str = (v) => (v && typeof v === 'string' ? v.trim() : '');

  const title      = str(query.title);
  const skills     = str(query.skills);
  const location   = str(query.location);
  const jobType    = str(query.jobType).toLowerCase();
  const workMode   = str(query.workMode).toLowerCase();
  const datePosted = str(query.datePosted).toLowerCase();
  const matchScore = str(query.matchScore).toLowerCase();

  return {
    title:      title      || null,
    skills:     skills     || null,
    location:   location   || null,
    jobType:    (jobType    && jobType    !== 'all') ? jobType    : null,
    workMode:   (workMode   && workMode   !== 'all') ? workMode   : null,
    datePosted: (datePosted && datePosted !== 'anytime') ? datePosted : null,
    matchScore: (matchScore && matchScore !== 'all') ? matchScore : null,
    page:  Math.max(1, parseInt(query.page,  10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 40)),
  };
}

/**
 * Apply all filters sequentially to a jobs array.
 * Each filter is only applied when the normalized value is non-null.
 *
 * @param {object[]} jobs
 * @param {object}   filters - output of normalizeFilters()
 * @returns {object[]} filtered jobs
 */
function applyFilters(jobs, filters) {
  let result = [...jobs];

  // Title / company / description search
  if (filters.title) {
    const q = filters.title.toLowerCase();
    result = result.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.description || '').toLowerCase().includes(q)
    );
  }

  // Skills — comma-separated, any match
  if (filters.skills) {
    const required = filters.skills
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    result = result.filter((j) =>
      required.some((rs) =>
        (j.skills || []).some((js) => js.toLowerCase().includes(rs))
      )
    );
  }

  // Date posted cutoff
  if (filters.datePosted) {
    const now    = new Date();
    const cutoff = new Date();
    if (filters.datePosted === '24h')    cutoff.setDate(now.getDate() - 1);
    else if (filters.datePosted === 'week')  cutoff.setDate(now.getDate() - 7);
    else if (filters.datePosted === 'month') cutoff.setMonth(now.getMonth() - 1);
    result = result.filter((j) => new Date(j.postedAt) >= cutoff);
  }

  // Job type — comma-separated, any match
  if (filters.jobType) {
    const types = filters.jobType.split(',').map((t) => t.trim());
    result = result.filter((j) =>
      types.some((t) => (j.jobType || '').toLowerCase().includes(t))
    );
  }

  // Work mode — comma-separated, any match
  if (filters.workMode) {
    const modes = filters.workMode.split(',').map((m) => m.trim());
    result = result.filter((j) =>
      modes.some((m) => (j.workMode || '').toLowerCase().includes(m))
    );
  }

  // Location — comma-separated, any match (e.g., "Hyderabad,Bangalore")
  // STRICT FILTERING: Only return jobs in specified locations
  if (filters.location) {
    const locations = filters.location
      .split(',')
      .map((loc) => loc.trim())
      .filter(Boolean);
    
    console.log(`📍 Applying location filter: ${locations.join(', ')}`);
    console.log(`Jobs before location filter: ${result.length}`);
    
    result = result.filter((j) => {
      const jobLocation = (j.location || '').toLowerCase();
      const matches = locations.some((loc) => 
        jobLocation.includes(loc.toLowerCase())
      );
      
      if (!matches && result.length < 50) {
        // Log jobs being filtered out for debugging
        console.log(`❌ Job filtered out - Location: "${j.location}" doesn't match [${locations.join(', ')}]`);
      }
      
      return matches;
    });
    
    console.log(`✅ Jobs after location filter: ${result.length}`);
  }

  // Note: Match score tier filter is applied AFTER enrichWithMatchData in getFilteredJobs pipeline
  // because match_score needs to be calculated from resume first

  return result;
}

/**
 * Enrich each job with match data calculated against the user's resume.
 * Preserves the stored match_score as a fallback if resume is empty.
 *
 * Called AFTER applyFilters so we only score jobs that will be shown.
 *
 * @param {object[]} jobs
 * @param {string}   resumeText - user's raw resume text
 * @returns {object[]} jobs with match_score, match_explanation, matched_skills, skill_gap
 */
async function enrichWithMatchData(jobs, resumeText) {
  if (!resumeText || !jobs.length) return jobs; 

  const { batchCalculateMatches } = require('./matchingService');
  
  // Use batch AI matching for better performance
  try {
    return await batchCalculateMatches(jobs, resumeText);
  } catch (err) {
    console.warn('⚠️  Batch matching failed, falling back to sequential:', err.message);
    // Sequential fallback using the existing calculateMatch (which also uses AI if available)
    const enriched = [];
    for (const job of jobs) {
      const matchData = await calculateMatch(job, resumeText);
      enriched.push({ ...job, ...matchData });
    }
    return enriched;
  }
}

/**
 * Paginate and build the final API response.
 * Always returns the same shape regardless of result count.
 *
 * @param {object[]} jobs        - enriched, filtered, sorted jobs
 * @param {number}   page
 * @param {number}   limit
 * @returns {{ jobs, bestMatches, total, page, limit, totalPages, message }}
 */
function paginateJobs(jobs, page, limit) {
  const total    = jobs.length;

  if (total === 0) {
    return {
      jobs:        [],
      bestMatches: [],
      total:       0,
      page,
      limit,
      totalPages:  0,
      message:     'No jobs found for the selected filters',
    };
  }

  const bestMatches   = getBestMatches(jobs);
  const startIndex    = (page - 1) * limit;
  const paginatedJobs = jobs.slice(startIndex, startIndex + limit);

  return {
    jobs:        paginatedJobs,
    bestMatches,
    total,
    page,
    limit,
    totalPages:  Math.ceil(total / limit),
    message:     null,
  };
}

const { KNOWN_SKILLS } = require('./matchingService');

async function fetchAdzunaJobs(filters, resumeText = '') {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    console.warn('⚠️  Missing Adzuna API credentials - will use local jobs.json only');
    return [];
  }

  try {
    // Randomize page between 1 and 5 to get different results on each refresh
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const baseUrl = `https://api.adzuna.com/v1/api/jobs/in/search/${randomPage}`;
    
    // Use fixed page 1 instead of random to avoid confusion
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '50',
    });

    // Extract skills from resume if available
    const { extractSkillsFromText } = require('./matchingService');
    const resumeSkills = resumeText ? extractSkillsFromText(resumeText) : [];

    if (filters.title && filters.skills) {
      const skillsArr = filters.skills.split(',').map(s => s.trim()).filter(Boolean);
      const topSkills = skillsArr.slice(0, 3).join(' ');
      params.append('what', `${filters.title} ${topSkills}`);
      console.log('🔍 Searching Adzuna with title and skills:', `${filters.title} ${topSkills}`);
    } else if (filters.title) {
      params.append('what', filters.title);
    } else if (filters.skills) {
      const skillsArr = filters.skills.split(',').map(s => s.trim()).filter(Boolean);
      const topSkills = skillsArr.slice(0, 3).join(' OR ');
      params.append('what', topSkills);
      console.log('🔍 Searching Adzuna with selected skills:', topSkills);
    } else if (resumeSkills.length > 0) {
      // Auto-populate search with top resume skills
      const topSkills = resumeSkills.slice(0, 3).join(' OR ');
      params.append('what', topSkills);
      console.log('🔍 Searching Adzuna with resume skills:', topSkills);
    } else {
      // Default fallback if no skills
      params.append('what', 'Developer');
    }
    
    // Only add location if it's not empty and not 'all'
    if (filters.location && filters.location.toLowerCase() !== 'all') {
      params.append('where', filters.location);
    } else {
      params.append('where', 'India');
    }
    
    if (filters.jobType) {
      if (filters.jobType.includes('full-time')) params.append('full_time', '1');
      if (filters.jobType.includes('part-time')) params.append('part_time', '1');
      if (filters.jobType.includes('contract')) params.append('contract', '1');
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log('🌐 Adzuna request URL:', url);

    const response = await fetch(url);
    console.log('🌐 Adzuna response status:', response.status);
    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.warn(`⚠️  Adzuna API error (${response.status}):`, errBody.substring(0, 300));
      return [];
    }

    const data = await response.json();
    if (!data || typeof data !== 'object' || !Array.isArray(data.results) || data.results.length === 0) {
      console.log(`ℹ️  Adzuna returned 0 results - using local jobs.json`);
      return [];
    }

    console.log(`✅ Adzuna returned ${data.results.length} jobs`);

    const jobs = data.results.map(job => {
      const desc = job.description || '';
      const extractedSkills = KNOWN_SKILLS.filter((skill) => {
        try {
          return new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i').test(desc);
        } catch {
          return false;
        }
      });

      let jType = 'Full-time';
      if (job.contract_time === 'part_time') jType = 'Part-time';
      else if (job.contract_time === 'contract') jType = 'Contract';

      let wMode = 'On-site';
      const locName = (job.location?.display_name || '').toLowerCase();
      const titleName = (job.title || '').toLowerCase();
      if (locName.includes('remote') || titleName.includes('remote')) {
        wMode = 'Remote';
      } else if (locName.includes('hybrid') || titleName.includes('hybrid')) {
        wMode = 'Hybrid';
      }

      return {
        id: String(job.id),
        title: job.title || 'Unknown Title',
        company: job.company?.display_name || 'Unknown Company',
        location: job.location?.display_name || 'Remote',
        description: desc,
        jobType: jType,
        workMode: wMode,
        skills: extractedSkills,
        applyUrl: job.redirect_url || '',
        postedAt: job.created || new Date().toISOString()
      };
    });
    console.log('✅ Adzuna jobs processed:', jobs.length);
    return jobs;

  } catch (err) {
    console.warn(`⚠️  Adzuna API error: ${err.message} - falling back to local jobs`);
    return [];
  }
}

/**
 * Full jobs pipeline: load → normalize filters → filter → enrich → sort → apply match score filter → paginate.
 *
 * @param {object} query      - raw request.query
 * @param {string} resumeText - user's resume text (may be empty)
 * @returns {object} final API response payload
 */
async function getFilteredJobs(query, resumeText) {
  const filters = normalizeFilters(query);
  let jobs = [];

  try {
    jobs = await fetchAdzunaJobs(filters, resumeText);
  } catch (err) {
    console.warn("Failed to fetch from Adzuna API, falling back to local jobs.json:", err.message);
  }

  if (!jobs || jobs.length === 0) {
    jobs = readData('jobs.json');
  }

  jobs = applyFilters(jobs, filters);
  jobs = await enrichWithMatchData(jobs, resumeText);
  
  // Apply match score filter AFTER enrichWithMatchData calculates scores
  if (filters.matchScore) {
    if (filters.matchScore === 'high') {
      jobs = jobs.filter((j) => (j.match_score ?? 0) > 70);
    } else if (filters.matchScore === 'medium') {
      jobs = jobs.filter((j) => { const s = j.match_score ?? 0; return s >= 40 && s <= 70; });
    } else if (filters.matchScore === 'low') {
      jobs = jobs.filter((j) => (j.match_score ?? 0) < 40);
    }
  }
  
  jobs.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));

  // Only show skill-relevant jobs when user has a resume (optional smart filtering)
  // If resume exists and user wants skill-based results, filter to jobs with at least some skill overlap
  if (resumeText && query.skillsOnly === 'true') {
    jobs = jobs.filter((j) => (j.match_score ?? 0) > 0 && (j.matched_skills?.length ?? 0) > 0);
  }

  return paginateJobs(jobs, filters.page, filters.limit);
}

module.exports = { normalizeFilters, applyFilters, enrichWithMatchData, paginateJobs, getFilteredJobs };
