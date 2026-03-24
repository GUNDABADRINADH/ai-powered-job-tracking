'use strict';

// Gemini API disabled due to quota exhaustion (1000/day free tier limit exceeded)
// Using pure keyword-based matching instead
// No embeddings will be used

/**
 * matchingService.js
 * Pure, isolated matching logic.
 * Replace the stub implementations below with LangChain calls when ready.
 */

// Skill keyword list shared across parse + matching
const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C',
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'React Native',
  'Node.js', 'Express', 'Fastify', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
  'GraphQL', 'REST APIs', 'Apollo', 'gRPC',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Snowflake',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'CI/CD', 'Git', 'GitHub', 'DevOps', 'Linux',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'pandas', 'NumPy',
  'LangChain', 'OpenAI', 'Machine Learning', 'Deep Learning', 'NLP',
  'Redux', 'Zustand', 'Jotai', 'MobX',
  'CSS', 'Tailwind CSS', 'Sass', 'Styled Components',
  'Figma', 'Storybook', 'Accessibility', 'WCAG',
  'Stripe', 'Twilio', 'Elasticsearch', 'WebSockets',
  'Agile', 'Scrum', 'Leadership', 'System Design',
  'Vite', 'Webpack', 'Rollup', 'Babel',
];

/**
 * Extract skills found in raw resume text.
 * @param {string} resumeText
 * @returns {string[]}
 */
function extractSkillsFromText(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') return [];
  const lower = resumeText.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));
}

/**
 * Calculate how well a single job matches the candidate's resume.
 *
 * Integration point: replace body with a LangChain structured-output call.
 *
 * @param {object} job        - Job object from jobs.json
 * @param {string} resumeText - Raw resume text from the user profile
 * @returns {{ match_score: number, match_explanation: string, matched_skills: string[], skill_gap: string[] }}
 */
async function calculateMatch(job, resumeText) {
  const resumeSkills = extractSkillsFromText(resumeText);
  const jobSkills    = Array.isArray(job.skills) ? job.skills : [];

  const matched  = jobSkills.filter((s) =>
    resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase())
  );
  const skillGap = jobSkills.filter((s) =>
    !resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase())
  );

  // Score: percentage of job skills covered by resume (0–100)
  let score = jobSkills.length > 0
    ? Math.round((matched.length / jobSkills.length) * 100)
    : job.match_score ?? 0; // fall back to stored score if job has no skills list

  let explanation =
    matched.length > 0
      ? `You match ${matched.length} of ${jobSkills.length} required skills: ${matched.join(', ')}.`
      : 'No direct skill overlap detected with your resume.';

  return {
    match_score:        score,
    match_explanation:  explanation,
    matched_skills:     matched,
    skill_gap:          skillGap,
  };
}

/**
 * Return the top N best-matched jobs (match_score > 70), sorted descending.
 * @param {object[]} jobs
 * @param {number}   [limit=8]
 * @returns {object[]}
 */
function getBestMatches(jobs, limit = 8) {
  return jobs
    .filter((j) => (j.match_score ?? 0) > 70)
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, limit);
}

module.exports = { calculateMatch, getBestMatches, extractSkillsFromText };
